import {
  boolean,
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { coupon } from "./coupon";
import { product } from "./product";
import { user } from "./user";

export const submission = pgTable("submission", {
  id: text("id").primaryKey().notNull(),

  // Usuário que fez o envio
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Produto/serviço relacionado ao envio
  productId: integer("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),

  // Cupom utilizado no envio (opcional)
  couponId: text("coupon_id").references(() => coupon.id, {
    onDelete: "set null",
  }),

  // Título/descrição do envio
  title: text("title").notNull(),

  // Preço total do envio (quantidade * preço unitário)
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),

  // Preço unitário usado no envio
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),

  // Quantidade de nomes enviados
  quantity: integer("quantity").notNull(),

  // Status do envio (pending, processing, completed, cancelled)
  status: text("status").notNull().default("pending"),

  // Observações do envio
  notes: text("notes"),

  // Campos de download
  isDownloaded: boolean("is_downloaded").notNull().default(false),
  downloadedAt: timestamp("downloaded_at"),

  // Campos de pagamento
  isPaid: boolean("is_paid").notNull().default(false),
  paymentId: text("payment_id"), // ID do pagamento no Asaas
  paymentStatus: text("payment_status").default("PENDING"), // PENDING, PAID, CANCELLED, REFUNDED
  paymentDate: timestamp("payment_date"),
  paymentUrl: text("payment_url"), // URL para pagamento PIX
  qrCodeData: text("qr_code_data"), // Dados do QR Code PIX

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const submissionClient = pgTable("submission_client", {
  id: text("id").primaryKey(),

  // Envio ao qual este cliente pertence
  submissionId: text("submission_id")
    .notNull()
    .references(() => submission.id, { onDelete: "cascade" }),

  // Nome do cliente
  name: text("name").notNull(),

  // Documento (CPF ou CNPJ) - opcional
  document: varchar("document", { length: 18 }).notNull(),

  // Status do processamento deste cliente específico
  status: text("status").notNull().default("pending"),

  // Observações específicas do cliente
  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
