import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

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
  role: userRoleEnum("role").default("admin").notNull(),
  address: varchar("address", { length: 500 }),
  phone: varchar("phone", { length: 20 }).notNull().default(""),
  matriculeFiscale: varchar("matriculeFiscale", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
