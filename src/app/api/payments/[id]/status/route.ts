import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { asaasService } from "@/services/asaas/asaas-service";
import { paymentService } from "@/services/asaas/payment-service";

/**
 * Endpoint para consultar o status de um pagamento específico
 * GET /api/payments/[id]/status
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: paymentId } = await params;

    if (!paymentId) {
      return NextResponse.json(
        { error: "ID do pagamento é obrigatório" },
        { status: 400 },
      );
    }

    // Verificar se o pagamento existe e obter informações
    const payment = await asaasService.getPayment(paymentId);

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 },
      );
    }

    // Validar se o pagamento está confirmado
    const isValid = await paymentService.validatePayment(paymentId);

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      value: payment.value,
      dateCreated: payment.dateCreated,
      confirmedDate: payment.confirmedDate,
      isValid,
      isPaid: payment.status === "RECEIVED" || payment.status === "CONFIRMED",
    });
  } catch (error) {
    console.error("Erro ao consultar status do pagamento:", error);

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
