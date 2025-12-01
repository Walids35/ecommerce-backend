import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import {
  CreateProductInputType,
  UpdateProductInputType,
} from "./dto/product.dto";
import { db } from "../../db/data-source";
import { subCategories, attributes, attributeValues } from "../../db/schema/subcategories";
import { subSubCategories } from "../../db/schema/subsubcategories";
import { productAttributeValues, products } from "../../db/schema/product";
import { NotFoundError, BadRequestError } from "../../utils/errors";

export class ProductService {
  // ---------------------------
  // CREATE PRODUCT
  // ---------------------------
  async create(data: CreateProductInputType) {
    // Validate category exists
    if (data.subCategoryId) {
      const subcategory = await db
        .select()
        .from(subCategories)
        .where(eq(subCategories.id, data.subCategoryId))
        .limit(1);

      if (!subcategory.length) throw new NotFoundError("Subcategory not found");
    } else if (data.subSubCategoryId) {
      const subsubcategory = await db
        .select()
        .from(subSubCategories)
        .where(eq(subSubCategories.id, data.subSubCategoryId))
        .limit(1);

      if (!subsubcategory.length) throw new NotFoundError("Subsubcategory not found");
    } else {
      throw new BadRequestError("Either subCategoryId or subSubCategoryId must be provided");
    }

    // Insert base product
    const [created] = await db
      .insert(products)
      .values({
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        discountPercentage: data.discountPercentage ?? "0",
        subCategoryId: data.subCategoryId ?? null,
        subSubCategoryId: data.subSubCategoryId ?? null,
        images: data.images,
        datasheet: data.datasheet,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
      })
      .returning();

    // Insert attribute values
    if (data.attributes?.length) {
      await this.validateAndInsertAttributes(
        created.id,
        data.attributes,
        data.subCategoryId,
        data.subSubCategoryId
      );
    }

    return created;
  }

  // Helper: Validate attributes belong to correct parent
  private async validateAndInsertAttributes(
    productId: string,
    attrs: Array<{ attributeId: number; attributeValueId: number }>,
    subCategoryId?: number,
    subSubCategoryId?: number
  ) {
    for (const attr of attrs) {
      // Fetch attribute to check ownership
      const attributeCheck = await db
        .select()
        .from(attributes)
        .where(eq(attributes.id, attr.attributeId))
        .limit(1);

      if (!attributeCheck.length) {
        throw new NotFoundError(`Attribute ${attr.attributeId} not found`);
      }

      const attribute = attributeCheck[0];

      // Validate attribute belongs to correct parent
      if (subCategoryId && attribute.subCategoryId !== subCategoryId) {
        throw new BadRequestError(
          `Attribute ${attr.attributeId} does not belong to subcategory ${subCategoryId}`
        );
      }

      if (subSubCategoryId && attribute.subSubCategoryId !== subSubCategoryId) {
        throw new BadRequestError(
          `Attribute ${attr.attributeId} does not belong to subsubcategory ${subSubCategoryId}`
        );
      }

      // Validate the provided value
      const valueCheck = await db
        .select()
        .from(attributeValues)
        .where(
          and(
            eq(attributeValues.id, attr.attributeValueId),
            eq(attributeValues.attributeId, attr.attributeId)
          )
        )
        .limit(1);

      if (!valueCheck.length) {
        throw new BadRequestError(
          `Attribute value ${attr.attributeValueId} is invalid for attribute ${attr.attributeId}`
        );
      }

      await db.insert(productAttributeValues).values({
        productId: productId,
        attributeId: attr.attributeId,
        attributeValueId: attr.attributeValueId,
      });
    }
  }

