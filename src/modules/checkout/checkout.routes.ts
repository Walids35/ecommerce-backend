import { Router } from "express";
import { CheckoutController } from "./checkout.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyJWT } from "../../middlewares/auth";

const router = Router();
const controller = new CheckoutController();

// Authenticated checkout only (guest checkout disabled)
router.post("/", verifyJWT, asyncHandler(controller.createOrder.bind(controller)));
router.get("/:orderNumber", asyncHandler(controller.getOrderByNumber.bind(controller)));

export default router;
