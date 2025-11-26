import { Router } from "express";
import { OrderController } from "./order.controller";

const router = Router();
const controller = new OrderController();

// Admin endpoints (JWT required)
router.get("/", async (req, res, next) => {
  try {
    await controller.listOrders(req, res);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    await controller.getOrderById(req, res);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    await controller.updateStatus(req, res);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/payment", async (req, res, next) => {
  try {
    await controller.updatePayment(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await controller.deleteOrder(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
