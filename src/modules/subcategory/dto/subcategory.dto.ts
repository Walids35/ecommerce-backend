// src/modules/sub-category/dto/sub-category.dto.ts
import { z } from "zod";

export const CreateSubCategoryDto = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category ID is required"),
});

export type CreateSubCategoryInput = z.infer<typeof CreateSubCategoryDto>;

export const UpdateSubCategoryDto = CreateSubCategoryDto.partial();
export type UpdateSubCategoryInput = z.infer<typeof UpdateSubCategoryDto>;
