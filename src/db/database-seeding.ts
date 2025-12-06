import { eq, and, sql } from "drizzle-orm";
import { db } from "./data-source";

import { user } from "./schema/users";
import bcrypt from "bcrypt";

import { categories } from "./schema/categories";
import { subCategories, attributes, attributeValues } from "./schema/subcategories";
import { subSubCategories } from "./schema/subsubcategories";
import { productAttributeValues, products } from "./schema/product";
import { orders, orderItems, orderStatusHistory } from "./schema/orders";
import { collections, productCollections } from "./schema/collections";

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
    const gamingRamAttr = await seedAttribute("RAM", undefined, gamingLaptopSub.id);
    const gamingCpuAttr = await seedAttribute("Processor", undefined, gamingLaptopSub.id);
    const gamingStorageAttr = await seedAttribute("Storage", undefined, gamingLaptopSub.id);

    // Business Laptop attributes (subsubcategory level)
    const weightAttr = await seedAttribute("Weight", undefined, businessLaptopSub.id);
    const batteryLifeAttr = await seedAttribute("Battery Life", undefined, businessLaptopSub.id);
    const businessRamAttr = await seedAttribute("RAM", undefined, businessLaptopSub.id);
    const businessCpuAttr = await seedAttribute("Processor", undefined, businessLaptopSub.id);
    const businessStorageAttr = await seedAttribute("Storage", undefined, businessLaptopSub.id);

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

    // Gaming laptop attribute values
    const gamingRam32 = await seedAttributeValue(gamingRamAttr.id, "32GB");
    const gamingCpuI9 = await seedAttributeValue(gamingCpuAttr.id, "Intel i9");
    const gamingStorage1tb = await seedAttributeValue(gamingStorageAttr.id, "1TB SSD");
    const gpuRtx4070 = await seedAttributeValue(gpuAttr.id, "RTX 4070");
    const gpuRtx4090 = await seedAttributeValue(gpuAttr.id, "RTX 4090");
    const refresh144 = await seedAttributeValue(refreshRateAttr.id, "144Hz");
    const refresh240 = await seedAttributeValue(refreshRateAttr.id, "240Hz");

    // Business laptop attribute values
    const businessRam16 = await seedAttributeValue(businessRamAttr.id, "16GB");
    const businessCpuI7 = await seedAttributeValue(businessCpuAttr.id, "Intel i7");
    const businessStorage512 = await seedAttributeValue(businessStorageAttr.id, "512GB SSD");
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
      discountPercentage: string = "0",
      isActive: boolean = true,
      displayOrder: number = 0
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
            isActive,
            displayOrder,
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
      "5",
      true,
      1
    );

    const msi = await seedProduct(
      "MSI GE76 Raider",
      "Powerful gaming laptop",
      "2599.99",
      15,
      undefined,
      gamingLaptopSub.id,
      ["msi.jpg"],
      null,
      "0",
      true,
      2
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
      "10",
      true,
      3
    );

    const latitude = await seedProduct(
      "Dell Latitude 9000",
      "Enterprise-grade laptop",
      "2099.99",
      30,
      undefined,
      businessLaptopSub.id,
      ["latitude.jpg"],
      null,
      "0",
      true,
      4
    );

    // Tablets (at subcategory level - no subsubcategory)
    const ipad = await seedProduct(
      "iPad Air",
      "Lightweight and powerful tablet",
      "599.99",
      80,
      tabletSub.id,
      undefined,
      ["ipad.jpg"],
      null,
      "0",
      true,
      5
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
      "15",
      true,
      6
    );

    // Chairs (at subcategory level)
    const ergomax = await seedProduct(
      "ErgoMax Pro",
      "Premium ergonomic office chair",
      "349.99",
      50,
      chairSub.id,
      undefined,
      ["ergomax.jpg"],
      null,
      "0",
      true,
      7
    );

    const herman = await seedProduct(
      "Herman Miller Aeron",
      "Legendary office chair",
      "1299.99",
      20,
      chairSub.id,
      undefined,
      ["aeron.jpg"],
      null,
      "0",
      true,
      8
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
    await link(rog.id, gamingRamAttr.id, gamingRam32.id);
    await link(rog.id, gamingCpuAttr.id, gamingCpuI9.id);
    await link(rog.id, gamingStorageAttr.id, gamingStorage1tb.id);
    await link(rog.id, gpuAttr.id, gpuRtx4090.id);
    await link(rog.id, refreshRateAttr.id, refresh240.id);

    // MSI (gaming laptop)
    await link(msi.id, gamingRamAttr.id, gamingRam32.id);
    await link(msi.id, gamingCpuAttr.id, gamingCpuI9.id);
    await link(msi.id, gamingStorageAttr.id, gamingStorage1tb.id);
    await link(msi.id, gpuAttr.id, gpuRtx4070.id);
    await link(msi.id, refreshRateAttr.id, refresh144.id);

    // ThinkPad (business laptop)
    await link(thinkpad.id, businessRamAttr.id, businessRam16.id);
    await link(thinkpad.id, businessCpuAttr.id, businessCpuI7.id);
    await link(thinkpad.id, businessStorageAttr.id, businessStorage512.id);
    await link(thinkpad.id, weightAttr.id, weight15kg.id);
    await link(thinkpad.id, batteryLifeAttr.id, battery15h.id);

    // Latitude (business laptop)
    await link(latitude.id, businessRamAttr.id, businessRam16.id);
    await link(latitude.id, businessCpuAttr.id, businessCpuI7.id);
    await link(latitude.id, businessStorageAttr.id, businessStorage512.id);
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

    // -------------------------------
    // ORDERS
    // -------------------------------
    async function seedOrder(
      orderNumber: string,
      customerName: string,
      customerEmail: string,
      customerPhone: string,
      city: string,
      postalCode: string,
      streetAddress: string,
      status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled",
      paymentMethod: "devis" | "livraison" | "carte",
      isPaid: boolean,
      subtotal: string,
      shippingCost: string,
      taxAmount: string,
      totalPrice: string,
      paidAt?: Date
    ) {
      const exists = await db
        .select()
        .from(orders)
        .where(eq(orders.orderNumber, orderNumber))
        .limit(1);

      if (exists.length > 0) return exists[0];

      return (
        await db
          .insert(orders)
          .values({
            orderNumber,
            customerName,
            customerEmail,
            customerPhone,
            city,
            postalCode,
            streetAddress,
            status,
            paymentMethod,
            isPaid,
            subtotal,
            shippingCost,
            taxAmount,
            totalPrice,
            paidAt: paidAt ?? null,
          })
          .returning()
      )[0];
    }

    // Create sample orders
    const order1 = await seedOrder(
      "ORD-2025-0001",
      "John Smith",
      "john.smith@example.com",
      "+1234567890",
      "Tunis",
      "1000",
      "123 Avenue Habib Bourguiba",
      "delivered",
      "carte",
      true,
      "2299.99",
      "15.00",
      "230.00",
      "2544.99",
      new Date("2025-01-15")
    );

    const order2 = await seedOrder(
      "ORD-2025-0002",
      "Jane Doe",
      "jane.doe@example.com",
      "+1987654321",
      "Sfax",
      "3000",
      "456 Rue de la République",
      "processing",
      "livraison",
      false,
      "1349.98",
      "20.00",
      "135.00",
      "1504.98"
    );

    const order3 = await seedOrder(
      "ORD-2025-0003",
      "Ahmed Ben Ali",
      "ahmed.benali@example.com",
      "+21612345678",
      "Sousse",
      "4000",
      "789 Avenue Mohamed V",
      "pending",
      "devis",
      false,
      "599.99",
      "10.00",
      "60.00",
      "669.99"
    );

    const order4 = await seedOrder(
      "ORD-2025-0004",
      "Sarah Johnson",
      "sarah.j@example.com",
      "+1122334455",
      "Ariana",
      "2080",
      "321 Rue des Jasmins",
      "shipped",
      "carte",
      true,
      "3199.98",
      "25.00",
      "320.00",
      "3544.98",
      new Date("2025-01-20")
    );

    const order5 = await seedOrder(
      "ORD-2025-0005",
      "Mohamed Trabelsi",
      "mohamed.trabelsi@example.com",
      "+21698765432",
      "Monastir",
      "5000",
      "15 Avenue de la Liberté",
      "confirmed",
      "devis",
      false,
      "2599.99",
      "20.00",
      "260.00",
      "2879.99"
    );

    const order6 = await seedOrder(
      "ORD-2025-0006",
      "Fatma Ben Salem",
      "fatma.bensalem@example.com",
      "+21620987654",
      "Bizerte",
      "7000",
      "88 Rue de la Corniche",
      "cancelled",
      "carte",
      false,
      "749.99",
      "10.00",
      "75.00",
      "834.99"
    );

    const order7 = await seedOrder(
      "ORD-2025-0007",
      "David Wilson",
      "david.wilson@example.com",
      "+1555666777",
      "Tunis",
      "1002",
      "42 Avenue de France",
      "delivered",
      "livraison",
      true,
      "1899.99",
      "15.00",
      "190.00",
      "2104.99",
      new Date("2025-01-18")
    );

    const order8 = await seedOrder(
      "ORD-2025-0008",
      "Leila Gharbi",
      "leila.gharbi@example.com",
      "+21655443322",
      "Nabeul",
      "8000",
      "67 Avenue Habib Thameur",
      "processing",
      "carte",
      true,
      "1299.99",
      "18.00",
      "130.00",
      "1447.99",
      new Date("2025-01-22")
    );

    const order9 = await seedOrder(
      "ORD-2025-0009",
      "Robert Martinez",
      "robert.m@example.com",
      "+1888999000",
      "Sousse",
      "4002",
      "23 Rue Hedi Chaker",
      "pending",
      "devis",
      false,
      "4599.98",
      "30.00",
      "460.00",
      "5089.98"
    );

    const order10 = await seedOrder(
      "ORD-2025-0010",
      "Amira Kacem",
      "amira.kacem@example.com",
      "+21697531864",
      "Sfax",
      "3018",
      "156 Avenue Ali Belhouane",
      "shipped",
      "livraison",
      false,
      "349.99",
      "12.00",
      "35.00",
      "396.99"
    );

    const order11 = await seedOrder(
      "ORD-2025-0011",
      "Thomas Anderson",
      "t.anderson@example.com",
      "+1333444555",
      "La Marsa",
      "2070",
      "99 Avenue Taieb Mhiri",
      "delivered",
      "carte",
      true,
      "599.99",
      "10.00",
      "60.00",
      "669.99",
      new Date("2025-01-16")
    );

    const order12 = await seedOrder(
      "ORD-2025-0012",
      "Salma Messaoudi",
      "salma.messaoudi@example.com",
      "+21623456789",
      "Gabes",
      "6000",
      "34 Rue de la République",
      "confirmed",
      "carte",
      true,
      "2099.99",
      "22.00",
      "210.00",
      "2331.99",
      new Date("2025-01-23")
    );

    const order13 = await seedOrder(
      "ORD-2025-0013",
      "Michael Chen",
      "m.chen@example.com",
      "+1777888999",
      "Hammamet",
      "8050",
      "12 Avenue de la Paix",
      "processing",
      "livraison",
      false,
      "3549.97",
      "28.00",
      "355.00",
      "3932.97"
    );

    const order14 = await seedOrder(
      "ORD-2025-0014",
      "Nadia Jlassi",
      "nadia.jlassi@example.com",
      "+21641852963",
      "Kairouan",
      "3100",
      "78 Avenue Ibn El Jazzar",
      "pending",
      "devis",
      false,
      "1349.98",
      "18.00",
      "135.00",
      "1502.98"
    );

    console.log("✔ Orders seeded");

    // -------------------------------
    // ORDER ITEMS
    // -------------------------------
    async function seedOrderItem(
      orderId: number,
      productId: string,
      productName: string,
      unitPrice: string,
      quantity: number,
      subtotal: string
    ) {
      const exists = await db
        .select()
        .from(orderItems)
        .where(
          and(
            eq(orderItems.orderId, orderId),
            eq(orderItems.productId, productId)
          )
        )
        .limit(1);

      if (exists.length > 0) return exists[0];

      return (
        await db
          .insert(orderItems)
          .values({
            orderId,
            productId,
            productName,
            unitPrice,
            quantity,
            subtotal,
          })
          .returning()
      )[0];
    }

    // Order 1: ASUS ROG
    await seedOrderItem(order1.id, rog.id, "ASUS ROG Strix", "2299.99", 1, "2299.99");

    // Order 2: ErgoMax + iPad
    await seedOrderItem(order2.id, ergomax.id, "ErgoMax Pro", "349.99", 1, "349.99");
    await seedOrderItem(order2.id, ipad.id, "iPad Air", "599.99", 1, "599.99");
    await seedOrderItem(order2.id, galaxy.id, "Samsung Galaxy Tab S9", "749.99", 1, "749.99");

    // Order 3: iPad only
    await seedOrderItem(order3.id, ipad.id, "iPad Air", "599.99", 1, "599.99");

    // Order 4: ThinkPad + Herman Miller
    await seedOrderItem(order4.id, thinkpad.id, "ThinkPad X1 Carbon", "1899.99", 1, "1899.99");
    await seedOrderItem(order4.id, herman.id, "Herman Miller Aeron", "1299.99", 1, "1299.99");

    // Order 5: MSI Gaming Laptop
    await seedOrderItem(order5.id, msi.id, "MSI GE76 Raider", "2599.99", 1, "2599.99");

    // Order 6: Samsung Galaxy Tab (cancelled order)
    await seedOrderItem(order6.id, galaxy.id, "Samsung Galaxy Tab S9", "749.99", 1, "749.99");

    // Order 7: ThinkPad only
    await seedOrderItem(order7.id, thinkpad.id, "ThinkPad X1 Carbon", "1899.99", 1, "1899.99");

    // Order 8: Herman Miller chair
    await seedOrderItem(order8.id, herman.id, "Herman Miller Aeron", "1299.99", 1, "1299.99");

    // Order 9: ASUS ROG + MSI (2 gaming laptops)
    await seedOrderItem(order9.id, rog.id, "ASUS ROG Strix", "2299.99", 1, "2299.99");
    await seedOrderItem(order9.id, msi.id, "MSI GE76 Raider", "2599.99", 1, "2599.99");

    // Order 10: ErgoMax chair only
    await seedOrderItem(order10.id, ergomax.id, "ErgoMax Pro", "349.99", 1, "349.99");

    // Order 11: iPad only
    await seedOrderItem(order11.id, ipad.id, "iPad Air", "599.99", 1, "599.99");

    // Order 12: Dell Latitude
    await seedOrderItem(order12.id, latitude.id, "Dell Latitude 9000", "2099.99", 1, "2099.99");

    // Order 13: iPad + Galaxy Tab + ErgoMax (variety)
    await seedOrderItem(order13.id, ipad.id, "iPad Air", "599.99", 1, "599.99");
    await seedOrderItem(order13.id, galaxy.id, "Samsung Galaxy Tab S9", "749.99", 1, "749.99");
    await seedOrderItem(order13.id, ergomax.id, "ErgoMax Pro", "349.99", 2, "699.99");
    await seedOrderItem(order13.id, thinkpad.id, "ThinkPad X1 Carbon", "1899.99", 1, "1899.99");

    // Order 14: ErgoMax + iPad
    await seedOrderItem(order14.id, ergomax.id, "ErgoMax Pro", "349.99", 1, "349.99");
    await seedOrderItem(order14.id, ipad.id, "iPad Air", "599.99", 1, "599.99");
    await seedOrderItem(order14.id, galaxy.id, "Samsung Galaxy Tab S9", "749.99", 1, "749.99");

    console.log("✔ Order items seeded");

    // -------------------------------
    // ORDER STATUS HISTORY
    // -------------------------------
    async function seedStatusHistory(
      orderId: number,
      oldStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | null,
      newStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled",
      changedBy: string
    ) {
      const exists = await db
        .select()
        .from(orderStatusHistory)
        .where(
          and(
            eq(orderStatusHistory.orderId, orderId),
            oldStatus !== null ? eq(orderStatusHistory.oldStatus, oldStatus) : sql`${orderStatusHistory.oldStatus} IS NULL`,
            eq(orderStatusHistory.newStatus, newStatus)
          )
        )
        .limit(1);

      if (exists.length > 0) return;

      await db.insert(orderStatusHistory).values({
        orderId,
        oldStatus,
        newStatus,
        changedBy,
      });
    }

    // Order 1 status history (delivered)
    await seedStatusHistory(order1.id, null, "pending", "System");
    await seedStatusHistory(order1.id, "pending", "confirmed", "admin@gmail.com");
    await seedStatusHistory(order1.id, "confirmed", "processing", "admin@gmail.com");
    await seedStatusHistory(order1.id, "processing", "shipped", "admin@gmail.com");
    await seedStatusHistory(order1.id, "shipped", "delivered", "System");

    // Order 2 status history (processing)
    await seedStatusHistory(order2.id, null, "pending", "System");
    await seedStatusHistory(order2.id, "pending", "confirmed", "admin@gmail.com");
    await seedStatusHistory(order2.id, "confirmed", "processing", "admin@gmail.com");

    // Order 3 status history (pending)
    await seedStatusHistory(order3.id, null, "pending", "System");

    // Order 4 status history (shipped)
    await seedStatusHistory(order4.id, null, "pending", "System");
    await seedStatusHistory(order4.id, "pending", "confirmed", "admin@gmail.com");
    await seedStatusHistory(order4.id, "confirmed", "processing", "admin@gmail.com");
    await seedStatusHistory(order4.id, "processing", "shipped", "admin@gmail.com");

    // Order 5 status history (confirmed)
    await seedStatusHistory(order5.id, null, "pending", "System");
    await seedStatusHistory(order5.id, "pending", "confirmed", "admin@gmail.com");

    // Order 6 status history (cancelled)
    await seedStatusHistory(order6.id, null, "pending", "System");
    await seedStatusHistory(order6.id, "pending", "cancelled", "admin@gmail.com");

    // Order 7 status history (delivered)
    await seedStatusHistory(order7.id, null, "pending", "System");
    await seedStatusHistory(order7.id, "pending", "confirmed", "admin@gmail.com");
    await seedStatusHistory(order7.id, "confirmed", "processing", "admin@gmail.com");
    await seedStatusHistory(order7.id, "processing", "shipped", "admin@gmail.com");
    await seedStatusHistory(order7.id, "shipped", "delivered", "System");

    // Order 8 status history (processing)
    await seedStatusHistory(order8.id, null, "pending", "System");
    await seedStatusHistory(order8.id, "pending", "confirmed", "admin@gmail.com");
    await seedStatusHistory(order8.id, "confirmed", "processing", "admin@gmail.com");

    // Order 9 status history (pending)
    await seedStatusHistory(order9.id, null, "pending", "System");

    // Order 10 status history (shipped)
    await seedStatusHistory(order10.id, null, "pending", "System");
    await seedStatusHistory(order10.id, "pending", "confirmed", "admin@gmail.com");
    await seedStatusHistory(order10.id, "confirmed", "processing", "admin@gmail.com");
    await seedStatusHistory(order10.id, "processing", "shipped", "admin@gmail.com");

    // Order 11 status history (delivered)
    await seedStatusHistory(order11.id, null, "pending", "System");
    await seedStatusHistory(order11.id, "pending", "confirmed", "admin@gmail.com");
    await seedStatusHistory(order11.id, "confirmed", "processing", "admin@gmail.com");
    await seedStatusHistory(order11.id, "processing", "shipped", "admin@gmail.com");
    await seedStatusHistory(order11.id, "shipped", "delivered", "System");

    // Order 12 status history (confirmed)
    await seedStatusHistory(order12.id, null, "pending", "System");
    await seedStatusHistory(order12.id, "pending", "confirmed", "admin@gmail.com");

    // Order 13 status history (processing)
    await seedStatusHistory(order13.id, null, "pending", "System");
    await seedStatusHistory(order13.id, "pending", "confirmed", "admin@gmail.com");
    await seedStatusHistory(order13.id, "confirmed", "processing", "admin@gmail.com");

    // Order 14 status history (pending)
    await seedStatusHistory(order14.id, null, "pending", "System");

    console.log("✔ Order status history seeded");

    // -------------------------------
    // COLLECTIONS
    // -------------------------------
    async function seedCollection(
      name: string,
      description: string,
      slug: string,
      image: string | null = null,
      displayOrder: number = 0
    ) {
      const exists = await db
        .select()
        .from(collections)
        .where(eq(collections.slug, slug))
        .limit(1);

      if (exists.length > 0) return exists[0];

      return (
        await db
          .insert(collections)
          .values({ name, description, slug, image, isActive: true, displayOrder })
          .returning()
      )[0];
    }

    const promotionsCollection = await seedCollection(
      "Promotions",
      "Special offers and discounted products",
      "promotions",
      null,
      0
    );

    const newArrivalsCollection = await seedCollection(
      "New Arrivals",
      "Recently added products to our store",
      "new-arrivals",
      null,
      1
    );

    const premiumCollection = await seedCollection(
      "Premium Products",
      "High-end and luxury items",
      "premium-products",
      null,
      2
    );

    const gamingCollection = await seedCollection(
      "Gaming Zone",
      "Everything for gamers",
      "gaming-zone",
      null,
      3
    );

    const workFromHomeCollection = await seedCollection(
      "Work From Home Essentials",
      "Perfect setup for remote work",
      "work-from-home",
      null,
      4
    );

    const mobilityCollection = await seedCollection(
      "Mobile Productivity",
      "Portable devices for on-the-go professionals",
      "mobile-productivity",
      null,
      5
    );

    console.log("✔ Collections seeded");

    // -------------------------------
    // PRODUCT-COLLECTION LINKS
    // -------------------------------
    async function linkProductToCollection(
      productId: string,
      collectionId: number,
      displayOrder: number = 0
    ) {
      const exists = await db
        .select()
        .from(productCollections)
        .where(
          and(
            eq(productCollections.productId, productId),
            eq(productCollections.collectionId, collectionId)
          )
        )
        .limit(1);

      if (exists.length > 0) return;

      await db.insert(productCollections).values({
        productId,
        collectionId,
        displayOrder,
      });
    }

    // Promotions Collection (products with discounts)
    await linkProductToCollection(rog.id, promotionsCollection.id, 1); // 5% discount
    await linkProductToCollection(thinkpad.id, promotionsCollection.id, 2); // 10% discount
    await linkProductToCollection(galaxy.id, promotionsCollection.id, 3); // 15% discount

    // New Arrivals Collection (latest products)
    await linkProductToCollection(msi.id, newArrivalsCollection.id, 1);
    await linkProductToCollection(latitude.id, newArrivalsCollection.id, 2);
    await linkProductToCollection(galaxy.id, newArrivalsCollection.id, 3);
    await linkProductToCollection(herman.id, newArrivalsCollection.id, 4);

    // Premium Products Collection (high-end items)
    await linkProductToCollection(herman.id, premiumCollection.id, 1); // $1299
    await linkProductToCollection(msi.id, premiumCollection.id, 2); // $2599
    await linkProductToCollection(rog.id, premiumCollection.id, 3); // $2299
    await linkProductToCollection(latitude.id, premiumCollection.id, 4); // $2099
    await linkProductToCollection(thinkpad.id, premiumCollection.id, 5); // $1899

    // Gaming Zone Collection (gaming-related products)
    await linkProductToCollection(rog.id, gamingCollection.id, 1);
    await linkProductToCollection(msi.id, gamingCollection.id, 2);

    // Work From Home Collection (office furniture + laptops)
    await linkProductToCollection(thinkpad.id, workFromHomeCollection.id, 1);
    await linkProductToCollection(latitude.id, workFromHomeCollection.id, 2);
    await linkProductToCollection(ergomax.id, workFromHomeCollection.id, 3);
    await linkProductToCollection(herman.id, workFromHomeCollection.id, 4);

    // Mobile Productivity Collection (tablets + business laptops)
    await linkProductToCollection(ipad.id, mobilityCollection.id, 1);
    await linkProductToCollection(galaxy.id, mobilityCollection.id, 2);
    await linkProductToCollection(thinkpad.id, mobilityCollection.id, 3);
    await linkProductToCollection(latitude.id, mobilityCollection.id, 4);

    console.log("✔ Product-collection links created");

    console.log("🌱 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

export { seedDatabase };
