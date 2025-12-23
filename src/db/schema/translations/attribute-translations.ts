import { relations } from "drizzle-orm";
import {
  pgTable,
  bigserial,
  timestamp,
  varchar,
  bigint,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { attributes } from "../subcategories";

// ============================================
// ATTRIBUTE TRANSLATIONS TABLE
// ============================================
export const attributeTranslations = pgTable(
  "attribute_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    attributeId: bigint("attribute_id", { mode: "number" })
      .references(() => attributes.id, { onDelete: "cascade" })
      .notNull(),
    language: varchar("language", { length: 2 }).notNull(), // 'fr' or 'ar'
    name: varchar("name", { length: 150 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Composite unique constraint: one translation per attribute per language
    uniqueAttributeLanguage: unique().on(table.attributeId, table.language),
    // Index for fast language-specific queries
    languageAttributeIdx: index("idx_attribute_trans_lang").on(
      table.language,
      table.attributeId
    ),
  })
);

// RELATIONS
export const attributeTranslationsRelations = relations(
  attributeTranslations,
  ({ one }) => ({
    attribute: one(attributes, {
      fields: [attributeTranslations.attributeId],
      references: [attributes.id],
    }),
  })
);
