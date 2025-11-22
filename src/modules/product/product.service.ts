import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import {
  CreateProductInputType,
  UpdateProductInputType,
} from "./dto/product.dto";
import { db } from "../../db/data-source";
import { subCategories, subCategoryAttributes, subCategoryAttributeValues } from "../../db/schema/subcategories";
import { productAttributeValues, products } from "../../db/schema/product";

export class ProductService {
  // ---------------------------
  // CREATE PRODUCT
  // ---------------------------
  async create(data: CreateProductInputType) {
    const subcategory = await db
      .select()
      .from(subCategories)
      .where(eq(subCategories.id, data.subCategoryId));

    if (!subcategory.length) throw new Error("Subcategory not found");

    // Insert base product
    const [created] = await db
      .insert(products)
      .values({
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        discountPercentage: data.discountPercentage ?? "0",
        subCategoryId: data.subCategoryId,
        images: data.images,
        datasheet: data.datasheet,
      })
      .returning();

    // Insert attribute values
    if (data.attributes?.length) {
      for (const attr of data.attributes) {
        // Validate the attribute
        const attributeCheck = await db
          .select()
          .from(subCategoryAttributes)
          .where(
            and(
              eq(subCategoryAttributes.id, attr.attributeId),
              eq(subCategoryAttributes.subCategoryId, data.subCategoryId)
            )
          );

        if (!attributeCheck.length)
          throw new Error(
            `Attribute ${attr.attributeId} does not belong to this subcategory`
          );

        // Validate the provided value
        const valueCheck = await db
          .select()
          .from(subCategoryAttributeValues)
          .where(
            and(
              eq(
                subCategoryAttributeValues.id,
                attr.attributeValueId
              ),
              eq(
                subCategoryAttributeValues.attributeId,
                attr.attributeId
              )
            )
          );

        if (!valueCheck.length)
          throw new Error(
            `Attribute value ${attr.attributeValueId} is invalid for attribute ${attr.attributeId}`
          );

        await db.insert(productAttributeValues).values({
          productId: created.id,
          attributeId: attr.attributeId,
          attributeValueId: attr.attributeValueId,
        });
      }
    }

    return created;
  }

  // ---------------------------
  // FIND ALL
  // ---------------------------
  async findAll() {
    return await db.select().from(products);
  }

  async findAllWithSearch(query: {
    search?: string;
    subCategoryId?: number;
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    const {
      search,
      subCategoryId,
      page = 1,
      limit = 10,
      sort = "newest",
    } = query;

    const offset = (page - 1) * limit;

    let whereClause: any[] = [];

    if (search) {
      whereClause.push(
        ilike(products.name, `%${search}%`)
      );
    }

    if (subCategoryId) {
      whereClause.push(eq(products.subCategoryId, subCategoryId));
    }

    const orderBy =
      sort === "price_asc"
        ? asc(products.price)
        : sort === "price_desc"
        ? desc(products.price)
        : desc(products.createdAt); // newest

    const rows = await db
      .select()
      .from(products)
      .where(whereClause.length ? and(...whereClause) : undefined)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Fetch attribute values for all product IDs
    const ids = rows.map((p) => p.id);

    const attributeRows = await db
      .select({
        productId: productAttributeValues.productId,
        attributeId: subCategoryAttributes.id,
        attributeName: subCategoryAttributes.name,
        valueId: subCategoryAttributeValues.id,
        value: subCategoryAttributeValues.value,
      })
      .from(productAttributeValues)
      .innerJoin(
        subCategoryAttributes,
        eq(productAttributeValues.attributeId, subCategoryAttributes.id)
      )
      .innerJoin(
        subCategoryAttributeValues,
        eq(
          productAttributeValues.attributeValueId,
          subCategoryAttributeValues.id
        )
      )
      .where(sql`${productAttributeValues.productId} = ANY(${ids})`);

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

    // Attach attributes to each product
    const final = rows.map((p) => ({
      ...p,
      attributes: groupedAttributes[p.id] ?? [],
    }));

    // Compute total count
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(products);

    return {
      page,
      limit,
      total: Number(count),
      data: final,
    };
  }

  // ---------------------------
  // FIND BY ID
  // ---------------------------
  async findById(id: string) {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!rows.length) throw new Error("Product not found");

    return rows[0];
  }

  // ---------------------------
  // UPDATE PRODUCT
  // ---------------------------
  async update(id: string, data: UpdateProductInputType) {
    await this.findById(id); // ensure product exists

    const payload: Record<string, any> = {};

    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.price !== undefined) payload.price = data.price;
    if (data.stock !== undefined) payload.stock = data.stock;
    if (data.discountPercentage !== undefined)
      payload.discountPercentage = data.discountPercentage;
    if (data.images !== undefined) payload.images = data.images;
    if (data.datasheet !== undefined) payload.datasheet = data.datasheet;

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

      for (const attr of data.attributes) {
        await db.insert(productAttributeValues).values({
          productId: id,
          attributeId: attr.attributeId,
          attributeValueId: attr.attributeValueId,
        });
      }
    }

    return updated;
  }

  // ---------------------------
  // DELETE
  // ---------------------------
  async delete(id: string) {
    await this.findById(id);

    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    return deleted;
  }
}
