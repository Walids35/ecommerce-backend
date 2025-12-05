import { z } from "zod";

export const CreateSubSubCategoryDto = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  subCategoryId: z.number().int().min(1, "Subcategory ID is required"),
});

export type CreateSubSubCategoryInput = z.infer<typeof CreateSubSubCategoryDto>;

export const UpdateSubSubCategoryDto = CreateSubSubCategoryDto.partial().omit({ subCategoryId: true }).extend({
  subCategoryId: z.number().int().min(1).optional(),
});

export type UpdateSubSubCategoryInput = z.infer<typeof UpdateSubSubCategoryDto>;
