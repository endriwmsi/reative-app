"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PaymentBoostOptions {
  paymentId: string;
  onBoostTriggered?: () => void;
}

/**
 * Hook para detectar confirmações de pagamento via webhook e
 * triggerar polling mais agressivo temporariamente
 */
export function usePaymentBoost({
  paymentId,
  onBoostTriggered,
}: PaymentBoostOptions) {
  const [isBoosted, setIsBoosted] = useState(false);
  const boostTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Função para ativar boost temporário
  const triggerBoost = useCallback(() => {
    console.log(`[PaymentBoost] Triggering boost for payment ${paymentId}`);
    setIsBoosted(true);
    onBoostTriggered?.();

    // Boost dura 30 segundos
    if (boostTimeoutRef.current) {
      clearTimeout(boostTimeoutRef.current);
    }

    boostTimeoutRef.current = setTimeout(() => {
      setIsBoosted(false);
      console.log(`[PaymentBoost] Boost expired for payment ${paymentId}`);
    }, 30000); // 30 segundos de boost
  }, [paymentId, onBoostTriggered]);

  useEffect(() => {
    // Escutar broadcast de confirmação de pagamento
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channelRef.current = new BroadcastChannel("payment-updates");

      channelRef.current.onmessage = (event) => {
        if (
          event.data.type === "PAYMENT_CONFIRMED" &&
          event.data.paymentId === paymentId
        ) {
          triggerBoost();
        }
      };
    }

    // Cleanup
    return () => {
      if (boostTimeoutRef.current) {
        clearTimeout(boostTimeoutRef.current);
      }
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, [paymentId, triggerBoost]);

  return {
    isBoosted,
    triggerBoost,
  };
}
