"use server";

import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { coupon, product, user, userProductPrice } from "@/db/schema";
import { formatCurrency } from "@/lib/utils";

export interface CreateCouponParams {
  userId: string;
  productId: number;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  isUnique: boolean;
  maxUses?: number;
  expiresAt?: Date;
  description?: string;
}

export interface ValidateCouponParams {
  code: string;
  productId: number;
  userId?: string; // Usuário que está tentando usar o cupom
}

// Função de compatibilidade para manter a antiga assinatura (deprecated)
export async function validateCouponOld(
  code: string,
  productId: number,
  userId?: string,
) {
  return validateCoupon({ code, productId, userId });
}

/**
 * Cria um novo cupom de desconto
 */
export async function createCoupon(params: CreateCouponParams) {
  try {
    const {
      userId,
      productId,
      code,
      discountType,
      discountValue,
      isUnique,
      maxUses,
      expiresAt,
      description,
    } = params;

    // Buscar dados do produto
    const [productData] = await db
      .select({
        id: product.id,
        name: product.name,
        basePrice: product.basePrice,
      })
      .from(product)
      .where(eq(product.id, productId));

    if (!productData) {
      return { success: false, error: "Produto não encontrado" };
    }

    // Buscar preço personalizado do usuário criador do cupom
    const [userPriceData] = await db
      .select({
        customPrice: userProductPrice.customPrice,
      })
      .from(userProductPrice)
      .where(
        and(
          eq(userProductPrice.userId, userId),
          eq(userProductPrice.productId, productId),
        ),
      );

    // Use o preço personalizado se existir, senão use o preço base
    const userPrice = userPriceData?.customPrice
      ? parseFloat(userPriceData.customPrice)
      : parseFloat(productData.basePrice);

    // Verificar se o código do cupom já existe
    const [existingCoupon] = await db
      .select({ id: coupon.id })
      .from(coupon)
      .where(eq(coupon.code, code.toUpperCase()));

    if (existingCoupon) {
      return { success: false, error: "Código do cupom já existe" };
    }

    // Calcular preço final com base no preço que o criador do cupom paga
    const discount = parseFloat(discountValue);

    let finalPrice: number;

    if (discountType === "percentage") {
      if (discount < 0 || discount > 100) {
        return {
          success: false,
          error: "Desconto percentual deve estar entre 0% e 100%",
        };
      }
      finalPrice = userPrice * (1 - discount / 100);
    } else {
      if (discount < 0 || discount >= userPrice) {
        return {
          success: false,
          error: `Desconto fixo deve ser menor que ${formatCurrency(userPrice.toString())}`,
        };
      }
      finalPrice = userPrice - discount;
    }

    if (finalPrice < 0) {
      return { success: false, error: "Preço final não pode ser negativo" };
    }

    // Criar cupom
    const [newCoupon] = await db
      .insert(coupon)
      .values({
        id: nanoid(),
        code: code.toUpperCase(),
        userId,
        productId,
        discountType,
        discountValue: discountValue,
        finalPrice: finalPrice.toFixed(2),
        isUnique,
        maxUses: isUnique ? 1 : maxUses || null,
        currentUses: 0,
        expiresAt,
        description,
        isActive: true,
      })
      .returning();

    revalidatePath("/produtos");

    return {
      success: true,
      data: newCoupon,
      message: `Cupom "${code.toUpperCase()}" criado com sucesso! Preço final por item: ${formatCurrency(finalPrice.toString())}`,
    };
  } catch (error) {
    console.error("Erro ao criar cupom:", error);
    return { success: false, error: "Erro interno ao criar cupom" };
  }
}

/**
 * Valida um cupom antes do uso
 */
