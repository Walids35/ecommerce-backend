import { z } from "zod";

export const CreateAttributeSchema = z.object({
  name: z.string().min(1),

  // Exactly one must be provided
  subCategoryId: z.number().int().optional(),
  subSubCategoryId: z.number().int().optional(),
}).refine(
  (data) => {
    const hasSubCat = data.subCategoryId !== undefined;
    const hasSubSubCat = data.subSubCategoryId !== undefined;
    return (hasSubCat && !hasSubSubCat) || (!hasSubCat && hasSubSubCat);
  },
  { message: "Exactly one of subCategoryId or subSubCategoryId must be provided" }
);

export type CreateAttributeInput = z.infer<typeof CreateAttributeSchema>;

export const UpdateAttributeSchema = z.object({
  name: z.string().optional(),
});

export type UpdateAttributeInput = z.infer<typeof UpdateAttributeSchema>;

export const CreateAttributeValueSchema = z.object({
  attributeId: z.number().int(),
  value: z.string().min(1),
});

export type CreateAttributeValueInput = z.infer<typeof CreateAttributeValueSchema>;
