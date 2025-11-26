import { Router } from "express";
import { SubSubCategoryController } from "./subsubcategory.controller";

const router = Router();
const controller = new SubSubCategoryController();

router.post("/", controller.create.bind(controller));
router.get("/", controller.getAll.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.get("/subcategory/:subCategoryId", controller.getBySubCategoryId.bind(controller));
router.get("/slug/:slug", controller.getBySlug.bind(controller));
router.put("/:id", controller.update.bind(controller));
router.delete("/:id", controller.delete.bind(controller));

export default router;
