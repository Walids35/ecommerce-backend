import { z } from "zod";

// Translation schema for a single language
const BrandTranslationSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters").max(150),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
});

export const createBrandDto = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters").max(150),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  logo: z.string().url("Logo must be a valid URL").optional(),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().int().nonnegative().optional().default(0),
  // Optional translations for multiple languages
  translations: z.object({
    en: BrandTranslationSchema.optional(),
    fr: BrandTranslationSchema.optional(),
    ar: BrandTranslationSchema.optional(),
  }).optional(),
});

export const updateBrandDto = z.object({
  name: z.string().min(2).max(150).optional(),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  logo: z.string().url().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
  // Optional translations for multiple languages
  translations: z.object({
    en: BrandTranslationSchema.optional(),
    fr: BrandTranslationSchema.optional(),
    ar: BrandTranslationSchema.optional(),
  }).optional(),
});

export type CreateBrandDto = z.infer<typeof createBrandDto>;
export type UpdateBrandDto = z.infer<typeof updateBrandDto>;
