"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { checkPaymentStatus } from "@/actions/payment/payment.action";

interface UsePaymentStatusOptions {
  paymentId: string;
  enabled?: boolean;
  onPaymentConfirmed?: () => void;
  onStatusUpdate?: (status: string, isPaid: boolean) => void;
}

interface PaymentStatusResult {
  status: string;
  isPaid: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  checkCount: number;
  maxChecks: number;
  nextCheckIn: number;
  manualCheck: () => Promise<void>;
  stopChecking: () => void;
}

function getStatusLabel(status: string): string {
  const statusLabels = {
    PENDING: "Pendente",
    AWAITING_PAYMENT: "Aguardando Pagamento",
    RECEIVED: "Recebido",
    CONFIRMED: "Confirmado",
    OVERDUE: "Vencido",
    REFUNDED: "Reembolsado",
    RECEIVED_IN_CASH: "Recebido em Dinheiro",
    REFUND_REQUESTED: "Reembolso Solicitado",
    CHARGEBACK_REQUESTED: "Estorno Solicitado",
    CHARGEBACK_DISPUTE: "Disputa de Estorno",
    AWAITING_CHARGEBACK_REVERSAL: "Aguardando Reversão",
    DUNNING_REQUESTED: "Cobrança Solicitada",
    DUNNING_RECEIVED: "Cobrança Recebida",
    AWAITING_RISK_ANALYSIS: "Análise de Risco",
  };
  return statusLabels[status as keyof typeof statusLabels] || status;
}

export function usePaymentStatus({
  paymentId,
  enabled = true,
  onPaymentConfirmed,
  onStatusUpdate,
}: UsePaymentStatusOptions): PaymentStatusResult {
  const router = useRouter();
  const [status, setStatus] = useState<string>("PENDING");
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checkCount, setCheckCount] = useState<number>(0);
  const [nextCheckIn, setNextCheckIn] = useState<number>(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const isEnabledRef = useRef(enabled);

  // Intervalos progressivos (em segundos) - mais conservadores com webhook
  const intervals = [30, 60, 120, 300]; // 30s, 1min, 2min, 5min
  const maxChecks = 6; // Máximo 6 verificações (aproximadamente 15 minutos)

  const checkPayment = useCallback(async () => {
    if (!paymentId || isChecking || isPaid) return;

    setIsChecking(true);

    try {
      const result = await checkPaymentStatus(paymentId);

      if (result.success && result.data) {
        const newStatus = result.data.status;
        const newIsPaid = result.data.isPaid;
        const isWebhookUpdate = result.data.isWebhookUpdate || false;

        // Detectar mudanças reais
        const statusChanged = status !== newStatus;
        const paidChanged = isPaid !== newIsPaid;

        setStatus(newStatus);
        setIsPaid(newIsPaid);
        setLastChecked(new Date());
        setCheckCount((prev) => prev + 1);

        console.log(`[usePaymentStatus] Status check result:`, {
          newStatus,
          newIsPaid,
          isWebhookUpdate,
          statusChanged,
          paidChanged,
        });

        // Callbacks
        onStatusUpdate?.(newStatus, newIsPaid);

        if (newIsPaid && !isPaid) {
          // Pagamento confirmado!
          const toastMessage = isWebhookUpdate
            ? "🎉 Pagamento confirmado automaticamente!"
            : "✅ Pagamento confirmado!";

          toast.success(toastMessage, {
            description: "Suas submissões foram atualizadas.",
            duration: 5000,
          });

          // Force refresh para garantir sincronização
          try {
            router.refresh();
            console.log(
              "[usePaymentStatus] Page refreshed after payment confirmation",
            );
          } catch (refreshError) {
            console.error(
              "[usePaymentStatus] Error refreshing page:",
              refreshError,
            );
          }

          onPaymentConfirmed?.();
        } else if (statusChanged && !newIsPaid) {
          // Status mudou mas ainda não foi pago
          toast.info(`Status atualizado: ${getStatusLabel(newStatus)}`, {
            description: "Verificação automática em andamento",
            duration: 3000,
          });
        }

        return newIsPaid;
      } else {
        console.error("Erro ao verificar pagamento:", result.message);
        return false;
      }
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [
    paymentId,
    isChecking,
    isPaid,
    status,
    router,
    onPaymentConfirmed,
    onStatusUpdate,
  ]);

  const scheduleNextCheck = useCallback(
    (currentCheckCount: number) => {
      if (currentCheckCount >= maxChecks || !isEnabledRef.current) {
        setNextCheckIn(0);
        toast.info("Verificações automáticas concluídas", {
          description:
            "O pagamento ainda será confirmado automaticamente via webhook quando processado.",
          duration: 5000,
        });
        return;
      }

      // Determinar intervalo baseado no número de verificações
      const intervalIndex = Math.min(currentCheckCount, intervals.length - 1);
      const intervalSeconds = intervals[intervalIndex];

      // Com webhook ativo, verificar menos frequentemente
      const webhookAwareInterval = intervalSeconds * 1.5; // 50% mais lento

      // Iniciar countdown
      let remainingTime = Math.floor(webhookAwareInterval);
      setNextCheckIn(remainingTime);

      // Limpar countdown anterior se existir
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }

      // Countdown visual atualizado a cada segundo
      countdownRef.current = setInterval(() => {
        remainingTime -= 1;
        setNextCheckIn(remainingTime);

        if (remainingTime <= 0 && countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      }, 1000);

      timeoutRef.current = setTimeout(async () => {
        const paymentConfirmed = await checkPayment();

        if (!paymentConfirmed && isEnabledRef.current) {
          scheduleNextCheck(currentCheckCount + 1);
        }
      }, webhookAwareInterval * 1000);

      console.log(
        `[usePaymentStatus] Next check scheduled in ${webhookAwareInterval}s (check ${currentCheckCount + 1}/${maxChecks})`,
      );
    },
    [checkPayment],
  );

  const manualCheck = useCallback(async () => {
    if (isChecking) {
      console.log("[usePaymentStatus] Check already in progress");
      return;
    }

    console.log("[usePaymentStatus] Manual check triggered");
    toast.info("Verificando pagamento...", {
      description: "Aguarde um momento.",
      duration: 2000,
    });

    const paymentConfirmed = await checkPayment();

    if (!paymentConfirmed && !isPaid) {
      toast.info("Pagamento ainda não confirmado", {
        description: "Continuaremos verificando automaticamente.",
        duration: 3000,
      });
    }
  }, [checkPayment, isChecking, isPaid]);

  const stopChecking = useCallback(() => {
    console.log("[usePaymentStatus] Stopping payment status checks");
    isEnabledRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setNextCheckIn(0);
  }, []);

  // Atualizar ref quando enabled mudar
  useEffect(() => {
    isEnabledRef.current = enabled;
  }, [enabled]);

  // Iniciar verificações quando ativado
  useEffect(() => {
    if (enabled && paymentId && !isPaid) {
      // Primeira verificação imediata após 3 segundos
      const initialTimeout = setTimeout(() => {
        checkPayment().then((confirmed) => {
          if (!confirmed && isEnabledRef.current) {
            scheduleNextCheck(0);
          }
        });
      }, 3000);

      return () => clearTimeout(initialTimeout);
    }
  }, [enabled, paymentId, isPaid, checkPayment, scheduleNextCheck]);

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return {
    status,
    isPaid,
    isChecking,
    lastChecked,
    checkCount,
    maxChecks,
    nextCheckIn,
    manualCheck,
    stopChecking,
  };
}
