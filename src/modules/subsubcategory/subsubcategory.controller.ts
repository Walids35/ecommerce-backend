import { Request, Response, NextFunction } from "express";
import { SubSubCategoryService } from "./subsubcategory.service";
import { CreateSubSubCategoryDto, UpdateSubSubCategoryDto } from "./dto/subsubcategory.dto";

const service = new SubSubCategoryService();

export class SubSubCategoryController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateSubSubCategoryDto.parse(req.body);
      const result = await service.create(data);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.findAll();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await service.findById(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getBySubCategoryId(req: Request, res: Response, next: NextFunction) {
    try {
      const subCategoryId = Number(req.params.subCategoryId);
      const result = await service.findBySubCategoryId(subCategoryId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const result = await service.findBySlug(slug);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = UpdateSubSubCategoryDto.parse(req.body);
      const result = await service.update(id, data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await service.delete(id);
      res.json({ message: "Subsubcategory deleted successfully", data: result });
    } catch (error) {
      next(error);
    }
  }
}
