import { z } from "zod";

const paymentMethodSchema = z.enum(["devis", "livraison", "carte"]);
const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const CreateOrderInput = z.object({
  // Customer info
  customerName: z.string().min(1).max(255),
  customerEmail: z.string().email().max(255),
  customerPhone: z.string().min(1).max(50),

  // Shipping address
  city: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  streetAddress: z.string().min(1),

  // Payment
  paymentMethod: paymentMethodSchema,

  // Pricing (client provides, server validates)
  // All prices must be strings in decimal format with up to 2 decimal places
  // Examples: "10.00", "99.99", "0.50", "100"
  subtotal: z.string().regex(/^\d+(\.\d{1,2})?$/, "Subtotal must be a valid decimal number (e.g., '10.00')"),
  shippingCost: z.string().regex(/^\d+(\.\d{1,2})?$/, "Shipping cost must be a valid decimal number (e.g., '5.00')"),
  taxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Tax amount must be a valid decimal number (e.g., '2.50')"),

  // Items
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Order must contain at least one item"),
});

export const UpdateOrderStatusInput = z.object({
  status: orderStatusSchema,
});

export const UpdatePaymentStatusInput = z.object({
  isPaid: z.boolean(),
});

export type CreateOrderInputType = z.infer<typeof CreateOrderInput>;
export type UpdateOrderStatusInputType = z.infer<typeof UpdateOrderStatusInput>;
export type UpdatePaymentStatusInputType = z.infer<
  typeof UpdatePaymentStatusInput
>;
