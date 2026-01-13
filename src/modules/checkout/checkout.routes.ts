import { Router } from "express";
import { CheckoutController } from "./checkout.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyJWT, requireAdmin } from "../../middlewares/auth";

const router = Router();
const controller = new CheckoutController();

// Admin manual checkout - Create order on behalf of client
router.post(
  "/admin",
  verifyJWT,
  requireAdmin,
  asyncHandler(controller.createOrderForClient.bind(controller))
);

// Authenticated checkout only (guest checkout disabled)
router.post("/", verifyJWT, asyncHandler(controller.createOrder.bind(controller)));
router.get("/:orderNumber", asyncHandler(controller.getOrderByNumber.bind(controller)));

export default router;
