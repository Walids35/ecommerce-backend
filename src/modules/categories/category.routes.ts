import { Router } from "express";
import { CategoryController } from "./category.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyJWT, requireStaff } from "../../middlewares/auth";

const router = Router();
const controller = new CategoryController();

// Admin endpoints (require JWT + staff role)
router.post("/", verifyJWT, requireStaff, asyncHandler(controller.create.bind(controller)));
router.put("/:id", verifyJWT, requireStaff, asyncHandler(controller.update.bind(controller)));
router.delete("/:id", verifyJWT, requireStaff, asyncHandler(controller.delete.bind(controller)));

// Public endpoints (no auth required)
router.get("/all", asyncHandler(controller.getAllCategoriesWithSubcategories.bind(controller)));
router.get("/", asyncHandler(controller.getAll.bind(controller)));
router.get("/:id", asyncHandler(controller.getById.bind(controller)));

export default router;
