import { Request, Response } from "express";
import { CollectionService } from "./collection.service";
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  AddProductsToCollectionDto,
  RemoveProductsFromCollectionDto,
} from "./dto/collection.dto";
import { sendSuccess, sendCreated, sendPaginated } from "../../utils/response";

const service = new CollectionService();

export class CollectionController {
  // Create a new collection
  async createCollection(req: Request, res: Response) {
    const parsed = CreateCollectionDto.parse(req.body);
    const collection = await service.create(parsed);
    sendCreated(res, collection, "Collection created successfully");
  }

  // Get all collections
  async getAllCollections(req: Request, res: Response) {
    const result = await service.findAll({
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
      search: req.query.search as string,
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

  // Get collection by ID
  async getCollectionById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const collection = await service.findById(id);
    sendSuccess(res, collection, "Collection retrieved successfully");
  }

  // Get collection with its products
  async getCollectionWithProducts(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await service.findByIdWithProducts(id, {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      sortBy: req.query.sortBy as "name" | "price" | "addedAt" | "displayOrder",
      sortOrder: req.query.sortOrder as "asc" | "desc",
    });

    sendSuccess(res, result, "Collection with products retrieved successfully");
  }

  // Update collection
  async updateCollection(req: Request, res: Response) {
    const id = Number(req.params.id);
    const parsed = UpdateCollectionDto.parse(req.body);
    const updated = await service.update(id, parsed);
    sendSuccess(res, updated, "Collection updated successfully");
  }

  // Delete collection (soft delete)
  async deleteCollection(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await service.delete(id);
    sendSuccess(res, result, "Collection deleted successfully");
  }

  // Add products to collection
  async addProductsToCollection(req: Request, res: Response) {
    const id = Number(req.params.id);
    const parsed = AddProductsToCollectionDto.parse(req.body);
    const result = await service.addProducts(id, parsed);
    sendSuccess(res, result, "Products added to collection successfully");
  }

  // Remove products from collection
  async removeProductsFromCollection(req: Request, res: Response) {
    const id = Number(req.params.id);
    const parsed = RemoveProductsFromCollectionDto.parse(req.body);
    const result = await service.removeProducts(id, parsed);
    sendSuccess(res, result, "Products removed from collection successfully");
  }

  // Get products by collection with filters
  async getProductsByCollection(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await service.getProductsByCollection(id, {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      minPrice: req.query.minPrice as string,
      maxPrice: req.query.maxPrice as string,
      search: req.query.search as string,
      isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
      sortBy: req.query.sortBy as "name" | "price" | "addedAt" | "displayOrder",
      sortOrder: req.query.sortOrder as "asc" | "desc",
    });

    sendSuccess(res, result, "Products retrieved successfully");
  }

  async toggleActiveStatus(req: Request, res: Response) {
    const id = Number(req.params.id);
    const updated = await service.toggleActiveStatus(id);
    sendSuccess(res, updated, "Collection status updated successfully");
  }
}
