import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "inactive",
  "trial",
  "expired",
  "cancelled",
  "pending",
]);

export const subscription = pgTable("subscription", {
  id: text("id")
    .primaryKey()
    .$default(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),

  abacatePayBillingId: text("abacate_pay_billing_id").notNull(),
  pixQrCodeCreatedAt: timestamp("pix_qr_code_created_at"),

  status: subscriptionStatusEnum("status").notNull(),

  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  trialExpiresAt: timestamp("trial_expires_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
