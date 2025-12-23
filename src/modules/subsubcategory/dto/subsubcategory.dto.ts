import { z } from "zod";

// Translation schema for a single language (slug IS in translation table)
const SubsubcategoryTranslationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
});

export const CreateSubSubCategoryDto = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  subCategoryId: z.number().int().positive(),
  // Optional translations for multiple languages
  translations: z.object({
    en: SubsubcategoryTranslationSchema.optional(),
    fr: SubsubcategoryTranslationSchema.optional(),
    ar: SubsubcategoryTranslationSchema.optional(),
  }).optional(),
});

export const UpdateSubSubCategoryDto = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  subCategoryId: z.number().int().positive().optional(),
  // Optional translations for multiple languages
  translations: z.object({
    en: SubsubcategoryTranslationSchema.optional(),
    fr: SubsubcategoryTranslationSchema.optional(),
    ar: SubsubcategoryTranslationSchema.optional(),
  }).optional(),
});

export type CreateSubSubCategoryInput = z.infer<typeof CreateSubSubCategoryDto>;
export type UpdateSubSubCategoryInput = z.infer<typeof UpdateSubSubCategoryDto>;
