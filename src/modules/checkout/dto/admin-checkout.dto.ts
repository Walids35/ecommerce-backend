import { z } from "zod";
import { CreateOrderInput } from "../../order/dto/order.dto";

/**
 * Schema for admin manual checkout
 * Extends regular checkout with userId field for selecting client user
 */
export const AdminCreateOrderInput = CreateOrderInput.extend({
  userId: z.string().uuid("User ID must be a valid UUID"),
});

export type AdminCreateOrderInputType = z.infer<typeof AdminCreateOrderInput>;
