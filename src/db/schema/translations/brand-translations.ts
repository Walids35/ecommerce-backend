import { relations } from "drizzle-orm";
import {
  pgTable,
  bigserial,
  text,
  timestamp,
  varchar,
  bigint,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { brands } from "../brands";

// ============================================
// BRAND TRANSLATIONS TABLE
// ============================================
export const brandTranslations = pgTable(
  "brand_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    brandId: bigint("brand_id", { mode: "number" })
      .references(() => brands.id, { onDelete: "cascade" })
      .notNull(),
    language: varchar("language", { length: 2 }).notNull(), // 'fr' or 'ar'
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 200 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Composite unique constraint: one translation per brand per language
    uniqueBrandLanguage: unique().on(table.brandId, table.language),
    // Index for fast language-specific queries
    languageBrandIdx: index("idx_brand_trans_lang").on(
      table.language,
      table.brandId
    ),
  })
);

// RELATIONS
export const brandTranslationsRelations = relations(
  brandTranslations,
  ({ one }) => ({
    brand: one(brands, {
      fields: [brandTranslations.brandId],
      references: [brands.id],
    }),
  })
);
