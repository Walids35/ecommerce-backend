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
import { attributeValues } from "../subcategories";

// ============================================
// ATTRIBUTE VALUE TRANSLATIONS TABLE
// ============================================
export const attributeValueTranslations = pgTable(
  "attribute_value_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    attributeValueId: bigint("attribute_value_id", { mode: "number" })
      .references(() => attributeValues.id, { onDelete: "cascade" })
      .notNull(),
    language: varchar("language", { length: 2 }).notNull(), // 'fr' or 'ar'
    value: varchar("value", { length: 200 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Composite unique constraint: one translation per attribute value per language
    uniqueAttributeValueLanguage: unique().on(
      table.attributeValueId,
      table.language
    ),
    // Index for fast language-specific queries
    languageAttributeValueIdx: index("idx_attr_val_trans_lang").on(
      table.language,
      table.attributeValueId
    ),
  })
);

// RELATIONS
export const attributeValueTranslationsRelations = relations(
  attributeValueTranslations,
  ({ one }) => ({
    attributeValue: one(attributeValues, {
      fields: [attributeValueTranslations.attributeValueId],
      references: [attributeValues.id],
    }),
  })
);
