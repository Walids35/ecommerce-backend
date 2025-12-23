import { eq, sql, and } from "drizzle-orm";
import { db } from "../../db/data-source";
import { subCategories, attributes, attributeValues } from "../../db/schema/subcategories";
import { subSubCategories } from "../../db/schema/subsubcategories";
import { attributeTranslations } from "../../db/schema/translations/attribute-translations";
import { attributeValueTranslations } from "../../db/schema/translations/attribute-value-translations";
import { SupportedLanguage } from "../../middlewares/language";
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

      // Check if subcategory has subsubcategories
      const hasSubSubCategories = await db
        .select({ count: sql<number>`count(*)` })
        .from(subSubCategories)
        .where(eq(subSubCategories.subCategoryId, data.subCategoryId));

      if (hasSubSubCategories[0].count > 0) {
        throw new Error(
          "Cannot create attributes for a subcategory that has subsubcategories. " +
          "Attributes can only be added to the subsubcategories themselves."
        );
      }
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

    // Insert translations if provided
    if (data.translations) {
      const translationRecords = [];

      for (const [lang, trans] of Object.entries(data.translations)) {
        if (trans) {
          translationRecords.push({
            attributeId: created.id,
            language: lang,
            name: trans.name,
          });
        }
      }

      if (translationRecords.length > 0) {
        await db.insert(attributeTranslations).values(translationRecords);
      }
    }

    return created;
  }

  async findAll(language: SupportedLanguage) {
    return await db
      .select({
        id: attributes.id,
        subCategoryId: attributes.subCategoryId,
        subSubCategoryId: attributes.subSubCategoryId,
        name: attributeTranslations.name,
      })
      .from(attributes)
      .innerJoin(
        attributeTranslations,
        and(
          eq(attributeTranslations.attributeId, attributes.id),
          eq(attributeTranslations.language, language)
        )
      );
  }

  async findById(language: SupportedLanguage, id: number) {
    const attr = await db
      .select({
        id: attributes.id,
        subCategoryId: attributes.subCategoryId,
        subSubCategoryId: attributes.subSubCategoryId,
        name: attributeTranslations.name,
      })
      .from(attributes)
      .innerJoin(
        attributeTranslations,
        and(
          eq(attributeTranslations.attributeId, attributes.id),
          eq(attributeTranslations.language, language)
        )
      )
      .where(eq(attributes.id, id))
      .limit(1);

    if (attr.length === 0) throw new Error("Attribute not found");

    return attr[0];
  }

  async findByParentId(language: SupportedLanguage, parentId: number, parentType: "subcategory" | "subsubcategory") {
    if (parentType === "subcategory") {
      return await db
        .select({
          id: attributes.id,
          subCategoryId: attributes.subCategoryId,
          subSubCategoryId: attributes.subSubCategoryId,
          name: attributeTranslations.name,
        })
        .from(attributes)
        .innerJoin(
          attributeTranslations,
          and(
            eq(attributeTranslations.attributeId, attributes.id),
            eq(attributeTranslations.language, language)
          )
        )
        .where(eq(attributes.subCategoryId, parentId));
    } else {
      return await db
        .select({
          id: attributes.id,
          subCategoryId: attributes.subCategoryId,
          subSubCategoryId: attributes.subSubCategoryId,
          name: attributeTranslations.name,
        })
        .from(attributes)
        .innerJoin(
          attributeTranslations,
          and(
            eq(attributeTranslations.attributeId, attributes.id),
            eq(attributeTranslations.language, language)
          )
        )
        .where(eq(attributes.subSubCategoryId, parentId));
    }
  }

  async update(id: number, data: UpdateAttributeInput) {
    await this.findById('en', id);

    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload.name = data.name;

    const [updated] = await db
      .update(attributes)
      .set(payload)
      .where(eq(attributes.id, id))
      .returning();

    // Upsert translations if provided
    if (data.translations) {
      for (const [lang, trans] of Object.entries(data.translations)) {
        if (trans) {
          const existing = await db
            .select()
            .from(attributeTranslations)
            .where(
              and(
                eq(attributeTranslations.attributeId, id),
                eq(attributeTranslations.language, lang)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            // Update existing translation
            await db
              .update(attributeTranslations)
              .set({
                name: trans.name,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(attributeTranslations.attributeId, id),
                  eq(attributeTranslations.language, lang)
                )
              );
          } else {
            // Insert new translation
            await db.insert(attributeTranslations).values({
              attributeId: id,
              language: lang,
              name: trans.name,
            });
          }
        }
      }
    }

    return updated;
  }

  async delete(id: number) {
    await this.findById('en', id);

    const [deleted] = await db
      .delete(attributes)
      .where(eq(attributes.id, id))
      .returning();

    return deleted;
  }

  // ------------------- ATTRIBUTE VALUES CRUD -------------------------

  async addValue(data: CreateAttributeValueInput) {
    await this.findById('en', data.attributeId);

    const [created] = await db
      .insert(attributeValues)
      .values({
        attributeId: data.attributeId,
        value: data.value,
      })
      .returning();

    // Insert translations if provided
    if (data.translations) {
      const translationRecords = [];

      for (const [lang, trans] of Object.entries(data.translations)) {
        if (trans) {
          translationRecords.push({
            attributeValueId: created.id,
            language: lang,
            value: trans.value,
          });
        }
      }

      if (translationRecords.length > 0) {
        await db.insert(attributeValueTranslations).values(translationRecords);
      }
    }

    return created;
  }

  async getValuesByAttribute(language: SupportedLanguage, attributeId: number) {
    return await db
      .select({
        id: attributeValues.id,
        attributeId: attributeValues.attributeId,
        value: attributeValueTranslations.value,
      })
      .from(attributeValues)
      .innerJoin(
        attributeValueTranslations,
        and(
          eq(attributeValueTranslations.attributeValueId, attributeValues.id),
          eq(attributeValueTranslations.language, language)
        )
      )
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

  async findAttributeWithValues(language: SupportedLanguage, attributeId: number) {
    const attribute = await this.findById(language, attributeId);
    const values = await this.getValuesByAttribute(language, attributeId);

    return {
      ...attribute,
      values,
    };
  }

  async getAttributesWithValuesByParent(
    language: SupportedLanguage,
    parentId: number,
    parentType: "subcategory" | "subsubcategory"
  ) {
    const attrs = await this.findByParentId(language, parentId, parentType);

    const results = await Promise.all(
      attrs.map(async (attr) => {
        const values = await this.getValuesByAttribute(language, attr.id);
        return {
          ...attr,
          values,
        };
      })
    );

    return results;
  }
}
