import { relations, sql } from "drizzle-orm";
import { integer, numeric, pgTable, primaryKey, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { subCategories, subCategoryAttributes, subCategoryAttributeValues } from "./subcategories";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0).notNull(),
  discountPercentage: numeric("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  subCategoryId: integer("sub_category_id")
    .references(() => subCategories.id, { onDelete: "set null" })
    .notNull(),
  images: text("images").array().notNull(),
  datasheet: text("datasheet"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  subCategory: one(subCategories, {
    fields: [products.subCategoryId],
    references: [subCategories.id],
  }),
  attributeValues: many(productAttributeValues),
}));

export const productAttributeValues = pgTable(
  "product_attribute_values",
  {
    id: serial("id").primaryKey(),

    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),

    attributeId: integer("attribute_id")
      .references(() => subCategoryAttributes.id, { onDelete: "cascade" })
      .notNull(),

    attributeValueId: integer("attribute_value_id")
    .references(() => subCategoryAttributeValues.id, { onDelete: "cascade" })
    .notNull(),
  }
);

// RELATIONS
export const productAttributeValuesRelations = relations(
  productAttributeValues,
  ({ one }) => ({
    product: one(products, {
      fields: [productAttributeValues.productId],
      references: [products.id],
    }),
    attribute: one(subCategoryAttributes, {
      fields: [productAttributeValues.attributeId],
      references: [subCategoryAttributes.id],
    }),
    attributeValue: one(subCategoryAttributeValues, {
      fields: [productAttributeValues.attributeValueId],
      references: [subCategoryAttributeValues.id],
    }),
  })
);
