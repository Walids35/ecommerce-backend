import { eq, asc, sql, and } from "drizzle-orm";
import { db } from "../../db/data-source";
import { brands } from "../../db/schema/brands";
import { products } from "../../db/schema/product";
import { brandTranslations } from "../../db/schema/translations/brand-translations";
import { NotFoundError, ConflictError, BadRequestError } from "../../utils/errors";
import { CreateBrandDto, UpdateBrandDto } from "./dto/brand.dto";
import { SupportedLanguage } from "../../middlewares/language";

export class BrandService {
  async getAll(language: SupportedLanguage) {
    return db
      .select({
        id: brands.id,
        logo: brands.logo,
        isActive: brands.isActive,
        displayOrder: brands.displayOrder,
        createdAt: brands.createdAt,
        updatedAt: brands.updatedAt,
        name: brandTranslations.name,
        description: brandTranslations.description,
        slug: brandTranslations.slug,
      })
      .from(brands)
      .innerJoin(
        brandTranslations,
        and(
          eq(brandTranslations.brandId, brands.id),
          eq(brandTranslations.language, language)
        )
      )
      .orderBy(asc(brands.displayOrder), asc(brandTranslations.name));
  }

  async getById(language: SupportedLanguage, id: number) {
    const result = await db
      .select({
        id: brands.id,
        logo: brands.logo,
        isActive: brands.isActive,
        displayOrder: brands.displayOrder,
        createdAt: brands.createdAt,
        updatedAt: brands.updatedAt,
        name: brandTranslations.name,
        description: brandTranslations.description,
        slug: brandTranslations.slug,
      })
      .from(brands)
      .innerJoin(
        brandTranslations,
        and(
          eq(brandTranslations.brandId, brands.id),
          eq(brandTranslations.language, language)
        )
      )
      .where(eq(brands.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundError("Brand not found");
    }

    return result[0];
  }

  async create(data: CreateBrandDto) {
    // Check name uniqueness
    const existingName = await db
      .select()
      .from(brands)
      .where(eq(brands.name, data.name))
      .limit(1);

    if (existingName.length > 0) {
      throw new ConflictError("Brand name already exists");
    }

    // Check slug uniqueness
    const existingSlug = await db
      .select()
      .from(brands)
      .where(eq(brands.slug, data.slug))
      .limit(1);

    if (existingSlug.length > 0) {
      throw new ConflictError("Slug already exists");
    }

    const [created] = await db
      .insert(brands)
      .values({
        name: data.name,
        description: data.description,
        slug: data.slug,
        logo: data.logo,
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
            brandId: created.id,
            language: lang,
            name: trans.name,
            description: trans.description,
            slug: trans.slug,
          });
        }
      }

      if (translationRecords.length > 0) {
        await db.insert(brandTranslations).values(translationRecords);
      }
    }

    return created;
  }

  async update(id: number, data: UpdateBrandDto) {
    const existing = await this.getById('en', id);

    // Check name uniqueness if being updated
    if (data.name && data.name !== existing.name) {
      const existingName = await db
        .select()
        .from(brands)
        .where(eq(brands.name, data.name))
        .limit(1);

      if (existingName.length > 0) {
        throw new ConflictError("Brand name already exists");
      }
    }

    // Check slug uniqueness if being updated
    if (data.slug && data.slug !== existing.slug) {
      const existingSlug = await db
        .select()
        .from(brands)
        .where(eq(brands.slug, data.slug))
        .limit(1);

      if (existingSlug.length > 0) {
        throw new ConflictError("Slug already exists");
      }
    }

    const payload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.slug !== undefined) payload.slug = data.slug;
    if (data.logo !== undefined) payload.logo = data.logo;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.displayOrder !== undefined) payload.displayOrder = data.displayOrder;

    const [updated] = await db
      .update(brands)
      .set(payload)
      .where(eq(brands.id, id))
      .returning();

    // Upsert translations if provided
    if (data.translations) {
      for (const [lang, trans] of Object.entries(data.translations)) {
        if (trans) {
          const existing = await db
            .select()
            .from(brandTranslations)
            .where(
              and(
                eq(brandTranslations.brandId, id),
                eq(brandTranslations.language, lang)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(brandTranslations)
              .set({
                name: trans.name,
                description: trans.description,
                slug: trans.slug,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(brandTranslations.brandId, id),
                  eq(brandTranslations.language, lang)
                )
              );
          } else {
            await db.insert(brandTranslations).values({
              brandId: id,
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

  async delete(id: number) {
    await this.getById('en', id); // Validates brand exists

    // Check if brand has products
    const productCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.brandId, id));

    if (Number(productCount[0].count) > 0) {
      throw new BadRequestError(
        `Cannot delete brand with ${productCount[0].count} associated product(s). Please reassign or delete products first.`
      );
    }

    await db.delete(brands).where(eq(brands.id, id));

    return { message: "Brand deleted successfully" };
  }
}
