import { Request, Response } from "express";
import { SubCategoryAttributeService } from "./subcategory-attribute.service";

const service = new SubCategoryAttributeService();

export class SubCategoryAttributeController {
  async create(req: Request, res: Response) {
    try {
      const result = await service.create(req.body);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async findAll(req: Request, res: Response) {
    const result = await service.findAll();
    res.json(result);
  }

  async findById(req: Request, res: Response) {
    try {
      const result = await service.findById(Number(req.params.id));
      res.json(result);
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }

  async findBySubCategory(req: Request, res: Response) {
    const result = await service.findBySubCategoryId(Number(req.params.subCategoryId));
    res.json(result);
  }

  async update(req: Request, res: Response) {
    try {
      const result = await service.update(Number(req.params.id), req.body);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await service.delete(Number(req.params.id));
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  // ---------- ATTRIBUTE VALUES ----------

  async addValue(req: Request, res: Response) {
    try {
      const result = await service.addValue(req.body);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async getValues(req: Request, res: Response) {
    const result = await service.getValuesByAttribute(Number(req.params.attributeId));
    res.json(result);
  }

  async deleteValue(req: Request, res: Response) {
    try {
      const result = await service.deleteValue(Number(req.params.valueId));
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
}
