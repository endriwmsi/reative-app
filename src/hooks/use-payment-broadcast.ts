"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface PaymentBroadcastData {
  type: "PAYMENT_CONFIRMED";
  paymentId: string;
  message?: string;
}

/**
 * Hook para gerenciar comunicação entre abas/janelas sobre confirmações de pagamento
 */
export function usePaymentBroadcast() {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Verificar se BroadcastChannel é suportado (navegador)
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channelRef.current = new BroadcastChannel("payment-updates");

      // Escutar mensagens de outras abas/janelas
      channelRef.current.onmessage = (
        event: MessageEvent<PaymentBroadcastData>,
      ) => {
        const { type, paymentId, message } = event.data;

        if (type === "PAYMENT_CONFIRMED") {
          // Mostrar toast de confirmação
          toast.success("🎉 Pagamento Confirmado!", {
            description:
              message || "Pagamento confirmado automaticamente via webhook!",
            duration: 5000,
          });

          // Revalidar a página atual para atualizar dados
          router.refresh();

          console.log(
            `[PaymentBroadcast] Pagamento ${paymentId} confirmado em outra aba`,
          );
        }
      };
    }

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, [router]);

  // Função para enviar notificação de pagamento confirmado para outras abas
  const broadcastPaymentConfirmed = (paymentId: string, message?: string) => {
    if (channelRef.current) {
      const data: PaymentBroadcastData = {
        type: "PAYMENT_CONFIRMED",
        paymentId,
        message,
      };

      channelRef.current.postMessage(data);
      console.log(
        `[PaymentBroadcast] Broadcasting payment confirmation: ${paymentId}`,
      );
    }
  };

  return {
    broadcastPaymentConfirmed,
  };
}
