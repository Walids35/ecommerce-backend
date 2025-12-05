import { relations, sql } from "drizzle-orm";
import { pgTable, bigserial, text, timestamp, varchar, boolean, integer, bigint } from "drizzle-orm/pg-core";
import { subCategories, attributes } from "./subcategories";
import { products } from "./product";

export const subSubCategories = pgTable("subsubcategories", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  image: text("image"),
  isActive: boolean("is_active").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  subCategoryId: bigint("sub_category_id", { mode: "number" })
    .references(() => subCategories.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RELATIONS
export const subSubCategoriesRelations = relations(
  subSubCategories,
  ({ one, many }) => ({
    subCategory: one(subCategories, {
      fields: [subSubCategories.subCategoryId],
      references: [subCategories.id],
    }),
    attributes: many(attributes),
    products: many(products),
  })
);
