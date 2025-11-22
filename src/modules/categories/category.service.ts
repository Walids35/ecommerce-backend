import { eq } from "drizzle-orm";
import { db } from "../../db/data-source";
import { categories } from "../../db/schema/categories";

export class CategoryService {
  async getAll() {
    return db.select().from(categories).orderBy(categories.id);
  }

  async getById(id: number) {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);

    if (result.length === 0) return null;
    return result[0];
  }

  async create(data: { name: string; description?: string }) {
    // Check existing name
    const exists = await db
      .select()
      .from(categories)
      .where(eq(categories.name, data.name))
      .limit(1);

    if (exists.length > 0) throw new Error("Category already exists");

    const result = await db.insert(categories).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<{ name: string; description: string }>) {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Category not found");

    const result = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return result[0];
  }

  async delete(id: number) {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Category not found");

    await db.delete(categories).where(eq(categories.id, id));
    return { message: "Category deleted successfully" };
  }
}
