import { Request, Response, NextFunction } from "express";
import { SubSubCategoryService } from "./subsubcategory.service";
import { CreateSubSubCategoryDto, UpdateSubSubCategoryDto } from "./dto/subsubcategory.dto";
import { sendCreated, sendSuccess } from "../../utils/response";

const service = new SubSubCategoryService();

export class SubSubCategoryController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateSubSubCategoryDto.parse(req.body);
      const result = await service.create(data);
      sendCreated(res, result, "Subsubcategory created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.findAll(req.language);
      sendSuccess(res, result, "Subsubcategories retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await service.findById(req.language, id);
      sendSuccess(res, result, "Subsubcategory retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getBySubCategoryId(req: Request, res: Response, next: NextFunction) {
    try {
      const subCategoryId = Number(req.params.subCategoryId);
      const result = await service.findBySubCategoryId(req.language, subCategoryId);
      sendSuccess(res, result, "Subsubcategories retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const result = await service.findBySlug(req.language, slug);
      sendSuccess(res, result, "Subsubcategory retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = UpdateSubSubCategoryDto.parse(req.body);
      const result = await service.update(id, data);
      sendSuccess(res, result, "Subsubcategory updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await service.delete(id);
      sendSuccess(res, result, "Subsubcategory deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}
