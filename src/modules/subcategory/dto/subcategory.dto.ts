import { z } from "zod";

export const CreateSubCategoryDto = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  categoryId: z.number().int().min(1, "Category ID is required"),
});

export type CreateSubCategoryInput = z.infer<typeof CreateSubCategoryDto>;

export const UpdateSubCategoryDto = CreateSubCategoryDto.partial().omit({ categoryId: true }).extend({
  categoryId: z.number().int().min(1).optional(),
});

export type UpdateSubCategoryInput = z.infer<typeof UpdateSubCategoryDto>;
