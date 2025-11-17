import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
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

    // Resposta de sucesso
    return NextResponse.json({
      success: true,
      message: result.message,
      eventId: validation.event.id,
      paymentId: result.paymentId,
      processed: result.processed,
    });
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
