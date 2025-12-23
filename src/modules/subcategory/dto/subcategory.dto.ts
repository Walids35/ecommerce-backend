import { z } from "zod";

// Translation schema for a single language (NO SLUG - slug is in base table only)
const SubcategoryTranslationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const CreateSubCategoryDto = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  categoryId: z.number().int().positive(),
  // Optional translations for multiple languages
  translations: z.object({
    en: SubcategoryTranslationSchema.optional(),
    fr: SubcategoryTranslationSchema.optional(),
    ar: SubcategoryTranslationSchema.optional(),
  }).optional(),
});

export const UpdateSubCategoryDto = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  categoryId: z.number().int().positive().optional(),
  // Optional translations for multiple languages
  translations: z.object({
    en: SubcategoryTranslationSchema.optional(),
    fr: SubcategoryTranslationSchema.optional(),
    ar: SubcategoryTranslationSchema.optional(),
  }).optional(),
});

export type CreateSubCategoryInput = z.infer<typeof CreateSubCategoryDto>;
export type UpdateSubCategoryInput = z.infer<typeof UpdateSubCategoryDto>;
