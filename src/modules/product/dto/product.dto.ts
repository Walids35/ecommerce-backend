import { z } from "zod";

// Translation schema for product (name, description, datasheet)
const ProductTranslationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  datasheet: z.string().optional(),
});

// Product availability enum schema
const disponibilitySchema = z.enum(["available", "on_request", "out_of_stock"]);

export const CreateProductInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string(),
  stock: z.number().int().nonnegative(),
  discountPercentage: z.string().optional(),

  // Flexible category linking: at least one required
  // Can specify BOTH subcategory and subsubcategory
  subCategoryId: z.number().int().optional(),
  subSubCategoryId: z.number().int().optional(),
  brandId: z.number().int().positive().optional(),

  images: z.array(z.string()).min(1),
  datasheet: z.string().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  subcategoryOrder: z.number().int().nonnegative().optional(),
  subsubcategoryOrder: z.number().int().nonnegative().optional(),

  // New product fields
  guarantee: z.number().int().nonnegative().optional().default(0),
  estimatedDeliveryMaxDays: z.number().int().positive().optional().default(7),
  disponibility: disponibilitySchema.optional().default("available"),

  attributes: z
    .array(
      z.object({
        attributeId: z.number().int(),
        attributeValueId: z.number().int(),
      })
    )
    .optional(),

  // Optional translations for multiple languages
  translations: z.object({
    en: ProductTranslationSchema.optional(),
    fr: ProductTranslationSchema.optional(),
    ar: ProductTranslationSchema.optional(),
  }).optional(),
}).refine(
  (data) => {
    // At least one category must be provided
    return data.subCategoryId !== undefined || data.subSubCategoryId !== undefined;
  },
  { message: "At least one of subCategoryId or subSubCategoryId must be provided" }
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
  subcategoryOrder: z.number().int().nonnegative().optional(),
  subsubcategoryOrder: z.number().int().nonnegative().optional(),
  brandId: z.number().int().positive().optional(),

  // New product fields
  guarantee: z.number().int().nonnegative().optional(),
  estimatedDeliveryMaxDays: z.number().int().positive().optional(),
  disponibility: disponibilitySchema.optional(),

  attributes: z
    .array(
      z.object({
        attributeId: z.number().int(),
        attributeValueId: z.number().int(),
      })
    )
    .optional(),

  // Optional translations for multiple languages
  translations: z.object({
    en: ProductTranslationSchema.optional(),
    fr: ProductTranslationSchema.optional(),
    ar: ProductTranslationSchema.optional(),
  }).optional(),
});

export const updateProductDisplayOrderInput = z.object({
  scope: z.enum(["subcategory", "subsubcategory"]),
  displayOrder: z.number().int().nonnegative({
    message: "Display order must be a non-negative integer"
  }),
});

export type UpdateProductDisplayOrderInputType = z.infer<typeof updateProductDisplayOrderInput>;

export type CreateProductInputType = z.infer<typeof CreateProductInput>;
export type UpdateProductInputType = z.infer<typeof UpdateProductInput>;
