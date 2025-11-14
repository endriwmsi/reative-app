import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AsaasWebhookPayload } from "@/services/asaas/asaas-types";
import { paymentService } from "@/services/asaas/payment-service";

/**
 * Webhook para receber notificações do Asaas sobre mudanças no status de pagamento
 * Este endpoint é chamado automaticamente pelo Asaas quando há alterações nos pagamentos
 * Suporta bypass de proteção Vercel para automação e webhooks externos
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar bypass via header (automação) ou query parameter (webhooks externos)
    const bypassSecret = request.headers.get("x-vercel-protection-bypass");
    const url = new URL(request.url);
    const queryBypass = url.searchParams.get("bypass");

    const isAutomation =
      bypassSecret === process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    const isWebhookBypass =
      queryBypass === process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

    if (isAutomation) {
      console.log(
        "[AUTOMATION] Processing payment webhook via protection bypass",
      );
    } else if (isWebhookBypass) {
      console.log(
        "[WEBHOOK] Processing Asaas webhook via URL bypass parameter",
      );
    }

    // Verificar autenticação via header asaas-access-token (conforme documentação do Asaas)
    const asaasAccessToken = request.headers.get("asaas-access-token");
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    // Se token não configurado, permitir acesso mas logar warning
    if (!expectedToken) {
      console.warn(
        "[WEBHOOK] ASAAS_WEBHOOK_TOKEN não configurado - webhook funcionando em modo development",
      );
    } else {
      // Validar token de autenticação conforme documentação do Asaas
      if (asaasAccessToken !== expectedToken) {
        console.warn("[WEBHOOK] Token inválido na requisição");
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
      }
      console.log("[WEBHOOK] Token validado com sucesso");
    }

    // Ler o corpo da requisição
    const payload: AsaasWebhookPayload = await request.json();

    console.log("Webhook recebido:", {
      event: payload.event,
      paymentId: payload.payment?.id,
      timestamp: new Date().toISOString(),
    });

    // Processar apenas eventos de pagamento relevantes
    const relevantEvents = [
      "PAYMENT_CREATED",
      "PAYMENT_AWAITING_RISK_ANALYSIS",
      "PAYMENT_APPROVED_BY_RISK_ANALYSIS",
      "PAYMENT_RECEIVED",
      "PAYMENT_CONFIRMED",
      "PAYMENT_OVERDUE",
      "PAYMENT_REFUNDED",
      "PAYMENT_RECEIVED_IN_CASH",
      "PAYMENT_DELETED",
    ];

    if (relevantEvents.includes(payload.event)) {
      await paymentService.processPaymentWebhook(payload);
    } else {
      console.log("Evento ignorado:", payload.event);
    }

    // Retornar sucesso para o Asaas
    return NextResponse.json(
      {
        message: "Webhook processado com sucesso",
        event: payload.event,
        processed: relevantEvents.includes(payload.event),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao processar webhook do Asaas:", error);

    // Retornar erro para que o Asaas reenvie o webhook
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

/**
 * Método GET para testar se o webhook está funcionando
 */
export async function GET() {
  return NextResponse.json({
    message: "Webhook do Asaas está funcionando",
    timestamp: new Date().toISOString(),
    environment: process.env.ASAAS_ENVIRONMENT || "sandbox",
  });
}

/**
 * Método OPTIONS para suporte a CORS e preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, asaas-access-token, x-vercel-protection-bypass",
      "Access-Control-Max-Age": "86400",
    },
  });
}
