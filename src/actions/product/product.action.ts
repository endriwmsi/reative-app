"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { product, user, userProductPrice } from "@/db/schema";

export async function getProducts() {
  try {
    const products = await db
      .select()
      .from(product)
      .where(eq(product.isActive, true))
      .orderBy(product.name);

    return { success: true, data: products };
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return { success: false, error: "Erro ao buscar produtos" };
  }
}

export async function getProductWithUserPrice(
  productId: number,
  userId: string,
) {
  try {
    const [productData] = await db
      .select()
      .from(product)
      .where(and(eq(product.id, productId), eq(product.isActive, true)));

    if (!productData) {
      return { success: false, error: "Produto não encontrado" };
    }

    // Buscar preço personalizado do usuário para este produto
    const [userPrice] = await db
      .select()
      .from(userProductPrice)
      .where(
        and(
          eq(userProductPrice.productId, productId),
          eq(userProductPrice.userId, userId),
        ),
      );

    return {
      success: true,
      data: {
        ...productData,
        userCustomPrice: userPrice?.customPrice || null,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return { success: false, error: "Erro ao buscar produto" };
  }
}

export async function getUserProducts(userId: string) {
  try {
    // Buscar produtos com preços personalizados do usuário
    const productsWithPrices = await db
      .select({
        id: product.id,
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        category: product.category,
        customPrice: userProductPrice.customPrice,
      })
      .from(product)
      .leftJoin(
        userProductPrice,
        and(
          eq(userProductPrice.productId, product.id),
          eq(userProductPrice.userId, userId),
        ),
      )
      .where(eq(product.isActive, true))
      .orderBy(product.name);

    return { success: true, data: productsWithPrices };
  } catch (error) {
    console.error("Erro ao buscar produtos do usuário:", error);
    return { success: false, error: "Erro ao buscar produtos" };
  }
}

export async function getProductsForUser(userId: string) {
  try {
    // Primeiro, buscar informações do usuário para verificar quem é o indicador
    const [userData] = await db
      .select({
        id: user.id,
        referredBy: user.referredBy,
      })
      .from(user)
      .where(eq(user.id, userId));

    if (!userData) {
      return { success: false, error: "Usuário não encontrado" };
    }

    // Se o usuário não foi indicado por ninguém, mostrar preços base
    if (!userData.referredBy) {
      const products = await db
        .select({
          id: product.id,
          name: product.name,
          description: product.description,
          basePrice: product.basePrice,
          category: product.category,
          customPrice: product.basePrice, // Usar preço base como padrão
        })
        .from(product)
        .where(eq(product.isActive, true))
        .orderBy(product.name);

      return { success: true, data: products };
    }

    // Buscar o indicador pelo código de referência
    const [referrer] = await db
      .select({
        id: user.id,
      })
      .from(user)
      .where(eq(user.referralCode, userData.referredBy));

    if (!referrer) {
      // Se não encontrar o indicador, usar preços base
      const products = await db
        .select({
          id: product.id,
          name: product.name,
          description: product.description,
          basePrice: product.basePrice,
          category: product.category,
          customPrice: product.basePrice,
        })
        .from(product)
        .where(eq(product.isActive, true))
        .orderBy(product.name);

      return { success: true, data: products };
    }

    // Buscar produtos com preços personalizados definidos pelo indicador
    const productsWithCustomPrices = await db
      .select({
        id: product.id,
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        category: product.category,
        customPrice: userProductPrice.customPrice,
      })
      .from(product)
      .leftJoin(
        userProductPrice,
        and(
          eq(userProductPrice.productId, product.id),
          eq(userProductPrice.userId, referrer.id), // Usar o ID do indicador
        ),
      )
      .where(eq(product.isActive, true))
      .orderBy(product.name);

    // Para produtos sem preço personalizado, usar o preço base
    const finalProducts = productsWithCustomPrices.map((product) => ({
      ...product,
      customPrice: product.customPrice || product.basePrice,
    }));

    return { success: true, data: finalProducts };
  } catch (error) {
    console.error("Erro ao buscar produtos para usuário:", error);
    return { success: false, error: "Erro ao buscar produtos" };
  }
}

export async function setUserProductPrice(
  userId: string,
  productId: number,
  customPrice: string,
) {
  try {
    // Verificar se o produto existe
    const [productData] = await db
      .select()
      .from(product)
      .where(and(eq(product.id, productId), eq(product.isActive, true)));

    if (!productData) {
      return { success: false, error: "Produto não encontrado" };
    }

    // Verificar se o preço é válido (deve ser maior que 0)
    const price = parseFloat(customPrice);
    if (Number.isNaN(price) || price <= 0) {
      return { success: false, error: "Preço inválido" };
    }
    // Inserir ou atualizar preço personalizado
    await db
      .insert(userProductPrice)
      .values({
        id: nanoid(),
        userId,
        productId,
        customPrice,
      })
      .onConflictDoUpdate({
        target: [userProductPrice.userId, userProductPrice.productId],
        set: {
          customPrice,
          updatedAt: new Date(),
        },
      });

    revalidatePath("/dashboard/produtos");
    return { success: true, message: "Preço atualizado com sucesso" };
  } catch (error) {
    console.error("Erro ao definir preço:", error);
    return { success: false, error: "Erro ao definir preço" };
  }
}