  // ---------------------------
  // FIND ALL WITH SEARCH
  // ---------------------------
  async findAllWithSearch(query: {
    search?: string;
    subCategoryId?: number;
    subSubCategoryId?: number;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
    sortBy?: string;
  }) {
    const {
      search,
      subCategoryId,
      subSubCategoryId,
      isActive,
      page = 1,
      limit = 10,
      sort = "newest",
      sortBy,
    } = query;

    const offset = (page - 1) * limit;

    let whereClause: any[] = [];

    if (search) {
      whereClause.push(
        or(
          ilike(products.name, `%${search}%`),
          sql`${products.id}::text ILIKE ${'%' + search + '%'}`
        )
      );
    }

    if (subCategoryId) {
      whereClause.push(eq(products.subCategoryId, subCategoryId));
    }

    if (subSubCategoryId) {
      whereClause.push(eq(products.subSubCategoryId, subSubCategoryId));
    }

    // Filter by isActive (defaults to true for backward compatibility)
    const activeFilter = isActive ?? true;
    whereClause.push(eq(products.isActive, activeFilter));

    // Dynamic sorting with sortBy parameter
    let orderBy;
    if (sortBy) {
      const direction = sort === "asc" ? asc : desc;
      switch (sortBy) {
        case "name":
          orderBy = direction(products.name);
          break;
        case "price":
          orderBy = direction(products.price);
          break;
        case "stock":
          orderBy = direction(products.stock);
          break;
        case "discountPercentage":
          orderBy = direction(products.discountPercentage);
          break;
        case "createdAt":
          orderBy = direction(products.createdAt);
          break;
        case "updatedAt":
          orderBy = direction(products.updatedAt);
          break;
        case "displayOrder":
          orderBy = direction(products.displayOrder);
          break;
        default:
          orderBy = [asc(products.displayOrder), desc(products.createdAt)];
      }
    } else {
      // Legacy sort parameter support
      orderBy =
        sort === "price_asc"
          ? asc(products.price)
          : sort === "price_desc"
          ? desc(products.price)
          : [asc(products.displayOrder), desc(products.createdAt)];
    }

    const baseQuery = db
      .select()
      .from(products)
      .where(whereClause.length ? and(...whereClause) : undefined);

    // Apply ordering
    const orderedQuery = Array.isArray(orderBy)
      ? baseQuery.orderBy(...orderBy)
      : baseQuery.orderBy(orderBy);

    const rows = await orderedQuery
      .limit(limit)
      .offset(offset);

    // Fetch attribute values for all product IDs
    const ids = rows.map((p) => p.id);

    let attributeRows: any[] = [];
    if (ids.length > 0) {
      attributeRows = await db
        .select({
          productId: productAttributeValues.productId,
          attributeId: attributes.id,
          attributeName: attributes.name,
          valueId: attributeValues.id,
          value: attributeValues.value,
        })
        .from(productAttributeValues)
        .innerJoin(
          attributes,
          eq(productAttributeValues.attributeId, attributes.id)
        )
        .innerJoin(
          attributeValues,
          eq(productAttributeValues.attributeValueId, attributeValues.id)
        )
        .where(inArray(productAttributeValues.productId, ids));
    }

    const groupedAttributes = attributeRows.reduce((acc, row) => {
      if (!acc[row.productId]) acc[row.productId] = [];
      acc[row.productId].push({
        attributeId: row.attributeId,
        attributeName: row.attributeName,
        valueId: row.valueId,
        value: row.value,
      });
      return acc;
    }, {} as Record<string, any[]>);

    const final = rows.map((p) => ({
      ...p,
      attributes: groupedAttributes[p.id] ?? [],
    }));

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(products)
      .where(whereClause.length ? and(...whereClause) : undefined);

    return {
      page,
      limit,
      total: Number(count),
      data: final,
    };
  }

  async findAll() {
    const rows = await db.select().from(products).orderBy(asc(products.displayOrder), desc(products.createdAt));
    return rows;
  }

  // ---------------------------
  // FIND BY ID
  // ---------------------------
  async findById(id: string) {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!rows.length) throw new NotFoundError("Product not found");

    const product = rows[0];

    const attributeRows = await db
      .select({
        attributeId: attributes.id,
        attributeName: attributes.name,
        valueId: attributeValues.id,
        value: attributeValues.value,
      })
      .from(productAttributeValues)
      .innerJoin(
        attributes,
        eq(productAttributeValues.attributeId, attributes.id)
      )
      .innerJoin(
        attributeValues,
        eq(productAttributeValues.attributeValueId, attributeValues.id)
      )
      .where(eq(productAttributeValues.productId, id));

    return {
      ...product,
      attributes: attributeRows.map((row) => ({
        attributeId: row.attributeId,
        attributeName: row.attributeName,
        attributeValueId: row.valueId,
        value: row.value,
      })),
    };
  }

  // ---------------------------
  // UPDATE PRODUCT
  // ---------------------------
  async update(id: string, data: UpdateProductInputType) {
    const existing = await this.findById(id);

    const payload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.price !== undefined) payload.price = data.price;
    if (data.stock !== undefined) payload.stock = data.stock;
    if (data.discountPercentage !== undefined)
      payload.discountPercentage = data.discountPercentage;
    if (data.images !== undefined) payload.images = data.images;
    if (data.datasheet !== undefined) payload.datasheet = data.datasheet;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.displayOrder !== undefined) payload.displayOrder = data.displayOrder;

    const [updated] = await db
      .update(products)
      .set(payload)
      .where(eq(products.id, id))
      .returning();

    // If attributes provided → replace all
    if (data.attributes) {
      await db
        .delete(productAttributeValues)
        .where(eq(productAttributeValues.productId, id));

      await this.validateAndInsertAttributes(
        id,
        data.attributes,
        existing.subCategoryId ?? undefined,
        existing.subSubCategoryId ?? undefined
      );
    }

    return updated;
  }

  async toggleActiveStatus(id: string) {
    const existing = await this.findById(id);

    const [updated] = await db
      .update(products)
      .set({
        isActive: !existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return updated;
  }

  // ---------------------------
  // DELETE (Soft Delete)
  // ---------------------------
  async delete(id: string) {
    await this.findById(id);

    const [deleted] = await db
      .update(products)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return deleted;
  }
}
