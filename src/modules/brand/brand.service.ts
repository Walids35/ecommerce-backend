import { eq, asc, sql } from "drizzle-orm";
import { db } from "../../db/data-source";
import { brands } from "../../db/schema/brands";
import { products } from "../../db/schema/product";
import { NotFoundError, ConflictError, BadRequestError } from "../../utils/errors";
import { CreateBrandDto, UpdateBrandDto } from "./dto/brand.dto";

export class BrandService {
  async getAll() {
    return db
      .select()
      .from(brands)
      .orderBy(asc(brands.displayOrder), asc(brands.name));
  }

  async getById(id: number) {
    const result = await db
      .select()
      .from(brands)
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

    const result = await db
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

    return result[0];
  }

  async update(id: number, data: UpdateBrandDto) {
    const existing = await this.getById(id);

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

    const result = await db
      .update(brands)
      .set(payload)
      .where(eq(brands.id, id))
      .returning();

    return result[0];
  }

  async delete(id: number) {
    await this.getById(id); // Validates brand exists

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
