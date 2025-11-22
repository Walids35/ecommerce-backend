import { Request, Response } from "express";
import { CategoryService } from "./category.service";
import { createCategoryDto, updateCategoryDto } from "./dto/categories.dto";


const categoryService = new CategoryService();

export class CategoryController {
  async getAll(req: Request, res: Response) {
    const data = await categoryService.getAll();
    res.json(data);
  }

  async getById(req: Request, res: Response) {
    const id = Number(req.params.id);

    const found = await categoryService.getById(id);
    if (!found) return res.status(404).json({ message: "Category not found" });

    res.json(found);
  }

  async create(req: Request, res: Response) {
    const parse = createCategoryDto.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ errors: parse.error.flatten() });
    }

    try {
      const created = await categoryService.create(parse.data);
      res.status(201).json(created);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const parse = updateCategoryDto.safeParse(req.body);

    if (!parse.success) {
      return res.status(400).json({ errors: parse.error.flatten() });
    }

    try {
      const updated = await categoryService.update(id, parse.data);
      res.json(updated);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);

    try {
      const result = await categoryService.delete(id);
      res.json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}
