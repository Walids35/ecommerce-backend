import { Router } from "express";
import { CollectionController } from "./collection.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyJWT } from "../../middlewares/auth";

const router = Router();
const controller = new CollectionController();

// Collection CRUD routes
router.post("/", verifyJWT, asyncHandler(controller.createCollection.bind(controller)));
router.get("/", asyncHandler(controller.getAllCollections.bind(controller)));
router.get("/:id", asyncHandler(controller.getCollectionById.bind(controller)));
router.get("/:id/products", asyncHandler(controller.getCollectionWithProducts.bind(controller)));
router.put("/:id", verifyJWT, asyncHandler(controller.updateCollection.bind(controller)));
router.patch("/:id/toggle-active", verifyJWT, asyncHandler(controller.toggleActiveStatus.bind(controller)));
router.delete("/:id", verifyJWT, asyncHandler(controller.deleteCollection.bind(controller)));

// Product management routes
router.post("/:id/products", verifyJWT, asyncHandler(controller.addProductsToCollection.bind(controller)));
router.delete("/:id/products", verifyJWT, asyncHandler(controller.removeProductsFromCollection.bind(controller)));

export default router;
