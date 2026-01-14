import { relations, sql } from "drizzle-orm";
import { bigint, bigserial, boolean, integer, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar, check } from "drizzle-orm/pg-core";
import { subCategories, attributes, attributeValues } from "./subcategories";
import { subSubCategories } from "./subsubcategories";
import { productCollections } from "./collections";
import { brands } from "./brands";

// Product availability enum
export const disponibilityEnum = pgEnum("disponibility", [
  "available",
  "on_request",
  "out_of_stock",
]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 200 }).unique(),
    detailedDescription: text("detailed_description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    stock: integer("stock").default(0).notNull(),
    discountPercentage: numeric("discount_percentage", { precision: 5, scale: 2 }).default("0"),

    // Flexible category linking: can link to subcategory AND/OR subsubcategory
    // - Product with ONLY subCategoryId → inherits attributes from subcategory
    // - Product with BOTH subCategoryId + subSubCategoryId → inherits attributes from subsubcategory only
    //   (because subcategory with subsubcategories cannot have attributes)
    subCategoryId: bigint("sub_category_id", { mode: "number" })
      .references(() => subCategories.id, { onDelete: "restrict" }),
    subSubCategoryId: bigint("subsubcategory_id", { mode: "number" })
      .references(() => subSubCategories.id, { onDelete: "restrict" }),
    brandId: bigint("brand_id", { mode: "number" })
      .references(() => brands.id, { onDelete: "set null" }),

    images: text("images").array().notNull(),
    datasheet: text("datasheet"),
    isActive: boolean("is_active").default(true).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    subcategoryOrder: integer("subcategory_order").default(0).notNull(),
    subsubcategoryOrder: integer("subsubcategory_order").default(0).notNull(),

    // New product fields
    guarantee: integer("guarantee").default(0).notNull(), // Guarantee period (in months/years)
    estimatedDeliveryMaxDays: integer("estimated_delivery_max_days").default(7).notNull(), // Maximum estimated delivery time in days
    disponibility: disponibilityEnum("disponibility").default("available").notNull(), // Product availability status

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
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
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  attributeValues: many(productAttributeValues),
  collections: many(productCollections),
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
