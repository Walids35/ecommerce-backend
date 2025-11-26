import { z } from "zod";

export const CreateProductInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string(),
  stock: z.number().int().nonnegative(),
  discountPercentage: z.string().optional(),

  // Flexible category linking: exactly one required
  subCategoryId: z.number().int().optional(),
  subSubCategoryId: z.number().int().optional(),

  images: z.array(z.string()).min(1),
  datasheet: z.string().optional(),

  attributes: z
    .array(
      z.object({
        attributeId: z.number().int(),
        attributeValueId: z.number().int(),
      })
    )
    .optional(),
}).refine(
  (data) => {
    const hasSubCat = data.subCategoryId !== undefined;
    const hasSubSubCat = data.subSubCategoryId !== undefined;
    return (hasSubCat && !hasSubSubCat) || (!hasSubCat && hasSubSubCat);
  },
  { message: "Exactly one of subCategoryId or subSubCategoryId must be provided" }
);

export const UpdateProductInput = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
  discountPercentage: z.string().optional(),
  images: z.array(z.string()).optional(),
  datasheet: z.string().optional(),

  attributes: z
    .array(
      z.object({
        attributeId: z.number().int(),
        attributeValueId: z.number().int(),
      })
    )
    .optional(),
});

export type CreateProductInputType = z.infer<typeof CreateProductInput>;
export type UpdateProductInputType = z.infer<typeof UpdateProductInput>;
