import { relations, sql } from "drizzle-orm";
import { pgTable, bigserial, text, timestamp, varchar, boolean, integer, bigint, check, AnyPgColumn } from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { productAttributeValues, products } from "./product";
import { subSubCategories } from "./subsubcategories";

// ============================================
// SUBCATEGORIES TABLE
// ============================================
export const subCategories = pgTable("sub_categories", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  categoryId: bigint("category_id", { mode: "number" })
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RELATIONS
export const subCategoriesRelations = relations(
  subCategories,
  ({ one, many }) => ({
    category: one(categories, {
      fields: [subCategories.categoryId],
      references: [categories.id],
    }),
    subSubCategories: many(subSubCategories),
    attributes: many(attributes),
    products: many(products),
  })
);

// ============================================
// ATTRIBUTES TABLE (Flexible: can belong to subcategory OR subsubcategory)
// ============================================
export const attributes = pgTable(
  "attributes",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),

    // Flexible linking: exactly one must be set
    subCategoryId: bigint("sub_category_id", { mode: "number" })
      .references(() => subCategories.id, { onDelete: "cascade" }),
    subSubCategoryId: bigint("subsubcategory_id", { mode: "number" })
      .references(() => subSubCategories.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // CHECK constraint: exactly one FK must be non-null
    checkOneParent: check(
      "check_one_parent",
      sql`(
        (${table.subCategoryId} IS NOT NULL AND ${table.subSubCategoryId} IS NULL) OR
        (${table.subCategoryId} IS NULL AND ${table.subSubCategoryId} IS NOT NULL)
      )`
    ),
  })
);

// RELATIONS
export const attributesRelations = relations(
  attributes,
  ({ one, many }) => ({
    subCategory: one(subCategories, {
      fields: [attributes.subCategoryId],
      references: [subCategories.id],
    }),
    subSubCategory: one(subSubCategories, {
      fields: [attributes.subSubCategoryId],
      references: [subSubCategories.id],
    }),
    attributeValues: many(attributeValues),
    productAttributeValues: many(productAttributeValues),
  })
);

// ============================================
// ATTRIBUTE VALUES TABLE
// ============================================
export const attributeValues = pgTable("attribute_values", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  attributeId: bigint("attribute_id", { mode: "number" })
    .references(() => attributes.id, { onDelete: "cascade" })
    .notNull(),
  value: varchar("value", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// RELATIONS
export const attributeValuesRelations = relations(
  attributeValues,
  ({ one, many }) => ({
    attribute: one(attributes, {
      fields: [attributeValues.attributeId],
      references: [attributes.id],
    }),
    productAttributeValues: many(productAttributeValues),
  })
);
