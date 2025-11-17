"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { submission } from "@/db/schema/submission";
import { PaymentService } from "@/services";
import type { CreatePaymentDTO } from "@/types/payment";
import { createCommissionEarnings } from "../commission/commission-earnings.action";

export interface CreatePaymentData {
  submissionIds: string[];
  totalAmount: number;
}

export interface PaymentResult {
  success: boolean;
  message: string;
  data?: {
    paymentId: string;
    qrCode: string;
    pixCopyPaste: string;
    paymentUrl: string;
  };
  error?: string;
}

const paymentService = new PaymentService();

export async function createPaymentForSubmissions(
  data: CreatePaymentData,
): Promise<PaymentResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Usuário não autenticado",
        error: "UNAUTHORIZED",
      };
    }

    const paymentData: CreatePaymentDTO = {
      submissionIds: data.submissionIds,
      totalAmount: data.totalAmount,
    };

    const result = await paymentService.createPaymentForSubmissions(
      paymentData,
      session.user.id,
    );

    if (result.success && result.data) {
      revalidatePath("/envios");

      return {
        success: true,
        message: result.message,
        data: {
          paymentId: result.data.paymentId,
          qrCode: result.data.qrCode,
          pixCopyPaste: result.data.pixCopyPaste,
          paymentUrl: result.data.paymentUrl,
        },
      };
    } else {
      return {
        success: false,
        message: result.message,
        error: result.error,
      };
    }
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    return {
      success: false,
      message: "Erro interno do servidor. Tente novamente.",
      error: "INTERNAL_ERROR",
    };
  }
}

export async function checkPaymentStatus(paymentId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, message: "Não autorizado" };
    }

    const result = await paymentService.checkPaymentStatus(paymentId);

    if (!result.success) {
      return {
        success: false,
        message: result.message || "Erro ao verificar status do pagamento",
      };
    }

    const shouldCreateCommissions = result.data?.status === "RECEIVED";

    const updateResult = await paymentService.updateSubmissionsFromWebhook(
      paymentId,
      result.data?.isPaid || false,
      result.data?.status || "PENDING",
      result.data?.confirmedDate,
    );

    if (shouldCreateCommissions && updateResult.success) {
      try {
        // Buscar dados necessários para criar comissões
        for (const submissionId of updateResult.submissionIds) {
          const submissionData = await db
            .select({
              id: submission.id,
              buyerUserId: submission.userId,
              productId: submission.productId,
              unitPrice: submission.unitPrice,
              quantity: submission.quantity,
              totalAmount: submission.totalAmount,
            })
            .from(submission)
            .where(eq(submission.id, submissionId))
            .limit(1);

          if (submissionData.length > 0) {
            const sub = submissionData[0];
            await createCommissionEarnings({
              submissionId: sub.id,
              buyerUserId: sub.buyerUserId,
              productId: sub.productId,
              unitPrice: sub.unitPrice,
              quantity: sub.quantity,
              totalAmount: sub.totalAmount,
            });
          }
        }
      } catch (commissionError) {
        console.error("Erro ao criar comissões:", commissionError);
      }
    }

    revalidatePath("/envios");

    return {
      success: true,
      message: `Status do pagamento: ${result.data?.status || "Desconhecido"}`,
      data: {
        status: result.data?.status || "PENDING",
        isPaid: result.data?.isPaid || false,
        confirmedDate: result.data?.confirmedDate,
      },
    };
  } catch (error) {
    console.error("Erro ao verificar status do pagamento:", error);
    return {
      success: false,
      message: "Erro ao verificar status do pagamento",
    };
  }
}

export async function refreshPaymentData(paymentId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, message: "Não autorizado" };
    }

    return {
      success: true,
      data: {
        paymentId: paymentId,
        qrCode: "",
        pixCopyPaste: "",
        paymentUrl: "",
        status: "",
      },
    };
  } catch (error) {
    console.error("Erro ao buscar dados do pagamento:", error);
    return {
      success: false,
      message: "Erro ao buscar dados do pagamento",
    };
  }
}

export async function getPaymentData(submissionIds: string[]) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Usuário não autenticado",
      };
    }

    const submissions = await db
      .select({
        id: submission.id,
        title: submission.title,
        totalAmount: submission.totalAmount,
        isPaid: submission.isPaid,
      })
      .from(submission)
      .where(
        and(
          inArray(submission.id, submissionIds),
          eq(submission.userId, session.user.id),
        ),
      );

    const totalAmount = submissions.reduce(
      (total, sub) => total + parseFloat(sub.totalAmount),
      0,
    );

    return {
      success: true,
      data: {
        submissions,
        totalAmount,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar dados de pagamento:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}
