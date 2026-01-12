import z, { email } from "zod";

export const loginSchema = z.object({
  email: email().min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: email().min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  matriculeFiscale: z.string().optional(),
  role: z.enum(["customer", "business-customer"]).default("customer").optional(),
});