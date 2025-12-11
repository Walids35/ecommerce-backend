import { Request, Response } from "express";
import { BrandService } from "./brand.service";
import { createBrandDto, updateBrandDto } from "./dto/brand.dto";
import { sendSuccess, sendCreated } from "../../utils/response";

const service = new BrandService();

export class BrandController {
  async getAll(req: Request, res: Response) {
    const brands = await service.getAll();
    sendSuccess(res, brands, "Brands retrieved successfully");
  }

  async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const brand = await service.getById(id);
    sendSuccess(res, brand, "Brand retrieved successfully");
  }

  async create(req: Request, res: Response) {
    const parsed = createBrandDto.parse(req.body);
    const created = await service.create(parsed);
    sendCreated(res, created, "Brand created successfully");
  }

  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const parsed = updateBrandDto.parse(req.body);
    const updated = await service.update(id, parsed);
    sendSuccess(res, updated, "Brand updated successfully");
  }

  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await service.delete(id);
    sendSuccess(res, result, result.message);
  }
}
