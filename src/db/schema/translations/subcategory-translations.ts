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
import { subCategories } from "../subcategories";

// ============================================
// SUBCATEGORY TRANSLATIONS TABLE
// ============================================
export const subcategoryTranslations = pgTable(
  "subcategory_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    subcategoryId: bigint("subcategory_id", { mode: "number" })
      .references(() => subCategories.id, { onDelete: "cascade" })
      .notNull(),
    language: varchar("language", { length: 2 }).notNull(), // 'fr' or 'ar'
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Composite unique constraint: one translation per subcategory per language
    uniqueSubcategoryLanguage: unique().on(table.subcategoryId, table.language),
    // Index for fast language-specific queries
    languageSubcategoryIdx: index("idx_subcat_trans_lang").on(
      table.language,
      table.subcategoryId
    ),
  })
);

// RELATIONS
export const subcategoryTranslationsRelations = relations(
  subcategoryTranslations,
  ({ one }) => ({
    subcategory: one(subCategories, {
      fields: [subcategoryTranslations.subcategoryId],
      references: [subCategories.id],
    }),
  })
);
