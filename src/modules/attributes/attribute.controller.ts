import { Request, Response, NextFunction } from "express";
import { AttributeService } from "./attribute.service";
import { CreateAttributeSchema, UpdateAttributeSchema, CreateAttributeValueSchema } from "./dto/attribute.dto";

const service = new AttributeService();

export class AttributeController {
  // ==================== ATTRIBUTES ====================

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateAttributeSchema.parse(req.body);
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

  async getByParentId(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = Number(req.params.parentId);
      const parentType = req.query.type as "subcategory" | "subsubcategory";

      if (!parentType || (parentType !== "subcategory" && parentType !== "subsubcategory")) {
        return res.status(400).json({ error: "Query parameter 'type' must be 'subcategory' or 'subsubcategory'" });
      }

      const result = await service.findByParentId(parentId, parentType);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = UpdateAttributeSchema.parse(req.body);
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
      res.json({ message: "Attribute deleted successfully", data: result });
    } catch (error) {
      next(error);
    }
  }

  // ==================== ATTRIBUTE VALUES ====================

  async addValue(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateAttributeValueSchema.parse(req.body);
      const result = await service.addValue(data);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getValues(req: Request, res: Response, next: NextFunction) {
    try {
      const attributeId = Number(req.params.attributeId);
      const result = await service.getValuesByAttribute(attributeId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteValue(req: Request, res: Response, next: NextFunction) {
    try {
      const valueId = Number(req.params.valueId);
      const result = await service.deleteValue(valueId);
      res.json({ message: "Attribute value deleted successfully", data: result });
    } catch (error) {
      next(error);
    }
  }

  async getAttributesWithValuesByParent(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = Number(req.params.parentId);
      const parentType = req.query.type as "subcategory" | "subsubcategory";

      if (!parentType || (parentType !== "subcategory" && parentType !== "subsubcategory")) {
        return res.status(400).json({ error: "Query parameter 'type' must be 'subcategory' or 'subsubcategory'" });
      }

      const result = await service.getAttributesWithValuesByParent(parentId, parentType);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
