import { relations, sql } from "drizzle-orm";
import { bigint, bigserial, integer, numeric, pgTable, text, timestamp, uuid, varchar, check } from "drizzle-orm/pg-core";
import { subCategories, attributes, attributeValues } from "./subcategories";
import { subSubCategories } from "./subsubcategories";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    stock: integer("stock").default(0).notNull(),
    discountPercentage: numeric("discount_percentage", { precision: 5, scale: 2 }).default("0"),

    // Flexible category linking: can link to subcategory OR subsubcategory
    subCategoryId: bigint("sub_category_id", { mode: "number" })
      .references(() => subCategories.id, { onDelete: "restrict" }),
    subSubCategoryId: bigint("subsubcategory_id", { mode: "number" })
      .references(() => subSubCategories.id, { onDelete: "restrict" }),

    images: text("images").array().notNull(),
    datasheet: text("datasheet"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // CHECK constraint: exactly one category FK must be non-null
    checkOneCategory: check(
      "check_one_category",
      sql`(
        (${table.subCategoryId} IS NOT NULL AND ${table.subSubCategoryId} IS NULL) OR
        (${table.subCategoryId} IS NULL AND ${table.subSubCategoryId} IS NOT NULL)
      )`
    ),
  })
);

export const productsRelations = relations(products, ({ one, many }) => ({
  subCategory: one(subCategories, {
    fields: [products.subCategoryId],
    references: [subCategories.id],
  }),
  subSubCategory: one(subSubCategories, {
    fields: [products.subSubCategoryId],
    references: [subSubCategories.id],
  }),
  attributeValues: many(productAttributeValues),
}));

export const productAttributeValues = pgTable("product_attribute_values", {
  id: bigserial("id", { mode: "number" }).primaryKey(),

  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),

  attributeId: bigint("attribute_id", { mode: "number" })
    .references(() => attributes.id, { onDelete: "cascade" })
    .notNull(),

  attributeValueId: bigint("attribute_value_id", { mode: "number" })
    .references(() => attributeValues.id, { onDelete: "cascade" })
    .notNull(),
});

// RELATIONS
export const productAttributeValuesRelations = relations(
  productAttributeValues,
  ({ one }) => ({
    product: one(products, {
      fields: [productAttributeValues.productId],
      references: [products.id],
    }),
    attribute: one(attributes, {
      fields: [productAttributeValues.attributeId],
      references: [attributes.id],
    }),
    attributeValue: one(attributeValues, {
      fields: [productAttributeValues.attributeValueId],
      references: [attributeValues.id],
    }),
  })
);
