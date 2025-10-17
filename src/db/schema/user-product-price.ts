import { relations } from "drizzle-orm";
import {
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { product } from "./product";
import { user } from "./user";

export const userProductPrice = pgTable(
  "user_product_price",
  {
    id: text("id").primaryKey(),

    // ID do usuário que está definindo o preço
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // ID do produto
    productId: integer("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),

    // Preço personalizado definido pelo usuário (em centavos)
    customPrice: decimal("custom_price", { precision: 10, scale: 2 }).notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Um usuário só pode ter um preço personalizado por produto
    userProductUnique: unique().on(table.userId, table.productId),
  }),
);

export const userProductPriceRelations = relations(
  userProductPrice,
  ({ one }) => ({
    user: one(user, {
      fields: [userProductPrice.userId],
      references: [user.id],
    }),
    product: one(product, {
      fields: [userProductPrice.productId],
      references: [product.id],
    }),
  }),
);
