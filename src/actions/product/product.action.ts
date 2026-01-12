"use server";

import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import type { ProductFormData } from "@/app/(app)/(dashboard)/produtos/_schemas/new-product-schema";
import { db } from "@/db/client";
import { product, user, userProductPrice } from "@/db/schema";
import { formatCurrency } from "@/lib/utils";

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
    // e preços de revenda definidos pelo próprio usuário
    const productsWithPrices = await db
      .select({
        id: product.id,
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        category: product.category,
        referrerCustomPrice: {
          customPrice: userProductPrice.customPrice,
        },
        userResalePrice: {
          customPrice: sql<string>`user_resale_price.custom_price`,
        },
      })
      .from(product)
      .leftJoin(
        userProductPrice,
        and(
          eq(userProductPrice.productId, product.id),
          eq(userProductPrice.userId, referrer.id), // Preço do indicador
        ),
      )
      .leftJoin(
        sql`${userProductPrice} as user_resale_price`,
        sql`user_resale_price.product_id = ${product.id} AND user_resale_price.user_id = ${userId}`, // Preço de revenda do usuário
      )
      .where(eq(product.isActive, true))
      .orderBy(product.name);

    // Formatar dados para incluir customPrice (do indicador) e resalePrice (do usuário)
    const finalProducts = productsWithPrices.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
      category: product.category,
      customPrice:
        product.referrerCustomPrice?.customPrice || product.basePrice,
      resalePrice: product.userResalePrice?.customPrice || null,
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

// Função para usuários indicados definirem seus preços de revenda
export async function setMyResalePrice(
  userId: string,
  productId: number,
  resalePrice: string,
) {
  try {
    // Verificar se o usuário foi indicado
    const [userData] = await db
      .select({
        id: user.id,
        referredBy: user.referredBy,
      })
      .from(user)
      .where(eq(user.id, userId));

    if (!userData || !userData.referredBy) {
      return {
        success: false,
        error: "Apenas usuários indicados podem definir preços de revenda",
      };
    }

    // Buscar o preço que o indicador definiu para este usuário
    const [referrerUser] = await db
      .select({
        id: user.id,
        referralCode: user.referralCode,
      })
      .from(user)
      .where(eq(user.referralCode, userData.referredBy));

    if (!referrerUser) {
      return { success: false, error: "Indicador não encontrado" };
    }

    // Buscar preço personalizado do indicador
    const [referrerPrice] = await db
      .select({ customPrice: userProductPrice.customPrice })
      .from(userProductPrice)
      .where(
        and(
          eq(userProductPrice.userId, referrerUser.id),
          eq(userProductPrice.productId, productId),
        ),
      );

    // Buscar preço base do produto como fallback
    const [productData] = await db
      .select({ basePrice: product.basePrice })
      .from(product)
      .where(eq(product.id, productId));

    if (!productData) {
      return { success: false, error: "Produto não encontrado" };
    }

    const minimumPrice = referrerPrice?.customPrice || productData.basePrice;
    const resalePriceNum = parseFloat(resalePrice);
    const minimumPriceNum = parseFloat(minimumPrice);

    // Validar se o preço de revenda é maior que o preço do indicador
    if (resalePriceNum <= minimumPriceNum) {
      return {
        success: false,
        error: `Preço de revenda deve ser maior que ${formatCurrency(minimumPrice)}`,
      };
    }

    // Definir preço de revenda (salva como customPrice do usuário indicado)
    await db
      .insert(userProductPrice)
      .values({
        id: nanoid(),
        userId,
        productId,
        customPrice: resalePrice,
      })
      .onConflictDoUpdate({
        target: [userProductPrice.userId, userProductPrice.productId],
        set: {
          customPrice: resalePrice,
          updatedAt: new Date(),
        },
      });

    revalidatePath("/produtos");
    return {
      success: true,
      message: `Preço de revenda definido: ${formatCurrency(resalePrice)}`,
    };
  } catch (error) {
    console.error("Erro ao definir preço de revenda:", error);
    return { success: false, error: "Erro ao definir preço de revenda" };
  }
}

export async function createProduct(data: ProductFormData) {
  try {
    const priceInCents = data.price.replace(/\D/g, "");
    const priceDecimal = (parseInt(priceInCents) / 100).toFixed(2);

    await db.insert(product).values({
      name: data.name,
      description: data.description || "",
      basePrice: priceDecimal,
      category: data.category,
    });

    revalidatePath("/produtos");
    return { success: true, message: "Produto criado com sucesso" };
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return { success: false, error: "Erro ao criar produto" };
  }
}
