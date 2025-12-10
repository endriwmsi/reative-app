import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const creatives = pgTable("creatives", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title"),
  key: text("key").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
