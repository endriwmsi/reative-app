import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { product, user, userProductPrice } from "@/db/schema";

// Script para verificar configuração de preços
async function checkPriceConfiguration() {
  try {
    console.log("=== Verificação de Configuração de Preços ===");

    // Buscar produto ID 8
    const [productData] = await db
      .select({
        id: product.id,
        name: product.name,
        basePrice: product.basePrice,
        category: product.category,
      })
      .from(product)
      .where(eq(product.id, 8));

    if (!productData) {
      console.log("❌ Produto ID 8 não encontrado");
      return;
    }

    console.log("\n📦 Produto:", {
      id: productData.id,
      name: productData.name,
      precoBase: `R$ ${productData.basePrice}`,
      category: productData.category,
    });

    // Buscar usuário indicador
    const [referrerUser] = await db
      .select({
        id: user.id,
        referralCode: user.referralCode,
      })
      .from(user)
      .where(eq(user.referralCode, "4169"));

    if (!referrerUser) {
      console.log("❌ Usuário indicador não encontrado");
      return;
    }

    console.log("\n👤 Indicador:", {
      id: referrerUser.id,
      referralCode: referrerUser.referralCode,
    });

    // Buscar preço personalizado
    const [customPriceData] = await db
      .select({
        customPrice: userProductPrice.customPrice,
        createdAt: userProductPrice.createdAt,
      })
      .from(userProductPrice)
      .where(
        eq(userProductPrice.userId, referrerUser.id) &&
          eq(userProductPrice.productId, 8),
      );

    if (!customPriceData) {
      console.log("❌ Preço personalizado não encontrado para este indicador");
      return;
    }

    console.log("\n💰 Configuração de Preços:", {
      precoBaseDoProduto: `R$ ${productData.basePrice}`,
      precoPersonalizadoDoIndicador: `R$ ${customPriceData.customPrice}`,
      diferencaParaComissao: `R$ ${(parseFloat(productData.basePrice) - parseFloat(customPriceData.customPrice)).toFixed(2)}`,
    });

    const basePriceNum = parseFloat(productData.basePrice);
    const customPriceNum = parseFloat(customPriceData.customPrice);
    const commission = basePriceNum - customPriceNum;

    console.log("\n📊 Análise:");

    if (commission > 0) {
      console.log(
        `✅ Configuração CORRETA - Comissão de R$ ${commission.toFixed(2)} seria gerada`,
      );
      console.log(
        `   Quando alguém comprar por R$ ${basePriceNum}, o indicador paga R$ ${customPriceNum}`,
      );
    } else if (commission === 0) {
      console.log(`⚠️  Configuração NEUTRA - Sem comissão (preços iguais)`);
      console.log(
        `   Sugestão: Diminuir preço personalizado do indicador para gerar comissão`,
      );
    } else {
      console.log(
        `❌ Configuração INCORRETA - Comissão negativa de R$ ${commission.toFixed(2)}`,
      );
      console.log(`   Preço personalizado é maior que o preço base!`);
    }

    console.log("\n💡 Para gerar comissões:");
    console.log(
      `   - Preço que clientes pagam: R$ ${basePriceNum} (preço base do produto)`,
    );
    console.log(`   - Preço que indicador paga: Deve ser < R$ ${basePriceNum}`);
    console.log(
      `   - Sugestão: Definir preço personalizado como R$ ${(basePriceNum - 25).toFixed(2)} (comissão de R$ 25,00)`,
    );
  } catch (error) {
    console.error("❌ Erro durante a verificação:", error);
  }
}

// Executar a verificação
checkPriceConfiguration().catch(console.error);
