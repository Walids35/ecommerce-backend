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
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),

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
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),

  attributes: z
    .array(
      z.object({
        attributeId: z.number().int(),
        attributeValueId: z.number().int(),
      })
    )
    .optional(),
});

export const updateProductDisplayOrderInput = z.object({
  displayOrder: z.number().int(),
});

export type CreateProductInputType = z.infer<typeof CreateProductInput>;
export type UpdateProductInputType = z.infer<typeof UpdateProductInput>;

export const FilterProductsInput = z.object({
  // At least one of these is required to scope the search
  subCategoryId: z.number().int().optional(),
  subSubCategoryId: z.number().int().optional(),

  // Array of selected attribute value IDs for filtering
  // e.g. [12, 25] means filter by products having (value 12) AND (value 25)
  attributeValueIds: z.array(z.number().int()).optional(),

  // Search, Pagination, and Sorting
  search: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).optional().default(10),
  sort: z.enum(["asc", "desc"]).optional().default("desc"),
  sortBy: z
    .enum(["name", "price", "createdAt", "displayOrder"])
    .optional()
    .default("displayOrder"),
}).refine(
  (data) => data.subCategoryId !== undefined || data.subSubCategoryId !== undefined,
  {
    message: "Either subCategoryId or subSubCategoryId must be provided.",
  }
);

export type FilterProductsInputType = z.infer<typeof FilterProductsInput>;
