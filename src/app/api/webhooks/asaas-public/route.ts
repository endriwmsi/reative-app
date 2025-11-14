import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AsaasWebhookPayload } from "@/services/asaas/asaas-types";
import { paymentService } from "@/services/asaas/payment-service";

/**
 * Webhook público para receber notificações do Asaas
 * Este endpoint NÃO tem proteção de deployment para permitir webhooks externos
 * A segurança é garantida pelo token de autenticação do Asaas
 *
 * IMPORTANTE: O Asaas envia o token via header "asaas-access-token" (não Authorization)
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[WEBHOOK] Asaas notification received via public endpoint");

    // Obter informações da requisição para debug
    const xForwardedFor = request.headers.get("x-forwarded-for");
    const clientIP = xForwardedFor ? xForwardedFor.split(",")[0] : "unknown";
    const userAgent = request.headers.get("user-agent");

    console.log(
      `[WEBHOOK] Request from IP: ${clientIP}, User-Agent: ${userAgent}`,
    );

    // ======================================================
    // VALIDAÇÃO DE TOKEN (conforme documentação do Asaas)
    // ======================================================

    // O Asaas envia o token no header "asaas-access-token"
    const asaasAccessToken = request.headers.get("asaas-access-token");
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    console.log("[WEBHOOK] Token validation:", {
      tokenReceived: asaasAccessToken
        ? `${asaasAccessToken.substring(0, 8)}...`
        : "NOT_PRESENT",
      tokenExpected: expectedToken
        ? `${expectedToken.substring(0, 8)}...`
        : "NOT_CONFIGURED",
      tokensMatch: asaasAccessToken === expectedToken,
    });

    // Verificar se token está configurado
    if (!expectedToken) {
      console.warn(
        "[WEBHOOK] ASAAS_WEBHOOK_TOKEN não configurado - webhook funcionando em modo development",
      );
      console.warn(
        "[WEBHOOK] RECOMENDAÇÃO: Configure ASAAS_WEBHOOK_TOKEN para produção",
      );
    } else {
      // Validar token de autenticação
      if (!asaasAccessToken) {
        console.error("[WEBHOOK] Token não enviado pelo Asaas");
        return NextResponse.json(
          { error: "Token de acesso obrigatório", code: "MISSING_TOKEN" },
          { status: 401 },
        );
      }

      if (asaasAccessToken !== expectedToken) {
        console.error(`[WEBHOOK] Token inválido do IP: ${clientIP}`);
        console.error(
          `[WEBHOOK] Expected: ${expectedToken?.substring(0, 8)}...`,
        );
        console.error(
          `[WEBHOOK] Received: ${asaasAccessToken?.substring(0, 8)}...`,
        );

        return NextResponse.json(
          {
            error: "Token inválido",
            code: "INVALID_TOKEN",
            hint: "Verifique se o token configurado no webhook Asaas é igual ao ASAAS_WEBHOOK_TOKEN",
          },
          { status: 401 },
        );
      }

      console.log("[WEBHOOK] ✅ Token validado com sucesso");
    }

    // ======================================================
    // PROCESSAR PAYLOAD
    // ======================================================

    // Ler o corpo da requisição
    const payload: AsaasWebhookPayload = await request.json();

    console.log("[WEBHOOK] Payload recebido:", {
      event: payload.event,
      paymentId: payload.payment?.id,
      status: payload.payment?.status,
      hasPayment: !!payload.payment,
    });

    // Validar payload básico
    if (!payload.event) {
      console.error("[WEBHOOK] Payload inválido - evento não informado");
      return NextResponse.json(
        { error: "Evento não informado", code: "INVALID_PAYLOAD" },
        { status: 400 },
      );
    }

    // Processar o webhook
    const result = await paymentService.handleWebhook(payload);

    if (!result.success) {
      console.error("[WEBHOOK] Erro ao processar:", result.error);
      return NextResponse.json(
        {
          error: "Erro interno do servidor",
          code: "PROCESSING_ERROR",
          details: result.error,
        },
        { status: 500 },
      );
    }

    console.log("[WEBHOOK] ✅ Processado com sucesso:", {
      paymentId: payload.payment?.id,
      processed: result.processed,
      event: payload.event,
    });

    // Retornar confirmação para o Asaas
    return NextResponse.json({
      received: true,
      processed: result.processed,
      event: payload.event,
      paymentId: payload.payment?.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[WEBHOOK] 💥 Erro não tratado:", error);

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        code: "UNEXPECTED_ERROR",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * Endpoint de verificação de saúde para o webhook
 * GET /api/webhooks/asaas-public
 */
export async function GET() {
  const hasWebhookToken = !!process.env.ASAAS_WEBHOOK_TOKEN;
  const hasAsaasApiKey = !!process.env.ASAAS_API_KEY;

  return NextResponse.json({
    status: "healthy",
    endpoint: "asaas-public-webhook",
    timestamp: new Date().toISOString(),
    configuration: {
      webhookToken: hasWebhookToken ? "configured" : "⚠️ NOT_CONFIGURED",
      asaasApiKey: hasAsaasApiKey ? "configured" : "⚠️ NOT_CONFIGURED",
      environment: process.env.ASAAS_ENVIRONMENT || "not_set",
    },
    instructions: {
      webhookUrl:
        "Configure no Asaas: https://your-app.vercel.app/api/webhooks/asaas-public",
      headerName: "asaas-access-token",
      headerFormat: "Apenas o token UUID (sem 'Bearer')",
      tokenExample: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    },
    troubleshooting: {
      tokenMissing: hasWebhookToken
        ? null
        : "Configure ASAAS_WEBHOOK_TOKEN no ambiente",
      apiKeyMissing: hasAsaasApiKey
        ? null
        : "Configure ASAAS_API_KEY no ambiente",
      testCommand: "node scripts/test/test-webhook-simple.js",
    },
  });
}
