import { Router } from "express";
import { CheckoutController } from "./checkout.controller";

const router = Router();
const controller = new CheckoutController();

// Public endpoints
router.post("/", async (req, res, next) => {
  try {
    await controller.createOrder(req, res);
  } catch (error) {
    next(error);
  }
});

router.get("/:orderNumber", async (req, res, next) => {
  try {
    await controller.getOrderByNumber(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
