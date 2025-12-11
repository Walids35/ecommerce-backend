import { Router } from "express";
import { BrandController } from "./brand.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyJWT } from "../../middlewares/auth";

const router = Router();
const controller = new BrandController();

// Public routes (no authentication)
router.get("/", asyncHandler(controller.getAll.bind(controller)));
router.get("/:id", asyncHandler(controller.getById.bind(controller)));

// Protected routes (require JWT)
router.post("/", verifyJWT, asyncHandler(controller.create.bind(controller)));
router.put("/:id", verifyJWT, asyncHandler(controller.update.bind(controller)));
router.delete("/:id", verifyJWT, asyncHandler(controller.delete.bind(controller)));

export default router;
