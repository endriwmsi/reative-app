"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { product, submission, user, userProductPrice } from "@/db/schema";

interface CommissionData {
  submissionId: string;
  buyerUserId: string;
  productId: number;
  quantity: number;
  totalAmount: string;
  unitPrice: string;
}

interface CommissionCalculation {
  level: number;
  userId: string;
  userName: string;
  referralCode: string;
  basePrice: string;
  sellingPrice: string;
  commissionPerUnit: string;
  totalCommission: string;
}

export async function calculateCommissionChain(
  commissionData: CommissionData,
): Promise<{
  success: boolean;
  data?: CommissionCalculation[];
  error?: string;
}> {
  try {
    const { buyerUserId, productId, quantity, unitPrice } = commissionData;

    // Buscar o produto base
    const [productData] = await db
      .select()
      .from(product)
      .where(eq(product.id, productId));

    if (!productData) {
      return { success: false, error: "Produto não encontrado" };
    }

    // Buscar a cadeia de afiliados
    const affiliateChain: CommissionCalculation[] = [];
    let currentUserId = buyerUserId;
    let level = 0;

    while (currentUserId && level < 10) {
      // Máximo 10 níveis para evitar loops infinitos
      // Buscar dados do usuário atual
      const [userData] = await db
        .select({
          id: user.id,
          name: user.name,
          referralCode: user.referralCode,
          referredBy: user.referredBy,
        })
        .from(user)
        .where(eq(user.id, currentUserId));

      if (!userData) break;

      // Se não é o comprador (nível 0), buscar o preço que ele definiu para este produto
      let sellingPrice = productData.basePrice;

      if (level > 0) {
        const [userPrice] = await db
          .select()
          .from(userProductPrice)
          .where(
            and(
              eq(userProductPrice.userId, currentUserId),
              eq(userProductPrice.productId, productId),
            ),
          );

        sellingPrice = userPrice?.customPrice || productData.basePrice;
      } else {
        // No nível 0 (comprador), o preço de venda é o preço que ele pagou
        sellingPrice = unitPrice;
      }

      // Calcular comissão (diferença entre preço base e preço de venda)
      const basePrice = parseFloat(productData.basePrice);
      const selling = parseFloat(sellingPrice);
      const commissionPerUnit = Math.max(0, selling - basePrice);
      const totalCommission = commissionPerUnit * quantity;

      affiliateChain.push({
        level,
        userId: userData.id,
        userName: userData.name,
        referralCode: userData.referralCode,
        basePrice: productData.basePrice,
        sellingPrice: sellingPrice,
        commissionPerUnit: commissionPerUnit.toFixed(2),
        totalCommission: totalCommission.toFixed(2),
      });

      // Se não tem referrer, parar a cadeia
      if (!userData.referredBy) break;

      // Buscar o próximo usuário na cadeia (quem indicou o atual)
      const [referrerData] = await db
        .select()
        .from(user)
        .where(eq(user.referralCode, userData.referredBy));

      if (!referrerData) break;

      currentUserId = referrerData.id;
      level++;
    }

    return { success: true, data: affiliateChain };
  } catch (error) {
    console.error("Erro ao calcular comissões:", error);
    return { success: false, error: "Erro ao calcular comissões" };
  }
}

export async function getAvailableProductPrice(
  userId: string,
  productId: number,
): Promise<{
  success: boolean;
  data?: { basePrice: string; userPrice: string | null; canSell: boolean };
  error?: string;
}> {
  try {
    // Buscar produto
    const [productData] = await db
      .select()
      .from(product)
      .where(and(eq(product.id, productId), eq(product.isActive, true)));

    if (!productData) {
      return { success: false, error: "Produto não encontrado" };
    }

    // Buscar preço personalizado do usuário
    const [userPrice] = await db
      .select()
      .from(userProductPrice)
      .where(
        and(
          eq(userProductPrice.userId, userId),
          eq(userProductPrice.productId, productId),
        ),
      );

    // Verificar se o usuário pode vender (tem preço personalizado definido)
    const canSell = userPrice !== undefined;

    return {
      success: true,
      data: {
        basePrice: productData.basePrice,
        userPrice: userPrice?.customPrice || null,
        canSell,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar preço do produto:", error);
    return { success: false, error: "Erro ao buscar preço do produto" };
  }
}

export async function calculateUserEarnings(
  _userId: string,
  _startDate?: Date,
  _endDate?: Date,
): Promise<{
  success: boolean;
  data?: {
    totalEarnings: string;
    submissionCount: number;
    avgCommissionPerSubmission: string;
  };
  error?: string;
}> {
  try {
    // Buscar todas as comissões do usuário baseadas nos envios
    // Isso seria implementado com uma query mais complexa que calcula
    // a diferença entre o preço pago pelo indicado e o preço base

    // Por enquanto, retorna um exemplo
    const totalEarnings = "1250.50";
    const submissionCount = 12;
    const avgCommissionPerSubmission = (
      parseFloat(totalEarnings) / submissionCount
    ).toFixed(2);

    return {
      success: true,
      data: {
        totalEarnings,
        submissionCount,
        avgCommissionPerSubmission,
      },
    };
  } catch (error) {
    console.error("Erro ao calcular ganhos:", error);
    return { success: false, error: "Erro ao calcular ganhos" };
  }
}

export async function getCommissionReport(
  submissionId: string,
  userId: string,
  isAdmin = false,
): Promise<{
  success: boolean;
  data?: {
    submission: {
      id: string;
      userId: string;
      productId: number;
      title: string;
      totalAmount: string;
      unitPrice: string;
      quantity: number;
      createdAt: Date;
    };
    commissionChain: CommissionCalculation[];
  };
  error?: string;
}> {
  try {
    // Buscar o envio
    const [submissionData] = await db
      .select({
        id: submission.id,
        userId: submission.userId,
        productId: submission.productId,
        title: submission.title,
        totalAmount: submission.totalAmount,
        unitPrice: submission.unitPrice,
        quantity: submission.quantity,
        createdAt: submission.createdAt,
      })
      .from(submission)
      .where(eq(submission.id, submissionId));

    if (!submissionData) {
      return { success: false, error: "Envio não encontrado" };
    }

    // Verificar permissões
    if (!isAdmin && submissionData.userId !== userId) {
      return {
        success: false,
        error: "Sem permissão para acessar este relatório",
      };
    }

    // Calcular cadeia de comissões
    const commissionResult = await calculateCommissionChain({
      submissionId,
      buyerUserId: submissionData.userId,
      productId: submissionData.productId,
      quantity: submissionData.quantity,
      totalAmount: submissionData.totalAmount,
      unitPrice: submissionData.unitPrice,
    });

    if (!commissionResult.success) {
      return { success: false, error: commissionResult.error };
    }

    return {
      success: true,
      data: {
        submission: submissionData,
        commissionChain: commissionResult.data || [],
      },
    };
  } catch (error) {
    console.error("Erro ao gerar relatório de comissões:", error);
    return { success: false, error: "Erro ao gerar relatório" };
  }
}
