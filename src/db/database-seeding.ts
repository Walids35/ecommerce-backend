import { eq, and } from "drizzle-orm";
import { db } from "./data-source";

import { user } from "./schema/users";
import bcrypt from "bcrypt";

import { categories } from "./schema/categories";
import {
  subCategories,
  subCategoryAttributes,
  subCategoryAttributeValues,
} from "./schema/subcategories";

import { productAttributeValues, products } from "./schema/product";

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // -------------------------------
    // ADMIN USER
    // -------------------------------
    const existingAdmin = await db
      .select()
      .from(user)
      .where(eq(user.email, "admin@gmail.com"))
      .limit(1);

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash("admin2025", 10);

      await db.insert(user).values({
        email: "admin@gmail.com",
        password: hashedPassword,
        name: "System Admin",
        role: "admin",
      });

      console.log("✔ Admin user seeded");
    } else {
      console.log("ℹ Admin user already exists");
    }

    // -------------------------------
    // CATEGORY SEEDING
    // -------------------------------
    async function seedCategory(name: string, description: string) {
      const exists = await db
        .select()
        .from(categories)
        .where(eq(categories.name, name))
        .limit(1);

      if (exists.length > 0) return exists[0];

      return (
        await db.insert(categories).values({ name, description }).returning()
      )[0];
    }

    const catElectronics = await seedCategory("Electronics", "Gadgets");
    const catFurniture = await seedCategory("Furniture", "Home/office");

    console.log("✔ Categories seeded");

    // -------------------------------
    // SUBCATEGORIES
    // -------------------------------
    async function seedSubCategory(name: string, categoryId: number) {
      const exists = await db
        .select()
        .from(subCategories)
        .where(
          and(eq(subCategories.name, name), eq(subCategories.categoryId, categoryId))
        );

      if (exists.length > 0) return exists[0];

      return (
        await db
          .insert(subCategories)
          .values({ name, categoryId })
          .returning()
      )[0];
    }

    const laptopSub = await seedSubCategory("Laptops", catElectronics.id);
    const phoneSub = await seedSubCategory("Smartphones", catElectronics.id);
    const chairSub = await seedSubCategory("Office Chairs", catFurniture.id);

    console.log("✔ Subcategories seeded");

    // -------------------------------
    // ATTRIBUTE DEFINITIONS
    // -------------------------------
    async function seedAttribute(subCategoryId: number, name: string) {
      const exists = await db
        .select()
        .from(subCategoryAttributes)
        .where(
          and(
            eq(subCategoryAttributes.subCategoryId, subCategoryId),
            eq(subCategoryAttributes.name, name)
          )
        );

      if (exists.length > 0) return exists[0];

      return (
        await db
          .insert(subCategoryAttributes)
          .values({ subCategoryId, name })
          .returning()
      )[0];
    }

    const ramAttr = await seedAttribute(laptopSub.id, "RAM");
    const cpuAttr = await seedAttribute(laptopSub.id, "Processor");
    const storageAttr = await seedAttribute(laptopSub.id, "Storage");

    const phoneScreenAttr = await seedAttribute(phoneSub.id, "Screen Size");
    const phoneBatteryAttr = await seedAttribute(phoneSub.id, "Battery");
    const phoneCameraAttr = await seedAttribute(phoneSub.id, "Camera");

    const materialAttr = await seedAttribute(chairSub.id, "Material");
    const weightAttr = await seedAttribute(chairSub.id, "Max Weight");

    console.log("✔ Attributes seeded");

    // -------------------------------
    // ATTRIBUTE VALUES
    // -------------------------------
    async function seedAttributeValue(attributeId: number, value: string) {
      const exists = await db
        .select()
        .from(subCategoryAttributeValues)
        .where(
          and(
            eq(subCategoryAttributeValues.attributeId, attributeId),
            eq(subCategoryAttributeValues.value, value)
          )
        );

      if (exists.length > 0) return exists[0];

      return (
        await db
          .insert(subCategoryAttributeValues)
          .values({ attributeId, value })
          .returning()
      )[0];
    }

    // Laptop attribute values
    const ram16 = await seedAttributeValue(ramAttr.id, "16GB");
    const ram32 = await seedAttributeValue(ramAttr.id, "32GB");

    const cpuI7 = await seedAttributeValue(cpuAttr.id, "Intel i7");
    const cpuI9 = await seedAttributeValue(cpuAttr.id, "Intel i9");

    const storage512 = await seedAttributeValue(storageAttr.id, "512GB SSD");
    const storage1tb = await seedAttributeValue(storageAttr.id, "1TB SSD");

    // Phone
    const screen67 = await seedAttributeValue(phoneScreenAttr.id, "6.7 inch");
    const battery4200 = await seedAttributeValue(phoneBatteryAttr.id, "4200 mAh");
    const cam48 = await seedAttributeValue(phoneCameraAttr.id, "48 MP");

    // Chair
    const materialLeather = await seedAttributeValue(materialAttr.id, "Leather");
    const weight120 = await seedAttributeValue(weightAttr.id, "120kg");

    console.log("✔ Attribute values seeded");

    // -------------------------------
    // PRODUCTS
    // -------------------------------
    async function seedProduct(
      name: string,
      description: string,
      price: string,
      stock: number,
      subCategoryId: number,
      images: string[] = [],
      datasheet: string | null = null,
      discountPercentage: string = "0"
    ) {
      const exists = await db
        .select()
        .from(products)
        .where(
          and(eq(products.name, name), eq(products.subCategoryId, subCategoryId))
        );

      if (exists.length > 0) return exists[0];

      return (
        await db
          .insert(products)
          .values({
            name,
            description,
            price,
            stock,
            subCategoryId,
            images,
            datasheet,
            discountPercentage,
          })
          .returning()
      )[0];
    }

    const dell = await seedProduct(
      "Dell XPS 15",
      "High-end laptop",
      "1899.99",
      50,
      laptopSub.id,
      ["dell.jpg"],
      null,
      "10"
    );

    const iphone = await seedProduct(
      "iPhone 15",
      "Latest iPhone model",
      "1099.00",
      120,
      phoneSub.id,
      ["iphone.jpg"]
    );

    const chair = await seedProduct(
      "ErgoMax Chair",
      "Ergonomic office chair",
      "249.99",
      30,
      chairSub.id,
      ["chair.jpg"]
    );

    console.log("✔ Products seeded");

    // -------------------------------
    // PRODUCT ATTRIBUTE VALUE LINKING
    // -------------------------------
    async function link(productId: string, attributeId: number, valueId: number) {
      const exists = await db
        .select()
        .from(productAttributeValues)
        .where(
          and(
            eq(productAttributeValues.productId, productId),
            eq(productAttributeValues.attributeId, attributeId)
          )
        );

      if (exists.length > 0) return;

      await db.insert(productAttributeValues).values({
        productId,
        attributeId,
        attributeValueId: valueId,
      });
    }

    // Dell
    await link(dell.id, ramAttr.id, ram32.id);
    await link(dell.id, cpuAttr.id, cpuI9.id);
    await link(dell.id, storageAttr.id, storage1tb.id);

    // iPhone
    await link(iphone.id, phoneScreenAttr.id, screen67.id);
    await link(iphone.id, phoneBatteryAttr.id, battery4200.id);
    await link(iphone.id, phoneCameraAttr.id, cam48.id);

    // Chair
    await link(chair.id, materialAttr.id, materialLeather.id);
    await link(chair.id, weightAttr.id, weight120.id);

    console.log("✔ Product → Attribute → Value links created");

    console.log("🌱 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

export { seedDatabase };
