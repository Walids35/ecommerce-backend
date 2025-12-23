import { eq, sql, and } from "drizzle-orm";
import { CreateSubSubCategoryInput, UpdateSubSubCategoryInput } from "./dto/subsubcategory.dto";
import { subCategories, attributes } from "../../db/schema/subcategories";
import { subSubCategories } from "../../db/schema/subsubcategories";
import { products } from "../../db/schema/product";
import { db } from "../../db/data-source";
import { subsubcategoryTranslations } from "../../db/schema/translations/subsubcategory-translations";
import { SupportedLanguage } from "../../middlewares/language";

export class SubSubCategoryService {
  async create(data: CreateSubSubCategoryInput) {
    // Validate parent subcategory exists
    const subcategory = await db
      .select()
      .from(subCategories)
      .where(eq(subCategories.id, data.subCategoryId))
      .limit(1);

    if (subcategory.length === 0) throw new Error("Subcategory not found");

    // Check if subcategory has attributes
    const hasAttributes = await db
      .select({ count: sql<number>`count(*)` })
      .from(attributes)
      .where(eq(attributes.subCategoryId, data.subCategoryId));

    if (hasAttributes[0].count > 0) {
      throw new Error(
        "Cannot create subsubcategories for a subcategory that has attributes. " +
        "A subcategory can either have attributes OR subsubcategories, but not both."
      );
    }

    // Check slug uniqueness (global)
    const existingSlug = await db
      .select()
      .from(subSubCategories)
      .where(eq(subSubCategories.slug, data.slug))
      .limit(1);

    if (existingSlug.length > 0) throw new Error("Slug already exists");

    const [created] = await db
      .insert(subSubCategories)
      .values({
        name: data.name,
        description: data.description,
        slug: data.slug,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
        subCategoryId: data.subCategoryId,
        image: data.image
      })
      .returning();

    // Insert translations if provided
    if (data.translations) {
      const translationRecords = [];

      for (const [lang, trans] of Object.entries(data.translations)) {
        if (trans) {
          translationRecords.push({
            subsubcategoryId: created.id,
            language: lang,
            name: trans.name,
            description: trans.description,
            slug: trans.slug,
          });
        }
      }

      if (translationRecords.length > 0) {
        await db.insert(subsubcategoryTranslations).values(translationRecords);
      }
    }

    return created;
  }

  async findAll(language: SupportedLanguage) {
    return await db
      .select({
        id: subSubCategories.id,
        subCategoryId: subSubCategories.subCategoryId,
        image: subSubCategories.image,
        isActive: subSubCategories.isActive,
        displayOrder: subSubCategories.displayOrder,
        createdAt: subSubCategories.createdAt,
        updatedAt: subSubCategories.updatedAt,
        name: subsubcategoryTranslations.name,
        description: subsubcategoryTranslations.description,
        slug: subsubcategoryTranslations.slug,
      })
      .from(subSubCategories)
      .innerJoin(
        subsubcategoryTranslations,
        and(
          eq(subsubcategoryTranslations.subsubcategoryId, subSubCategories.id),
          eq(subsubcategoryTranslations.language, language)
        )
      );
  }

  async findById(language: SupportedLanguage, id: number) {
    const result = await db
      .select({
        id: subSubCategories.id,
        subCategoryId: subSubCategories.subCategoryId,
        image: subSubCategories.image,
        isActive: subSubCategories.isActive,
        displayOrder: subSubCategories.displayOrder,
        createdAt: subSubCategories.createdAt,
        updatedAt: subSubCategories.updatedAt,
        name: subsubcategoryTranslations.name,
        description: subsubcategoryTranslations.description,
        slug: subsubcategoryTranslations.slug,
      })
      .from(subSubCategories)
      .innerJoin(
        subsubcategoryTranslations,
        and(
          eq(subsubcategoryTranslations.subsubcategoryId, subSubCategories.id),
          eq(subsubcategoryTranslations.language, language)
        )
      )
      .where(eq(subSubCategories.id, id))
      .limit(1);

    if (result.length === 0) throw new Error("Subsubcategory not found");
    return result[0];
  }

