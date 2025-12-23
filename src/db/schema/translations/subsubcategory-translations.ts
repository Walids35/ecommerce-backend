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
import { subSubCategories } from "../subsubcategories";

// ============================================
// SUBSUBCATEGORY TRANSLATIONS TABLE
// ============================================
export const subsubcategoryTranslations = pgTable(
  "subsubcategory_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    subsubcategoryId: bigint("subsubcategory_id", { mode: "number" })
      .references(() => subSubCategories.id, { onDelete: "cascade" })
      .notNull(),
    language: varchar("language", { length: 2 }).notNull(), // 'fr' or 'ar'
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 200 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Composite unique constraint: one translation per subsubcategory per language
    uniqueSubsubcategoryLanguage: unique().on(
      table.subsubcategoryId,
      table.language
    ),
    // Index for fast language-specific queries
    languageSubsubcategoryIdx: index("idx_subsubcat_trans_lang").on(
      table.language,
      table.subsubcategoryId
    ),
  })
);

// RELATIONS
export const subsubcategoryTranslationsRelations = relations(
  subsubcategoryTranslations,
  ({ one }) => ({
    subsubcategory: one(subSubCategories, {
      fields: [subsubcategoryTranslations.subsubcategoryId],
      references: [subSubCategories.id],
    }),
  })
);
