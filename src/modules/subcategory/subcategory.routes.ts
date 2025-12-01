import { Router } from "express";
import { SubCategoryController } from "./subcategory.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();
const controller = new SubCategoryController();

router.post("/", asyncHandler(controller.create.bind(controller)));
router.get("/", asyncHandler(controller.findAll.bind(controller)));
router.get("/:id", asyncHandler(controller.findOne.bind(controller)));
router.put("/:id", asyncHandler(controller.update.bind(controller)));
router.delete("/:id", asyncHandler(controller.delete.bind(controller)));

export default router;
