// product.controller.ts
import { Request, Response } from "express";
import { ProductService } from "./product.service";
import { CreateProductInput, UpdateProductInput } from "./dto/product.dto";

const service = new ProductService();

export class ProductController {
  async create(req: Request, res: Response) {
    const parsed = CreateProductInput.parse(req.body);
    const product = await service.create(parsed);
    res.json(product);
  }

  async findById(req: Request, res: Response) {
    const product = await service.findById(req.params.id);
    res.json(product);
  }

  async update(req: Request, res: Response) {
    const parsed = UpdateProductInput.parse(req.body);
    const updated = await service.update(req.params.id, parsed);
    res.json(updated);
  }

  async delete(req: Request, res: Response) {
    const deleted = await service.delete(req.params.id);
    res.json(deleted);
  }

  async findAll(req: Request, res: Response) {
    const products = await service.findAll();
    res.json(products);
  }

  async findAllWithSearch(req: Request, res: Response) {
    const products = await service.findAllWithSearch({
      search: req.query.search as string,
      subCategoryId: req.query.subCategoryId ? Number(req.query.subCategoryId) : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
      sort: req.query.sort as string,
    });

    res.json(products);
  }
}
