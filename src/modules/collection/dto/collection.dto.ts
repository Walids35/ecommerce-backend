import { z } from "zod";

// Create Collection DTO
export const CreateCollectionDto = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export type CreateCollectionInput = z.infer<typeof CreateCollectionDto>;

// Update Collection DTO
export const UpdateCollectionDto = CreateCollectionDto.partial();

export type UpdateCollectionInput = z.infer<typeof UpdateCollectionDto>;

// Add Products to Collection DTO
export const AddProductsToCollectionDto = z.object({
  productIds: z.array(z.string().uuid("Invalid product ID format")).min(1, "At least one product ID is required"),
});

export type AddProductsToCollectionInput = z.infer<typeof AddProductsToCollectionDto>;

// Remove Products from Collection DTO
export const RemoveProductsFromCollectionDto = z.object({
  productIds: z.array(z.string().uuid("Invalid product ID format")).min(1, "At least one product ID is required"),
});

export type RemoveProductsFromCollectionInput = z.infer<typeof RemoveProductsFromCollectionDto>;
