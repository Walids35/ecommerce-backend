import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import {
  CreateCollectionInput,
  UpdateCollectionInput,
  AddProductsToCollectionInput,
  RemoveProductsFromCollectionInput,
} from "./dto/collection.dto";
import { db } from "../../db/data-source";
import { collections, productCollections } from "../../db/schema/collections";
import { products } from "../../db/schema/product";
import { subCategories } from "../../db/schema/subcategories";
import { subSubCategories } from "../../db/schema/subsubcategories";
import { NotFoundError, BadRequestError } from "../../utils/errors";

export class CollectionService {
  // ---------------------------
  // CREATE COLLECTION
  // ---------------------------
  async create(data: CreateCollectionInput) {
    // Check if slug already exists
    const existingSlug = await db
      .select()
      .from(collections)
      .where(eq(collections.slug, data.slug))
      .limit(1);

    if (existingSlug.length) {
      throw new BadRequestError("A collection with this slug already exists");
    }

    // Insert new collection
    const [created] = await db
      .insert(collections)
      .values({
        name: data.name,
        description: data.description,
        slug: data.slug,
        image: data.image,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
      })
      .returning();

    return created;
  }

  // ---------------------------
  // FIND ALL COLLECTIONS
  // ---------------------------
  async findAll(filters?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (filters?.isActive !== undefined) {
      conditions.push(eq(collections.isActive, filters.isActive));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(collections.name, `%${filters.search}%`),
          ilike(collections.description, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get collections with product count
    const results = await db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        slug: collections.slug,
        image: collections.image,
        isActive: collections.isActive,
        displayOrder: collections.displayOrder,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        productCount: sql<number>`CAST(COUNT(${productCollections.id}) AS INTEGER)`,
      })
      .from(collections)
      .leftJoin(productCollections, eq(collections.id, productCollections.collectionId))
      .where(whereClause)
      .groupBy(collections.id)
      .orderBy(asc(collections.displayOrder), asc(collections.name))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(collections)
      .where(whereClause);

    return {
      page,
      limit,
      total: Number(totalResult.count),
      data: results,
    };
  }

