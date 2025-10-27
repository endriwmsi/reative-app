"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import {
  commissionEarning,
  product,
  submission,
  user,
  userProductPrice,
} from "@/db/schema";

interface CreateCommissionParams {
  submissionId: string;
  buyerUserId: string;
  productId: number;
  unitPrice: string;
  quantity: number;
  totalAmount: string;
}

/**
 * Cria comissões para uma venda
 * Limitado a apenas 1 nível de comissão (primeiro indicador direto)
 */
export async function createCommissionEarnings({
  submissionId,
  buyerUserId,
  productId,
  unitPrice,
  quantity,
  totalAmount,
}: CreateCommissionParams) {
  try {
    console.log("=== Creating Commission Earnings ===");
    console.log("Submission ID:", submissionId);
    console.log("Buyer User ID:", buyerUserId);
    console.log("Product ID:", productId);

    // Verificar se já existe comissão para esta submissão
    const [existingCommission] = await db
      .select({ id: commissionEarning.id })
      .from(commissionEarning)
      .where(eq(commissionEarning.submissionId, submissionId));

    if (existingCommission) {
      console.log("Comissão já existe para esta submissão");
      return {
        success: true,
        message: "Comissão já foi criada para esta submissão",
      };
    }

    const [buyerUser] = await db
      .select({
        id: user.id,
        referredBy: user.referredBy,
      })
      .from(user)
      .where(eq(user.id, buyerUserId));

    if (!buyerUser?.referredBy) {
      console.log("Usuário não foi indicado");
      return {
        success: true,
        message: "Usuário não foi indicado, nenhuma comissão gerada",
      };
    }

    console.log("Buyer referred by:", buyerUser.referredBy);

    // Buscar o indicador direto (primeiro nível)
    const [referrerUser] = await db
      .select({
        id: user.id,
        referralCode: user.referralCode,
      })
      .from(user)
      .where(eq(user.referralCode, buyerUser.referredBy));

    if (!referrerUser) {
      console.log(
        "Indicador não encontrado para código:",
        buyerUser.referredBy,
      );
      return {
        success: false,
        error: "Indicador não encontrado",
      };
    }

    console.log("Referrer found:", referrerUser.id, referrerUser.referralCode);

    // Buscar preço personalizado do indicador para este produto
    const [customPrice] = await db
      .select({
        customPrice: userProductPrice.customPrice,
      })
      .from(userProductPrice)
      .where(
        and(
          eq(userProductPrice.userId, referrerUser.id),
          eq(userProductPrice.productId, productId),
        ),
      );

    if (!customPrice) {
      console.log(
        "Indicador não possui preço personalizado para produto ID:",
        productId,
      );
      return {
        success: true,
        message: "Indicador não possui preço personalizado para este produto",
      };
    }

    console.log("Custom price found:", customPrice.customPrice);

    // Calcular comissão - LÓGICA CORRETA
    // unitPrice = preço que o indicado pagou (preço personalizado maior)
    // customPrice = NÃO USADO (era confuso)
    // A comissão é a diferença entre o preço personalizado e o preço base do produto

    // Buscar preço base do produto
    const [productData] = await db
      .select({ basePrice: product.basePrice })
      .from(product)
      .where(eq(product.id, productId));

    if (!productData) {
      return {
        success: false,
        error: "Produto não encontrado",
      };
    }

    const basePrice = parseFloat(productData.basePrice); // Preço base do produto (R$ 75)
    const paidPrice = parseFloat(unitPrice); // Preço que o indicado pagou (R$ 175)

    // A comissão é: preço pago pelo indicado - preço base do produto
    const commissionPerUnit = paidPrice - basePrice;

    console.log("🧮 Cálculo de comissão (LÓGICA CORRETA):", {
      precoBaseDoProduto: basePrice, // R$ 75
      precoQuelIndicadoPagou: paidPrice, // R$ 175
      comissaoParaOIndicador: commissionPerUnit, // R$ 100
      unitPrice,
      basePrice: productData.basePrice,
    });

    if (commissionPerUnit <= 0) {
      console.log("❌ Comissão não positiva:", {
        explicacao: "Preço pago pelo indicado deve ser maior que preço base",
        precoBase: basePrice,
        precoPago: paidPrice,
        comissao: commissionPerUnit,
      });
      return {
        success: true,
        message: `Sem comissão: indicado pagou R$${paidPrice}, preço base é R$${basePrice}`,
      };
    }

    const commissionAmount = (commissionPerUnit * quantity).toFixed(2);

    console.log("✅ Comissão calculada com sucesso:", {
      precoBase: basePrice,
      precoPago: paidPrice,
      comissaoPorUnidade: commissionPerUnit,
      quantidade: quantity,
      comissaoTotal: commissionAmount,
      totalCommission: `R$ ${commissionAmount}`,
    });

    // Data disponível para saque (7 dias a partir de agora)
    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + 7);

    // Criar comissão
    const [newCommission] = await db
      .insert(commissionEarning)
      .values({
        id: crypto.randomUUID(),
        submissionId,
        beneficiaryUserId: referrerUser.id,
        buyerUserId,
        productId,
        unitPrice,
        quantity,
        totalAmount,
        commissionAmount,
        status: "pending",
        availableAt,
      })
      .returning();

    console.log("Commission created successfully:", newCommission.id);

    return {
      success: true,
      data: newCommission,
      message: `Comissão de ${commissionAmount} criada para ${referrerUser.referralCode}`,
    };
  } catch (error) {
    console.error("Erro ao criar comissões:", error);
    return {
      success: false,
      error: "Erro interno ao processar comissões",
    };
  }
}

