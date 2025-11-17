"use client";

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

export function usePaymentStatus({
  paymentId,
  enabled = true,
  onPaymentConfirmed,
  onStatusUpdate,
}: UsePaymentStatusOptions): PaymentStatusResult {
  const [status, setStatus] = useState<string>("PENDING");
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checkCount, setCheckCount] = useState<number>(0);
  const [nextCheckIn, setNextCheckIn] = useState<number>(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isEnabledRef = useRef(enabled);

  // Intervalos progressivos (em segundos) - otimizados para melhor UX
  const intervals = [10, 20, 30, 60]; // 10s, 20s, 30s, 60s
  const maxChecks = 8; // Máximo 8 verificações (aproximadamente 10 minutos)

  const checkPayment = useCallback(async () => {
    if (!paymentId || isChecking || isPaid) return;

    setIsChecking(true);

    try {
      const result = await checkPaymentStatus(paymentId);

      if (result.success && result.data) {
        const newStatus = result.data.status;
        const newIsPaid = result.data.isPaid;

        setStatus(newStatus);
        setIsPaid(newIsPaid);
        setLastChecked(new Date());
        setCheckCount((prev) => prev + 1);

        // Callbacks
        onStatusUpdate?.(newStatus, newIsPaid);

        if (newIsPaid && !isPaid) {
          onPaymentConfirmed?.();
          // Toast será exibido pelo modal, não aqui para evitar duplicação
        } else if (newStatus !== status) {
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
    onPaymentConfirmed,
    onStatusUpdate,
  ]);

  const scheduleNextCheck = useCallback(
    (currentCheckCount: number) => {
      if (currentCheckCount >= maxChecks || !isEnabledRef.current) {
        setNextCheckIn(0);
        return;
      }

      // Determinar intervalo baseado no número de verificações
      const intervalIndex = Math.min(currentCheckCount, intervals.length - 1);
      const intervalSeconds = intervals[intervalIndex];

      // Iniciar countdown
      setNextCheckIn(Math.floor(intervalSeconds));

      timeoutRef.current = setTimeout(async () => {
        const paymentConfirmed = await checkPayment();

        if (!paymentConfirmed && isEnabledRef.current) {
          scheduleNextCheck(currentCheckCount + 1);
        }
      }, intervalSeconds * 1000);
    },
    [checkPayment],
  );

  const manualCheck = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    await checkPayment();

    // Reiniciar o ciclo de verificações automáticas se ainda não foi pago
    if (!isPaid && enabled) {
      scheduleNextCheck(checkCount);
    }
  }, [checkPayment, isPaid, enabled, checkCount, scheduleNextCheck]);

  const stopChecking = useCallback(() => {
    isEnabledRef.current = false;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Iniciar verificações automáticas
  useEffect(() => {
    isEnabledRef.current = enabled;

    if (enabled && paymentId && !isPaid) {
      // Agendar primeira verificação (sem verificação imediata)
      scheduleNextCheck(0);
    }

    return () => {
      stopChecking();
    };
  }, [enabled, paymentId, isPaid, scheduleNextCheck, stopChecking]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopChecking();
    };
  }, [stopChecking]);

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

function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    PENDING: "Pendente",
    AWAITING_PAYMENT: "Aguardando Pagamento",
    RECEIVED: "Confirmado",
    OVERDUE: "Vencido",
    CANCELLED: "Cancelado",
    REFUNDED: "Reembolsado",
  };

  return statusLabels[status] || status;
}
