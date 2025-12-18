import { Router } from "express";
import { SubCategoryController } from "./subcategory.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyJWT } from "../../middlewares/auth";

const router = Router();
const controller = new SubCategoryController();

router.post("/", asyncHandler(controller.create.bind(controller)));
router.get("/", asyncHandler(controller.findAll.bind(controller)));
router.get(
  "/category/:categoryId",
  asyncHandler(controller.findByCategoryId.bind(controller))
);
router.get(
  "/with-subsubcategories",
  asyncHandler(controller.getAllWithSubSubCategories.bind(controller))
);
router.get(
  "/:id",
  verifyJWT,
  asyncHandler(controller.findOne.bind(controller))
);
router.put("/:id", verifyJWT, asyncHandler(controller.update.bind(controller)));
router.delete(
  "/:id",
  verifyJWT,
  asyncHandler(controller.delete.bind(controller))
);

export default router;
