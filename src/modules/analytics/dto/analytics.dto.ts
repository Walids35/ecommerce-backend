import { z } from "zod";

// Query parameter schemas
export const DateRangeQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const RevenueAnalyticsQuerySchema = DateRangeQuerySchema.extend({
  groupBy: z.enum(["day", "week", "month"]).optional(),
});

export const OrderAnalyticsQuerySchema = DateRangeQuerySchema.extend({
  status: z.string().optional(),
});

export const InventoryAnalyticsQuerySchema = z.object({
  categoryId: z.coerce.number().optional(),
  subCategoryId: z.coerce.number().optional(),
  lowStockThreshold: z.coerce.number().default(10),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

// Type exports
export type DateRangeQuery = z.infer<typeof DateRangeQuerySchema>;
export type RevenueAnalyticsQuery = z.infer<typeof RevenueAnalyticsQuerySchema>;
export type OrderAnalyticsQuery = z.infer<typeof OrderAnalyticsQuerySchema>;
export type InventoryAnalyticsQuery = z.infer<
  typeof InventoryAnalyticsQuerySchema
>;
