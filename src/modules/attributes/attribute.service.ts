import { eq, sql } from "drizzle-orm";
import { db } from "../../db/data-source";
import { subCategories, attributes, attributeValues } from "../../db/schema/subcategories";
import { subSubCategories } from "../../db/schema/subsubcategories";
import {
  CreateAttributeInput,
  UpdateAttributeInput,
  CreateAttributeValueInput,
} from "./dto/attribute.dto";

export class AttributeService {
  // ------------------------- ATTRIBUTES CRUD -------------------------

  async create(data: CreateAttributeInput) {
    // Validate parent exists
    if (data.subCategoryId) {
      const exists = await db
        .select()
        .from(subCategories)
        .where(eq(subCategories.id, data.subCategoryId))
        .limit(1);

      if (exists.length === 0) throw new Error("Subcategory not found");
    } else if (data.subSubCategoryId) {
      const exists = await db
        .select()
        .from(subSubCategories)
        .where(eq(subSubCategories.id, data.subSubCategoryId))
        .limit(1);

      if (exists.length === 0) throw new Error("Subsubcategory not found");
    } else {
      throw new Error("Either subCategoryId or subSubCategoryId must be provided");
    }

    const [created] = await db
      .insert(attributes)
      .values({
        name: data.name,
        subCategoryId: data.subCategoryId ?? null,
        subSubCategoryId: data.subSubCategoryId ?? null,
      })
      .returning();

    return created;
  }

  async findAll() {
    return await db.select().from(attributes);
  }

  async findById(id: number) {
    const attr = await db
      .select()
      .from(attributes)
      .where(eq(attributes.id, id))
      .limit(1);

    if (attr.length === 0) throw new Error("Attribute not found");

    return attr[0];
  }

  async findByParentId(parentId: number, parentType: "subcategory" | "subsubcategory") {
    if (parentType === "subcategory") {
      return await db
        .select()
        .from(attributes)
        .where(eq(attributes.subCategoryId, parentId));
    } else {
      return await db
        .select()
        .from(attributes)
        .where(eq(attributes.subSubCategoryId, parentId));
    }
  }

  async update(id: number, data: UpdateAttributeInput) {
    await this.findById(id);

    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload.name = data.name;

    const [updated] = await db
      .update(attributes)
      .set(payload)
      .where(eq(attributes.id, id))
      .returning();

    return updated;
  }

  async delete(id: number) {
    await this.findById(id);

    const [deleted] = await db
      .delete(attributes)
      .where(eq(attributes.id, id))
      .returning();

    return deleted;
  }

  // ------------------- ATTRIBUTE VALUES CRUD -------------------------

  async addValue(data: CreateAttributeValueInput) {
    await this.findById(data.attributeId);

    const [created] = await db
      .insert(attributeValues)
      .values({
        attributeId: data.attributeId,
        value: data.value,
      })
      .returning();

    return created;
  }

  async getValuesByAttribute(attributeId: number) {
    return await db
      .select()
      .from(attributeValues)
      .where(eq(attributeValues.attributeId, attributeId));
  }

  async deleteValue(valueId: number) {
    const rows = await db
      .select()
      .from(attributeValues)
      .where(eq(attributeValues.id, valueId))
      .limit(1);

    if (rows.length === 0) throw new Error("Attribute value not found");

    const [deleted] = await db
      .delete(attributeValues)
      .where(eq(attributeValues.id, valueId))
      .returning();

    return deleted;
  }

  // ------------------- FULL ATTRIBUTE WITH VALUES -------------------------

  async findAttributeWithValues(attributeId: number) {
    const attribute = await this.findById(attributeId);
    const values = await this.getValuesByAttribute(attributeId);

    return {
      ...attribute,
      values,
    };
  }

  async getAttributesWithValuesByParent(
    parentId: number,
    parentType: "subcategory" | "subsubcategory"
  ) {
    const attrs = await this.findByParentId(parentId, parentType);

    const results = await Promise.all(
      attrs.map(async (attr) => {
        const values = await this.getValuesByAttribute(attr.id);
        return {
          ...attr,
          values,
        };
      })
    );

    return results;
  }
}
