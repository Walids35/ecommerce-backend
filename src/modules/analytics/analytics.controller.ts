import { Request, Response } from "express";
import { AnalyticsService } from "./analytics.service";
import {
  DateRangeQuerySchema,
  RevenueAnalyticsQuerySchema,
  OrderAnalyticsQuerySchema,
  InventoryAnalyticsQuerySchema,
} from "./dto/analytics.dto";
import { analyticsCache } from "./analytics.cache";
import { sendSuccess } from "../../utils/response";

const service = new AnalyticsService();

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export class AnalyticsController {
  async getOverview(req: AuthRequest, res: Response) {
    const query = DateRangeQuerySchema.parse(req.query);

    // Generate cache key
    const cacheKey = analyticsCache.generateKey("overview", query);

    // Check cache
    let data = analyticsCache.get(cacheKey);

    if (!data) {
      // Fetch from database
      data = await service.getOverview(query);

      // Cache with 5 minute TTL
      analyticsCache.set(cacheKey, data, 5 * 60 * 1000);
    }

    sendSuccess(res, data, "Analytics overview retrieved successfully");
  }

  async getRevenueAnalytics(req: AuthRequest, res: Response) {
    const query = RevenueAnalyticsQuerySchema.parse(req.query);

    const cacheKey = analyticsCache.generateKey("revenue", query);
    let data = analyticsCache.get(cacheKey);

    if (!data) {
      data = await service.getRevenueAnalytics(query);
      analyticsCache.set(cacheKey, data, 10 * 60 * 1000); // 10 min TTL
    }

    sendSuccess(res, data, "Revenue analytics retrieved successfully");
  }

  async getOrderAnalytics(req: AuthRequest, res: Response) {
    const query = OrderAnalyticsQuerySchema.parse(req.query);

    const cacheKey = analyticsCache.generateKey("orders", query);
    let data = analyticsCache.get(cacheKey);

    if (!data) {
      data = await service.getOrderAnalytics(query);
      analyticsCache.set(cacheKey, data, 5 * 60 * 1000); // 5 min TTL
    }

    sendSuccess(res, data, "Order analytics retrieved successfully");
  }

  async getInventoryAnalytics(req: AuthRequest, res: Response) {
    const query = InventoryAnalyticsQuerySchema.parse(req.query);

    const cacheKey = analyticsCache.generateKey("inventory", query);
    let data = analyticsCache.get(cacheKey);

    if (!data) {
      data = await service.getInventoryAnalytics(query);
      analyticsCache.set(cacheKey, data, 15 * 60 * 1000); // 15 min TTL
    }

    sendSuccess(res, data, "Inventory analytics retrieved successfully");
  }

  async clearCache(req: AuthRequest, res: Response) {
    // Admin-only endpoint to manually clear cache
    analyticsCache.clear();
    sendSuccess(res, null, "Analytics cache cleared successfully");
  }
}
