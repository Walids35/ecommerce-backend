import { z } from "zod";

export const CreateSubCategoryAttributeSchema = z.object({
  subCategoryId: z.number(),
  name: z.string().min(1),
});

export type CreateSubCategoryAttributeInput = z.infer<
  typeof CreateSubCategoryAttributeSchema
>;

export const UpdateSubCategoryAttributeSchema = z.object({
  name: z.string().optional(),
});

export type UpdateSubCategoryAttributeInput = z.infer<
  typeof UpdateSubCategoryAttributeSchema
>;

// New: Predefined attribute value DTO
export const CreateAttributeValueSchema = z.object({
  attributeId: z.number(),
  value: z.string().min(1),
});

export type CreateAttributeValueInput = z.infer<
  typeof CreateAttributeValueSchema
>;
