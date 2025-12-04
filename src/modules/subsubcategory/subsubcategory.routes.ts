import { Router } from "express";
import { SubSubCategoryController } from "./subsubcategory.controller";
import { verifyJWT } from "../../middlewares/auth";

const router = Router();
const controller = new SubSubCategoryController();

router.post("/", verifyJWT, controller.create.bind(controller));
router.get("/", controller.getAll.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.get("/subcategory/:subCategoryId", controller.getBySubCategoryId.bind(controller));
router.get("/slug/:slug", controller.getBySlug.bind(controller));
router.put("/:id", verifyJWT, controller.update.bind(controller));
router.delete("/:id", verifyJWT, controller.delete.bind(controller));

export default router;
