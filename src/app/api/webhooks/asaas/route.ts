import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidateSubmissionsData } from "@/actions/revalidate/revalidate.action";
import { WebhookService } from "@/services/webhook.service";

const webhookService = new WebhookService();

export async function POST(request: NextRequest) {
  console.log("[AsaasWebhook] Received webhook request");

  try {
    // Verificar se o request tem body
    if (!request.body) {
      console.error("[AsaasWebhook] No request body");
      return NextResponse.json(
        { error: "Missing request body" },
        { status: 400 },
      );
    }

    // Parse do payload
    let payload: unknown;
    try {
      payload = await request.json();
      console.log("[AsaasWebhook] Payload received:", {
        hasPayload: !!payload,
        payloadType: typeof payload,
      });
    } catch (parseError) {
      console.error("[AsaasWebhook] Error parsing JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    // Validar webhook
    const validation = webhookService.validateWebhook(payload);
    if (!validation.valid) {
      console.error(
        "[AsaasWebhook] Webhook validation failed:",
        validation.error,
      );
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    if (!validation.event) {
      console.error("[AsaasWebhook] No event in validation result");
      return NextResponse.json(
        { error: "Event validation failed" },
        { status: 400 },
      );
    }

    // Log detalhes do evento
    console.log("[AsaasWebhook] Processing valid webhook:", {
      eventId: validation.event.id,
      eventType: validation.event.event,
      paymentId: validation.event.payment.id,
      paymentStatus: validation.event.payment.status,
      externalReference: validation.event.payment.externalReference,
    });

    // Processar webhook
    const result = await webhookService.processWebhook(validation.event);

    if (!result.success) {
      console.error("[AsaasWebhook] Webhook processing failed:", result);
      return NextResponse.json(
        {
          error: result.message,
          details: result.error,
        },
        { status: 500 },
      );
    }

    // Log resultado
    console.log("[AsaasWebhook] Webhook processed successfully:", {
      eventType: validation.event.event,
      paymentId: result.paymentId,
      processed: result.processed,
      submissionsAffected: result.submissionIds?.length || 0,
    });

    // Se o pagamento foi confirmado, forçar revalidação completa
    if (validation.event.event === "PAYMENT_RECEIVED" && result.success) {
      try {
        console.log(
          "[AsaasWebhook] Payment confirmed - starting complete revalidation",
        );

        // Método 1: Revalidação direta (funciona para futuras requisições)
        revalidatePath("/dashboard");
        revalidatePath("/envios");
        revalidatePath("/dashboard/envios");
        revalidatePath("/(dashboard)/envios");

        // Método 2: Server Action (mais robusta)
        const serverRevalidation = await revalidateSubmissionsData();
        if (serverRevalidation.success) {
          console.log(
            "[AsaasWebhook] Server action revalidation completed successfully",
          );
        } else {
          console.error(
            "[AsaasWebhook] Server action revalidation failed:",
            serverRevalidation.error,
          );
        }

        console.log("[AsaasWebhook] Complete revalidation process finished");
      } catch (revalidationError) {
        console.error(
          "[AsaasWebhook] Error during revalidation process:",
          revalidationError,
        );
        // Não falhar o webhook por causa disso
      }
    }

    // Resposta de sucesso
    const response = {
      success: true,
      message: result.message,
      eventId: validation.event.id,
      paymentId: result.paymentId,
      processed: result.processed,
      // Adicionar informações para broadcast
      shouldBroadcast:
        validation.event.event === "PAYMENT_RECEIVED" && result.success,
      eventType: validation.event.event,
    };

    console.log("[AsaasWebhook] Sending response:", {
      success: response.success,
      eventType: response.eventType,
      shouldBroadcast: response.shouldBroadcast,
      paymentId: response.paymentId,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("[AsaasWebhook] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
