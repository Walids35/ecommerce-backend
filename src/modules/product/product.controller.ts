// product.controller.ts
import { Request, Response } from "express";
import { ProductService } from "./product.service";
import { CreateProductInput, updateProductDisplayOrderInput, UpdateProductInput } from "./dto/product.dto";
import { sendSuccess, sendCreated, sendPaginated } from "../../utils/response";
import { FilterProductsInput } from "./dto/filter.dto";

const service = new ProductService();

export class ProductController {
  async create(req: Request, res: Response) {
    const parsed = CreateProductInput.parse(req.body);
    const product = await service.create(parsed);
    sendCreated(res, product, "Product created successfully");
  }

  async findById(req: Request, res: Response) {
    const product = await service.findById(req.params.id);
    sendSuccess(res, product, "Product retrieved successfully");
  }

  async update(req: Request, res: Response) {
    const parsed = UpdateProductInput.parse(req.body);
    const updated = await service.update(req.params.id, parsed);
    sendSuccess(res, updated, "Product updated successfully");
  }

  async delete(req: Request, res: Response) {
    const deleted = await service.delete(req.params.id);
    sendSuccess(res, deleted, "Product deleted successfully");
  }

  async findAll(req: Request, res: Response) {
    const products = await service.findAll();
    sendSuccess(res, products, "Products retrieved successfully");
  }

  async findAllWithSearch(req: Request, res: Response) {
    const result = await service.findAllWithSearch({
      search: req.query.search as string,
      subCategoryId: req.query.subCategoryId ? Number(req.query.subCategoryId) : undefined,
      subSubCategoryId: req.query.subSubCategoryId ? Number(req.query.subSubCategoryId) : undefined,
      isActive: req.query.isActive ? req.query.isActive === 'true' : true,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
      sort: req.query.sort as string,
      sortBy: req.query.sortBy as string,
    });

    sendPaginated(
      res,
      result.data,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
      "Products retrieved successfully"
    );
  }

  async toggleActiveStatus(req: Request, res: Response) {
    const updatedProduct = await service.toggleActiveStatus(req.params.id);
    sendSuccess(res, updatedProduct, "Product status updated successfully");
  }

  async updateDisplayOrder(req: Request, res: Response) {
    const parsed = updateProductDisplayOrderInput.parse(req.body);
    const { displayOrder } = parsed;
    const updatedProduct = await service.updateProductDisplayOrder(req.params.id, displayOrder);
    sendSuccess(res, updatedProduct, "Product display order updated successfully");
  }

  async filterProducts(req: Request, res: Response) {
    const parsed = FilterProductsInput.parse(req.body);
    const result = await service.filterProducts(parsed);
    sendPaginated(
      res,
      result.data,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
      "Products retrieved successfully"
    );
  }
}
