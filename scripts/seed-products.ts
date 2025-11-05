import { db } from "../src/db/client";
import { product } from "../src/db/schema";

async function seedProducts() {
  console.log("🌱 Populando produtos iniciais...");

  const initialProducts = [
    {
      name: "Limpa Nome Completo",
      description:
        "Serviço completo de limpeza de nome incluindo análise detalhada, remoção de negativações e renegociação de dívidas.",
      basePrice: "25.00",
      category: "limpa_nome",
    },
    {
      name: "Atualização de Rating Comercial - PJ",
      description:
        "VOLTE A TER CRÉDITO NO MERCADO! Prazo médio de 15 dias para conclusão do serviço. Consulte o administrador para saber mais sobre o envio da documentação necessária.",
      basePrice: "550",
      category: "atualizacao_rating",
    },
    {
      name: "Atualização de Rating Comercial - PF",
      description:
        "VOLTE A TER CRÉDITO NO MERCADO! Prazo médio de 15 dias para conclusão do serviço. Consulte o administrador para saber mais sobre o envio da documentação necessária.",
      basePrice: "550",
      category: "atualizacao_rating",
    },
    {
      name: "BACEN",
      description:
        "Prazo médio de 90 dias para conclusão do serviço. Consulte o administrador para saber mais sobre o envio da documentação necessária.",
      basePrice: "1500",
      category: "atualizacao_rating",
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
