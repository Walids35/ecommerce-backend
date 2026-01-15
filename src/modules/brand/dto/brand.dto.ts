import { z } from "zod";

export const createBrandDto = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters").max(150),
  logo: z.string().url("Logo must be a valid URL").optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateBrandDto = z.object({
  name: z.string().min(2).max(150).optional(),
  logo: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export type CreateBrandDto = z.infer<typeof createBrandDto>;
export type UpdateBrandDto = z.infer<typeof updateBrandDto>;
