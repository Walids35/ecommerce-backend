import { Router } from "express";
import { ProductController } from "./product.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyJWT, requireStaff } from "../../middlewares/auth";

const router = Router();
const controller = new ProductController();

// Admin endpoints (require JWT + staff role)
router.post("/", verifyJWT, requireStaff, asyncHandler(controller.create.bind(controller)));
router.put("/:id", verifyJWT, requireStaff, asyncHandler(controller.update.bind(controller)));
router.patch("/:id/toggle-active", verifyJWT, requireStaff, asyncHandler(controller.toggleActiveStatus.bind(controller)));
router.patch("/:id/display-order", verifyJWT, requireStaff, asyncHandler(controller.updateDisplayOrder.bind(controller)));
router.delete("/:id", verifyJWT, requireStaff, asyncHandler(controller.delete.bind(controller)));

// Public endpoints (no auth required)
router.get("/", asyncHandler(controller.findAllWithSearch.bind(controller)));
router.get("/discounted", asyncHandler(controller.findDiscountedProducts.bind(controller)));
router.get("/slug/:slug", asyncHandler(controller.findBySlug.bind(controller)));
router.get("/:id", asyncHandler(controller.findById.bind(controller)));
router.post("/filter", asyncHandler(controller.filterProducts.bind(controller)));

export default router;
