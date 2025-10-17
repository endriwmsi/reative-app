"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { submission } from "@/db/schema/submission";
import { user } from "@/db/schema/user";
import { AsaasAPI, type AsaasCustomer, asaas } from "@/lib/asaas";

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

    // Buscar as submissions selecionadas
    const submissions = await db
      .select({
        id: submission.id,
        title: submission.title,
        totalAmount: submission.totalAmount,
        userId: submission.userId,
        isPaid: submission.isPaid,
      })
      .from(submission)
      .where(
        and(
          inArray(submission.id, data.submissionIds),
          eq(submission.userId, session.user.id),
          eq(submission.isPaid, false), // Apenas submissions não pagas
        ),
      );

    if (submissions.length === 0) {
      return {
        success: false,
        message: "Nenhuma submissão válida encontrada",
        error: "NO_SUBMISSIONS",
      };
    }

    // Verificar se o valor total confere
    const calculatedTotal = submissions.reduce(
      (total, sub) => total + parseFloat(sub.totalAmount),
      0,
    );

    if (Math.abs(calculatedTotal - data.totalAmount) > 0.01) {
      return {
        success: false,
        message: "Valor total não confere com as submissões selecionadas",
        error: "INVALID_AMOUNT",
      };
    }

    // Buscar dados do usuário
    const userData = await db
      .select({
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        cnpj: user.cnpj,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (userData.length === 0) {
      return {
        success: false,
        message: "Dados do usuário não encontrados",
        error: "USER_NOT_FOUND",
      };
    }

    const userInfo = userData[0];

    // Verificar se temos CPF ou CNPJ válido
    const document = userInfo.cpf || userInfo.cnpj;
    if (!document) {
      return {
        success: false,
        message:
          "CPF ou CNPJ não encontrado no perfil do usuário. Entre em contato com o suporte.",
        error: "NO_DOCUMENT",
      };
    }

    // Criar ou obter customer no Asaas
    let customer: AsaasCustomer;
    try {
      customer = await asaas.getOrCreateCustomer({
        name: userInfo.name || "Usuário",
        email: userInfo.email || "",
        cpfCnpj: document,
      });

      if (!customer || !customer.id) {
        return {
          success: false,
          message: "Erro ao criar cliente no sistema de pagamento",
          error: "CUSTOMER_CREATION_FAILED",
        };
      }
    } catch (error) {
      console.error("Erro ao criar cliente no Asaas:", error);
      return {
        success: false,
        message:
          "Erro ao criar cliente no sistema de pagamento. Verifique se o CPF/CNPJ está correto.",
        error: "ASAAS_CUSTOMER_ERROR",
      };
    }

    // Criar descrição do pagamento
    const description = `Pagamento de ${submissions.length} envio(s) - ${submissions
      .map((s) => s.title)
      .join(", ")}`;

    // Criar pagamento PIX no Asaas
    const customerId = customer.id;
    if (!customerId) {
      return {
        success: false,
        message: "ID do cliente não foi retornado pelo sistema de pagamento",
        error: "INVALID_CUSTOMER_ID",
      };
    }

    const payment = await asaas.createPixPayment(
      customerId,
      data.totalAmount,
      description,
      `submissions-${data.submissionIds.join("-")}`,
    );

    console.log("=== Payment Response Debug ===");
    console.log("Payment ID:", payment.id);
    console.log("Payment Status:", payment.status);
    console.log("PIX Transaction:", payment.pixTransaction);
    console.log(
      "Encoded Image:",
      payment.pixTransaction?.encodedImage ? "Present" : "Missing",
    );
    console.log(
      "Payload:",
      payment.pixTransaction?.payload ? "Present" : "Missing",
    );

    // Atualizar submissions com dados do pagamento
    await db
      .update(submission)
      .set({
        paymentId: payment.id,
        paymentStatus: payment.status,
        paymentUrl: payment.invoiceUrl,
        qrCodeData: payment.pixTransaction?.payload,
      })
      .where(inArray(submission.id, data.submissionIds));

    revalidatePath("/envios");

    return {
      success: true,
      message: "Pagamento criado com sucesso",
      data: {
        paymentId: payment.id,
        qrCode: payment.pixTransaction?.encodedImage || "",
        pixCopyPaste: payment.pixTransaction?.payload || "",
        paymentUrl: payment.invoiceUrl || "",
      },
    };
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    return {
      success: false,
      message: "Erro interno do servidor",
      error: "INTERNAL_ERROR",
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

    console.log("=== Refresh Payment Data Debug ===");
    console.log("Payment ID:", paymentId);

    const asaasApi = new AsaasAPI();

    // Buscar dados básicos do pagamento
    const payment = await asaasApi.getPayment(paymentId);
    console.log("Payment data from Asaas:", payment);

    if (!payment) {
      return { success: false, message: "Pagamento não encontrado" };
    }

    // Buscar dados de cobrança para obter informações do PIX
    let pixData = { qrCode: "", pixCopyPaste: "" };

    try {
      const billingInfo = await asaasApi.getPaymentBillingInfo(paymentId);
      console.log("Billing info from Asaas:", billingInfo);

      if (billingInfo.pix) {
        pixData = {
          qrCode: billingInfo.pix.encodedImage || "",
          pixCopyPaste: billingInfo.pix.payload || "",
        };
      }
    } catch (billingError) {
      console.warn("Failed to get billing info:", billingError);
      // Tentar usar dados do pagamento se disponíveis
      if (payment.pixTransaction) {
        pixData = {
          qrCode: payment.pixTransaction.encodedImage || "",
          pixCopyPaste: payment.pixTransaction.payload || "",
        };
      }
    }

    console.log("Final PIX data:", pixData);

    return {
      success: true,
      data: {
        paymentId: payment.id,
        qrCode: pixData.qrCode,
        pixCopyPaste: pixData.pixCopyPaste,
        paymentUrl: payment.invoiceUrl || "",
        status: payment.status,
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

export async function checkPaymentStatus(paymentId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, message: "Não autorizado" };
    }

    console.log("=== Check Payment Status Debug ===");
    console.log("Payment ID:", paymentId);

    const asaasApi = new AsaasAPI();
    const payment = await asaasApi.getPayment(paymentId);

    console.log("Payment status from Asaas:", payment?.status);

    if (!payment) {
      return { success: false, message: "Pagamento não encontrado" };
    }

    // Atualizar status no banco de dados
    await db
      .update(submission)
      .set({
        paymentStatus: payment.status,
        paymentDate: payment.confirmedDate
          ? new Date(payment.confirmedDate)
          : null,
        isPaid: payment.status === "RECEIVED",
      })
      .where(eq(submission.paymentId, paymentId));

    revalidatePath("/envios");

    return {
      success: true,
      message: `Status do pagamento: ${payment.status}`,
      data: {
        status: payment.status,
        isPaid: payment.status === "RECEIVED",
        confirmedDate: payment.confirmedDate,
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

export async function getPaymentData(submissionIds: string[]): Promise<{
  success: boolean;
  data?: {
    submissions: Array<{
      id: string;
      title: string;
      totalAmount: string;
      isPaid: boolean;
    }>;
    totalAmount: number;
  };
  error?: string;
}> {
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
