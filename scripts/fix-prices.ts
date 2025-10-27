import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { product, userProductPrice } from "@/db/schema";

// Script para corrigir configuração de preços
async function fixPriceConfiguration() {
  try {
    console.log("=== Correção de Preços ===");

    // Opção 1: Aumentar preço base do produto para R$ 200,00
    console.log("\n🔧 Opção 1: Aumentar preço base do produto...");
    await db
      .update(product)
      .set({ basePrice: "200.00" })
      .where(eq(product.id, 8));

    console.log("✅ Preço base do produto alterado para R$ 200,00");

    // Verificar resultado
    const [updatedProduct] = await db
      .select({
        id: product.id,
        name: product.name,
        basePrice: product.basePrice,
      })
      .from(product)
      .where(eq(product.id, 8));

    const [customPrice] = await db
      .select({
        customPrice: userProductPrice.customPrice,
      })
      .from(userProductPrice)
      .where(
        and(
          eq(userProductPrice.productId, 8),
          eq(userProductPrice.userId, "255bb6bb-63fa-436f-97fb-603bd8e0370c"),
        ),
      );

    console.log("\n📊 Configuração Atualizada:");
    console.log(`   Preço base do produto: R$ ${updatedProduct.basePrice}`);
    console.log(
      `   Preço personalizado do indicador: R$ ${customPrice?.customPrice || "N/A"}`,
    );

    if (customPrice) {
      const commission =
        parseFloat(updatedProduct.basePrice) -
        parseFloat(customPrice.customPrice);
      console.log(`   Comissão gerada: R$ ${commission.toFixed(2)}`);

      if (commission > 0) {
        console.log("✅ Configuração corrigida! Comissões serão geradas.");
      } else {
        console.log("❌ Ainda não gera comissão positiva.");
      }
    }
  } catch (error) {
    console.error("❌ Erro durante a correção:", error);
  }
}

// Executar a correção
fixPriceConfiguration().catch(console.error);
