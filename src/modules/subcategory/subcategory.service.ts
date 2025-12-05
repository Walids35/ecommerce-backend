import { eq, sql } from "drizzle-orm";
import { CreateSubCategoryInput, UpdateSubCategoryInput } from "./dto/subcategory.dto";
import { categories } from "../../db/schema/categories";
import { db } from "../../db/data-source";
import { subCategories } from "../../db/schema/subcategories";
import { subSubCategories } from "../../db/schema/subsubcategories";
import { products } from "../../db/schema/product";

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
        image: data.image
      })
      .returning();

    return created;
  }

  async findAll() {
    return await db.select().from(subCategories);
  }
  async findByCategoryId(categoryId: number) {
    return await db
      .select()
      .from(subCategories)
      .where(eq(subCategories.categoryId, categoryId));
  }
  async findById(id: number) {
    const result = await db
      .select()
      .from(subCategories)
      .where(eq(subCategories.id, id))
      .limit(1);

    if (result.length === 0) throw new Error("Sub-category not found");
    return result[0];
  }

  async findBySlug(slug: string) {
    const result = await db
      .select()
      .from(subCategories)
      .where(eq(subCategories.slug, slug))
      .limit(1);

    if (result.length === 0) throw new Error("Subcategory not found");
    return result[0];
  }

  async update(id: number, data: UpdateSubCategoryInput) {
    await this.findById(id);

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
    if (data.displayOrder !== undefined) payload.displayOrder = data.displayOrder;
    if (data.categoryId !== undefined) payload.categoryId = data.categoryId;

    const [updated] = await db
      .update(subCategories)
      .set(payload)
      .where(eq(subCategories.id, id))
      .returning();

    return updated;
  }

  async delete(id: number) {
    await this.findById(id);

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
}
