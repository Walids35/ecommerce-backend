import { relations } from "drizzle-orm";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { productAttributeValues, products } from "./product";

export const subCategories = pgTable("sub_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  categoryId: integer("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// RELATIONS
export const subCategoriesRelations = relations(
  subCategories,
  ({ one, many }) => ({
    category: one(categories, {
      fields: [subCategories.categoryId],
      references: [categories.id],
    }),
    attributes: many(subCategoryAttributes),
    products: many(products),
  })
);

export const subCategoryAttributes = pgTable("sub_category_attributes", {
  id: serial("id").primaryKey(),
  subCategoryId: integer("sub_category_id")
    .references(() => subCategories.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 150 }).notNull(),
});

// RELATIONS
export const subCategoryAttributesRelations = relations(
  subCategoryAttributes,
  ({ one, many }) => ({
    subCategory: one(subCategories, {
      fields: [subCategoryAttributes.subCategoryId],
      references: [subCategories.id],
    }),
    productAttributeValues: many(productAttributeValues),
  })
);

export const subCategoryAttributeValues = pgTable(
  "sub_category_attribute_values",
  {
    id: serial("id").primaryKey(),
    attributeId: integer("attribute_id")
      .references(() => subCategoryAttributes.id, { onDelete: "cascade" })
      .notNull(),
    value: varchar("value", { length: 200 }).notNull(),
  }
);

export const subCategoryAttributeValuesRelations = relations(
  subCategoryAttributeValues,
  ({ one, many }) => ({
    attribute: one(subCategoryAttributes, {
      fields: [subCategoryAttributeValues.attributeId],
      references: [subCategoryAttributes.id],
    }),

    // Each value can be used by product_attribute_values
    productAttributeValues: many(productAttributeValues),
  })
);
