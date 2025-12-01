import { Router } from "express";
import { AnalyticsController } from "./analytics.controller";

const router = Router();
const controller = new AnalyticsController();

// All analytics routes require authentication (configured in index.ts)
router.get("/overview", async (req, res, next) => {
  try {
    await controller.getOverview(req, res);
  } catch (error) {
    next(error);
  }
});

router.get("/revenue", async (req, res, next) => {
  try {
    await controller.getRevenueAnalytics(req, res);
  } catch (error) {
    next(error);
  }
});

router.get("/orders", async (req, res, next) => {
  try {
    await controller.getOrderAnalytics(req, res);
  } catch (error) {
    next(error);
  }
});

router.get("/inventory", async (req, res, next) => {
  try {
    await controller.getInventoryAnalytics(req, res);
  } catch (error) {
    next(error);
  }
});

// Admin utility endpoint
router.post("/cache/clear", async (req, res, next) => {
  try {
    await controller.clearCache(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
