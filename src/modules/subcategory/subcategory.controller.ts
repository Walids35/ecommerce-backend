import { Request, Response } from "express";
import { SubCategoryService } from "./subcategory.service";
import { CreateSubCategoryDto, UpdateSubCategoryDto } from "./dto/subcategory.dto";

const service = new SubCategoryService();

export class SubCategoryController {
  async create(req: Request, res: Response) {
    try {
      const body = CreateSubCategoryDto.parse(req.body);
      const subCategory = await service.create(body);
      res.status(201).json(subCategory);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async findAll(req: Request, res: Response) {
    const items = await service.findAll();
    res.json(items);
  }

  async findOne(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const item = await service.findById(id);
      res.json(item);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const body = UpdateSubCategoryDto.parse(req.body);
      const updated = await service.update(id, body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const deleted = await service.delete(id);
      res.json(deleted);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }
}
