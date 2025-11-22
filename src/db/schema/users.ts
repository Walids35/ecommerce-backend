import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "support"]);

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),

  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("admin").notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});