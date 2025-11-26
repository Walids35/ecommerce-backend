import { eq, sql } from "drizzle-orm";
import { CreateSubSubCategoryInput, UpdateSubSubCategoryInput } from "./dto/subsubcategory.dto";
import { subCategories, attributes } from "../../db/schema/subcategories";
import { subSubCategories } from "../../db/schema/subsubcategories";
import { products } from "../../db/schema/product";
import { db } from "../../db/data-source";

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
      })
      .returning();

    return created;
  }

  async findAll() {
    return await db.select().from(subSubCategories);
  }

  async findById(id: number) {
    const result = await db
      .select()
      .from(subSubCategories)
      .where(eq(subSubCategories.id, id))
      .limit(1);

    if (result.length === 0) throw new Error("Subsubcategory not found");
    return result[0];
  }

  async findBySubCategoryId(subCategoryId: number) {
    return await db
      .select()
      .from(subSubCategories)
      .where(eq(subSubCategories.subCategoryId, subCategoryId));
  }

  async findBySlug(slug: string) {
    const result = await db
      .select()
      .from(subSubCategories)
      .where(eq(subSubCategories.slug, slug))
      .limit(1);

    if (result.length === 0) throw new Error("Subsubcategory not found");
    return result[0];
  }

  async update(id: number, data: UpdateSubSubCategoryInput) {
    await this.findById(id);

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

    return updated;
  }

  async delete(id: number) {
    await this.findById(id);

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
