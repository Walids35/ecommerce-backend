import { Request, Response } from "express";
import { CategoryService } from "./category.service";
import { createCategoryDto, updateCategoryDto } from "./dto/categories.dto";
import { sendSuccess, sendCreated } from "../../utils/response";
import { NotFoundError, ValidationError } from "../../utils/errors";

const categoryService = new CategoryService();

export class CategoryController {
  async getAll(req: Request, res: Response) {
    const data = await categoryService.getAll(req.language);
    sendSuccess(res, data, "Categories retrieved successfully");
  }

  async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const found = await categoryService.getById(req.language, id);
    if (!found) throw new NotFoundError("Category not found");

    sendSuccess(res, found, "Category retrieved successfully");
  }

  async create(req: Request, res: Response) {
    const parse = createCategoryDto.safeParse(req.body);
    if (!parse.success) {
      throw new ValidationError("Validation failed", parse.error.flatten());
    }

    const created = await categoryService.create(parse.data);
    sendCreated(res, created, "Category created successfully");
  }

  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const parse = updateCategoryDto.safeParse(req.body);

    if (!parse.success) {
      throw new ValidationError("Validation failed", parse.error.flatten());
    }

    const updated = await categoryService.update(id, parse.data);
    sendSuccess(res, updated, "Category updated successfully");
  }

  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await categoryService.delete(id);
    sendSuccess(res, result, "Category deleted successfully");
  }
  async getAllCategoriesWithSubcategories(req: Request, res: Response) {
    const data = await categoryService.getAllCategoriesWithSubcategories(req.language);
    sendSuccess(res, data, "Categories with subcategories retrieved successfully");
  }
}
