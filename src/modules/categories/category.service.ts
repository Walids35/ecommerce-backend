import { eq, sql } from "drizzle-orm";
import { db } from "../../db/data-source";
import { categories } from "../../db/schema/categories";
import { subCategories } from "../../db/schema/subcategories";
import { NotFoundError, ConflictError, BadRequestError } from "../../utils/errors";

export class CategoryService {
  async getAll() {
    return db
      .select()
      .from(categories)
      .orderBy(categories.displayOrder, categories.name);
  }

  async getById(id: number) {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (result.length === 0) return null;
    return result[0];
  }

  async getBySlug(slug: string) {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
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

    const result = await db
      .insert(categories)
      .values({
        name: data.name,
        description: data.description,
        slug: data.slug,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
      })
      .returning();

    return result[0];
  }

  async update(
    id: number,
    data: Partial<{
      name: string;
      description: string;
      slug: string;
      isActive: boolean;
      displayOrder: number;
    }>
  ) {
    const existing = await this.getById(id);
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

    const result = await db
      .update(categories)
      .set(payload)
      .where(eq(categories.id, id))
      .returning();

    return result[0];
  }

  async delete(id: number) {
    const existing = await this.getById(id);
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
