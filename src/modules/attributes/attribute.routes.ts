import { Router } from "express";
import { AttributeController } from "./attribute.controller";
import { verifyJWT, requireStaff } from "../../middlewares/auth";

const router = Router();
const controller = new AttributeController();

// Admin attribute routes (require JWT + staff role)
router.post("/", verifyJWT, requireStaff, controller.create.bind(controller));
router.put("/:id", verifyJWT, requireStaff, controller.update.bind(controller));
router.delete("/:id", verifyJWT, requireStaff, controller.delete.bind(controller));

// Admin attribute value routes (require JWT + staff role)
router.post("/value", verifyJWT, requireStaff, controller.addValue.bind(controller));
router.delete("/value/remove/:valueId", verifyJWT, requireStaff, controller.deleteValue.bind(controller));

// Public attribute routes (no auth required)
router.get("/", controller.getAll.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.get("/parent/:parentId", controller.getByParentId.bind(controller)); // ?type=subcategory|subsubcategory
router.get("/value/:attributeId", controller.getValues.bind(controller));
router.get("/with-values/parent/:parentId", controller.getAttributesWithValuesByParent.bind(controller)); // ?type=subcategory|subsubcategory

export default router;
