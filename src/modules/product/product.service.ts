import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import {
  CreateProductInputType,
  UpdateProductInputType,
} from "./dto/product.dto";
import { FilterProductsInputType } from "./dto/filter.dto";
import { db } from "../../db/data-source";
import {
  subCategories,
  attributes,
  attributeValues,
} from "../../db/schema/subcategories";
import { subSubCategories } from "../../db/schema/subsubcategories";
import { productAttributeValues, products } from "../../db/schema/product";
import { brands } from "../../db/schema/brands";
import { productTranslations } from "../../db/schema/translations/product-translations";
import { attributeTranslations } from "../../db/schema/translations/attribute-translations";
import { attributeValueTranslations } from "../../db/schema/translations/attribute-value-translations";
import { SupportedLanguage } from "../../middlewares/language";
import { NotFoundError, BadRequestError, ConflictError } from "../../utils/errors";
import sanitizeHtml from "sanitize-html";

export class ProductService {
  // ---------------------------
  // HTML SANITIZATION HELPER
  // ---------------------------
  private sanitizeHtmlContent(html: string | undefined): string | undefined {
    if (!html) return html;
    return sanitizeHtml(html, {
      allowedTags: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'br', 'span', 'div'],
      allowedAttributes: { 'a': ['href', 'target'] },
    });
  }

  // ---------------------------
  // CREATE PRODUCT
  // ---------------------------
  async create(data: CreateProductInputType) {
    // Validate at least one category is provided
    if (!data.subCategoryId && !data.subSubCategoryId) {
      throw new BadRequestError(
        "At least one of subCategoryId or subSubCategoryId must be provided"
      );
    }

    // Validate subcategory if provided
    if (data.subCategoryId) {
      const subcategory = await db
        .select()
        .from(subCategories)
        .where(eq(subCategories.id, data.subCategoryId))
        .limit(1);

      if (!subcategory.length) {
        throw new NotFoundError("Subcategory not found");
      }
    }

    // Validate subsubcategory if provided
    if (data.subSubCategoryId) {
      const subsubcategory = await db
        .select()
        .from(subSubCategories)
        .where(eq(subSubCategories.id, data.subSubCategoryId))
        .limit(1);

      if (!subsubcategory.length) {
        throw new NotFoundError("Subsubcategory not found");
      }

      // If both categories provided, validate relationship
      if (
        data.subCategoryId &&
        subsubcategory[0].subCategoryId !== data.subCategoryId
      ) {
        throw new BadRequestError(
          `Subsubcategory ${data.subSubCategoryId} does not belong to subcategory ${data.subCategoryId}`
        );
      }
    }

    // Validate brand if provided
    if (data.brandId) {
      const brand = await db
        .select()
        .from(brands)
        .where(eq(brands.id, data.brandId))
        .limit(1);

      if (!brand.length) {
        throw new NotFoundError("Brand not found");
      }
    }

    // Validate slug uniqueness
    const existingSlug = await db
      .select()
      .from(products)
      .where(eq(products.slug, data.slug))
      .limit(1);

    if (existingSlug.length > 0) {
      throw new ConflictError("Slug already exists. Please choose a different slug.");
    }

    // Sanitize HTML content
    const sanitizedDetailedDescription = this.sanitizeHtmlContent(data.detailedDescription);

    // Insert base product
    const [created] = await db
      .insert(products)
      .values({
        name: data.name,
        description: data.description,
        slug: data.slug,
        detailedDescription: sanitizedDetailedDescription,
        price: data.price,
        stock: data.stock,
        discountPercentage: data.discountPercentage ?? "0",
        subCategoryId: data.subCategoryId ?? null,
        subSubCategoryId: data.subSubCategoryId ?? null,
        brandId: data.brandId ?? null,
        images: data.images,
        datasheet: data.datasheet,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
        subcategoryOrder: data.subcategoryOrder ?? data.displayOrder ?? 0,
        subsubcategoryOrder: data.subsubcategoryOrder ?? data.displayOrder ?? 0,
        guarantee: data.guarantee ?? 0,
        estimatedDeliveryMaxDays: data.estimatedDeliveryMaxDays ?? 7,
        disponibility: data.disponibility ?? "available",
      })
      .returning();

    // Insert translations if provided
    if (data.translations) {
      const translationRecords = [];

      for (const [lang, trans] of Object.entries(data.translations)) {
        if (trans) {
          translationRecords.push({
            productId: created.id,
            language: lang,
            name: trans.name,
            description: trans.description,
            detailedDescription: this.sanitizeHtmlContent(trans.detailedDescription),
            datasheet: trans.datasheet,
          });
        }
      }

      if (translationRecords.length > 0) {
        await db.insert(productTranslations).values(translationRecords);
      }
    }

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
  // Business Rule:
  // - If product has ONLY subcategory → attributes must come from subcategory
  // - If product has subsubcategory (with or without subcategory) → attributes MUST come from subsubcategory
  //   (because subcategories with subsubcategories cannot have attributes)
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

      // Determine which parent should have the attributes based on business rule
      if (subSubCategoryId) {
        // Product has subsubcategory → attributes MUST come from subsubcategory
        if (attribute.subSubCategoryId !== subSubCategoryId) {
          throw new BadRequestError(
            `Attribute ${attr.attributeId} does not belong to subsubcategory ${subSubCategoryId}. ` +
              `When a product has a subsubcategory, it must use attributes from that subsubcategory only.`
          );
        }
      } else if (subCategoryId) {
        // Product has only subcategory → attributes must come from subcategory
        if (attribute.subCategoryId !== subCategoryId) {
          throw new BadRequestError(
            `Attribute ${attr.attributeId} does not belong to subcategory ${subCategoryId}`
          );
        }
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
  async findAllWithSearch(language: SupportedLanguage, query: {
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

    // Build where conditions including search
    if (search) {
      whereClause.push(
        sql`(
          LOWER(COALESCE(pt_requested.name, pt_fallback.name, ${products.name})) LIKE LOWER(${`%${search}%`})
          OR ${products.id}::text LIKE ${`%${search}%`}
        )`
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
          // Use COALESCE expression for translated name field
          orderBy = direction(sql`COALESCE(
            pt_requested.name,
            pt_fallback.name,
            ${products.name}
          )`);
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
          // Context-aware: use appropriate order field
          if (subSubCategoryId) {
            orderBy = direction(products.subsubcategoryOrder);
          } else {
            orderBy = direction(products.subcategoryOrder);
          }
          break;
        case "subcategoryOrder":
          orderBy = direction(products.subcategoryOrder);
          break;
        case "subsubcategoryOrder":
          orderBy = direction(products.subsubcategoryOrder);
          break;
        default:
          // Default: context-aware ordering
          if (subSubCategoryId) {
            orderBy = [
              asc(products.subsubcategoryOrder),
              desc(products.createdAt),
            ];
          } else {
            orderBy = [
              asc(products.subcategoryOrder),
              desc(products.createdAt),
            ];
          }
      }
    } else {
      // Legacy sort parameter support with context-aware ordering
      if (sort === "price_asc") {
        orderBy = asc(products.price);
      } else if (sort === "price_desc") {
        orderBy = desc(products.price);
      } else {
        // Context-aware default ordering
        if (subSubCategoryId) {
          orderBy = [
            asc(products.subsubcategoryOrder),
            desc(products.createdAt),
          ];
        } else {
          orderBy = [asc(products.subcategoryOrder), desc(products.createdAt)];
        }
      }
    }

    const baseQuery = db
      .select({
        // Base product fields (language-agnostic)
        id: products.id,
        slug: products.slug,
        price: products.price,
        stock: products.stock,
        discountPercentage: products.discountPercentage,
        subCategoryId: products.subCategoryId,
        subSubCategoryId: products.subSubCategoryId,
        brandId: products.brandId,
        images: products.images,
        isActive: products.isActive,
        displayOrder: products.displayOrder,
        subcategoryOrder: products.subcategoryOrder,
        subsubcategoryOrder: products.subsubcategoryOrder,
        guarantee: products.guarantee,
        estimatedDeliveryMaxDays: products.estimatedDeliveryMaxDays,
        disponibility: products.disponibility,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        // Translated fields with fallback
        name: sql<string>`COALESCE(
          pt_requested.name,
          pt_fallback.name,
          ${products.name}
        )`,
        description: sql<string>`COALESCE(
          pt_requested.description,
          pt_fallback.description,
          ${products.description}
        )`,
        detailedDescription: sql<string>`COALESCE(
          pt_requested.detailed_description,
          pt_fallback.detailed_description,
          ${products.detailedDescription}
        )`,
        datasheet: sql<string>`COALESCE(
          pt_requested.datasheet,
          pt_fallback.datasheet,
          ${products.datasheet}
        )`,
      })
      .from(products)
      .leftJoin(
        sql`product_translations as pt_requested`,
        sql`pt_requested.product_id = ${products.id} AND pt_requested.language = ${language}`
      )
      .leftJoin(
        sql`product_translations as pt_fallback`,
        sql`pt_fallback.product_id = ${products.id} AND pt_fallback.language = 'en'`
      )
      .where(whereClause.length ? and(...whereClause) : undefined);

    // Apply ordering
    const orderedQuery = Array.isArray(orderBy)
      ? baseQuery.orderBy(...orderBy)
      : baseQuery.orderBy(orderBy);

    const rows = await orderedQuery.limit(limit).offset(offset);

    // Fetch attribute values for all product IDs (with translations)
    const ids = rows.map((p) => p.id);

    let attributeRows: any[] = [];
    if (ids.length > 0) {
      attributeRows = await db
        .select({
          productId: productAttributeValues.productId,
          attributeId: attributes.id,
          attributeName: sql<string>`COALESCE(
            at_requested.name,
            at_fallback.name,
            ${attributes.name}
          )`,
          valueId: attributeValues.id,
          value: sql<string>`COALESCE(
            av_requested.value,
            av_fallback.value,
            ${attributeValues.value}
          )`,
        })
        .from(productAttributeValues)
        .innerJoin(
          attributes,
          eq(productAttributeValues.attributeId, attributes.id)
        )
        .leftJoin(
          sql`attribute_translations as at_requested`,
          sql`at_requested.attribute_id = ${attributes.id} AND at_requested.language = ${language}`
        )
        .leftJoin(
          sql`attribute_translations as at_fallback`,
          sql`at_fallback.attribute_id = ${attributes.id} AND at_fallback.language = 'en'`
        )
        .innerJoin(
          attributeValues,
          eq(productAttributeValues.attributeValueId, attributeValues.id)
        )
        .leftJoin(
          sql`attribute_value_translations as av_requested`,
          sql`av_requested.attribute_value_id = ${attributeValues.id} AND av_requested.language = ${language}`
        )
        .leftJoin(
          sql`attribute_value_translations as av_fallback`,
          sql`av_fallback.attribute_value_id = ${attributeValues.id} AND av_fallback.language = 'en'`
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

    // Count query - needs same joins and where clause for accurate count
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(products)
      .leftJoin(
        sql`product_translations as pt_requested`,
        sql`pt_requested.product_id = ${products.id} AND pt_requested.language = ${language}`
      )
      .leftJoin(
        sql`product_translations as pt_fallback`,
        sql`pt_fallback.product_id = ${products.id} AND pt_fallback.language = 'en'`
      )
      .where(whereClause.length ? and(...whereClause) : undefined);

    return {
      page,
      limit,
      total: Number(count),
      data: final,
    };
  }

  async findAll(language: SupportedLanguage) {
    const rows = await db
      .select({
        // Base product fields
        id: products.id,
        slug: products.slug,
        price: products.price,
        stock: products.stock,
        discountPercentage: products.discountPercentage,
        subCategoryId: products.subCategoryId,
        subSubCategoryId: products.subSubCategoryId,
        brandId: products.brandId,
        images: products.images,
        isActive: products.isActive,
        displayOrder: products.displayOrder,
        subcategoryOrder: products.subcategoryOrder,
        subsubcategoryOrder: products.subsubcategoryOrder,
        guarantee: products.guarantee,
        estimatedDeliveryMaxDays: products.estimatedDeliveryMaxDays,
        disponibility: products.disponibility,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        // Translated fields
        name: productTranslations.name,
        description: productTranslations.description,
        detailedDescription: productTranslations.detailedDescription,
        datasheet: productTranslations.datasheet,
      })
      .from(products)
      .innerJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.language, language)
        )
      )
      .orderBy(asc(products.subcategoryOrder), desc(products.createdAt));
    return rows;
  }

  // ---------------------------
  // FIND BY ID
  // ---------------------------
  async findById(language: SupportedLanguage, id: string) {
    const rows = await db
      .select({
        // Base product fields
        id: products.id,
        slug: products.slug,
        price: products.price,
        stock: products.stock,
        discountPercentage: products.discountPercentage,
        subCategoryId: products.subCategoryId,
        subSubCategoryId: products.subSubCategoryId,
        brandId: products.brandId,
        images: products.images,
        isActive: products.isActive,
        displayOrder: products.displayOrder,
        subcategoryOrder: products.subcategoryOrder,
        subsubcategoryOrder: products.subsubcategoryOrder,
        guarantee: products.guarantee,
        estimatedDeliveryMaxDays: products.estimatedDeliveryMaxDays,
        disponibility: products.disponibility,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        // Translated fields
        name: productTranslations.name,
        description: productTranslations.description,
        detailedDescription: productTranslations.detailedDescription,
        datasheet: productTranslations.datasheet,
      })
      .from(products)
      .innerJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.language, language)
        )
      )
      .where(eq(products.id, id))
      .limit(1);

    if (!rows.length) throw new NotFoundError("Product not found");

    const product = rows[0];

    const attributeRows = await db
      .select({
        attributeId: attributes.id,
        attributeName: attributeTranslations.name,
        valueId: attributeValues.id,
        value: attributeValueTranslations.value,
      })
      .from(productAttributeValues)
      .innerJoin(
        attributes,
        eq(productAttributeValues.attributeId, attributes.id)
      )
      .innerJoin(
        attributeTranslations,
        and(
          eq(attributeTranslations.attributeId, attributes.id),
          eq(attributeTranslations.language, language)
        )
      )
      .innerJoin(
        attributeValues,
        eq(productAttributeValues.attributeValueId, attributeValues.id)
      )
      .innerJoin(
        attributeValueTranslations,
        and(
          eq(attributeValueTranslations.attributeValueId, attributeValues.id),
          eq(attributeValueTranslations.language, language)
        )
      )
      .where(eq(productAttributeValues.productId, id));

    // Fetch all translations for this product
    const allTranslations = await db
      .select({
        language: productTranslations.language,
        name: productTranslations.name,
        description: productTranslations.description,
        detailedDescription: productTranslations.detailedDescription,
        datasheet: productTranslations.datasheet,
      })
      .from(productTranslations)
      .where(eq(productTranslations.productId, id));

    return {
      ...product,
      attributes: attributeRows.map((row) => ({
        attributeId: row.attributeId,
        attributeName: row.attributeName,
        attributeValueId: row.valueId,
        value: row.value,
      })),
      translations: allTranslations,
    };
  }

  // ---------------------------
  // FIND BY SLUG
  // ---------------------------
  async findBySlug(language: SupportedLanguage, slug: string) {
    const rows = await db
      .select({
        // Base product fields
        id: products.id,
        slug: products.slug,
        price: products.price,
        stock: products.stock,
        discountPercentage: products.discountPercentage,
        subCategoryId: products.subCategoryId,
        subSubCategoryId: products.subSubCategoryId,
        brandId: products.brandId,
        images: products.images,
        isActive: products.isActive,
        displayOrder: products.displayOrder,
        subcategoryOrder: products.subcategoryOrder,
        subsubcategoryOrder: products.subsubcategoryOrder,
        guarantee: products.guarantee,
        estimatedDeliveryMaxDays: products.estimatedDeliveryMaxDays,
        disponibility: products.disponibility,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        // Translated fields
        name: productTranslations.name,
        description: productTranslations.description,
        detailedDescription: productTranslations.detailedDescription,
        datasheet: productTranslations.datasheet,
      })
      .from(products)
      .innerJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.language, language)
        )
      )
      .where(eq(products.slug, slug))
      .limit(1);

    if (!rows.length) throw new NotFoundError("Product not found");

    const product = rows[0];

    const attributeRows = await db
      .select({
        attributeId: attributes.id,
        attributeName: attributeTranslations.name,
        valueId: attributeValues.id,
        value: attributeValueTranslations.value,
      })
      .from(productAttributeValues)
      .innerJoin(
        attributes,
        eq(productAttributeValues.attributeId, attributes.id)
      )
      .innerJoin(
        attributeTranslations,
        and(
          eq(attributeTranslations.attributeId, attributes.id),
          eq(attributeTranslations.language, language)
        )
      )
      .innerJoin(
        attributeValues,
        eq(productAttributeValues.attributeValueId, attributeValues.id)
      )
      .innerJoin(
        attributeValueTranslations,
        and(
          eq(attributeValueTranslations.attributeValueId, attributeValues.id),
          eq(attributeValueTranslations.language, language)
        )
      )
      .where(eq(productAttributeValues.productId, product.id));

    // Fetch all translations for this product
    const allTranslations = await db
      .select({
        language: productTranslations.language,
        name: productTranslations.name,
        description: productTranslations.description,
        detailedDescription: productTranslations.detailedDescription,
        datasheet: productTranslations.datasheet,
      })
      .from(productTranslations)
      .where(eq(productTranslations.productId, product.id));

    return {
      ...product,
      attributes: attributeRows.map((row) => ({
        attributeId: row.attributeId,
        attributeName: row.attributeName,
        attributeValueId: row.valueId,
        value: row.value,
      })),
      translations: allTranslations,
    };
  }

  // ---------------------------
  // UPDATE PRODUCT
  // ---------------------------
  async update(language: SupportedLanguage, id: string, data: UpdateProductInputType) {
    const existing = await this.findById(language, id);

    // Validate brand if being updated
    if (data.brandId !== undefined && data.brandId !== null) {
      const brand = await db
        .select()
        .from(brands)
        .where(eq(brands.id, data.brandId))
        .limit(1);

      if (!brand.length) {
        throw new NotFoundError("Brand not found");
      }
    }

    // Validate slug uniqueness if being updated
    if (data.slug !== undefined) {
      const existingSlug = await db
        .select()
        .from(products)
        .where(eq(products.slug, data.slug))
        .limit(1);

      if (existingSlug.length > 0 && existingSlug[0].id !== id) {
        throw new ConflictError("Slug already exists. Please choose a different slug.");
      }
    }

    const payload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.slug !== undefined) payload.slug = data.slug;
    if (data.detailedDescription !== undefined)
      payload.detailedDescription = this.sanitizeHtmlContent(data.detailedDescription);
    if (data.price !== undefined) payload.price = data.price;
    if (data.stock !== undefined) payload.stock = data.stock;
    if (data.discountPercentage !== undefined)
      payload.discountPercentage = data.discountPercentage;
    if (data.images !== undefined) payload.images = data.images;
    if (data.datasheet !== undefined) payload.datasheet = data.datasheet;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.displayOrder !== undefined)
      payload.displayOrder = data.displayOrder;
    if (data.subcategoryOrder !== undefined)
      payload.subcategoryOrder = data.subcategoryOrder;
    if (data.subsubcategoryOrder !== undefined)
      payload.subsubcategoryOrder = data.subsubcategoryOrder;
    if (data.brandId !== undefined) payload.brandId = data.brandId;
    if (data.guarantee !== undefined) payload.guarantee = data.guarantee;
    if (data.estimatedDeliveryMaxDays !== undefined)
      payload.estimatedDeliveryMaxDays = data.estimatedDeliveryMaxDays;
    if (data.disponibility !== undefined)
      payload.disponibility = data.disponibility;

    const [updated] = await db
      .update(products)
      .set(payload)
      .where(eq(products.id, id))
      .returning();

    // Upsert translations if provided
    if (data.translations) {
      for (const [lang, trans] of Object.entries(data.translations)) {
        if (trans) {
          const existing = await db
            .select()
            .from(productTranslations)
            .where(
              and(
                eq(productTranslations.productId, id),
                eq(productTranslations.language, lang)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            // Update existing translation
            await db
              .update(productTranslations)
              .set({
                name: trans.name,
                description: trans.description,
                detailedDescription: this.sanitizeHtmlContent(trans.detailedDescription),
                datasheet: trans.datasheet,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(productTranslations.productId, id),
                  eq(productTranslations.language, lang)
                )
              );
          } else {
            // Insert new translation
            await db.insert(productTranslations).values({
              productId: id,
              language: lang,
              name: trans.name,
              description: trans.description,
              detailedDescription: this.sanitizeHtmlContent(trans.detailedDescription),
              datasheet: trans.datasheet,
            });
          }
        }
      }
    }

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
    const existing = await this.findById('en', id);

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

  async updateProductDisplayOrder(
    id: string,
    scope: "subcategory" | "subsubcategory",
    displayOrder: number
  ) {
    // Fetch product to validate relationship
    const existing = await this.findById('en', id);

    // Validate scope matches product relationships
    if (scope === "subcategory" && !existing.subCategoryId) {
      throw new BadRequestError(
        "Cannot update subcategoryOrder: product does not have a subcategory relationship"
      );
    }

    if (scope === "subsubcategory" && !existing.subSubCategoryId) {
      throw new BadRequestError(
        "Cannot update subsubcategoryOrder: product does not have a subsubcategory relationship"
      );
    }

    // Update appropriate field based on scope
    const updatePayload: any = { updatedAt: new Date() };

    if (scope === "subcategory") {
      updatePayload.subcategoryOrder = displayOrder;
    } else {
      updatePayload.subsubcategoryOrder = displayOrder;
    }

    const [updated] = await db
      .update(products)
      .set(updatePayload)
      .where(eq(products.id, id))
      .returning();

    return updated;
  }

  // ---------------------------
  // DELETE (Soft Delete)
  // ---------------------------
  async delete(id: string) {
    await this.findById('en', id);

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

  // ---------------------------
  // FIND DISCOUNTED PRODUCTS
  // ---------------------------
  async findDiscountedProducts(language: SupportedLanguage, query: {
    page?: number;
    limit?: number;
    sortBy?: "discount" | "newest" | "price_asc" | "price_desc";
  }) {
    const {
      page = 1,
      limit = 10,
      sortBy = "discount",
    } = query;

    const offset = (page - 1) * limit;

    // Filter products with discountPercentage > 0 and isActive = true
    const whereClause = and(
      sql`CAST(${products.discountPercentage} AS DECIMAL) > 0`,
      eq(products.isActive, true)
    );

    // Determine sorting
    let orderBy;
    switch (sortBy) {
      case "discount":
        orderBy = desc(products.discountPercentage);
        break;
      case "newest":
        orderBy = desc(products.createdAt);
        break;
      case "price_asc":
        orderBy = asc(products.price);
        break;
      case "price_desc":
        orderBy = desc(products.price);
        break;
      default:
        orderBy = desc(products.discountPercentage);
    }

    const rows = await db
      .select({
        // Base product fields
        id: products.id,
        slug: products.slug,
        price: products.price,
        stock: products.stock,
        discountPercentage: products.discountPercentage,
        subCategoryId: products.subCategoryId,
        subSubCategoryId: products.subSubCategoryId,
        brandId: products.brandId,
        images: products.images,
        isActive: products.isActive,
        displayOrder: products.displayOrder,
        subcategoryOrder: products.subcategoryOrder,
        subsubcategoryOrder: products.subsubcategoryOrder,
        guarantee: products.guarantee,
        estimatedDeliveryMaxDays: products.estimatedDeliveryMaxDays,
        disponibility: products.disponibility,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        // Translated fields
        name: productTranslations.name,
        description: productTranslations.description,
        detailedDescription: productTranslations.detailedDescription,
        datasheet: productTranslations.datasheet,
      })
      .from(products)
      .innerJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.language, language)
        )
      )
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Fetch attribute values for all product IDs (with translations)
    const ids = rows.map((p) => p.id);

    let attributeRows: any[] = [];
    if (ids.length > 0) {
      attributeRows = await db
        .select({
          productId: productAttributeValues.productId,
          attributeId: attributes.id,
          attributeName: sql<string>`COALESCE(
            at_requested.name,
            at_fallback.name,
            ${attributes.name}
          )`,
          valueId: attributeValues.id,
          value: sql<string>`COALESCE(
            av_requested.value,
            av_fallback.value,
            ${attributeValues.value}
          )`,
        })
        .from(productAttributeValues)
        .innerJoin(
          attributes,
          eq(productAttributeValues.attributeId, attributes.id)
        )
        .leftJoin(
          sql`attribute_translations as at_requested`,
          sql`at_requested.attribute_id = ${attributes.id} AND at_requested.language = ${language}`
        )
        .leftJoin(
          sql`attribute_translations as at_fallback`,
          sql`at_fallback.attribute_id = ${attributes.id} AND at_fallback.language = 'en'`
        )
        .innerJoin(
          attributeValues,
          eq(productAttributeValues.attributeValueId, attributeValues.id)
        )
        .leftJoin(
          sql`attribute_value_translations as av_requested`,
          sql`av_requested.attribute_value_id = ${attributeValues.id} AND av_requested.language = ${language}`
        )
        .leftJoin(
          sql`attribute_value_translations as av_fallback`,
          sql`av_fallback.attribute_value_id = ${attributeValues.id} AND av_fallback.language = 'en'`
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
      .innerJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.language, language)
        )
      )
      .where(whereClause);

    return {
      page,
      limit,
      total: Number(count),
      data: final,
    };
  }

  // ---------------------------
  // FILTER PRODUCTS
  // ---------------------------
  async filterProducts(language: SupportedLanguage, input: FilterProductsInputType) {
    const {
      categoryId,
      categoryType,
      filters = [],
      page = 1,
      limit = 10,
    } = input;
    const offset = (page - 1) * limit;

    const baseWhereClauses = [];

    // Base category filter
    // Note: Products can now have BOTH subcategory and subsubcategory
    // - Filtering by subcategory returns products with that subcategory (regardless of subsubcategory)
    // - Filtering by subsubcategory returns products with that specific subsubcategory
    if (categoryType === "subcategory") {
      baseWhereClauses.push(eq(products.subCategoryId, categoryId));
    } else if (categoryType === "subsubcategory") {
      baseWhereClauses.push(eq(products.subSubCategoryId, categoryId));
    } else {
      throw new BadRequestError("Invalid category type");
    }

    baseWhereClauses.push(eq(products.isActive, true));

    let matchingProductIds: string[] = [];

    if (filters.length > 0) {
      const filterConditions = filters.map((filter) =>
        and(
          eq(productAttributeValues.attributeId, filter.attributeId),
          inArray(productAttributeValues.attributeValueId, filter.valueIds)
        )
      );

      const subquery = db
        .select({
          productId: productAttributeValues.productId,
        })
        .from(productAttributeValues)
        .where(or(...filterConditions))
        .groupBy(productAttributeValues.productId)
        .having(
          sql`COUNT(DISTINCT ${productAttributeValues.attributeId}) = ${filters.length}`
        );

      const result = await subquery;
      matchingProductIds = result.map((r) => r.productId);

      if (matchingProductIds.length === 0) {
        return { page, limit, total: 0, data: [] };
      }
    }

    const finalWhereClauses = [...baseWhereClauses];
    if (matchingProductIds.length > 0) {
      finalWhereClauses.push(inArray(products.id, matchingProductIds));
    }

    const finalWhere = and(...finalWhereClauses);

    // Context-aware ordering based on category type
    const orderByClause =
      categoryType === "subsubcategory"
        ? [asc(products.subsubcategoryOrder), desc(products.createdAt)]
        : [asc(products.subcategoryOrder), desc(products.createdAt)];

    const rows = await db
      .select({
        // Base product fields
        id: products.id,
        slug: products.slug,
        price: products.price,
        stock: products.stock,
        discountPercentage: products.discountPercentage,
        subCategoryId: products.subCategoryId,
        subSubCategoryId: products.subSubCategoryId,
        brandId: products.brandId,
        images: products.images,
        isActive: products.isActive,
        displayOrder: products.displayOrder,
        subcategoryOrder: products.subcategoryOrder,
        subsubcategoryOrder: products.subsubcategoryOrder,
        guarantee: products.guarantee,
        estimatedDeliveryMaxDays: products.estimatedDeliveryMaxDays,
        disponibility: products.disponibility,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        // Translated fields
        name: productTranslations.name,
        description: productTranslations.description,
        detailedDescription: productTranslations.detailedDescription,
        datasheet: productTranslations.datasheet,
      })
      .from(products)
      .innerJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.language, language)
        )
      )
      .where(finalWhere)
      .orderBy(...orderByClause)
      .limit(limit)
      .offset(offset);

    const ids = rows.map((p) => p.id);
    let attributeRows: any[] = [];
    if (ids.length > 0) {
      attributeRows = await db
        .select({
          productId: productAttributeValues.productId,
          attributeId: attributes.id,
          attributeName: sql<string>`COALESCE(
            at_requested.name,
            at_fallback.name,
            ${attributes.name}
          )`,
          valueId: attributeValues.id,
          value: sql<string>`COALESCE(
            av_requested.value,
            av_fallback.value,
            ${attributeValues.value}
          )`,
        })
        .from(productAttributeValues)
        .innerJoin(
          attributes,
          eq(productAttributeValues.attributeId, attributes.id)
        )
        .leftJoin(
          sql`attribute_translations as at_requested`,
          sql`at_requested.attribute_id = ${attributes.id} AND at_requested.language = ${language}`
        )
        .leftJoin(
          sql`attribute_translations as at_fallback`,
          sql`at_fallback.attribute_id = ${attributes.id} AND at_fallback.language = 'en'`
        )
        .innerJoin(
          attributeValues,
          eq(productAttributeValues.attributeValueId, attributeValues.id)
        )
        .leftJoin(
          sql`attribute_value_translations as av_requested`,
          sql`av_requested.attribute_value_id = ${attributeValues.id} AND av_requested.language = ${language}`
        )
        .leftJoin(
          sql`attribute_value_translations as av_fallback`,
          sql`av_fallback.attribute_value_id = ${attributeValues.id} AND av_fallback.language = 'en'`
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
      .where(finalWhere);

    return {
      page,
      limit,
      total: Number(count),
      data: final,
    };
  }
}
