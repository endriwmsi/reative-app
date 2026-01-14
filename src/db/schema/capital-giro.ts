import { boolean, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user";

export const capitalGiroStatusEnum = pgEnum("capital_giro_status", [
  "pending",
  "analyzing",
  "pre-approved",
  "approved",
  "rejected",
]);

export const capitalGiro = pgTable("capital_giro", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  estadoCivil: text("estado_civil").notNull(),
  cpf: text("cpf").notNull(),
  estadoNascimento: text("estado_nascimento").notNull().default("tbd"),
  enderecoPessoa: text("endereco_pessoa").notNull(),
  cidadePessoa: text("cidade_pessoa").notNull(),
  estadoPessoa: text("estado_pessoa").notNull(),

  nomePartner: text("nome_partner").notNull().default("Fabio"),
  documentoUrl: text("documento_url"),

  razaoSocial: text("razao_social").notNull(),
  cnpj: text("cnpj").notNull(),
  faturamento: text("faturamento").notNull(),
  enderecoEmpresa: text("endereco_empresa").notNull(),
  cidadeEmpresa: text("cidade_empresa").notNull(),
  estadoEmpresa: text("estado_empresa").notNull(),

  temRestricao: text("tem_restricao").notNull(),
  valorRestricao: text("valor_restricao"),

  status: capitalGiroStatusEnum("status").default("pending").notNull(),

  isDownloaded: boolean("is_downloaded").default(false).notNull(),
  downloadedAt: timestamp("downloaded_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
