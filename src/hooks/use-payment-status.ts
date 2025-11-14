"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface UsePaymentStatusOptions {
  paymentId: string;
  enabled?: boolean;
  onPaymentConfirmed?: () => void;
  onStatusUpdate?: (status: string, isPaid: boolean) => void;
  autoStart?: boolean;
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
  startChecking: () => void;
  stopChecking: () => void;
}

/**
 * Hook melhorado para verificar status de pagamento
 * Funciona independente de modal estar aberto ou não
 */
export function usePaymentStatus({
  paymentId,
  enabled = true,
  onPaymentConfirmed,
  onStatusUpdate,
  autoStart = true,
}: UsePaymentStatusOptions): PaymentStatusResult {
  const [status, setStatus] = useState<string>("PENDING");
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checkCount, setCheckCount] = useState<number>(0);
  const [nextCheckIn, setNextCheckIn] = useState<number>(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Intervalos progressivos mais conservadores
  const intervals = [5, 10, 15, 30, 60, 120]; // 5s, 10s, 15s, 30s, 1min, 2min
  const maxChecks = 15; // Máximo 15 verificações

  const checkPayment = useCallback(async () => {
    if (!paymentId || isPaid || !enabled) return;

    setIsChecking(true);

    try {
      console.log(
        `Verificando pagamento ${paymentId} (tentativa ${checkCount + 1}/${maxChecks})`,
      );

      // Preparar headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Adicionar header de bypass do Vercel se disponível
      // Nota: Em produção, esta variável deve estar disponível no servidor
      // Este é um exemplo de como seria implementado
      if (
        typeof window !== "undefined" &&
        window.location.hostname.includes("vercel.app")
      ) {
        console.log(
          "Detectado deployment Vercel - aplicando headers de automação",
        );
      }

      const response = await fetch(`/api/payments/${paymentId}/status`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const { status: newStatus, isPaid: newIsPaid } = data;

      setStatus(newStatus);
      setIsPaid(newIsPaid);
      setLastChecked(new Date());
      setCheckCount((prev) => prev + 1);

      onStatusUpdate?.(newStatus, newIsPaid);

      if (newIsPaid) {
        console.log(`Pagamento ${paymentId} confirmado!`);
        toast.success("Pagamento confirmado!");
        onPaymentConfirmed?.();
      }
    } catch (error) {
      console.error("Erro ao verificar status do pagamento:", error);
      toast.error("Erro ao verificar status do pagamento");
    } finally {
      setIsChecking(false);
    }
  }, [
    paymentId,
    isPaid,
    enabled,
    checkCount,
    onPaymentConfirmed,
    onStatusUpdate,
  ]);

  const scheduleNextCheck = useCallback(() => {
    if (isPaid || checkCount >= maxChecks || !enabled) {
      return;
    }

    const intervalIndex = Math.min(checkCount, intervals.length - 1);
    const interval = intervals[intervalIndex] * 1000;

    setNextCheckIn(intervals[intervalIndex]);

    // Countdown para próxima verificação
    let countdown = intervals[intervalIndex];
    countdownRef.current = setInterval(() => {
      countdown -= 1;
      setNextCheckIn(countdown);

      if (countdown <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }, 1000);

    // Agendar próxima verificação
    timeoutRef.current = setTimeout(() => {
      if (!isPaid && checkCount < maxChecks && enabled) {
        checkPayment();
        scheduleNextCheck();
      }
    }, interval);
  }, [checkCount, isPaid, enabled, checkPayment]);

  const startChecking = useCallback(() => {
    if (isPaid || !paymentId) return;

    console.log(`Iniciando verificação de pagamento: ${paymentId}`);
    setCheckCount(0);
    checkPayment();
    scheduleNextCheck();
  }, [paymentId, isPaid, checkPayment, scheduleNextCheck]);

  const stopChecking = useCallback(() => {
    console.log("Parando verificação de pagamento");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    setIsChecking(false);
    setNextCheckIn(0);
  }, []);

  const manualCheck = useCallback(async () => {
    stopChecking();
    await checkPayment();
    if (!isPaid && checkCount < maxChecks) {
      scheduleNextCheck();
    }
  }, [checkPayment, isPaid, checkCount, stopChecking, scheduleNextCheck]);

  // Auto iniciar verificação quando habilitado
  useEffect(() => {
    if (enabled && autoStart && paymentId && !isPaid) {
      startChecking();
    } else if (!enabled) {
      stopChecking();
    }

    return () => stopChecking();
  }, [enabled, autoStart, paymentId, isPaid, startChecking, stopChecking]);

  return {
    status,
    isPaid,
    isChecking,
    lastChecked,
    checkCount,
    maxChecks,
    nextCheckIn,
    manualCheck,
    startChecking,
    stopChecking,
  };
}
