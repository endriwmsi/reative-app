import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Endpoint de teste para validar configuração de webhook
 * GET /api/webhooks/test - Status da configuração
 * POST /api/webhooks/test - Simular webhook do Asaas
 */

export async function GET() {
  const hasWebhookToken = !!process.env.ASAAS_WEBHOOK_TOKEN;
  const hasAsaasApiKey = !!process.env.ASAAS_API_KEY;

  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    configuration: {
      webhookToken: hasWebhookToken ? "configured" : "missing",
      asaasApiKey: hasAsaasApiKey ? "configured" : "missing",
      environment: process.env.ASAAS_ENVIRONMENT || "not_set",
    },
    endpoints: {
      main: "/api/webhooks/asaas",
      public: "/api/webhooks/asaas-public",
      test: "/api/webhooks/test",
    },
    instructions: {
      webhookUrl: "Use: https://your-app.vercel.app/api/webhooks/asaas-public",
      authHeader: "asaas-access-token: YOUR_WEBHOOK_TOKEN",
      authFormat: "Não use 'Bearer', apenas o token diretamente",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log("[TEST] Simulando webhook do Asaas");

    // Verificar headers
    const asaasAccessToken = request.headers.get("asaas-access-token");
    const contentType = request.headers.get("content-type");
    const userAgent = request.headers.get("user-agent");

    console.log("[TEST] Headers recebidos:", {
      asaasAccessToken: asaasAccessToken
        ? `${asaasAccessToken.substring(0, 8)}...`
        : "not_present",
      contentType,
      userAgent,
    });

    // Ler payload
    const payload = await request.json();
    console.log("[TEST] Payload recebido:", payload);

    // Simular validação
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    const validation = {
      tokenConfigured: !!expectedToken,
      tokenProvided: !!asaasAccessToken,
      tokenValid: expectedToken === asaasAccessToken,
      payloadValid: !!payload.event && !!payload.payment,
    };

    console.log("[TEST] Validação:", validation);

    return NextResponse.json({
      received: true,
      test: true,
      timestamp: new Date().toISOString(),
      validation,
      payload: {
        event: payload.event,
        paymentId: payload.payment?.id,
        status: payload.payment?.status,
      },
      nextSteps: validation.tokenValid
        ? "✅ Configuração válida! Configure esta URL no Asaas."
        : "❌ Configure ASAAS_WEBHOOK_TOKEN no ambiente.",
    });
  } catch (error) {
    console.error("[TEST] Erro:", error);
    return NextResponse.json(
      {
        error: "Erro ao processar teste",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
