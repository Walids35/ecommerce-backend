import { relations } from "drizzle-orm";
import { pgTable, bigserial, text, timestamp, varchar, boolean, integer, uuid, unique } from "drizzle-orm/pg-core";
import { products } from "./product";

// ============================================
// COLLECTIONS TABLE
// ============================================
export const collections = pgTable("collections", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  description: text("description"),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  image: text("image"),
  isActive: boolean("is_active").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RELATIONS
export const collectionsRelations = relations(
  collections,
  ({ many }) => ({
    productCollections: many(productCollections),
  })
);

// ============================================
// PRODUCT_COLLECTIONS JUNCTION TABLE
// ============================================
export const productCollections = pgTable(
  "product_collections",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    collectionId: bigserial("collection_id", { mode: "number" })
      .references(() => collections.id, { onDelete: "cascade" })
      .notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueProductCollection: unique().on(table.productId, table.collectionId),
  })
);

// RELATIONS
export const productCollectionsRelations = relations(
  productCollections,
  ({ one }) => ({
    product: one(products, {
      fields: [productCollections.productId],
      references: [products.id],
    }),
    collection: one(collections, {
      fields: [productCollections.collectionId],
      references: [collections.id],
    }),
  })
);
