import { eq, asc, sql } from "drizzle-orm";
import { db } from "../../db/data-source";
import { brands } from "../../db/schema/brands";
import { products } from "../../db/schema/product";
import { NotFoundError, ConflictError, BadRequestError } from "../../utils/errors";
import { CreateBrandDto, UpdateBrandDto } from "./dto/brand.dto";

export class BrandService {
  async getAll() {
    return db
      .select({
        id: brands.id,
        name: brands.name,
        logo: brands.logo,
        isActive: brands.isActive,
        createdAt: brands.createdAt,
        updatedAt: brands.updatedAt,
      })
      .from(brands)
      .orderBy(asc(brands.name));
  }

  async getById(id: number) {
    const result = await db
      .select({
        id: brands.id,
        name: brands.name,
        logo: brands.logo,
        isActive: brands.isActive,
        createdAt: brands.createdAt,
        updatedAt: brands.updatedAt,
      })
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

    const [created] = await db
      .insert(brands)
      .values({
        name: data.name,
        logo: data.logo,
        isActive: data.isActive ?? true,
      })
      .returning();

    return created;
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

    const payload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) payload.name = data.name;
    if (data.logo !== undefined) payload.logo = data.logo;
    if (data.isActive !== undefined) payload.isActive = data.isActive;

    const [updated] = await db
      .update(brands)
      .set(payload)
      .where(eq(brands.id, id))
      .returning();

    return updated;
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
