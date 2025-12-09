import { z } from "zod";

const FilterAttributeSchema = z.object({
  attributeId: z.number(),
  valueIds: z.array(z.number()).min(1),
});

export const FilterProductsInput = z.object({
  categoryId: z.number(),
  categoryType: z.enum(["subcategory", "subsubcategory"]),
  filters: z.array(FilterAttributeSchema).optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
});

export type FilterProductsInputType = z.infer<typeof FilterProductsInput>;
