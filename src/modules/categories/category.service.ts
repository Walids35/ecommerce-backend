import { eq, sql, and } from "drizzle-orm";
import { db } from "../../db/data-source";
import { categories } from "../../db/schema/categories";
import { subCategories } from "../../db/schema/subcategories";
import { subSubCategories } from "../../db/schema/subsubcategories";
import { categoryTranslations } from "../../db/schema/translations/category-translations";
import { subcategoryTranslations } from "../../db/schema/translations/subcategory-translations";
import { subsubcategoryTranslations } from "../../db/schema/translations/subsubcategory-translations";
import { SupportedLanguage } from "../../middlewares/language";
import { NotFoundError, ConflictError, BadRequestError } from "../../utils/errors";

export class CategoryService {
  async getAll(language: SupportedLanguage) {
    return db
      .select({
        id: categories.id,
        isActive: categories.isActive,
        displayOrder: categories.displayOrder,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        name: sql<string>`COALESCE(
          ct_requested.name,
          ct_fallback.name,
          ${categories.name}
        )`,
        description: sql<string>`COALESCE(
          ct_requested.description,
          ct_fallback.description,
          ${categories.description}
        )`,
        slug: sql<string>`COALESCE(
          ct_requested.slug,
          ct_fallback.slug,
          ${categories.slug}
        )`,
      })
      .from(categories)
      .leftJoin(
        sql`category_translations as ct_requested`,
        sql`ct_requested.category_id = ${categories.id} AND ct_requested.language = ${language}`
      )
      .leftJoin(
        sql`category_translations as ct_fallback`,
        sql`ct_fallback.category_id = ${categories.id} AND ct_fallback.language = 'en'`
      )
      .orderBy(categories.displayOrder);
  }
async getAllCategoriesWithSubcategories(language: SupportedLanguage) {
    const allCategories = await db
      .select({
        id: categories.id,
        isActive: categories.isActive,
        displayOrder: categories.displayOrder,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        name: categoryTranslations.name,
        description: categoryTranslations.description,
        slug: categoryTranslations.slug,
      })
      .from(categories)
      .innerJoin(
        categoryTranslations,
        and(
          eq(categoryTranslations.categoryId, categories.id),
          eq(categoryTranslations.language, language)
        )
      )
      .orderBy(categories.displayOrder, categoryTranslations.name);

    const allSubCategories = await db
      .select({
        id: subCategories.id,
        categoryId: subCategories.categoryId,
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
      .orderBy(subCategories.displayOrder, subcategoryTranslations.name);

    const allSubSubCategories = await db
      .select({
        id: subSubCategories.id,
        subCategoryId: subSubCategories.subCategoryId,
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
      .orderBy(subSubCategories.displayOrder, subsubcategoryTranslations.name);

    const result = allCategories.map(category => {
      const subcategories = allSubCategories
        .filter(sub => sub.categoryId === category.id)
        .map(sub => {
          const subsubcategories = allSubSubCategories.filter(
            subsub => subsub.subCategoryId === sub.id
          );
          return { ...sub, subsubcategories };
        });
      return { ...category, subcategories };
    });

    return result;
  }

  async getById(language: SupportedLanguage, id: number) {
    const result = await db
      .select({
        id: categories.id,
        isActive: categories.isActive,
        displayOrder: categories.displayOrder,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        name: categoryTranslations.name,
        description: categoryTranslations.description,
        slug: categoryTranslations.slug,
      })
      .from(categories)
      .innerJoin(
        categoryTranslations,
        and(
          eq(categoryTranslations.categoryId, categories.id),
          eq(categoryTranslations.language, language)
        )
      )
      .where(eq(categories.id, id))
      .limit(1);

    if (result.length === 0) return null;
    return result[0];
  }

  async getBySlug(language: SupportedLanguage, slug: string) {
    const result = await db
      .select({
        id: categories.id,
        isActive: categories.isActive,
        displayOrder: categories.displayOrder,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        name: categoryTranslations.name,
        description: categoryTranslations.description,
        slug: categoryTranslations.slug,
      })
      .from(categories)
      .innerJoin(
        categoryTranslations,
        and(
          eq(categoryTranslations.categoryId, categories.id),
          eq(categoryTranslations.language, language)
        )
      )
      .where(eq(categoryTranslations.slug, slug))
      .limit(1);

    if (result.length === 0) throw new NotFoundError("Category not found");
    return result[0];
  }

  async create(data: {
    name: string;
    description?: string;
    slug: string;
    isActive?: boolean;
    displayOrder?: number;
    translations?: {
      en?: { name: string; description?: string; slug: string };
      fr?: { name: string; description?: string; slug: string };
      ar?: { name: string; description?: string; slug: string };
    };
  }) {
    // Check name uniqueness
    const existingName = await db
      .select()
      .from(categories)
      .where(eq(categories.name, data.name))
      .limit(1);

    if (existingName.length > 0) throw new ConflictError("Category name already exists");

    // Check slug uniqueness
    const existingSlug = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, data.slug))
      .limit(1);

    if (existingSlug.length > 0) throw new ConflictError("Slug already exists");

    const [created] = await db
      .insert(categories)
      .values({
        name: data.name,
        description: data.description,
        slug: data.slug,
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
            categoryId: created.id,
            language: lang,
            name: trans.name,
            description: trans.description,
            slug: trans.slug,
          });
        }
      }

      if (translationRecords.length > 0) {
        await db.insert(categoryTranslations).values(translationRecords);
      }
    }

    return created;
  }

  async update(
    id: number,
    data: Partial<{
      name: string;
      description: string;
      slug: string;
      isActive: boolean;
      displayOrder: number;
      translations?: {
        en?: { name: string; description?: string; slug: string };
        fr?: { name: string; description?: string; slug: string };
        ar?: { name: string; description?: string; slug: string };
      };
    }>
  ) {
    const existing = await this.getById('en', id);
    if (!existing) throw new NotFoundError("Category not found");

    // Check slug uniqueness if being updated
    if (data.slug) {
      const existingSlug = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, data.slug))
        .limit(1);

      if (existingSlug.length > 0 && existingSlug[0].id !== id) {
        throw new ConflictError("Slug already exists");
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

    const [updated] = await db
      .update(categories)
      .set(payload)
      .where(eq(categories.id, id))
      .returning();

    // Upsert translations if provided
    if (data.translations) {
      for (const [lang, trans] of Object.entries(data.translations)) {
        if (trans) {
          // Check if translation exists
          const existing = await db
            .select()
            .from(categoryTranslations)
            .where(
              and(
                eq(categoryTranslations.categoryId, id),
                eq(categoryTranslations.language, lang)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            // Update existing translation
            await db
              .update(categoryTranslations)
              .set({
                name: trans.name,
                description: trans.description,
                slug: trans.slug,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(categoryTranslations.categoryId, id),
                  eq(categoryTranslations.language, lang)
                )
              );
          } else {
            // Insert new translation
            await db.insert(categoryTranslations).values({
              categoryId: id,
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
    const existing = await this.getById('en', id);
    if (!existing) throw new NotFoundError("Category not found");

    // Check if category has subcategories
    const subcats = await db
      .select({ count: sql<number>`count(*)` })
      .from(subCategories)
      .where(eq(subCategories.categoryId, id));

    if (subcats[0].count > 0) {
      throw new BadRequestError("Cannot delete category with subcategories");
    }

    await db.delete(categories).where(eq(categories.id, id));
    return { message: "Category deleted successfully" };
  }
}
