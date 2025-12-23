import { z } from "zod";

// Translation schema for attribute (only name field)
const AttributeTranslationSchema = z.object({
  name: z.string().min(1),
});

export const CreateAttributeSchema = z.object({
  name: z.string().min(1),

  // Exactly one must be provided
  subCategoryId: z.number().int().optional(),
  subSubCategoryId: z.number().int().optional(),

  // Optional translations for multiple languages
  translations: z.object({
    en: AttributeTranslationSchema.optional(),
    fr: AttributeTranslationSchema.optional(),
    ar: AttributeTranslationSchema.optional(),
  }).optional(),
}).refine(
  (data) => {
    const hasSubCat = data.subCategoryId !== undefined;
    const hasSubSubCat = data.subSubCategoryId !== undefined;
    return (hasSubCat && !hasSubSubCat) || (!hasSubCat && hasSubSubCat);
  },
  { message: "Exactly one of subCategoryId or subSubCategoryId must be provided" }
);

export type CreateAttributeInput = z.infer<typeof CreateAttributeSchema>;

export const UpdateAttributeSchema = z.object({
  name: z.string().optional(),
  // Optional translations for multiple languages
  translations: z.object({
    en: AttributeTranslationSchema.optional(),
    fr: AttributeTranslationSchema.optional(),
    ar: AttributeTranslationSchema.optional(),
  }).optional(),
});

export type UpdateAttributeInput = z.infer<typeof UpdateAttributeSchema>;

// Translation schema for attribute value (only value field)
const AttributeValueTranslationSchema = z.object({
  value: z.string().min(1),
});

export const CreateAttributeValueSchema = z.object({
  attributeId: z.number().int(),
  value: z.string().min(1),
  // Optional translations for multiple languages
  translations: z.object({
    en: AttributeValueTranslationSchema.optional(),
    fr: AttributeValueTranslationSchema.optional(),
    ar: AttributeValueTranslationSchema.optional(),
  }).optional(),
});

export type CreateAttributeValueInput = z.infer<typeof CreateAttributeValueSchema>;
