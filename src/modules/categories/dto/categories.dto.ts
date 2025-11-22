import { z } from "zod";

export const createCategoryDto = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export const updateCategoryDto = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategoryDto>;
export type UpdateCategoryDto = z.infer<typeof updateCategoryDto>;
