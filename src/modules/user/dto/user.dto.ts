import { z } from "zod";

// Update user profile schema
export const UpdateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  matriculeFiscale: z.string().optional(),
  role: z.enum(["admin", "support", "customer", "business-customer"]).optional(),
});

export type UpdateUserInputType = z.infer<typeof UpdateUserSchema>;

// Update password schema
export const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters"),
});

export type UpdatePasswordInputType = z.infer<typeof UpdatePasswordSchema>;

// Query params for listing users
export const ListUsersQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  role: z.enum(["admin", "support", "customer", "business-customer"]).optional(),
  search: z.string().optional(),
});

export type ListUsersQueryType = z.infer<typeof ListUsersQuerySchema>;
