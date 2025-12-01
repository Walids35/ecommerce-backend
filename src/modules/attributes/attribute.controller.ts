import { Request, Response, NextFunction } from "express";
import { AttributeService } from "./attribute.service";
import { CreateAttributeSchema, UpdateAttributeSchema, CreateAttributeValueSchema } from "./dto/attribute.dto";
import { sendCreated, sendError, sendSuccess } from "../../utils/response";

const service = new AttributeService();

export class AttributeController {
  // ==================== ATTRIBUTES ====================

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateAttributeSchema.parse(req.body);
      const result = await service.create(data);
      sendCreated(res, result, "Attribute created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.findAll();
      sendSuccess(res, result, "Attributes retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await service.findById(id);
      sendSuccess(res, result, "Attribute retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getByParentId(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = Number(req.params.parentId);
      const parentType = req.query.type as "subcategory" | "subsubcategory";

      if (!parentType || (parentType !== "subcategory" && parentType !== "subsubcategory")) {
        return sendError(res, "Query parameter 'type' must be 'subcategory' or 'subsubcategory'", 400);
      }

      const result = await service.findByParentId(parentId, parentType);
      sendSuccess(res, result, "Attributes retrieved successfully");
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
      sendSuccess(res, result, "Attribute deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  // ==================== ATTRIBUTE VALUES ====================

  async addValue(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateAttributeValueSchema.parse(req.body);
      const result = await service.addValue(data);
      sendCreated(res, result, "Attribute value added successfully");
    } catch (error) {
      next(error);
    }
  }

  async getValues(req: Request, res: Response, next: NextFunction) {
    try {
      const attributeId = Number(req.params.attributeId);
      const result = await service.getValuesByAttribute(attributeId);
      sendSuccess(res, result, "Attribute values retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteValue(req: Request, res: Response, next: NextFunction) {
    try {
      const valueId = Number(req.params.valueId);
      const result = await service.deleteValue(valueId);
      sendSuccess(res, result, "Attribute value deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async getAttributesWithValuesByParent(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = Number(req.params.parentId);
      const parentType = req.query.type as "subcategory" | "subsubcategory";

      if (!parentType || (parentType !== "subcategory" && parentType !== "subsubcategory")) {
        return sendError(res, "Query parameter 'type' must be 'subcategory' or 'subsubcategory'", 400);
      }

      const result = await service.getAttributesWithValuesByParent(parentId, parentType);
      sendSuccess(res, result, "Attributes with values retrieved successfully");
    } catch (error) {
      next(error);
    }
  }
}
