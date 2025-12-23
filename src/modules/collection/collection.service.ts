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
import { collectionTranslations } from "../../db/schema/translations/collection-translations";
import { productTranslations } from "../../db/schema/translations/product-translations";
import { subcategoryTranslations } from "../../db/schema/translations/subcategory-translations";
import { subsubcategoryTranslations } from "../../db/schema/translations/subsubcategory-translations";
import { NotFoundError, BadRequestError } from "../../utils/errors";
import { SupportedLanguage } from "../../middlewares/language";

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

    // Insert translations if provided
    if (data.translations) {
      const translationRecords = [];

      for (const [lang, trans] of Object.entries(data.translations)) {
        if (trans) {
          translationRecords.push({
            collectionId: created.id,
            language: lang,
            name: trans.name,
            description: trans.description,
            slug: trans.slug,
          });
        }
      }

      if (translationRecords.length > 0) {
        await db.insert(collectionTranslations).values(translationRecords);
      }
    }

    return created;
  }

  // ---------------------------
  // FIND ALL COLLECTIONS
  // ---------------------------
  async findAll(language: SupportedLanguage, filters?: {
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
          ilike(collectionTranslations.name, `%${filters.search}%`),
          ilike(collectionTranslations.description, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get collections with product count
    const results = await db
      .select({
        id: collections.id,
        name: collectionTranslations.name,
        description: collectionTranslations.description,
        slug: collectionTranslations.slug,
        image: collections.image,
        isActive: collections.isActive,
        displayOrder: collections.displayOrder,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        productCount: sql<number>`CAST(COUNT(${productCollections.id}) AS INTEGER)`,
      })
      .from(collections)
      .innerJoin(
        collectionTranslations,
        and(
          eq(collectionTranslations.collectionId, collections.id),
          eq(collectionTranslations.language, language)
        )
      )
      .leftJoin(productCollections, eq(collections.id, productCollections.collectionId))
      .where(whereClause)
      .groupBy(collections.id, collectionTranslations.id)
      .orderBy(asc(collections.displayOrder), asc(collectionTranslations.name))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(collections)
      .innerJoin(
        collectionTranslations,
        and(
          eq(collectionTranslations.collectionId, collections.id),
          eq(collectionTranslations.language, language)
        )
      )
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
  async findById(language: SupportedLanguage, id: number) {
    const [result] = await db
      .select({
        id: collections.id,
        name: collectionTranslations.name,
        description: collectionTranslations.description,
        slug: collectionTranslations.slug,
        image: collections.image,
        isActive: collections.isActive,
        displayOrder: collections.displayOrder,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        productCount: sql<number>`CAST(COUNT(${productCollections.id}) AS INTEGER)`,
      })
      .from(collections)
      .innerJoin(
        collectionTranslations,
        and(
          eq(collectionTranslations.collectionId, collections.id),
          eq(collectionTranslations.language, language)
        )
      )
      .leftJoin(productCollections, eq(collections.id, productCollections.collectionId))
      .where(eq(collections.id, id))
      .groupBy(collections.id, collectionTranslations.id);

    if (!result) {
      throw new NotFoundError("Collection not found");
    }

    // Fetch all translations for this collection
    const allTranslations = await db
      .select({
        language: collectionTranslations.language,
        name: collectionTranslations.name,
        description: collectionTranslations.description,
        slug: collectionTranslations.slug,
      })
      .from(collectionTranslations)
      .where(eq(collectionTranslations.collectionId, id));

    return {
      ...result,
      translations: allTranslations,
    };
  }

  // ---------------------------
  // FIND COLLECTION WITH PRODUCTS
  // ---------------------------
  async findByIdWithProducts(
    language: SupportedLanguage,
    id: number,
    filters?: {
      page?: number;
      limit?: number;
      sortBy?: "name" | "price" | "addedAt" | "displayOrder";
      sortOrder?: "asc" | "desc";
    }
  ) {
    // First, verify collection exists
    const collection = await this.findById(language, id);

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;
    const sortBy = filters?.sortBy ?? "displayOrder";
    const sortOrder = filters?.sortOrder ?? "asc";

    // Build sort order
    let orderByClause;
    switch (sortBy) {
      case "name":
        orderByClause = sortOrder === "asc" ? asc(productTranslations.name) : desc(productTranslations.name);
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
        name: productTranslations.name,
        description: productTranslations.description,
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
      .innerJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.language, language)
        )
      )
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
              subCategoryName: subcategoryTranslations.name,
              categoryId: subCategories.categoryId,
            })
            .from(subCategories)
            .innerJoin(
              subcategoryTranslations,
              and(
                eq(subcategoryTranslations.subcategoryId, subCategories.id),
                eq(subcategoryTranslations.language, language)
              )
            )
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
              subSubCategoryName: subsubcategoryTranslations.name,
              subCategoryId: subSubCategories.subCategoryId,
            })
            .from(subSubCategories)
            .innerJoin(
              subsubcategoryTranslations,
              and(
                eq(subsubcategoryTranslations.subsubcategoryId, subSubCategories.id),
                eq(subsubcategoryTranslations.language, language)
              )
            )
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
    await this.findById('en', id);

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

    // Separate translations from base data
    const { translations, ...baseData } = data;

    // Build base table payload
    const basePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (baseData.name !== undefined) basePayload.name = baseData.name;
    if (baseData.description !== undefined) basePayload.description = baseData.description;
    if (baseData.slug !== undefined) basePayload.slug = baseData.slug;
    if (baseData.image !== undefined) basePayload.image = baseData.image;
    if (baseData.isActive !== undefined) basePayload.isActive = baseData.isActive;
    if (baseData.displayOrder !== undefined) basePayload.displayOrder = baseData.displayOrder;

    // Update base table
    const [updated] = await db
      .update(collections)
      .set(basePayload)
      .where(eq(collections.id, id))
      .returning();

    // Upsert translations if provided
    if (translations) {
      for (const [lang, trans] of Object.entries(translations)) {
        if (trans) {
          const existing = await db
            .select()
            .from(collectionTranslations)
            .where(
              and(
                eq(collectionTranslations.collectionId, id),
                eq(collectionTranslations.language, lang)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            // Update existing translation
            await db
              .update(collectionTranslations)
              .set({
                name: trans.name,
                description: trans.description,
                slug: trans.slug,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(collectionTranslations.collectionId, id),
                  eq(collectionTranslations.language, lang)
                )
              );
          } else {
            // Insert new translation
            await db.insert(collectionTranslations).values({
              collectionId: id,
              language: lang,
              name: trans.name,
              description: trans.description,
              slug: trans.slug,
            });
          }
        }
      }
    }

    return updated;
  }

  // ---------------------------
  // DELETE COLLECTION (SOFT DELETE)
  // ---------------------------
  async delete(id: number) {
    // Check if collection exists
    await this.findById('en', id);

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
    await this.findById('en', collectionId);

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
    await this.findById('en', collectionId);

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
    const collection = await this.findById('en', collectionId); 
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
    language: SupportedLanguage,
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
    await this.findById('en', collectionId);

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
        ilike(productTranslations.name, `%${filters.search}%`),
        ilike(productTranslations.description, `%${filters.search}%`)
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
        orderByClause = sortOrder === "asc" ? asc(productTranslations.name) : desc(productTranslations.name);
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
        name: productTranslations.name,
        description: productTranslations.description,
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
      .innerJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.language, language)
        )
      )
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(productCollections)
      .innerJoin(products, eq(productCollections.productId, products.id))
      .innerJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.language, language)
        )
      )
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
