import { Router } from "express";
import { CheckoutController } from "./checkout.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();
const controller = new CheckoutController();

// Public endpoints
router.post("/", asyncHandler(controller.createOrder.bind(controller)));
router.get("/:orderNumber", asyncHandler(controller.getOrderByNumber.bind(controller)));

export default router;
