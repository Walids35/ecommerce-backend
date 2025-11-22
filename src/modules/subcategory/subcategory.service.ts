import { eq } from "drizzle-orm";
import { CreateSubCategoryInput, UpdateSubCategoryInput } from "./dto/subcategory.dto";
import { categories } from "../../db/schema/categories";
import { db } from "../../db/data-source";
import { subCategories } from "../../db/schema/subcategories";

export class SubCategoryService {
  async create(data: CreateSubCategoryInput) {
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.id, Number(data.categoryId)));

    if (category.length === 0) throw new Error("Category not found");

    const insertValues = {
      name: data.name,
      categoryId: Number(data.categoryId),
    };

    const [created] = await db.insert(subCategories).values(insertValues).returning();
    return created;
  }

  async findAll() {
    return await db.select().from(subCategories);
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(subCategories)
      .where(eq(subCategories.id, Number(id)));

    if (result.length === 0) throw new Error("Sub-category not found");
    return result[0];
  }

  async update(id: string, data: UpdateSubCategoryInput) {
    await this.findById(id);

    const payload: { 
      name?: string; 
      categoryId?: number;
    } = {};

    if (data.name !== undefined) payload.name = data.name;
    if (data.categoryId !== undefined) payload.categoryId = Number(data.categoryId);

    const [updated] = await db
      .update(subCategories)
      .set(payload)
      .where(eq(subCategories.id, Number(id)))
      .returning();

    return updated;
  }

  async delete(id: string) {
    await this.findById(id);

    const [deleted] = await db
      .delete(subCategories)
      .where(eq(subCategories.id, Number(id)))
      .returning();

    return deleted;
  }
}
