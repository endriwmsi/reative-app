import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { submission, user } from "@/db/schema";
import type {
  AsaasPayment,
  CreatePaymentDTO,
  PaymentCreationResult,
  PaymentStatusResult,
  SubmissionPaymentUpdate,
} from "@/types/payment";
import { AsaasAPIService } from "./asaas-api.service";

/**
 * Service responsável pela lógica de negócio de pagamentos
 * Integra a API do Asaas com o banco de dados da aplicação
 */
export class PaymentService {
  private asaasAPI: AsaasAPIService;

  constructor() {
    this.asaasAPI = new AsaasAPIService();
  }

  /**
   * Cria um pagamento PIX para as submissions selecionadas
   */
  async createPaymentForSubmissions(
    data: CreatePaymentDTO,
    userId: string,
  ): Promise<PaymentCreationResult> {
    try {
      console.log(
        "[PaymentService] Creating payment for submissions:",
        data.submissionIds,
      );

      // Validações básicas
      if (data.submissionIds.length === 0) {
        return {
          success: false,
          message: "Nenhuma submissão selecionada",
          error: "NO_SUBMISSIONS",
        };
      }

      if (data.submissionIds.length > 10) {
        return {
          success: false,
          message: "Máximo de 10 envios por pagamento. Selecione menos envios.",
          error: "TOO_MANY_SUBMISSIONS",
        };
      }

      // Buscar submissions válidas
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
            eq(submission.userId, userId),
            eq(submission.isPaid, false),
          ),
        );

      if (submissions.length === 0) {
        return {
          success: false,
          message:
            "Nenhuma submissão válida encontrada ou todas já foram pagas",
          error: "NO_VALID_SUBMISSIONS",
        };
      }

      // Verificar se o valor confere
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
        .where(eq(user.id, userId))
        .limit(1);

      if (userData.length === 0) {
        return {
          success: false,
          message: "Dados do usuário não encontrados",
          error: "USER_NOT_FOUND",
        };
      }

      const userInfo = userData[0];
      const document = userInfo.cpf || userInfo.cnpj;

      if (!document) {
        return {
          success: false,
          message:
            "CPF ou CNPJ não encontrado no perfil do usuário. Complete seu perfil.",
          error: "NO_DOCUMENT",
        };
      }

      // Criar/buscar cliente no Asaas
      const customerResult = await this.asaasAPI.getOrCreateCustomer({
        name: userInfo.name || "Usuário",
        email: userInfo.email || "",
        cpfCnpj: document,
      });

      if (!customerResult.success || !customerResult.data?.id) {
        return {
          success: false,
          message:
            "Erro ao criar cliente no sistema de pagamento. Verifique se o CPF/CNPJ está correto.",
          error: "ASAAS_CUSTOMER_ERROR",
        };
      }

      // Criar descrição do pagamento
      const description = this.createPaymentDescription(
        submissions,
        data.totalAmount,
      );

      // Criar external reference para identificar as submissions
      const externalReference = this.createExternalReference(
        data.submissionIds,
      );

      // Criar pagamento PIX
      const payment: AsaasPayment = {
        customer: customerResult.data.id,
        billingType: "PIX",
        value: Number(data.totalAmount.toFixed(2)),
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        description: description,
        externalReference: externalReference,
      };

      const paymentResponse = await this.asaasAPI.createPayment(payment);

      // Buscar informações de cobrança PIX
      let pixData = { qrCode: "", pixCopyPaste: "" };
      try {
        const billingInfo = await this.asaasAPI.getPaymentBillingInfo(
          paymentResponse.id,
        );
        pixData = {
          qrCode: billingInfo.pix?.encodedImage || "",
          pixCopyPaste: billingInfo.pix?.payload || "",
        };
      } catch (error) {
        console.warn("[PaymentService] Failed to get PIX billing info:", error);
      }

      // Atualizar submissions com dados do pagamento
      const updateData: Partial<SubmissionPaymentUpdate> = {
        paymentId: paymentResponse.id,
        paymentStatus: paymentResponse.status,
        paymentUrl: paymentResponse.invoiceUrl,
        qrCodeData: pixData.pixCopyPaste,
      };