  // ---------------------------
  // FIND COLLECTION BY ID
  // ---------------------------
  async findById(id: number) {
    const [result] = await db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        slug: collections.slug,
        image: collections.image,
        isActive: collections.isActive,
        displayOrder: collections.displayOrder,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        productCount: sql<number>`CAST(COUNT(${productCollections.id}) AS INTEGER)`,
      })
      .from(collections)
      .leftJoin(productCollections, eq(collections.id, productCollections.collectionId))
      .where(eq(collections.id, id))
      .groupBy(collections.id);

    if (!result) {
      throw new NotFoundError("Collection not found");
    }

    return result;
  }

  // ---------------------------
  // FIND COLLECTION WITH PRODUCTS
  // ---------------------------
  async findByIdWithProducts(
    id: number,
    filters?: {
      page?: number;
      limit?: number;
      sortBy?: "name" | "price" | "addedAt" | "displayOrder";
      sortOrder?: "asc" | "desc";
    }
  ) {
    // First, verify collection exists
    const collection = await this.findById(id);

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;
    const sortBy = filters?.sortBy ?? "displayOrder";
    const sortOrder = filters?.sortOrder ?? "asc";

    // Build sort order
    let orderByClause;
    switch (sortBy) {
      case "name":
        orderByClause = sortOrder === "asc" ? asc(products.name) : desc(products.name);
        break;
      case "price":
        orderByClause = sortOrder === "asc" ? asc(products.price) : desc(products.price);
        break;
      case "addedAt":
        orderByClause = sortOrder === "asc" ? asc(productCollections.addedAt) : desc(productCollections.addedAt);
        break;
      case "displayOrder":
      default:
        orderByClause = sortOrder === "asc" ? asc(productCollections.displayOrder) : desc(productCollections.displayOrder);
        break;
    }

    // Get products in collection
    const productResults = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        stock: products.stock,
        discountPercentage: products.discountPercentage,
        images: products.images,
        isActive: products.isActive,
        addedAt: productCollections.addedAt,
        displayOrder: productCollections.displayOrder,
        subCategoryId: products.subCategoryId,
        subSubCategoryId: products.subSubCategoryId,
      })
      .from(productCollections)
      .innerJoin(products, eq(productCollections.productId, products.id))
      .where(eq(productCollections.collectionId, id))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Get category names for each product
    const productsWithCategories = await Promise.all(
      productResults.map(async (product) => {
        let categoryInfo = null;

        if (product.subCategoryId) {
          const [subCat] = await db
            .select({
              subCategoryName: subCategories.name,
              categoryId: subCategories.categoryId,
            })
            .from(subCategories)
            .where(eq(subCategories.id, product.subCategoryId))
            .limit(1);

          if (subCat) {
            categoryInfo = {
              subcategoryName: subCat.subCategoryName,
            };
          }
        } else if (product.subSubCategoryId) {
          const [subSubCat] = await db
            .select({
              subSubCategoryName: subSubCategories.name,
              subCategoryId: subSubCategories.subCategoryId,
            })
            .from(subSubCategories)
            .where(eq(subSubCategories.id, product.subSubCategoryId))
            .limit(1);

          if (subSubCat) {
            categoryInfo = {
              subsubcategoryName: subSubCat.subSubCategoryName,
            };
          }
        }

        return {
          ...product,
          originalCategory: categoryInfo,
        };
      })
    );

    // Get total product count in this collection
    const [totalResult] = await db
      .select({ count: count() })
      .from(productCollections)
      .where(eq(productCollections.collectionId, id));

    return {
      collection,
      products: productsWithCategories,
      pagination: {
        total: totalResult.count,
        page,
        limit,
        totalPages: Math.ceil(totalResult.count / limit),
      },
    };
  }

  // ---------------------------
  // UPDATE COLLECTION
  // ---------------------------
  async update(id: number, data: UpdateCollectionInput) {
    // Check if collection exists
    await this.findById(id);

    // If updating slug, check it's not taken
    if (data.slug) {
      const existingSlug = await db
        .select()
        .from(collections)
        .where(and(eq(collections.slug, data.slug), sql`${collections.id} != ${id}`))
        .limit(1);

      if (existingSlug.length) {
        throw new BadRequestError("A collection with this slug already exists");
      }
    }

    // Update collection
    const [updated] = await db
      .update(collections)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(collections.id, id))
      .returning();

    return updated;
  }

  // ---------------------------
  // DELETE COLLECTION (SOFT DELETE)
  // ---------------------------
  async delete(id: number) {
    // Check if collection exists
    await this.findById(id);

    // Soft delete
    await db
      .update(collections)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(collections.id, id));

    return { message: "Collection deleted successfully" };
  }

  // ---------------------------
  // ADD PRODUCTS TO COLLECTION
  // ---------------------------
  async addProducts(collectionId: number, data: AddProductsToCollectionInput) {
    // Check if collection exists
    await this.findById(collectionId);

    // Validate all products exist
    const productList = await db
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.id, data.productIds));

    if (productList.length !== data.productIds.length) {
      throw new NotFoundError("One or more products not found");
    }

    // Insert into junction table (ON CONFLICT DO NOTHING to prevent duplicates)
    const values = data.productIds.map((productId) => ({
      productId,
      collectionId,
      displayOrder: 0,
    }));

    await db
      .insert(productCollections)
      .values(values)
      .onConflictDoNothing();

    return { message: `Products added to collection successfully` };
  }

  // ---------------------------
  // REMOVE PRODUCTS FROM COLLECTION
  // ---------------------------
  async removeProducts(collectionId: number, data: RemoveProductsFromCollectionInput) {
    // Check if collection exists
    await this.findById(collectionId);

    // Delete from junction table
    await db
      .delete(productCollections)
      .where(
        and(
          eq(productCollections.collectionId, collectionId),
          inArray(productCollections.productId, data.productIds)
        )
      );

    return { message: "Products removed from collection successfully" };
  }

  async toggleActiveStatus(collectionId: number) {
    // Check if collection exists
    const collection = await this.findById(collectionId); 
    // Toggle isActive status
    const newStatus = !collection.isActive;

    // Update collection with new status
    const [updated] = await db
      .update(collections)
      .set({
        isActive: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(collections.id, collectionId))
      .returning();

    return updated;
  }

  // ---------------------------
  // GET PRODUCTS BY COLLECTION
  // ---------------------------
  async getProductsByCollection(
    collectionId: number,
    filters?: {
      page?: number;
      limit?: number;
      minPrice?: string;
      maxPrice?: string;
      search?: string;
      isActive?: boolean;
      sortBy?: "name" | "price" | "addedAt" | "displayOrder";
      sortOrder?: "asc" | "desc";
    }
  ) {
    // Check if collection exists
    await this.findById(collectionId);

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(productCollections.collectionId, collectionId)];

    if (filters?.isActive !== undefined) {
      conditions.push(eq(products.isActive, filters.isActive));
    }
    if (filters?.search) {
      const searchCondition = or(
        ilike(products.name, `%${filters.search}%`),
        ilike(products.description, `%${filters.search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }
    if (filters?.minPrice) {
      conditions.push(sql`${products.price} >= ${filters.minPrice}`);
    }
    if (filters?.maxPrice) {
      conditions.push(sql`${products.price} <= ${filters.maxPrice}`);
    }

    const whereClause = and(...conditions);

    // Build sort order
    const sortBy = filters?.sortBy ?? "displayOrder";
    const sortOrder = filters?.sortOrder ?? "asc";
    let orderByClause;
    switch (sortBy) {
      case "name":
        orderByClause = sortOrder === "asc" ? asc(products.name) : desc(products.name);
        break;
      case "price":
        orderByClause = sortOrder === "asc" ? asc(products.price) : desc(products.price);
        break;
      case "addedAt":
        orderByClause = sortOrder === "asc" ? asc(productCollections.addedAt) : desc(productCollections.addedAt);
        break;
      case "displayOrder":
      default:
        orderByClause = sortOrder === "asc" ? asc(productCollections.displayOrder) : desc(productCollections.displayOrder);
        break;
    }

    // Get products
    const productResults = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        stock: products.stock,
        discountPercentage: products.discountPercentage,
        images: products.images,
        isActive: products.isActive,
        addedAt: productCollections.addedAt,
        displayOrder: productCollections.displayOrder,
      })
      .from(productCollections)
      .innerJoin(products, eq(productCollections.productId, products.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(productCollections)
      .innerJoin(products, eq(productCollections.productId, products.id))
      .where(whereClause);

    return {
      products: productResults,
      pagination: {
        total: totalResult.count,
        page,
        limit,
        totalPages: Math.ceil(totalResult.count / limit),
      },
    };
  }
}