  async findBySubCategoryId(language: SupportedLanguage, subCategoryId: number) {
    return await db
      .select({
        id: subSubCategories.id,
        subCategoryId: subSubCategories.subCategoryId,
        image: subSubCategories.image,
        isActive: subSubCategories.isActive,
        displayOrder: subSubCategories.displayOrder,
        createdAt: subSubCategories.createdAt,
        updatedAt: subSubCategories.updatedAt,
        name: subsubcategoryTranslations.name,
        description: subsubcategoryTranslations.description,
        slug: subsubcategoryTranslations.slug,
      })
      .from(subSubCategories)
      .innerJoin(
        subsubcategoryTranslations,
        and(
          eq(subsubcategoryTranslations.subsubcategoryId, subSubCategories.id),
          eq(subsubcategoryTranslations.language, language)
        )
      )
      .where(eq(subSubCategories.subCategoryId, subCategoryId));
  }

  async findBySlug(language: SupportedLanguage, slug: string) {
    const result = await db
      .select({
        id: subSubCategories.id,
        subCategoryId: subSubCategories.subCategoryId,
        image: subSubCategories.image,
        isActive: subSubCategories.isActive,
        displayOrder: subSubCategories.displayOrder,
        createdAt: subSubCategories.createdAt,
        updatedAt: subSubCategories.updatedAt,
        name: subsubcategoryTranslations.name,
        description: subsubcategoryTranslations.description,
        slug: subsubcategoryTranslations.slug,
      })
      .from(subSubCategories)
      .innerJoin(
        subsubcategoryTranslations,
        and(
          eq(subsubcategoryTranslations.subsubcategoryId, subSubCategories.id),
          eq(subsubcategoryTranslations.language, language)
        )
      )
      .where(eq(subsubcategoryTranslations.slug, slug))
      .limit(1);

    if (result.length === 0) throw new Error("Subsubcategory not found");
    return result[0];
  }

  async update(id: number, data: UpdateSubSubCategoryInput) {
    await this.findById("en", id);

    // Check slug uniqueness if being updated
    if (data.slug) {
      const existingSlug = await db
        .select()
        .from(subSubCategories)
        .where(eq(subSubCategories.slug, data.slug))
        .limit(1);

      if (existingSlug.length > 0 && existingSlug[0].id !== id) {
        throw new Error("Slug already exists");
      }
    }

    const payload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.slug !== undefined) payload.slug = data.slug;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.displayOrder !== undefined) payload.displayOrder = data.displayOrder;
    if (data.subCategoryId !== undefined) payload.subCategoryId = data.subCategoryId;

    const [updated] = await db
      .update(subSubCategories)
      .set(payload)
      .where(eq(subSubCategories.id, id))
      .returning();

    // Upsert translations if provided
    if (data.translations) {
      for (const [lang, trans] of Object.entries(data.translations)) {
        if (trans) {
          const existing = await db
            .select()
            .from(subsubcategoryTranslations)
            .where(
              and(
                eq(subsubcategoryTranslations.subsubcategoryId, id),
                eq(subsubcategoryTranslations.language, lang)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(subsubcategoryTranslations)
              .set({
                name: trans.name,
                description: trans.description,
                slug: trans.slug,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(subsubcategoryTranslations.subsubcategoryId, id),
                  eq(subsubcategoryTranslations.language, lang)
                )
              );
          } else {
            await db.insert(subsubcategoryTranslations).values({
              subsubcategoryId: id,
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
    await this.findById("en", id);

    // Check if any products are linked
    const linkedProducts = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.subSubCategoryId, id));

    if (linkedProducts[0].count > 0) {
      throw new Error("Cannot delete subsubcategory with linked products");
    }

    const [deleted] = await db
      .delete(subSubCategories)
      .where(eq(subSubCategories.id, id))
      .returning();

    return deleted;
  }
}
