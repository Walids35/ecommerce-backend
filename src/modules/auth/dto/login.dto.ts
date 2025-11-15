import z, { email } from "zod";

export const loginSchema = z.object({
  email: email().min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});