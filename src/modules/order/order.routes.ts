import { Router } from "express";
import { OrderController } from "./order.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();
const controller = new OrderController();

// Admin endpoints (JWT required)
router.get("/", asyncHandler(controller.listOrders.bind(controller)));
router.get("/:id", asyncHandler(controller.getOrderById.bind(controller)));
router.patch("/:id/status", asyncHandler(controller.updateStatus.bind(controller)));
router.patch("/:id/payment", asyncHandler(controller.updatePayment.bind(controller)));
router.delete("/:id", asyncHandler(controller.deleteOrder.bind(controller)));

export default router;
