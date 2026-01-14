import { relations } from "drizzle-orm";
import {
  pgTable,
  bigserial,
  text,
  timestamp,
  varchar,
  uuid,
  unique,
  index,
  bigint,
} from "drizzle-orm/pg-core";
import { products } from "../product";

// ============================================
// PRODUCT TRANSLATIONS TABLE
// ============================================
export const productTranslations = pgTable(
  "product_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    language: varchar("language", { length: 2 }).notNull(), // 'fr' or 'ar'
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    detailedDescription: text("detailed_description"),
    datasheet: text("datasheet"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Composite unique constraint: one translation per product per language
    uniqueProductLanguage: unique().on(table.productId, table.language),
    // Index for fast language-specific queries
    languageProductIdx: index("idx_product_trans_lang").on(
      table.language,
      table.productId
    ),
  })
);

// RELATIONS
export const productTranslationsRelations = relations(
  productTranslations,
  ({ one }) => ({
    product: one(products, {
      fields: [productTranslations.productId],
      references: [products.id],
    }),
  })
);
