import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AsaasWebhookPayload } from "@/services/asaas/asaas-types";
import { paymentService } from "@/services/asaas/payment-service";

/**
 * Webhook público para receber notificações do Asaas
 * Este endpoint NÃO tem proteção de deployment para permitir webhooks externos
 * A segurança é garantida pelo token de autenticação do Asaas
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[WEBHOOK] Asaas notification received via public endpoint");

    // Verificar IP origin (opcional - adicione IPs do Asaas se necessário)
    const xForwardedFor = request.headers.get("x-forwarded-for");
    const clientIP = xForwardedFor ? xForwardedFor.split(",")[0] : "unknown";

    console.log(`[WEBHOOK] Request from IP: ${clientIP}`);

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
      console.warn(
        `[WEBHOOK] Tentativa de acesso com token inválido do IP: ${clientIP}`,
      );
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Ler o corpo da requisição
    const payload: AsaasWebhookPayload = await request.json();

    console.log("[WEBHOOK] Payload recebido:", {
      event: payload.event,
      paymentId: payload.payment?.id,
      status: payload.payment?.status,
    });

    // Processar o webhook
    const result = await paymentService.handleWebhook(payload);

    if (!result.success) {
      console.error("[WEBHOOK] Erro ao processar:", result.error);
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 },
      );
    }

    console.log("[WEBHOOK] Processado com sucesso:", {
      paymentId: payload.payment?.id,
      processed: result.processed,
    });

    // Retornar confirmação para o Asaas
    return NextResponse.json({
      received: true,
      processed: result.processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[WEBHOOK] Erro não tratado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

/**
 * Endpoint de verificação de saúde para o webhook
 */
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    endpoint: "asaas-public-webhook",
    timestamp: new Date().toISOString(),
    configured: !!process.env.ASAAS_WEBHOOK_TOKEN,
  });
}
