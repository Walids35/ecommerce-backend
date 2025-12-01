import { Router } from "express";
import { ProductController } from "./product.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();
const controller = new ProductController();

router.post("/", asyncHandler(controller.create.bind(controller)));
router.get("/", asyncHandler(controller.findAllWithSearch.bind(controller)));
router.get("/:id", asyncHandler(controller.findById.bind(controller)));
router.put("/:id", asyncHandler(controller.update.bind(controller)));
router.patch("/:id/toggle-active", asyncHandler(controller.toggleActiveStatus.bind(controller)));
router.patch("/:id/display-order", asyncHandler(controller.updateDisplayOrder.bind(controller)));
router.delete("/:id", asyncHandler(controller.delete.bind(controller)));

export default router;
