import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { products } from "./product";
import { user } from "./users";

// Enums
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "devis", // Quote/invoice
  "livraison", // Cash on delivery
  "carte", // Card payment
]);

// Orders table
export const orders = pgTable("orders", {
  id: bigserial("id", { mode: "number" }).primaryKey(),

  // Unique order identifier (customer-facing)
  orderNumber: varchar("order_number", { length: 20 }).notNull().unique(),

  // Required link to user account (guest checkout disabled)
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),

  // Customer information fetched from user relation

  // Shipping address
  city: varchar("city", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  streetAddress: text("street_address").notNull(),

  // Order status and payment
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  isPaid: boolean("is_paid").default(false).notNull(),

  // Pricing (stored for historical accuracy)
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: bigserial("id", { mode: "number" }).primaryKey(),

  orderId: bigint("order_id", { mode: "number" })
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),

  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "restrict" })
    .notNull(),

  // Snapshot fields (preserve product state at order time)
  productName: varchar("product_name", { length: 200 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),

  quantity: integer("quantity").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Order status history table
export const orderStatusHistory = pgTable("order_status_history", {
  id: bigserial("id", { mode: "number" }).primaryKey(),

  orderId: bigint("order_id", { mode: "number" })
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),

  oldStatus: orderStatusEnum("old_status"), // nullable for first entry
  newStatus: orderStatusEnum("new_status").notNull(),

  // Track who made the change
  changedBy: varchar("changed_by", { length: 255 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const orderStatusHistoryRelations = relations(
  orderStatusHistory,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderStatusHistory.orderId],
      references: [orders.id],
    }),
  })
);
