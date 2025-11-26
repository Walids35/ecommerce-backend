import { relations } from "drizzle-orm";
import { pgTable, bigserial, text, timestamp, varchar, boolean, integer } from "drizzle-orm/pg-core";
import { subCategories } from "./subcategories";

export const categories = pgTable("categories", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  description: text("description"),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RELATIONS
export const categoriesRelations = relations(categories, ({ many }) => ({
  subCategories: many(subCategories),
}));