import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user";

export const announcement = pgTable("announcement", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  authorId: text("author_id").references(() => user.id),
});

export const announcementRelations = relations(announcement, ({ one }) => ({
  author: one(user, {
    fields: [announcement.authorId],
    references: [user.id],
  }),
}));
