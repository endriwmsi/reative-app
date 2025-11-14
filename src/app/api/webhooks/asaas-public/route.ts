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

    // Verificar autenticação via header asaas-access-token (conforme documentação do Asaas)
    const asaasAccessToken = request.headers.get("asaas-access-token");
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    // Se token não configurado, permitir acesso mas logar warning (para desenvolvimento)
    if (!expectedToken) {
      console.warn(
        "[WEBHOOK] ASAAS_WEBHOOK_TOKEN não configurado - webhook funcionando em modo development",
      );
    } else {
      // Validar token de autenticação conforme documentação do Asaas
      if (asaasAccessToken !== expectedToken) {
        console.warn(
          `[WEBHOOK] Token inválido do IP: ${clientIP}. Expected: ${expectedToken?.substring(0, 8)}..., Received: ${asaasAccessToken?.substring(0, 8) || "none"}...`,
        );
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
      }
      console.log("[WEBHOOK] Token validado com sucesso");
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
