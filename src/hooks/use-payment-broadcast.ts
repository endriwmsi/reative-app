"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  revalidatePaymentData,
  revalidateSubmissionsData,
} from "@/actions/revalidate/revalidate.action";

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
      channelRef.current.onmessage = async (
        event: MessageEvent<PaymentBroadcastData>,
      ) => {
        const { type, paymentId, message } = event.data;

        if (type === "PAYMENT_CONFIRMED") {
          console.log(
            `[PaymentBroadcast] Pagamento ${paymentId} confirmado - iniciando atualização`,
          );

          // Mostrar toast de confirmação
          toast.success("🎉 Pagamento Confirmado!", {
            description:
              message || "Pagamento confirmado automaticamente via webhook!",
            duration: 5000,
          });

          try {
            // 1. Forçar revalidação server-side específica para este pagamento
            const paymentRevalidation = await revalidatePaymentData(paymentId);
            if (paymentRevalidation.success) {
              console.log(
                `[PaymentBroadcast] Specific revalidation completed for ${paymentId}`,
              );
            }

            // 2. Revalidação geral como fallback
            const generalRevalidation = await revalidateSubmissionsData();
            if (generalRevalidation.success) {
              console.log("[PaymentBroadcast] General revalidation completed");
            }

            // 3. Forçar refresh da página (força re-fetch dos dados)
            console.log("[PaymentBroadcast] Triggering router refresh");
            router.refresh();

            // 4. Aguardar e fazer refresh adicional se necessário
            setTimeout(() => {
              console.log("[PaymentBroadcast] Secondary refresh triggered");
              router.refresh();
            }, 2000); // Aumentado para 2s

            // 5. Terceiro refresh para garantir (em casos extremos)
            setTimeout(() => {
              console.log("[PaymentBroadcast] Final refresh triggered");
              router.refresh();
            }, 5000); // 5s depois
          } catch (error) {
            console.error("[PaymentBroadcast] Error during refresh:", error);
            // Fallback: pelo menos fazer o refresh básico
            router.refresh();
            setTimeout(() => router.refresh(), 1000);
          }
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
