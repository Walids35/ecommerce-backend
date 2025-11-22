import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { subCategories } from "./subcategories";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// RELATIONS
export const categoriesRelations = relations(categories, ({ many }) => ({
  subCategories: many(subCategories),
}));