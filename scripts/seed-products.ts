import { db } from "../src/db/client";
import { product } from "../src/db/schema";

async function seedProducts() {
  console.log("🌱 Populando produtos iniciais...");

  const initialProducts = [
    {
      name: "Limpa Nome Básico",
      description:
        "Serviço básico de limpeza de nome com análise de CPF e remoção de negativações simples.",
      basePrice: "10.00",
      category: "limpa_nome",
    },
    {
      name: "Limpa Nome Completo",
      description:
        "Serviço completo de limpeza de nome incluindo análise detalhada, remoção de negativações e renegociação de dívidas.",
      basePrice: "25.00",
      category: "limpa_nome",
    },
    {
      name: "Recuperação de Crédito Básica",
      description:
        "Serviço de recuperação de crédito com análise de score e orientações para melhoria.",
      basePrice: "15.00",
      category: "recuperacao_credito",
    },
    {
      name: "Recuperação de Crédito Premium",
      description:
        "Serviço premium de recuperação de crédito com acompanhamento mensal e estratégias personalizadas.",
      basePrice: "50.00",
      category: "recuperacao_credito",
    },
    {
      name: "Consultoria Financeira",
      description:
        "Consultoria personalizada para organização financeira e planejamento de pagamentos.",
      basePrice: "75.00",
      category: "consultoria",
    },
  ];

  try {
    // Verificar se já existem produtos
    const existingProducts = await db.select().from(product).limit(1);

    if (existingProducts.length > 0) {
      console.log("✅ Produtos já existem no banco. Pulando seed...");
      return;
    }

    // Inserir produtos
    const insertedProducts = await db
      .insert(product)
      .values(initialProducts)
      .returning();

    console.log(
      `✅ ${insertedProducts.length} produtos inseridos com sucesso!`,
    );

    insertedProducts.forEach((product) => {
      console.log(
        `   - ${product.name} (${product.category}) - R$ ${product.basePrice}`,
      );
    });
  } catch (error) {
    console.error("❌ Erro ao popular produtos:", error);
    throw error;
  }
}

// Executar o script se for chamado diretamente
if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log("🎉 Seed de produtos concluído!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Erro durante o seed:", error);
      process.exit(1);
    });
}

export { seedProducts };
