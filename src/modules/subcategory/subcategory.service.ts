import { eq, sql, and, inArray } from "drizzle-orm";
import { CreateSubCategoryInput, UpdateSubCategoryInput } from "./dto/subcategory.dto";
import { categories } from "../../db/schema/categories";
import { db } from "../../db/data-source";
import { subCategories } from "../../db/schema/subcategories";
import { subSubCategories } from "../../db/schema/subsubcategories";
import { products } from "../../db/schema/product";
import { subcategoryTranslations } from "../../db/schema/translations/subcategory-translations";
import { subsubcategoryTranslations } from "../../db/schema/translations/subsubcategory-translations";
import { SupportedLanguage } from "../../middlewares/language";

export class SubCategoryService {
  async create(data: CreateSubCategoryInput) {
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.id, data.categoryId))
      .limit(1);

    if (category.length === 0) throw new Error("Category not found");

    // Check slug uniqueness (global)
    const existingSlug = await db
      .select()
      .from(subCategories)
      .where(eq(subCategories.slug, data.slug))
      .limit(1);

    if (existingSlug.length > 0) throw new Error("Slug already exists");

    const [created] = await db
      .insert(subCategories)
      .values({
        name: data.name,
        description: data.description,
        slug: data.slug,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
        categoryId: data.categoryId,
        image: data.image,
      })
      .returning();

    // Insert translations if provided
    if (data.translations) {
      const translationRecords = [];

      for (const [lang, trans] of Object.entries(data.translations)) {
        if (trans) {
          translationRecords.push({
            subcategoryId: created.id,
            language: lang,
            name: trans.name,
            description: trans.description,
          });
        }
      }

      if (translationRecords.length > 0) {
        await db.insert(subcategoryTranslations).values(translationRecords);
      }
    }

    return created;
  }

  async findAll(language: SupportedLanguage) {
    return await db
      .select({
        id: subCategories.id,
        categoryId: subCategories.categoryId,
        slug: subCategories.slug,
        image: subCategories.image,
        isActive: subCategories.isActive,
        displayOrder: subCategories.displayOrder,
        createdAt: subCategories.createdAt,
        updatedAt: subCategories.updatedAt,
        name: subcategoryTranslations.name,
        description: subcategoryTranslations.description,
      })
      .from(subCategories)
      .innerJoin(
        subcategoryTranslations,
        and(
          eq(subcategoryTranslations.subcategoryId, subCategories.id),
          eq(subcategoryTranslations.language, language)
        )
      );
  }

  async getAllWithSubSubCategories(language: SupportedLanguage) {
    // Fetch all subcategories with translations
    const subcategoriesList = await db
      .select({
        id: subCategories.id,
        categoryId: subCategories.categoryId,
        slug: subCategories.slug,
        image: subCategories.image,
        isActive: subCategories.isActive,
        displayOrder: subCategories.displayOrder,
        createdAt: subCategories.createdAt,
        updatedAt: subCategories.updatedAt,
        name: subcategoryTranslations.name,
        description: subcategoryTranslations.description,
      })
      .from(subCategories)
      .innerJoin(
        subcategoryTranslations,
        and(
          eq(subcategoryTranslations.subcategoryId, subCategories.id),
          eq(subcategoryTranslations.language, language)
        )
      );

    if (subcategoriesList.length === 0) {
      return [];
    }

    // Get all subcategory IDs
    const subcategoryIds = subcategoriesList.map(sc => sc.id);

    // Fetch all subsubcategories for these subcategories
    const subsubcategoriesList = await db
      .select({
        id: subSubCategories.id,
        subCategoryId: subSubCategories.subCategoryId,
        slug: subSubCategories.slug,
        image: subSubCategories.image,
        isActive: subSubCategories.isActive,
        displayOrder: subSubCategories.displayOrder,
        createdAt: subSubCategories.createdAt,
        updatedAt: subSubCategories.updatedAt,
        name: subsubcategoryTranslations.name,
        description: subsubcategoryTranslations.description,
      })
      .from(subSubCategories)
      .innerJoin(
        subsubcategoryTranslations,
        and(
          eq(subsubcategoryTranslations.subsubcategoryId, subSubCategories.id),
          eq(subsubcategoryTranslations.language, language)
        )
      )
      .where(inArray(subSubCategories.subCategoryId, subcategoryIds));

    // Group subsubcategories by subcategory ID
    const subsubcategoriesMap = subsubcategoriesList.reduce((acc, subsubcat) => {
      if (!acc[subsubcat.subCategoryId]) {
        acc[subsubcat.subCategoryId] = [];
      }
      acc[subsubcat.subCategoryId].push({
        id: subsubcat.id,
        slug: subsubcat.slug,
        image: subsubcat.image,
        isActive: subsubcat.isActive,
        displayOrder: subsubcat.displayOrder,
        createdAt: subsubcat.createdAt,
        updatedAt: subsubcat.updatedAt,
        name: subsubcat.name,
        description: subsubcat.description,
      });
      return acc;
    }, {} as Record<number, any[]>);

    // Combine subcategories with their subsubcategories
    return subcategoriesList.map(subcategory => ({
      ...subcategory,
      subsubcategories: subsubcategoriesMap[subcategory.id] || [],
    }));
  }

  async findByCategoryId(language: SupportedLanguage, categoryId: number) {
    return await db
      .select({
        id: subCategories.id,
        categoryId: subCategories.categoryId,
        slug: subCategories.slug,
        image: subCategories.image,
        isActive: subCategories.isActive,
        displayOrder: subCategories.displayOrder,
        createdAt: subCategories.createdAt,
        updatedAt: subCategories.updatedAt,
        name: subcategoryTranslations.name,
        description: subcategoryTranslations.description,
      })
      .from(subCategories)
      .innerJoin(
        subcategoryTranslations,
        and(
          eq(subcategoryTranslations.subcategoryId, subCategories.id),
          eq(subcategoryTranslations.language, language)
        )
      )
      .where(eq(subCategories.categoryId, categoryId));
  }
  async findById(language: SupportedLanguage, id: number) {
    const result = await db
      .select({
        id: subCategories.id,
        categoryId: subCategories.categoryId,
        slug: subCategories.slug,
        image: subCategories.image,
        isActive: subCategories.isActive,
        displayOrder: subCategories.displayOrder,
        createdAt: subCategories.createdAt,
        updatedAt: subCategories.updatedAt,
        name: subcategoryTranslations.name,
        description: subcategoryTranslations.description,
      })
      .from(subCategories)
      .innerJoin(
        subcategoryTranslations,
        and(
          eq(subcategoryTranslations.subcategoryId, subCategories.id),
          eq(subcategoryTranslations.language, language)
        )
      )
      .where(eq(subCategories.id, id))
      .limit(1);

    if (result.length === 0) throw new Error("Sub-category not found");
    return result[0];
  }

  async findBySlug(language: SupportedLanguage, slug: string) {
    const result = await db
      .select({
        id: subCategories.id,
        categoryId: subCategories.categoryId,
        slug: subCategories.slug,
        image: subCategories.image,
        isActive: subCategories.isActive,
        displayOrder: subCategories.displayOrder,
        createdAt: subCategories.createdAt,
        updatedAt: subCategories.updatedAt,
        name: subcategoryTranslations.name,
        description: subcategoryTranslations.description,
      })
      .from(subCategories)
      .innerJoin(
        subcategoryTranslations,
        and(
          eq(subcategoryTranslations.subcategoryId, subCategories.id),
          eq(subcategoryTranslations.language, language)
        )
      )
      .where(eq(subCategories.slug, slug))
      .limit(1);

    if (result.length === 0) throw new Error("Subcategory not found");
    return result[0];
  }

  async update(id: number, data: UpdateSubCategoryInput) {
    await this.findById("en", id);

    // Check slug uniqueness if being updated
    if (data.slug) {
      const existingSlug = await db
        .select()
        .from(subCategories)
        .where(eq(subCategories.slug, data.slug))
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
    if (data.displayOrder !== undefined)
      payload.displayOrder = data.displayOrder;
    if (data.categoryId !== undefined) payload.categoryId = data.categoryId;

    const [updated] = await db
      .update(subCategories)
      .set(payload)
      .where(eq(subCategories.id, id))
      .returning();

    // Upsert translations if provided
    if (data.translations) {
      for (const [lang, trans] of Object.entries(data.translations)) {
        if (trans) {
          const existing = await db
            .select()
            .from(subcategoryTranslations)
            .where(
              and(
                eq(subcategoryTranslations.subcategoryId, id),
                eq(subcategoryTranslations.language, lang)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(subcategoryTranslations)
              .set({
                name: trans.name,
                description: trans.description,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(subcategoryTranslations.subcategoryId, id),
                  eq(subcategoryTranslations.language, lang)
                )
              );
          } else {
            await db.insert(subcategoryTranslations).values({
              subcategoryId: id,
              language: lang,
              name: trans.name,
              description: trans.description,
            });
          }
        }
      }
    }

    return updated;
  }

  async delete(id: number) {
    await this.findById("en", id);

    // Check if any subsubcategories exist
    const subsubcats = await db
      .select({ count: sql<number>`count(*)` })
      .from(subSubCategories)
      .where(eq(subSubCategories.subCategoryId, id));

    if (subsubcats[0].count > 0) {
      throw new Error("Cannot delete subcategory with subsubcategories");
    }

    // Check if any products are directly linked
    const linkedProducts = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.subCategoryId, id));

    if (linkedProducts[0].count > 0) {
      throw new Error("Cannot delete subcategory with linked products");
    }

    const [deleted] = await db
      .delete(subCategories)
      .where(eq(subCategories.id, id))
      .returning();

    return deleted;
  }

  async getAllWithSubSubCategories() {
    const subcats = await this.findAll();
    const result = await Promise.all(
      subcats.map(async (subcat) => {
        const subsubcats = await db
          .select()
          .from(subSubCategories)
          .where(eq(subSubCategories.subCategoryId, subcat.id));
        return { ...subcat, subSubCategories: subsubcats };
      })
    );
    return result;
  }
}