/**
 * Busca o saldo disponível para saque de um usuário
 */
export async function getAvailableBalance(userId: string) {
  try {
    const now = new Date();

    // Buscar comissões disponíveis para saque
    const availableCommissions = await db
      .select({
        id: commissionEarning.id,
        submissionId: commissionEarning.submissionId,
        commissionAmount: commissionEarning.commissionAmount,
        availableAt: commissionEarning.availableAt,
        productId: commissionEarning.productId,
        quantity: commissionEarning.quantity,
        buyerName: user.name,
      })
      .from(commissionEarning)
      .innerJoin(user, eq(commissionEarning.buyerUserId, user.id))
      .where(
        and(
          eq(commissionEarning.beneficiaryUserId, userId),
          eq(commissionEarning.status, "pending"),
          sql`${commissionEarning.availableAt} <= ${now}`,
        ),
      )
      .orderBy(desc(commissionEarning.createdAt));

    // Calcular total disponível
    const totalAvailable = availableCommissions.reduce(
      (total, commission) => total + parseFloat(commission.commissionAmount),
      0,
    );

    // Buscar comissões pendentes (ainda não disponíveis)
    const pendingCommissions = await db
      .select({
        id: commissionEarning.id,
        commissionAmount: commissionEarning.commissionAmount,
        availableAt: commissionEarning.availableAt,
      })
      .from(commissionEarning)
      .where(
        and(
          eq(commissionEarning.beneficiaryUserId, userId),
          eq(commissionEarning.status, "pending"),
          sql`${commissionEarning.availableAt} > ${now}`,
        ),
      );

    const totalPending = pendingCommissions.reduce(
      (total, commission) => total + parseFloat(commission.commissionAmount),
      0,
    );

    return {
      success: true,
      data: {
        availableBalance: totalAvailable,
        pendingBalance: totalPending,
        availableCommissions,
        pendingCommissions,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar saldo disponível:", error);
    return {
      success: false,
      error: "Erro ao consultar saldo",
    };
  }
}

/**
 * Busca todas as comissões de um usuário (histórico completo)
 */
export async function getUserCommissions(userId: string) {
  try {
    const commissions = await db
      .select({
        id: commissionEarning.id,
        submissionId: commissionEarning.submissionId,
        commissionAmount: commissionEarning.commissionAmount,
        status: commissionEarning.status,
        createdAt: commissionEarning.createdAt,
        availableAt: commissionEarning.availableAt,
        withdrawnAt: commissionEarning.withdrawnAt,
        productId: commissionEarning.productId,
        quantity: commissionEarning.quantity,
        totalAmount: commissionEarning.totalAmount,
        buyerName: user.name,
        submissionTitle: submission.title,
      })
      .from(commissionEarning)
      .innerJoin(user, eq(commissionEarning.buyerUserId, user.id))
      .innerJoin(submission, eq(commissionEarning.submissionId, submission.id))
      .where(eq(commissionEarning.beneficiaryUserId, userId))
      .orderBy(desc(commissionEarning.createdAt));

    return {
      success: true,
      data: commissions,
    };
  } catch (error) {
    console.error("Erro ao buscar comissões do usuário:", error);
    return {
      success: false,
      error: "Erro ao consultar comissões",
    };
  }
}

/**
 * Marcar comissões como sacadas
 */
export async function withdrawCommissions(
  userId: string,
  commissionIds: string[],
) {
  try {
    const now = new Date();

    // Verificar se todas as comissões pertencem ao usuário e estão disponíveis
    const commissionsToWithdraw = await db
      .select({
        id: commissionEarning.id,
        status: commissionEarning.status,
        availableAt: commissionEarning.availableAt,
        commissionAmount: commissionEarning.commissionAmount,
      })
      .from(commissionEarning)
      .where(
        and(
          eq(commissionEarning.beneficiaryUserId, userId),
          sql`${commissionEarning.id} = ANY(${commissionIds})`,
        ),
      );

    // Validações
    const invalidCommissions = commissionsToWithdraw.filter(
      (c) => c.status !== "pending" || new Date(c.availableAt) > now,
    );

    if (invalidCommissions.length > 0) {
      return {
        success: false,
        error: "Algumas comissões não estão disponíveis para saque",
      };
    }

    // Atualizar status das comissões
    const updatedCommissions = await db
      .update(commissionEarning)
      .set({
        status: "withdrawn",
        withdrawnAt: now,
      })
      .where(
        and(
          eq(commissionEarning.beneficiaryUserId, userId),
          sql`${commissionEarning.id} = ANY(${commissionIds})`,
        ),
      )
      .returning();

    const totalWithdrawn = updatedCommissions.reduce(
      (total, commission) => total + parseFloat(commission.commissionAmount),
      0,
    );

    revalidatePath("/envios");
    revalidatePath("/comissoes");

    return {
      success: true,
      data: {
        totalWithdrawn,
        commissionsCount: updatedCommissions.length,
      },
      message: `Saque de R$ ${totalWithdrawn.toFixed(2)} realizado com sucesso`,
    };
  } catch (error) {
    console.error("Erro ao processar saque:", error);
    return {
      success: false,
      error: "Erro ao processar saque",
    };
  }
}

/**
 * Busca comissões de um envio específico
 */
export async function getSubmissionCommissions(submissionId: string) {
  try {
    const commissions = await db
      .select({
        id: commissionEarning.id,
        beneficiaryUserId: commissionEarning.beneficiaryUserId,
        beneficiaryName: user.name,
        beneficiaryReferralCode: user.referralCode,
        commissionAmount: commissionEarning.commissionAmount,
        status: commissionEarning.status,
        createdAt: commissionEarning.createdAt,
        availableAt: commissionEarning.availableAt,
        withdrawnAt: commissionEarning.withdrawnAt,
      })
      .from(commissionEarning)
      .innerJoin(user, eq(commissionEarning.beneficiaryUserId, user.id))
      .where(eq(commissionEarning.submissionId, submissionId))
      .orderBy(desc(commissionEarning.createdAt));

    return {
      success: true,
      data: commissions,
    };
  } catch (error) {
    console.error("Erro ao buscar comissões do envio:", error);
    return {
      success: false,
      error: "Erro ao consultar comissões do envio",
    };
  }
}
