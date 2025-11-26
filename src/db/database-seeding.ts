import { eq, and, sql } from "drizzle-orm";
import { db } from "./data-source";

import { user } from "./schema/users";
import bcrypt from "bcrypt";

import { categories } from "./schema/categories";
import { subCategories, attributes, attributeValues } from "./schema/subcategories";
import { subSubCategories } from "./schema/subsubcategories";
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
    // CATEGORIES
    // -------------------------------
    async function seedCategory(
      name: string,
      description: string,
      slug: string,
      displayOrder: number = 0
    ) {
      const exists = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);

      if (exists.length > 0) return exists[0];

      return (
        await db
          .insert(categories)
          .values({ name, description, slug, isActive: true, displayOrder })
          .returning()
      )[0];
    }

    const catElectronics = await seedCategory("Electronics", "Electronic gadgets and devices", "electronics", 0);
    const catFurniture = await seedCategory("Furniture", "Home and office furniture", "furniture", 1);

    console.log("✔ Categories seeded");

    // -------------------------------
    // SUBCATEGORIES
    // -------------------------------
    async function seedSubCategory(
      name: string,
      categoryId: number,
      slug: string,
      description: string = "",
      displayOrder: number = 0
    ) {
      const exists = await db
        .select()
        .from(subCategories)
        .where(eq(subCategories.slug, slug))
        .limit(1);

      if (exists.length > 0) return exists[0];

      return (
        await db
          .insert(subCategories)
          .values({ name, categoryId, slug, description, isActive: true, displayOrder })
          .returning()
      )[0];
    }

    const laptopSub = await seedSubCategory("Laptops", catElectronics.id, "laptops", "Portable computers", 0);
    const tabletSub = await seedSubCategory("Tablets", catElectronics.id, "tablets", "Tablet devices", 1);
    const chairSub = await seedSubCategory("Office Chairs", catFurniture.id, "office-chairs", "Ergonomic office seating", 0);

    console.log("✔ Subcategories seeded");

    // -------------------------------
    // SUBSUBCATEGORIES
    // -------------------------------
    async function seedSubSubCategory(
      name: string,
      subCategoryId: number,
      slug: string,
      description: string = "",
      displayOrder: number = 0
    ) {
      const exists = await db
        .select()
        .from(subSubCategories)
        .where(eq(subSubCategories.slug, slug))
        .limit(1);

      if (exists.length > 0) return exists[0];

      return (
        await db
          .insert(subSubCategories)
          .values({ name, subCategoryId, slug, description, isActive: true, displayOrder })
          .returning()
      )[0];
    }

    const gamingLaptopSub = await seedSubSubCategory("Gaming Laptops", laptopSub.id, "gaming-laptops", "High-performance gaming laptops", 0);
    const businessLaptopSub = await seedSubSubCategory("Business Laptops", laptopSub.id, "business-laptops", "Professional laptops for work", 1);

    console.log("✔ Subsubcategories seeded");

    // -------------------------------
    // ATTRIBUTES (Flexible parent linking)
    // -------------------------------
    async function seedAttribute(
      name: string,
      subCategoryId?: number,
      subSubCategoryId?: number
    ) {
      const exists = await db
        .select()
        .from(attributes)
        .where(
          and(
            eq(attributes.name, name),
            subCategoryId ? eq(attributes.subCategoryId, subCategoryId) : sql`${attributes.subCategoryId} IS NULL`,
            subSubCategoryId ? eq(attributes.subSubCategoryId, subSubCategoryId) : sql`${attributes.subSubCategoryId} IS NULL`
          )
        )
        .limit(1);

      if (exists.length > 0) return exists[0];

      return (
        await db
          .insert(attributes)
          .values({ name, subCategoryId: subCategoryId ?? null, subSubCategoryId: subSubCategoryId ?? null })
          .returning()
      )[0];
    }

    // Gaming Laptop attributes (subsubcategory level)
    const gpuAttr = await seedAttribute("GPU", undefined, gamingLaptopSub.id);
    const refreshRateAttr = await seedAttribute("Refresh Rate", undefined, gamingLaptopSub.id);

    // Business Laptop attributes (subsubcategory level)
    const weightAttr = await seedAttribute("Weight", undefined, businessLaptopSub.id);
    const batteryLifeAttr = await seedAttribute("Battery Life", undefined, businessLaptopSub.id);

    // Shared Laptop attributes (subcategory level - inherited by all laptop types)
    const ramAttr = await seedAttribute("RAM", laptopSub.id);
    const cpuAttr = await seedAttribute("Processor", laptopSub.id);
    const storageAttr = await seedAttribute("Storage", laptopSub.id);

    // Tablet attributes (subcategory level - tablets have no subsubcategory)
    const screenSizeAttr = await seedAttribute("Screen Size", tabletSub.id);
    const tabletStorageAttr = await seedAttribute("Storage", tabletSub.id);

    // Chair attributes
    const materialAttr = await seedAttribute("Material", chairSub.id);
    const maxWeightAttr = await seedAttribute("Max Weight", chairSub.id);

    console.log("✔ Attributes seeded");

    // -------------------------------
    // ATTRIBUTE VALUES
    // -------------------------------
    async function seedAttributeValue(attributeId: number, value: string) {
      const exists = await db
        .select()
        .from(attributeValues)
        .where(
          and(
            eq(attributeValues.attributeId, attributeId),
            eq(attributeValues.value, value)
          )
        )
        .limit(1);

      if (exists.length > 0) return exists[0];

      return (
        await db
          .insert(attributeValues)
          .values({ attributeId, value })
          .returning()
      )[0];
    }

    // Shared laptop attribute values
    const ram16 = await seedAttributeValue(ramAttr.id, "16GB");
    const ram32 = await seedAttributeValue(ramAttr.id, "32GB");
    const cpuI7 = await seedAttributeValue(cpuAttr.id, "Intel i7");
    const cpuI9 = await seedAttributeValue(cpuAttr.id, "Intel i9");
    const storage512 = await seedAttributeValue(storageAttr.id, "512GB SSD");
    const storage1tb = await seedAttributeValue(storageAttr.id, "1TB SSD");

    // Gaming laptop specific
    const gpuRtx4070 = await seedAttributeValue(gpuAttr.id, "RTX 4070");
    const gpuRtx4090 = await seedAttributeValue(gpuAttr.id, "RTX 4090");
    const refresh144 = await seedAttributeValue(refreshRateAttr.id, "144Hz");
    const refresh240 = await seedAttributeValue(refreshRateAttr.id, "240Hz");

    // Business laptop specific
    const weight15kg = await seedAttributeValue(weightAttr.id, "1.5kg");
    const weight18kg = await seedAttributeValue(weightAttr.id, "1.8kg");
    const battery10h = await seedAttributeValue(batteryLifeAttr.id, "10 hours");
    const battery15h = await seedAttributeValue(batteryLifeAttr.id, "15 hours");

    // Tablet
    const screen10 = await seedAttributeValue(screenSizeAttr.id, "10.5 inch");
    const screen11 = await seedAttributeValue(screenSizeAttr.id, "11 inch");
    const tablet128 = await seedAttributeValue(tabletStorageAttr.id, "128GB");
    const tablet256 = await seedAttributeValue(tabletStorageAttr.id, "256GB");

    // Chair
    const materialLeather = await seedAttributeValue(materialAttr.id, "Leather");
    const materialMesh = await seedAttributeValue(materialAttr.id, "Mesh");
    const weight120 = await seedAttributeValue(maxWeightAttr.id, "120kg");
    const weight150 = await seedAttributeValue(maxWeightAttr.id, "150kg");

    console.log("✔ Attribute values seeded");

    // -------------------------------
    // PRODUCTS (Flexible category linking)
    // -------------------------------
    async function seedProduct(
      name: string,
      description: string,
      price: string,
      stock: number,
      subCategoryId?: number,
      subSubCategoryId?: number,
      images: string[] = [],
      datasheet: string | null = null,
      discountPercentage: string = "0"
    ) {
      const exists = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.name, name),
            subCategoryId ? eq(products.subCategoryId, subCategoryId) : sql`${products.subCategoryId} IS NULL`,
            subSubCategoryId ? eq(products.subSubCategoryId, subSubCategoryId) : sql`${products.subSubCategoryId} IS NULL`
          )
        )
        .limit(1);

      if (exists.length > 0) return exists[0];

      return (
        await db
          .insert(products)
          .values({
            name,
            description,
            price,
            stock,
            subCategoryId: subCategoryId ?? null,
            subSubCategoryId: subSubCategoryId ?? null,
            images,
            datasheet,
            discountPercentage,
          })
          .returning()
      )[0];
    }

    // Gaming Laptops (at subsubcategory level)
    const rog = await seedProduct(
      "ASUS ROG Strix",
      "High-end gaming laptop with RGB",
      "2299.99",
      25,
      undefined,
      gamingLaptopSub.id,
      ["rog.jpg"],
      null,
      "5"
    );

    const msi = await seedProduct(
      "MSI GE76 Raider",
      "Powerful gaming laptop",
      "2599.99",
      15,
      undefined,
      gamingLaptopSub.id,
      ["msi.jpg"]
    );

    // Business Laptops (at subsubcategory level)
    const thinkpad = await seedProduct(
      "ThinkPad X1 Carbon",
      "Ultra-portable business laptop",
      "1899.99",
      40,
      undefined,
      businessLaptopSub.id,
      ["thinkpad.jpg"],
      null,
      "10"
    );

    const latitude = await seedProduct(
      "Dell Latitude 9000",
      "Enterprise-grade laptop",
      "2099.99",
      30,
      undefined,
      businessLaptopSub.id,
      ["latitude.jpg"]
    );

    // Tablets (at subcategory level - no subsubcategory)
    const ipad = await seedProduct(
      "iPad Air",
      "Lightweight and powerful tablet",
      "599.99",
      80,
      tabletSub.id,
      undefined,
      ["ipad.jpg"]
    );

    const galaxy = await seedProduct(
      "Samsung Galaxy Tab S9",
      "Android tablet with S Pen",
      "749.99",
      60,
      tabletSub.id,
      undefined,
      ["galaxy-tab.jpg"],
      null,
      "15"
    );

    // Chairs (at subcategory level)
    const ergomax = await seedProduct(
      "ErgoMax Pro",
      "Premium ergonomic office chair",
      "349.99",
      50,
      chairSub.id,
      undefined,
      ["ergomax.jpg"]
    );

    const herman = await seedProduct(
      "Herman Miller Aeron",
      "Legendary office chair",
      "1299.99",
      20,
      chairSub.id,
      undefined,
      ["aeron.jpg"]
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
        )
        .limit(1);

      if (exists.length > 0) return;

      await db.insert(productAttributeValues).values({
        productId,
        attributeId,
        attributeValueId: valueId,
      });
    }

    // ASUS ROG (gaming laptop)
    await link(rog.id, ramAttr.id, ram32.id);
    await link(rog.id, cpuAttr.id, cpuI9.id);
    await link(rog.id, storageAttr.id, storage1tb.id);
    await link(rog.id, gpuAttr.id, gpuRtx4090.id);
    await link(rog.id, refreshRateAttr.id, refresh240.id);

    // MSI (gaming laptop)
    await link(msi.id, ramAttr.id, ram32.id);
    await link(msi.id, cpuAttr.id, cpuI9.id);
    await link(msi.id, storageAttr.id, storage1tb.id);
    await link(msi.id, gpuAttr.id, gpuRtx4070.id);
    await link(msi.id, refreshRateAttr.id, refresh144.id);

    // ThinkPad (business laptop)
    await link(thinkpad.id, ramAttr.id, ram16.id);
    await link(thinkpad.id, cpuAttr.id, cpuI7.id);
    await link(thinkpad.id, storageAttr.id, storage512.id);
    await link(thinkpad.id, weightAttr.id, weight15kg.id);
    await link(thinkpad.id, batteryLifeAttr.id, battery15h.id);

    // Latitude (business laptop)
    await link(latitude.id, ramAttr.id, ram16.id);
    await link(latitude.id, cpuAttr.id, cpuI7.id);
    await link(latitude.id, storageAttr.id, storage512.id);
    await link(latitude.id, weightAttr.id, weight18kg.id);
    await link(latitude.id, batteryLifeAttr.id, battery10h.id);

    // iPad (tablet)
    await link(ipad.id, screenSizeAttr.id, screen11.id);
    await link(ipad.id, tabletStorageAttr.id, tablet256.id);

    // Galaxy Tab (tablet)
    await link(galaxy.id, screenSizeAttr.id, screen10.id);
    await link(galaxy.id, tabletStorageAttr.id, tablet128.id);

    // ErgoMax (chair)
    await link(ergomax.id, materialAttr.id, materialMesh.id);
    await link(ergomax.id, maxWeightAttr.id, weight120.id);

    // Herman Miller (chair)
    await link(herman.id, materialAttr.id, materialMesh.id);
    await link(herman.id, maxWeightAttr.id, weight150.id);

    console.log("✔ Product → Attribute → Value links created");

    console.log("🌱 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

export { seedDatabase };
