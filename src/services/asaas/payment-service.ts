import { asaasService } from "./asaas-service";
import type { AsaasWebhookPayload, PaymentStatus } from "./asaas-types";

/**
 * Serviço para gerenciar pagamentos e integrações com o banco de dados
 */
export class PaymentService {
  /**
   * Processa webhook do Asaas para atualização de status de pagamento
   */
  async processPaymentWebhook(payload: AsaasWebhookPayload): Promise<void> {
    try {
      console.log("Processando webhook do Asaas:", payload.event);

      // Validar se é um evento de pagamento
      if (!payload.payment) {
        console.warn("Webhook recebido sem dados de pagamento:", payload);
        return;
      }

      const { payment } = payload;
      const { id: paymentId, status, externalReference } = payment;

      // Se não tem external reference, não conseguimos vincular ao banco
      if (!externalReference) {
        console.warn("Pagamento sem externalReference:", paymentId);
        return;
      }

      // Aqui você deve implementar a lógica para atualizar o banco de dados
      // Baseando-se no seu schema existente
      await this.updatePaymentStatus(
        externalReference,
        status as PaymentStatus,
        paymentId,
      );

      console.log(`Status do pagamento ${paymentId} atualizado para ${status}`);
    } catch (error) {
      console.error("Erro ao processar webhook do Asaas:", error);
      throw error;
    }
  }

  /**
   * Atualiza o status do pagamento no banco de dados
   * Esta função deve ser implementada de acordo com seu schema de banco
   */
  private async updatePaymentStatus(
    externalReference: string,
    status: PaymentStatus,
    _asaasPaymentId: string,
  ): Promise<void> {
    try {
      // TODO: Implementar atualização no banco de dados
      // Exemplo usando Drizzle (ajuste conforme seu schema):

      // import { db } from "@/db/client";
      // import { submissions } from "@/db/schema/submissions";
      // import { eq } from "drizzle-orm";

      // const isPaid = status === "RECEIVED" || status === "CONFIRMED";

      // await db
      //   .update(submissions)
      //   .set({
      //     isPaid,
      //     asaasPaymentId,
      //     paidAt: isPaid ? new Date() : null,
      //     paymentStatus: status
      //   })
      //   .where(eq(submissions.id, parseInt(externalReference)));

      console.log(`Atualizando pagamento: ${externalReference} -> ${status}`);
    } catch (error) {
      console.error("Erro ao atualizar status no banco:", error);
      throw error;
    }
  }

  /**
   * Valida se um pagamento está confirmado
   */
  async validatePayment(paymentId: string): Promise<boolean> {
    try {
      const payment = await asaasService.getPayment(paymentId);
      return payment.status === "RECEIVED" || payment.status === "CONFIRMED";
    } catch (error) {
      console.error("Erro ao validar pagamento:", error);
      return false;
    }
  }

  /**
   * Verifica periodicamente o status de pagamentos pendentes
   * Útil como backup caso o webhook falhe
   */
  async checkPendingPayments(paymentIds: string[]): Promise<void> {
    console.log("Verificando status de pagamentos pendentes...");

    const checkPromises = paymentIds.map(async (paymentId) => {
      try {
        const payment = await asaasService.getPayment(paymentId);

        if (payment.status === "RECEIVED" || payment.status === "CONFIRMED") {
          // Simular webhook para atualizar o banco
          await this.processPaymentWebhook({
            event: "PAYMENT_RECEIVED",
            payment: {
              id: payment.id,
              status: payment.status,
              customer: payment.customer,
              value: payment.value,
              externalReference: payment.externalReference,
              dateCreated: payment.dateCreated,
              confirmedDate: payment.confirmedDate,
            },
          });
        }
      } catch (error) {
        console.error(`Erro ao verificar pagamento ${paymentId}:`, error);
      }
    });

    await Promise.allSettled(checkPromises);
  }
}

export const paymentService = new PaymentService();
