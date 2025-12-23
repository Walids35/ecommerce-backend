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
import { collections } from "../collections";

// ============================================
// COLLECTION TRANSLATIONS TABLE
// ============================================
export const collectionTranslations = pgTable(
  "collection_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    collectionId: bigint("collection_id", { mode: "number" })
      .references(() => collections.id, { onDelete: "cascade" })
      .notNull(),
    language: varchar("language", { length: 2 }).notNull(), // 'fr' or 'ar'
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 200 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Composite unique constraint: one translation per collection per language
    uniqueCollectionLanguage: unique().on(table.collectionId, table.language),
    // Index for fast language-specific queries
    languageCollectionIdx: index("idx_collection_trans_lang").on(
      table.language,
      table.collectionId
    ),
  })
);

// RELATIONS
export const collectionTranslationsRelations = relations(
  collectionTranslations,
  ({ one }) => ({
    collection: one(collections, {
      fields: [collectionTranslations.collectionId],
      references: [collections.id],
    }),
  })
);
