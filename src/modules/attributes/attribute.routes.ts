import { Router } from "express";
import { AttributeController } from "./attribute.controller";
import { verifyJWT } from "../../middlewares/auth";

const router = Router();
const controller = new AttributeController();

// Attribute routes
router.post("/", verifyJWT, controller.create.bind(controller));
router.get("/", controller.getAll.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.get("/parent/:parentId", controller.getByParentId.bind(controller)); // ?type=subcategory|subsubcategory
router.put("/:id", verifyJWT, controller.update.bind(controller));
router.delete("/:id", verifyJWT, controller.delete.bind(controller));

// Attribute value routes
router.post("/value", verifyJWT, controller.addValue.bind(controller));
router.get("/value/:attributeId", controller.getValues.bind(controller));
router.get("/with-values/parent/:parentId", controller.getAttributesWithValuesByParent.bind(controller)); // ?type=subcategory|subsubcategory
router.delete("/value/remove/:valueId", verifyJWT, controller.deleteValue.bind(controller));

export default router;
