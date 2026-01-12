import { relations } from "drizzle-orm";
import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "support",
  "customer",
  "business-customer",
]);

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),

  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("customer").notNull(),
  address: varchar("address", { length: 500 }),
  phone: varchar("phone", { length: 20 }).notNull().default(""),
  matriculeFiscale: varchar("matriculeFiscale", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  orders: many(orders),
}));
