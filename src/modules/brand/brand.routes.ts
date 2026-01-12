import { Router } from "express";
import { BrandController } from "./brand.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyJWT, requireStaff } from "../../middlewares/auth";

const router = Router();
const controller = new BrandController();

// Admin endpoints (require JWT + staff role)
router.post("/", verifyJWT, requireStaff, asyncHandler(controller.create.bind(controller)));
router.put("/:id", verifyJWT, requireStaff, asyncHandler(controller.update.bind(controller)));
router.delete("/:id", verifyJWT, requireStaff, asyncHandler(controller.delete.bind(controller)));

// Public routes (no authentication)
router.get("/", asyncHandler(controller.getAll.bind(controller)));
router.get("/:id", asyncHandler(controller.getById.bind(controller)));

export default router;
