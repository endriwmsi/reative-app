import { relations } from "drizzle-orm";
import {
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { submission } from "./submission";
import { user } from "./user";

export const commissionEarning = pgTable("commission_earning", {
  id: text("id").primaryKey(),

  // Relacionamentos
  submissionId: text("submission_id")
    .notNull()
    .references(() => submission.id, { onDelete: "cascade" }),

  // Usuário que receberá a comissão (primeiro nível da hierarquia)
  beneficiaryUserId: text("beneficiary_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Usuário que fez a compra (origem da comissão)
  buyerUserId: text("buyer_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Produto que gerou a comissão
  productId: integer("product_id").notNull(),

  // Valores
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),

  // Status do saque
  status: text("status").notNull().default("pending"), // pending, available, withdrawn

  // Datas de controle
  createdAt: timestamp("created_at").notNull().defaultNow(),
  availableAt: timestamp("available_at").notNull(), // Data quando fica disponível para saque (7 dias)
  withdrawnAt: timestamp("withdrawn_at"), // Data do saque

  // Observações
  notes: text("notes"),
});

// Relações
export const commissionEarningRelations = relations(
  commissionEarning,
  ({ one }) => ({
    submission: one(submission, {
      fields: [commissionEarning.submissionId],
      references: [submission.id],
    }),
    beneficiaryUser: one(user, {
      fields: [commissionEarning.beneficiaryUserId],
      references: [user.id],
      relationName: "beneficiaryCommissions",
    }),
    buyerUser: one(user, {
      fields: [commissionEarning.buyerUserId],
      references: [user.id],
      relationName: "generatedCommissions",
    }),
  }),
);

// Relações inversas no user
export const userCommissionRelations = relations(user, ({ many }) => ({
  beneficiaryCommissions: many(commissionEarning, {
    relationName: "beneficiaryCommissions",
  }),
  generatedCommissions: many(commissionEarning, {
    relationName: "generatedCommissions",
  }),
}));
