import {
  boolean,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  phone: text("phone").notNull(),

  image: text("image"),

  cpf: varchar("cpf", { length: 14 }).unique(),
  cnpj: varchar("cnpj", { length: 18 }).unique(),

  // Código de afiliado: 4 dígitos únicos
  referralCode: varchar("referral_code", { length: 4 }).notNull().unique(),
  // Código do afiliado que indicou este usuário (opcional)
  referredBy: varchar("referred_by", { length: 4 }),

  street: text("street").notNull(),
  number: text("number").notNull(),
  complement: text("complement").default(""),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  uf: text("uf").notNull(),
  cep: text("cep").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
