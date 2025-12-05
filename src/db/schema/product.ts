import {
  boolean,
  decimal,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const product = pgTable("product", {
  id: serial("id").primaryKey(),

  name: text("name").notNull(),
  description: text("description").notNull(),

  // Preço base do produto
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),

  // Categoria do serviço (limpa_nome, recuperacao_credito, etc)
  category: text("category").notNull(),

  // Status do produto (ativo/inativo)
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
