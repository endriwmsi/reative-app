import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { paymentService } from "@/services/asaas/payment-service";

/**
 * Endpoint para verificar pagamentos pendentes em lote
 * POST /api/payments/check-pending
 *
 * Body: { paymentIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIds } = body;

    if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: "Lista de IDs de pagamento é obrigatória" },
        { status: 400 },
      );
    }

    // Verificar até 10 pagamentos por vez para evitar sobrecarga
    if (paymentIds.length > 10) {
      return NextResponse.json(
        { error: "Máximo de 10 pagamentos por verificação" },
        { status: 400 },
      );
    }

    // Verificar os pagamentos pendentes
    await paymentService.checkPendingPayments(paymentIds);

    return NextResponse.json({
      message: "Verificação de pagamentos concluída",
      checkedCount: paymentIds.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao verificar pagamentos pendentes:", error);

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

/**
 * Endpoint GET para documentação da API
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/payments/check-pending",
    method: "POST",
    description: "Verifica o status de pagamentos pendentes em lote",
    body: {
      paymentIds: ["string[]"],
    },
    limits: {
      maxPayments: 10,
    },
  });
}
