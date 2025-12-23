import { z } from "zod";

// Translation schema for a single language
const CollectionTranslationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
});

export const CreateCollectionDto = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  // Optional translations for multiple languages
  translations: z.object({
    en: CollectionTranslationSchema.optional(),
    fr: CollectionTranslationSchema.optional(),
    ar: CollectionTranslationSchema.optional(),
  }).optional(),
});

export const UpdateCollectionDto = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  // Optional translations for multiple languages
  translations: z.object({
    en: CollectionTranslationSchema.optional(),
    fr: CollectionTranslationSchema.optional(),
    ar: CollectionTranslationSchema.optional(),
  }).optional(),
});

// DTO for adding products to a collection
export const AddProductsToCollectionDto = z.object({
  productIds: z.array(z.string().uuid()).min(1, "At least one product ID is required"),
});

// DTO for removing products from a collection
export const RemoveProductsFromCollectionDto = z.object({
  productIds: z.array(z.string().uuid()).min(1, "At least one product ID is required"),
});

// Type exports with both naming conventions for backward compatibility
export type CreateCollectionDto = z.infer<typeof CreateCollectionDto>;
export type UpdateCollectionDto = z.infer<typeof UpdateCollectionDto>;
export type AddProductsToCollectionDto = z.infer<typeof AddProductsToCollectionDto>;
export type RemoveProductsFromCollectionDto = z.infer<typeof RemoveProductsFromCollectionDto>;

// Alias exports for service compatibility
export type CreateCollectionInput = CreateCollectionDto;
export type UpdateCollectionInput = UpdateCollectionDto;
export type AddProductsToCollectionInput = AddProductsToCollectionDto;
export type RemoveProductsFromCollectionInput = RemoveProductsFromCollectionDto;
