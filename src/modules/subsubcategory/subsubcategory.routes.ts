import { Router } from "express";
import { SubSubCategoryController } from "./subsubcategory.controller";
import { verifyJWT, requireStaff } from "../../middlewares/auth";

const router = Router();
const controller = new SubSubCategoryController();

// Admin endpoints (require JWT + staff role)
router.post("/", verifyJWT, requireStaff, controller.create.bind(controller));
router.put("/:id", verifyJWT, requireStaff, controller.update.bind(controller));
router.delete("/:id", verifyJWT, requireStaff, controller.delete.bind(controller));

// Public endpoints (no auth required)
router.get("/", controller.getAll.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.get("/subcategory/:subCategoryId", controller.getBySubCategoryId.bind(controller));
router.get("/slug/:slug", controller.getBySlug.bind(controller));

export default router;
