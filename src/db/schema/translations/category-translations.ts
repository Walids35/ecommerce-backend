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
import { categories } from "../categories";

// ============================================
// CATEGORY TRANSLATIONS TABLE
// ============================================
export const categoryTranslations = pgTable(
  "category_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    categoryId: bigint("category_id", { mode: "number" })
      .references(() => categories.id, { onDelete: "cascade" })
      .notNull(),
    language: varchar("language", { length: 2 }).notNull(), // 'fr' or 'ar'
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 200 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Composite unique constraint: one translation per category per language
    uniqueCategoryLanguage: unique().on(table.categoryId, table.language),
    // Index for fast language-specific queries
    languageCategoryIdx: index("idx_category_trans_lang").on(
      table.language,
      table.categoryId
    ),
  })
);

// RELATIONS
export const categoryTranslationsRelations = relations(
  categoryTranslations,
  ({ one }) => ({
    category: one(categories, {
      fields: [categoryTranslations.categoryId],
      references: [categories.id],
    }),
  })
);
