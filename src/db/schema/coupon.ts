import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { product } from "./product";
import { user } from "./user";

export const coupon = pgTable("coupon", {
  id: text("id").primaryKey(),

  code: text("code").notNull().unique(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  productId: integer("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),

  discountType: text("discount_type", { enum: ["percentage", "fixed"] })
    .notNull()
    .default("percentage"),

  discountValue: decimal("discount_value", {
    precision: 10,
    scale: 2,
  }).notNull(),

  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(),

  isUnique: boolean("is_unique").notNull().default(true),
  maxUses: integer("max_uses").default(1),
  currentUses: integer("current_uses").notNull().default(0),

  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),

  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relacionamentos
export const couponRelations = relations(coupon, ({ one }) => ({
  user: one(user, {
    fields: [coupon.userId],
    references: [user.id],
  }),
  product: one(product, {
    fields: [coupon.productId],
    references: [product.id],
  }),
}));
