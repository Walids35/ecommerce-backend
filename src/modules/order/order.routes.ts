import { Router } from "express";
import { OrderController } from "./order.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyJWT, requireStaff, requireCustomer } from "../../middlewares/auth";

const router = Router();
const controller = new OrderController();

// Apply verifyJWT to all routes in this router
router.use(verifyJWT);

// Customer endpoint - MUST be before /:id to avoid collision
router.get("/my-orders", requireCustomer, asyncHandler(controller.getMyOrders.bind(controller)));

// Admin/Support endpoints (require staff role)
router.get("/", requireStaff, asyncHandler(controller.listOrders.bind(controller)));
router.get("/:id", requireStaff, asyncHandler(controller.getOrderById.bind(controller)));
router.patch("/:id/status", requireStaff, asyncHandler(controller.updateStatus.bind(controller)));
router.patch("/:id/payment", requireStaff, asyncHandler(controller.updatePayment.bind(controller)));
router.delete("/:id", requireStaff, asyncHandler(controller.deleteOrder.bind(controller)));

export default router;
