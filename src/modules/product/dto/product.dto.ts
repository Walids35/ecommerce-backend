// dto/product.dto.ts
import { z } from "zod";

export const CreateProductInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string(),
  stock: z.number().int().nonnegative(),
  discountPercentage: z.string().optional(),
  subCategoryId: z.number().int(),
  images: z.array(z.string()).min(1),
  datasheet: z.string().optional(),

  // [{ attributeId: number, valueId: number }]
  attributes: z
    .array(
      z.object({
        attributeId: z.number().int(),
        attributeValueId: z.number().int(),
      })
    )
    .optional(),
});

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