export async function validateCoupon(params: ValidateCouponParams) {
  try {
    const { code, productId, userId } = params;

    // Buscar cupom
    const [couponData] = await db
      .select({
        id: coupon.id,
        code: coupon.code,
        userId: coupon.userId,
        productId: coupon.productId,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        finalPrice: coupon.finalPrice,
        isUnique: coupon.isUnique,
        maxUses: coupon.maxUses,
        currentUses: coupon.currentUses,
        isActive: coupon.isActive,
        expiresAt: coupon.expiresAt,
        description: coupon.description,
        // Dados do produto
        productName: product.name,
        productBasePrice: product.basePrice,
        // Dados do criador
        creatorName: user.name,
        creatorReferralCode: user.referralCode,
      })
      .from(coupon)
      .innerJoin(product, eq(coupon.productId, product.id))
      .innerJoin(user, eq(coupon.userId, user.id))
      .where(eq(coupon.code, code.toUpperCase()));

    if (!couponData) {
      return { success: false, error: "Cupom não encontrado" };
    }

    // Verificar se está ativo
    if (!couponData.isActive) {
      return { success: false, error: "Cupom está inativo" };
    }

    // Verificar se é para o produto correto
    if (couponData.productId !== productId) {
      return {
        success: false,
        error: `Cupom válido apenas para "${couponData.productName}"`,
      };
    }

    // Verificar expiração
    if (couponData.expiresAt && new Date() > couponData.expiresAt) {
      return { success: false, error: "Cupom expirado" };
    }

    // Verificar limite de usos
    if (couponData.maxUses && couponData.currentUses >= couponData.maxUses) {
      return { success: false, error: "Cupom esgotado" };
    }

    // Verificar se o próprio criador está tentando usar (opcional - pode permitir ou não)
    if (userId === couponData.userId) {
      return { success: false, error: "Você não pode usar seu próprio cupom" };
    }

    // Buscar preço personalizado
    // Lógica: O preço base deve ser o preço definido pelo "usuário acima" (quem indicou o comprador)
    // Se não houver usuário logado ou não houver indicador, tenta usar o preço do criador do cupom
    let userPrice = parseFloat(couponData.productBasePrice);

    if (userId) {
      // 1. Buscar quem indicou o usuário (Upline)
      const [userData] = await db
        .select({ referredBy: user.referredBy })
        .from(user)
        .where(eq(user.id, userId));

      if (userData?.referredBy) {
        // 2. Buscar o ID do Upline pelo código de referência
        const [referrer] = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.referralCode, userData.referredBy));

        if (referrer) {
          // 3. Buscar o preço definido pelo Upline
          const [referrerPriceData] = await db
            .select({ customPrice: userProductPrice.customPrice })
            .from(userProductPrice)
            .where(
              and(
                eq(userProductPrice.userId, referrer.id),
                eq(userProductPrice.productId, productId),
              ),
            );

          if (referrerPriceData?.customPrice) {
            userPrice = parseFloat(referrerPriceData.customPrice);
          }
        }
      }
    } else {
      // Fallback: Se não tem usuário logado, usa o preço do criador do cupom
      // Assumindo que quem tem o cupom vai comprar de quem criou
      const [creatorPriceData] = await db
        .select({ customPrice: userProductPrice.customPrice })
        .from(userProductPrice)
        .where(
          and(
            eq(userProductPrice.userId, couponData.userId),
            eq(userProductPrice.productId, productId),
          ),
        );

      if (creatorPriceData?.customPrice) {
        userPrice = parseFloat(creatorPriceData.customPrice);
      }
    }

    // Calcular o desconto sobre o preço que o usuário realmente pagaria
    let discountedPrice: number;
    const discountValue = parseFloat(couponData.discountValue);

    if (couponData.discountType === "percentage") {
      discountedPrice = userPrice * (1 - discountValue / 100);
    } else {
      discountedPrice = userPrice - discountValue;
    }

    // Garantir que o preço não seja negativo
    discountedPrice = Math.max(0, discountedPrice);

    const totalDiscount = userPrice - discountedPrice;

    return {
      success: true,
      data: {
        id: couponData.id,
        code: couponData.code,
        finalPrice: discountedPrice.toFixed(2),
        discountType: couponData.discountType,
        discountValue: couponData.discountValue,
        productName: couponData.productName,
        originalPrice: userPrice.toFixed(2),
        discount: totalDiscount.toFixed(2),
        creatorName: couponData.creatorName,
        description: couponData.description,
      },
      message: `Cupom válido! Desconto de ${formatCurrency(totalDiscount.toString())} por item sobre seu preço personalizado`,
    };
  } catch (error) {
    console.error("Erro ao validar cupom:", error);
    return { success: false, error: "Erro interno ao validar cupom" };
  }
}

/**
 * Aplica/usa um cupom (incrementa o contador de uso)
 */
export async function useCoupon(couponId: string) {
  try {
    // Incrementar uso do cupom
    await db
      .update(coupon)
      .set({
        currentUses: sql`${coupon.currentUses} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(coupon.id, couponId));

    return { success: true, message: "Cupom aplicado com sucesso" };
  } catch (error) {
    console.error("Erro ao usar cupom:", error);
    return { success: false, error: "Erro interno ao aplicar cupom" };
  }
}

/**
 * Lista cupons de um usuário
 */
export async function getUserCoupons(userId: string) {
  try {
    const userCoupons = await db
      .select({
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        finalPrice: coupon.finalPrice,
        isUnique: coupon.isUnique,
        maxUses: coupon.maxUses,
        currentUses: coupon.currentUses,
        isActive: coupon.isActive,
        expiresAt: coupon.expiresAt,
        description: coupon.description,
        createdAt: coupon.createdAt,
        // Dados do produto
        productId: product.id,
        productName: product.name,
        productBasePrice: product.basePrice,
        productCategory: product.category,
      })
      .from(coupon)
      .innerJoin(product, eq(coupon.productId, product.id))
      .where(eq(coupon.userId, userId))
      .orderBy(coupon.createdAt);

    return { success: true, data: userCoupons };
  } catch (error) {
    console.error("Erro ao buscar cupons:", error);
    return { success: false, error: "Erro ao buscar cupons" };
  }
}

/**
 * Ativa/desativa um cupom
 */
export async function toggleCouponStatus(couponId: string, isActive: boolean) {
  try {
    await db
      .update(coupon)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(coupon.id, couponId));

    revalidatePath("/produtos");

    return {
      success: true,
      message: `Cupom ${isActive ? "ativado" : "desativado"} com sucesso`,
    };
  } catch (error) {
    console.error("Erro ao alterar status do cupom:", error);
    return { success: false, error: "Erro ao alterar status do cupom" };
  }
}
