import { Router } from "express";
import { CollectionController } from "./collection.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyJWT, requireStaff } from "../../middlewares/auth";

const router = Router();
const controller = new CollectionController();

// Admin endpoints (require JWT + staff role)
router.post("/", verifyJWT, requireStaff, asyncHandler(controller.createCollection.bind(controller)));
router.put("/:id", verifyJWT, requireStaff, asyncHandler(controller.updateCollection.bind(controller)));
router.patch("/:id/toggle-active", verifyJWT, requireStaff, asyncHandler(controller.toggleActiveStatus.bind(controller)));
router.delete("/:id", verifyJWT, requireStaff, asyncHandler(controller.deleteCollection.bind(controller)));
router.post("/:id/products", verifyJWT, requireStaff, asyncHandler(controller.addProductsToCollection.bind(controller)));
router.delete("/:id/products", verifyJWT, requireStaff, asyncHandler(controller.removeProductsFromCollection.bind(controller)));

// Public endpoints (no auth required)
router.get("/", asyncHandler(controller.getAllCollections.bind(controller)));
router.get("/:id", asyncHandler(controller.getCollectionById.bind(controller)));
router.get("/:id/products", asyncHandler(controller.getCollectionWithProducts.bind(controller)));

export default router;
