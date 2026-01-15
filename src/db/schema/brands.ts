import { relations } from "drizzle-orm";
import { pgTable, bigserial, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { products } from "./product";

export const brands = pgTable("brands", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  logo: text("logo"), // URL to brand logo image in Firebase Storage
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));
