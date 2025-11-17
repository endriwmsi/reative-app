import type {
  AsaasWebhookEvent,
  WebhookProcessingResult,
  WebhookValidationResult,
} from "@/types/payment";
import { PaymentService } from "./payment.service";

/**
 * Service responsável pelo processamento de webhooks do Asaas
 */
export class WebhookService {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Valida o payload do webhook
   */
  validateWebhook(payload: unknown): WebhookValidationResult {
    try {
      // Verificar se é um objeto válido
      if (!payload || typeof payload !== "object") {
        return {
          valid: false,
          error: "Payload inválido: não é um objeto",
        };
      }

      const event = payload as AsaasWebhookEvent;

      // Validar campos obrigatórios
      if (!event.id || !event.event || !event.dateCreated || !event.payment) {
        return {
          valid: false,
          error: "Payload inválido: campos obrigatórios ausentes",
        };
      }

      // Validar payment object
      if (!event.payment.id || !event.payment.status) {
        return {
          valid: false,
          error: "Payload inválido: dados do pagamento incompletos",
        };
      }

      // Validar se é um evento que processamos
      const supportedEvents = [
        "PAYMENT_RECEIVED",
        "PAYMENT_CREATED",
        "PAYMENT_UPDATED",
        "PAYMENT_CANCELLED",
        "PAYMENT_REFUNDED",
      ];

      if (!supportedEvents.includes(event.event)) {
        return {
          valid: false,
          error: `Evento não suportado: ${event.event}`,
        };
      }

      console.log("[WebhookService] Webhook validation passed:", {
        eventId: event.id,
        eventType: event.event,
        paymentId: event.payment.id,
        paymentStatus: event.payment.status,
      });

      return {
        valid: true,
        event,
      };
    } catch (error) {
      console.error("[WebhookService] Error validating webhook:", error);
      return {
        valid: false,
        error: "Erro ao validar webhook",
      };
    }
  }

  /**
   * Processa um evento de webhook
   */
  async processWebhook(
    event: AsaasWebhookEvent,
  ): Promise<WebhookProcessingResult> {
    console.log("[WebhookService] Processing webhook:", {
      eventId: event.id,
      eventType: event.event,
      paymentId: event.payment.id,
      paymentStatus: event.payment.status,
    });

    try {
      switch (event.event) {
        case "PAYMENT_RECEIVED":
          return await this.processPaymentReceived(event);

        case "PAYMENT_UPDATED":
          return await this.processPaymentUpdated(event);

        case "PAYMENT_CANCELLED":
        case "PAYMENT_REFUNDED":
          return await this.processPaymentCancelled(event);

        default:
          console.log(
            "[WebhookService] Event type not processed:",
            event.event,
          );
          return {
            success: true,
            message: `Evento ${event.event} recebido mas não processado`,
            processed: false,
            paymentId: event.payment.id,
          };
      }
    } catch (error) {
      console.error("[WebhookService] Error processing webhook:", error);
      return {
        success: false,
        message: "Erro ao processar webhook",
        processed: false,
        paymentId: event.payment.id,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Processa evento de pagamento recebido
   */
  private async processPaymentReceived(
    event: AsaasWebhookEvent,
  ): Promise<WebhookProcessingResult> {
    console.log(
      "[WebhookService] Processing PAYMENT_RECEIVED:",
      event.payment.id,
    );

    const updateResult = await this.paymentService.updateSubmissionsFromWebhook(
      event.payment.id,
      true, // isPaid = true
      event.payment.status,
      event.payment.paymentDate || undefined,
    );

    if (!updateResult.success) {
      return {
        success: false,
        message: "Erro ao atualizar submissions",
        processed: false,
        paymentId: event.payment.id,
        error: updateResult.error,
      };
    }

    // TODO: Aqui você pode adicionar a lógica para criar comissões
    // await this.createCommissionsForSubmissions(updateResult.submissionIds);

    console.log("[WebhookService] Payment received processed successfully:", {
      paymentId: event.payment.id,
      submissionsUpdated: updateResult.submissionIds.length,
    });

    return {
      success: true,
      message: "Pagamento confirmado e submissions atualizadas",
      processed: true,
      paymentId: event.payment.id,
      submissionIds: updateResult.submissionIds,
    };
  }

  /**
   * Processa evento de pagamento atualizado
   */
  private async processPaymentUpdated(
    event: AsaasWebhookEvent,
  ): Promise<WebhookProcessingResult> {
    console.log(
      "[WebhookService] Processing PAYMENT_UPDATED:",
      event.payment.id,
    );

    const isPaid = event.payment.status === "RECEIVED";

    const updateResult = await this.paymentService.updateSubmissionsFromWebhook(
      event.payment.id,
      isPaid,
      event.payment.status,
      event.payment.paymentDate || undefined,
    );

    if (!updateResult.success) {
      return {
        success: false,
        message: "Erro ao atualizar submissions",
        processed: false,
        paymentId: event.payment.id,
        error: updateResult.error,
      };
    }

    return {
      success: true,
      message: `Status do pagamento atualizado para: ${event.payment.status}`,
      processed: true,
      paymentId: event.payment.id,
      submissionIds: updateResult.submissionIds,
    };
  }

  /**
   * Processa evento de pagamento cancelado/reembolsado
   */
  private async processPaymentCancelled(
    event: AsaasWebhookEvent,
  ): Promise<WebhookProcessingResult> {
    console.log(
      "[WebhookService] Processing PAYMENT_CANCELLED/REFUNDED:",
      event.payment.id,
    );

    const updateResult = await this.paymentService.updateSubmissionsFromWebhook(
      event.payment.id,
      false, // isPaid = false
      event.payment.status,
    );

    if (!updateResult.success) {
      return {
        success: false,
        message: "Erro ao atualizar submissions",
        processed: false,
        paymentId: event.payment.id,
        error: updateResult.error,
      };
    }

    return {
      success: true,
      message: `Pagamento ${event.payment.status.toLowerCase()}`,
      processed: true,
      paymentId: event.payment.id,
      submissionIds: updateResult.submissionIds,
    };
  }
}
