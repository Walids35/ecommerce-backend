import { Router } from "express";
import { SubCategoryController } from "./subcategory.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyJWT, requireStaff } from "../../middlewares/auth";

const router = Router();
const controller = new SubCategoryController();

// Admin endpoints (require JWT + staff role)
router.post("/", verifyJWT, requireStaff, asyncHandler(controller.create.bind(controller)));
router.put("/:id", verifyJWT, requireStaff, asyncHandler(controller.update.bind(controller)));
router.delete("/:id", verifyJWT, requireStaff, asyncHandler(controller.delete.bind(controller)));

// Public/mixed endpoints
router.get("/", asyncHandler(controller.findAll.bind(controller)));
router.get("/with-subsubcategories", asyncHandler(controller.getAllWithSubSubCategories.bind(controller)));
router.get("/category/:categoryId", asyncHandler(controller.findByCategoryId.bind(controller)));
router.get("/:id", verifyJWT, asyncHandler(controller.findOne.bind(controller)));

export default router;
