import { Request, Response } from "express";
import { SubCategoryService } from "./subcategory.service";
import {
  CreateSubCategoryDto,
  UpdateSubCategoryDto,
} from "./dto/subcategory.dto";
import { sendSuccess, sendCreated } from "../../utils/response";

const service = new SubCategoryService();

export class SubCategoryController {
  async create(req: Request, res: Response) {
    const body = CreateSubCategoryDto.parse(req.body);
    const subCategory = await service.create(body);
    sendCreated(res, subCategory, "Subcategory created successfully");
  }

  async findAll(req: Request, res: Response) {
    const items = await service.findAll(req.language);
    sendSuccess(res, items, "Subcategories retrieved successfully");
  }

  async getAllWithSubSubCategories(req: Request, res: Response) {
    const items = await service.getAllWithSubSubCategories(req.language);
    sendSuccess(res, items, "Subcategories with subsubcategories retrieved successfully");
  }

  async findByCategoryId(req: Request, res: Response) {
    const categoryId = Number(req.params.categoryId);
    const items = await service.findByCategoryId(req.language, categoryId);
    sendSuccess(res, items, "Subcategories retrieved successfully");
  }
  async findOne(req: Request, res: Response) {
    const id = Number(req.params.id);
    const item = await service.findById(req.language, id);
    sendSuccess(res, item, "Subcategory retrieved successfully");
  }

  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const body = UpdateSubCategoryDto.parse(req.body);
    const updated = await service.update(id, body);
    sendSuccess(res, updated, "Subcategory updated successfully");
  }

  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const deleted = await service.delete(id);
    sendSuccess(res, deleted, "Subcategory deleted successfully");
  }
}
