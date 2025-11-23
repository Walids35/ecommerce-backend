import { eq } from "drizzle-orm";
import { db } from "../../../db/data-source";
import { subCategories, subCategoryAttributes, subCategoryAttributeValues } from "../../../db/schema/subcategories";

import {
  CreateSubCategoryAttributeInput,
  UpdateSubCategoryAttributeInput,
  CreateAttributeValueInput,
} from "./dto/subcategory-attribute.dto";

export class SubCategoryAttributeService {
  // ------------------------- ATTRIBUTES CRUD -------------------------

  async create(data: CreateSubCategoryAttributeInput) {
    const exists = await db
      .select()
      .from(subCategories)
      .where(eq(subCategories.id, data.subCategoryId));

    if (exists.length === 0)
      throw new Error("Sub-category not found");

    const [created] = await db
      .insert(subCategoryAttributes)
      .values({
        subCategoryId: data.subCategoryId,
        name: data.name,
      })
      .returning();

    return created;
  }

  async findAll() {
    return await db.select().from(subCategoryAttributes);
  }

  async findById(id: number) {
    const attr = await db
      .select()
      .from(subCategoryAttributes)
      .where(eq(subCategoryAttributes.id, id));

    if (attr.length === 0)
      throw new Error("Attribute not found");

    return attr[0];
  }

  async findBySubCategoryId(subCategoryId: number) {
    return await db
      .select()
      .from(subCategoryAttributes)
      .where(eq(subCategoryAttributes.subCategoryId, subCategoryId));
  }

  async update(id: number, data: UpdateSubCategoryAttributeInput) {
    await this.findById(id);

    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload.name = data.name;

    const [updated] = await db
      .update(subCategoryAttributes)
      .set(payload)
      .where(eq(subCategoryAttributes.id, id))
      .returning();

    return updated;
  }

  async delete(id: number) {
    await this.findById(id);

    const [deleted] = await db
      .delete(subCategoryAttributes)
      .where(eq(subCategoryAttributes.id, id))
      .returning();

    return deleted;
  }

  // ------------------- ATTRIBUTE VALUES CRUD -------------------------

  async addValue(data: CreateAttributeValueInput) {
    const attribute = await this.findById(data.attributeId);

    const [created] = await db
      .insert(subCategoryAttributeValues)
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
      .from(subCategoryAttributeValues)
      .where(eq(subCategoryAttributeValues.attributeId, attributeId));
  }

  async deleteValue(valueId: number) {
    const rows = await db
      .select()
      .from(subCategoryAttributeValues)
      .where(eq(subCategoryAttributeValues.id, valueId));

    if (rows.length === 0)
      throw new Error("Attribute value not found");

    const [deleted] = await db
      .delete(subCategoryAttributeValues)
      .where(eq(subCategoryAttributeValues.id, valueId))
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

  async getAttributesWithValuesBySubCategory(subCategoryId: number) {
    const attributes = await this.findBySubCategoryId(subCategoryId);

    const results = await Promise.all(
      attributes.map(async (attr) => {
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
