import { z } from "zod";

// Translation schema for a single language
const CategoryTranslationSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
});

export const createCategoryDto = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  // Optional translations for multiple languages
  translations: z.object({
    en: CategoryTranslationSchema.optional(),
    fr: CategoryTranslationSchema.optional(),
    ar: CategoryTranslationSchema.optional(),
  }).optional(),
});

export const updateCategoryDto = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens").optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  // Optional translations for multiple languages
  translations: z.object({
    en: CategoryTranslationSchema.optional(),
    fr: CategoryTranslationSchema.optional(),
    ar: CategoryTranslationSchema.optional(),
  }).optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategoryDto>;
export type UpdateCategoryDto = z.infer<typeof updateCategoryDto>;
