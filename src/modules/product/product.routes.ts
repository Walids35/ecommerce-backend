import { Router } from "express";
import { ProductController } from "./product.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyJWT } from "../../middlewares/auth";

const router = Router();
const controller = new ProductController();

router.post("/", verifyJWT, asyncHandler(controller.create.bind(controller)));
router.get("/", asyncHandler(controller.findAllWithSearch.bind(controller)));
router.get("/:id", asyncHandler(controller.findById.bind(controller)));
router.put("/:id", verifyJWT, asyncHandler(controller.update.bind(controller)));
router.patch("/:id/toggle-active", verifyJWT, asyncHandler(controller.toggleActiveStatus.bind(controller)));
router.patch("/:id/display-order", verifyJWT, asyncHandler(controller.updateDisplayOrder.bind(controller)));
router.delete("/:id", verifyJWT, asyncHandler(controller.delete.bind(controller)));

export default router;
