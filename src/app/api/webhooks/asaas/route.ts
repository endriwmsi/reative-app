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
    // Verificar se é uma requisição de automação via Vercel Protection Bypass
    const bypassSecret = request.headers.get("x-vercel-protection-bypass");
    const isAutomation =
      bypassSecret === process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

    if (isAutomation) {
      console.log(
        "[AUTOMATION] Processing payment webhook via protection bypass",
      );
    }

    // Verificar se a requisição tem o token de autenticação correto
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    if (!expectedToken) {
      console.error("ASAAS_WEBHOOK_TOKEN não configurado");
      return NextResponse.json(
        { error: "Webhook não configurado" },
        { status: 500 },
      );
    }

    // Validar token de autenticação (principal método para webhooks do Asaas)
    if (authHeader !== `Bearer ${expectedToken}`) {
      console.warn("Tentativa de acesso ao webhook com token inválido");
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
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
