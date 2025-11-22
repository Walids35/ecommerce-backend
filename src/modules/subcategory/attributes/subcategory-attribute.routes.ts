import { Router } from "express";
import { SubCategoryAttributeController } from "./subcategory-attribute.controller";

const router = Router();
const controller = new SubCategoryAttributeController();

// Attributes
router.post("/", controller.create.bind(controller));
router.get("/", controller.findAll.bind(controller));
router.get("/:id", controller.findById.bind(controller));
router.get("/subcategory/:subCategoryId", controller.findBySubCategory.bind(controller));
router.put("/:id", controller.update.bind(controller));
router.delete("/:id", controller.delete.bind(controller));

// Attribute Values
router.post("/value", controller.addValue.bind(controller));
router.get("/value/:attributeId", controller.getValues.bind(controller));
router.delete("/value/remove/:valueId", controller.deleteValue.bind(controller));

export default router;
