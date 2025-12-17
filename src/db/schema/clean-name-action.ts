import { boolean, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";

export const actionStatusEnum = pgEnum("action_status", [
  "Aguardando baixas",
  "Baixas Iniciadas",
  "Baixas completas",
]);

export const cleanNameAction = pgTable("clean_name_action", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  allowSubmissions: boolean("allow_submissions").notNull().default(true),

  boaVistaStatus: actionStatusEnum("boa_vista_status")
    .notNull()
    .default("Aguardando baixas"),
  spcStatus: actionStatusEnum("spc_status")
    .notNull()
    .default("Aguardando baixas"),
  serasaStatus: actionStatusEnum("serasa_status")
    .notNull()
    .default("Aguardando baixas"),
  cenprotSpStatus: actionStatusEnum("cenprot_sp_status")
    .notNull()
    .default("Aguardando baixas"),
  cenprotNacionalStatus: actionStatusEnum("cenprot_nacional_status")
    .notNull()
    .default("Aguardando baixas"),
  outrosStatus: actionStatusEnum("outros_status")
    .notNull()
    .default("Aguardando baixas"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CleanNameAction = typeof cleanNameAction.$inferSelect;
