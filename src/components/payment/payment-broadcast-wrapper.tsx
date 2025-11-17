"use client";

import { useEffect } from "react";
import { usePaymentBroadcast } from "@/hooks/use-payment-broadcast";

interface PaymentBroadcastWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper que adiciona funcionalidade de broadcast de pagamentos
 * para páginas que precisam ser notificadas sobre confirmações
 */
export function PaymentBroadcastWrapper({
  children,
}: PaymentBroadcastWrapperProps) {
  // Hook só é inicializado para escutar broadcasts
  usePaymentBroadcast();

  useEffect(() => {
    console.log(
      "[PaymentBroadcastWrapper] Initialized payment broadcast listener",
    );
  }, []);

  return <>{children}</>;
}