      await db
        .update(submission)
        .set(updateData)
        .where(inArray(submission.id, data.submissionIds));

      console.log(
        "[PaymentService] Payment created successfully:",
        paymentResponse.id,
      );

      return {
        success: true,
        message: "Pagamento criado com sucesso",
        data: {
          paymentId: paymentResponse.id,
          qrCode: pixData.qrCode,
          pixCopyPaste: pixData.pixCopyPaste,
          paymentUrl: paymentResponse.invoiceUrl || "",
          totalAmount: data.totalAmount,
          submissionTitles: submissions.map((sub) => sub.title),
        },
      };
    } catch (error) {
      console.error("[PaymentService] Error creating payment:", error);
      return {
        success: false,
        message: "Erro interno do servidor. Tente novamente.",
        error: "INTERNAL_ERROR",
      };
    }
  }

  /**
   * Verifica o status de um pagamento
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    try {
      const payment = await this.asaasAPI.getPayment(paymentId);

      if (!payment) {
        return {
          success: false,
          message: "Pagamento não encontrado",
          error: "PAYMENT_NOT_FOUND",
        };
      }

      return {
        success: true,
        message: `Status: ${this.getStatusLabel(payment.status)}`,
        data: {
          status: payment.status,
          isPaid: payment.status === "RECEIVED",
          confirmedDate: payment.confirmedDate,
          paymentId: payment.id,
        },
      };
    } catch (error) {
      console.error("[PaymentService] Error checking payment status:", error);
      return {
        success: false,
        message: "Erro ao verificar status do pagamento",
        error: "STATUS_CHECK_ERROR",
      };
    }
  }

  /**
   * Atualiza submissions com base nos dados do webhook
   */
  async updateSubmissionsFromWebhook(
    paymentId: string,
    isPaid: boolean,
    paymentStatus: string,
    paymentDate?: string,
  ): Promise<{ success: boolean; submissionIds: string[]; error?: string }> {
    try {
      console.log("[PaymentService] Updating submissions from webhook:", {
        paymentId,
        isPaid,
        paymentStatus,
      });

      const updateData: Partial<SubmissionPaymentUpdate> = {
        paymentStatus,
        isPaid,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
      };

      // Buscar submissions antes da atualização para retornar os IDs
      const submissionsToUpdate = await db
        .select({ id: submission.id })
        .from(submission)
        .where(eq(submission.paymentId, paymentId));

      const submissionIds = submissionsToUpdate.map((s) => s.id);

      // Atualizar submissions
      await db
        .update(submission)
        .set(updateData)
        .where(eq(submission.paymentId, paymentId));

      console.log("[PaymentService] Updated submissions:", submissionIds);

      return {
        success: true,
        submissionIds,
      };
    } catch (error) {
      console.error(
        "[PaymentService] Error updating submissions from webhook:",
        error,
      );
      return {
        success: false,
        submissionIds: [],
        error: "Failed to update submissions",
      };
    }
  }

  /**
   * Cria descrição do pagamento baseada nas submissions
   */
  private createPaymentDescription(
    submissions: Array<{ title: string }>,
    totalAmount: number,
  ): string {
    let description = `Pagamento de ${submissions.length} envio(s)`;

    if (submissions.length <= 3) {
      const titles = submissions.map((s) => s.title).join(", ");
      const fullDescription = `${description} - ${titles}`;
      description =
        fullDescription.length <= 200
          ? fullDescription
          : `${description} - ${titles.substring(0, 180)}...`;
    } else {
      description = `${description} (total: R$ ${totalAmount.toFixed(2)})`;
    }

    return description;
  }

  /**
   * Cria external reference para identificar as submissions
   */
  private createExternalReference(submissionIds: string[]): string {
    if (submissionIds.length === 1) {
      return submissionIds[0].substring(0, 50);
    }

    return `submissions-${submissionIds.length}`;
  }

  /**
   * Converte status do Asaas para label legível
   */
  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: "Pendente",
      AWAITING_PAYMENT: "Aguardando Pagamento",
      RECEIVED: "Confirmado",
      OVERDUE: "Vencido",
      CANCELLED: "Cancelado",
      REFUNDED: "Reembolsado",
    };

    return labels[status] || status;
  }
}
