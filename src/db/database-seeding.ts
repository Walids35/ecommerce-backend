import { eq, and, sql } from "drizzle-orm";
import { db } from "./data-source";

import { user } from "./schema/users";
import bcrypt from "bcrypt";

import { categories } from "./schema/categories";
import {
  subCategories,
  attributes,
  attributeValues,
} from "./schema/subcategories";
import { subSubCategories } from "./schema/subsubcategories";
import { productAttributeValues, products } from "./schema/product";
import { orders, orderItems, orderStatusHistory } from "./schema/orders";
import { collections, productCollections } from "./schema/collections";
import { brands } from "./schema/brands";

// Import translation tables
import { categoryTranslations } from "./schema/translations/category-translations";
import { brandTranslations } from "./schema/translations/brand-translations";
import { collectionTranslations } from "./schema/translations/collection-translations";
import { subcategoryTranslations } from "./schema/translations/subcategory-translations";
import { subsubcategoryTranslations } from "./schema/translations/subsubcategory-translations";
import { productTranslations } from "./schema/translations/product-translations";
import { attributeTranslations } from "./schema/translations/attribute-translations";
import { attributeValueTranslations } from "./schema/translations/attribute-value-translations";

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // -------------------------------
    // TRANSLATION HELPER FUNCTIONS
    // -------------------------------
    async function seedCategoryTranslations(
      categoryId: number,
      translations: {
        en: { name: string; description: string; slug: string };
        fr: { name: string; description: string; slug: string };
        ar: { name: string; description: string; slug: string };
      }
    ) {
      for (const [lang, trans] of Object.entries(translations)) {
        const exists = await db
          .select()
          .from(categoryTranslations)
          .where(
            and(
              eq(categoryTranslations.categoryId, categoryId),
              eq(categoryTranslations.language, lang)
            )
          )
          .limit(1);

        if (exists.length === 0) {
          await db.insert(categoryTranslations).values({
            categoryId,
            language: lang,
            name: trans.name,
            description: trans.description,
            slug: trans.slug,
          });
        }
      }
    }

    async function seedBrandTranslations(
      brandId: number,
      translations: {
        en: { name: string; description: string; slug: string };
        fr: { name: string; description: string; slug: string };
        ar: { name: string; description: string; slug: string };
      }
    ) {
      for (const [lang, trans] of Object.entries(translations)) {
        const exists = await db
          .select()
          .from(brandTranslations)
          .where(
            and(
              eq(brandTranslations.brandId, brandId),
              eq(brandTranslations.language, lang)
            )
          )
          .limit(1);

        if (exists.length === 0) {
          await db.insert(brandTranslations).values({
            brandId,
            language: lang,
            name: trans.name,
            description: trans.description,
            slug: trans.slug,
          });
        }
      }
    }

    async function seedSubcategoryTranslations(
      subcategoryId: number,
      translations: {
        en: { name: string; description: string };
        fr: { name: string; description: string };
        ar: { name: string; description: string };
      }
    ) {
      for (const [lang, trans] of Object.entries(translations)) {
        const exists = await db
          .select()
          .from(subcategoryTranslations)
          .where(
            and(
              eq(subcategoryTranslations.subcategoryId, subcategoryId),
              eq(subcategoryTranslations.language, lang)
            )
          )
          .limit(1);

        if (exists.length === 0) {
          await db.insert(subcategoryTranslations).values({
            subcategoryId,
            language: lang,
            name: trans.name,
            description: trans.description,
          });
        }
      }
    }

    async function seedSubsubcategoryTranslations(
      subsubcategoryId: number,
      translations: {
        en: { name: string; description: string; slug: string };
        fr: { name: string; description: string; slug: string };
        ar: { name: string; description: string; slug: string };
      }
    ) {
      for (const [lang, trans] of Object.entries(translations)) {
        const exists = await db
          .select()
          .from(subsubcategoryTranslations)
          .where(
            and(
              eq(subsubcategoryTranslations.subsubcategoryId, subsubcategoryId),
              eq(subsubcategoryTranslations.language, lang)
            )
          )
          .limit(1);

        if (exists.length === 0) {
          await db.insert(subsubcategoryTranslations).values({
            subsubcategoryId,
            language: lang,
            name: trans.name,
            description: trans.description,
            slug: trans.slug,
          });
        }
      }
    }

    async function seedCollectionTranslations(
      collectionId: number,
      translations: {
        en: { name: string; description: string; slug: string };
        fr: { name: string; description: string; slug: string };
        ar: { name: string; description: string; slug: string };
      }
    ) {
      for (const [lang, trans] of Object.entries(translations)) {
        const exists = await db
          .select()
          .from(collectionTranslations)
          .where(
            and(
              eq(collectionTranslations.collectionId, collectionId),
              eq(collectionTranslations.language, lang)
            )
          )
          .limit(1);

        if (exists.length === 0) {
          await db.insert(collectionTranslations).values({
            collectionId,
            language: lang,
            name: trans.name,
            description: trans.description,
            slug: trans.slug,
          });
        }
      }
    }

    async function seedProductTranslations(
      productId: string,
      translations: {
        en: { name: string; description: string; datasheet?: string };
        fr: { name: string; description: string; datasheet?: string };
        ar: { name: string; description: string; datasheet?: string };
      }
    ) {
      for (const [lang, trans] of Object.entries(translations)) {
        const exists = await db
          .select()
          .from(productTranslations)
          .where(
            and(
              eq(productTranslations.productId, productId),
              eq(productTranslations.language, lang)
            )
          )
          .limit(1);

        if (exists.length === 0) {
          await db.insert(productTranslations).values({
            productId,
            language: lang,
            name: trans.name,
            description: trans.description,
            datasheet: trans.datasheet || null,
          });
        }
      }
    }

    async function seedAttributeTranslations(
      attributeId: number,
      translations: {
        en: { name: string };
        fr: { name: string };
        ar: { name: string };
      }
    ) {
      for (const [lang, trans] of Object.entries(translations)) {
        const exists = await db
          .select()
          .from(attributeTranslations)
          .where(
            and(
              eq(attributeTranslations.attributeId, attributeId),
              eq(attributeTranslations.language, lang)
            )
          )
          .limit(1);

        if (exists.length === 0) {
          await db.insert(attributeTranslations).values({
            attributeId,
            language: lang,
            name: trans.name,
          });
        }
      }
    }

    async function seedAttributeValueTranslations(
      attributeValueId: number,
      translations: {
        en: { value: string };
        fr: { value: string };
        ar: { value: string };
      }
    ) {
      for (const [lang, trans] of Object.entries(translations)) {
        const exists = await db
          .select()
          .from(attributeValueTranslations)
          .where(
            and(
              eq(attributeValueTranslations.attributeValueId, attributeValueId),
              eq(attributeValueTranslations.language, lang)
            )
          )
          .limit(1);

        if (exists.length === 0) {
          await db.insert(attributeValueTranslations).values({
            attributeValueId,
            language: lang,
            value: trans.value,
          });
        }
      }
    }

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
        address: "123 Admin St, Admin City, Admin Country",
        phone: "+1234567890",
        matriculeFiscale: "123456789",
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

      if (exists.length > 0) {
        // Update existing record with new description
        await db
          .update(categories)
          .set({ name, description, displayOrder })
          .where(eq(categories.slug, slug));
        return exists[0];
      }

      return (
        await db
          .insert(categories)
          .values({ name, description, slug, isActive: true, displayOrder })
          .returning()
      )[0];
    }

    const catElectronics = await seedCategory(
      "Electronics",
      "A comprehensive collection of electronic gadgets and devices including computers, smartphones, tablets, gaming consoles, and various technological accessories designed to enhance productivity, entertainment, and connectivity in modern life.",
      "electronics",
      0
    );
    await seedCategoryTranslations(catElectronics.id, {
      en: {
        name: "Electronics",
        description:
          "A comprehensive collection of electronic gadgets and devices including computers, smartphones, tablets, gaming consoles, and various technological accessories designed to enhance productivity, entertainment, and connectivity in modern life.",
        slug: "electronics",
      },
      fr: {
        name: "Électronique",
        description:
          "Une collection complète de gadgets et appareils électroniques comprenant des ordinateurs, smartphones, tablettes, consoles de jeux et divers accessoires technologiques conçus pour améliorer la productivité, le divertissement et la connectivité dans la vie moderne.",
        slug: "electronique",
      },
      ar: {
        name: "إلكترونيات",
        description:
          "مجموعة شاملة من الأجهزة الإلكترونية والأدوات بما في ذلك أجهزة الكمبيوتر والهواتف الذكية والأجهزة اللوحية وأجهزة الألعاب ومختلف الملحقات التكنولوجية المصممة لتعزيز الإنتاجية والترفيه والاتصال في الحياة الحديثة.",
        slug: "electronics-ar",
      },
    });

    const catFurniture = await seedCategory(
      "Furniture",
      "High-quality home and office furniture including chairs, desks, tables, cabinets, and storage solutions crafted from premium materials to provide comfort, functionality, and aesthetic appeal for residential and professional spaces.",
      "furniture",
      1
    );
    await seedCategoryTranslations(catFurniture.id, {
      en: {
        name: "Furniture",
        description:
          "High-quality home and office furniture including chairs, desks, tables, cabinets, and storage solutions crafted from premium materials to provide comfort, functionality, and aesthetic appeal for residential and professional spaces.",
        slug: "furniture",
      },
      fr: {
        name: "Meubles",
        description:
          "Meubles de maison et de bureau de haute qualité comprenant des chaises, bureaux, tables, armoires et solutions de rangement fabriqués à partir de matériaux de qualité supérieure pour offrir confort, fonctionnalité et attrait esthétique pour les espaces résidentiels et professionnels.",
        slug: "meubles",
      },
      ar: {
        name: "أثاث",
        description:
          "أثاث منزلي ومكتبي عالي الجودة بما في ذلك الكراسي والمكاتب والطاولات والخزائن وحلول التخزين المصنوعة من مواد فاخرة لتوفير الراحة والوظائف والجاذبية الجمالية للمساحات السكنية والمهنية.",
        slug: "furniture-ar",
      },
    });

    console.log("✔ Categories seeded with translations");

    // -------------------------------
    // BRANDS
    // -------------------------------
    async function seedBrand(
      name: string,
      slug: string,
      description: string = "",
      logo: string = "",
      displayOrder: number = 0
    ) {
      const exists = await db
        .select()
        .from(brands)
        .where(eq(brands.slug, slug))
        .limit(1);

      if (exists.length > 0) {
        await db
          .update(brands)
          .set({ name, description, logo, displayOrder, updatedAt: new Date() })
          .where(eq(brands.slug, slug));
        return exists[0];
      }

      return (
        await db
          .insert(brands)
          .values({
            name,
            description,
            slug,
            logo,
            isActive: true,
            displayOrder,
          })
          .returning()
      )[0];
    }

    const asus = await seedBrand(
      "ASUS",
      "asus",
      "ASUSTeK Computer Inc. is a Taiwanese multinational company known for computer hardware and electronics",
      "https://example.com/brands/asus-logo.png",
      0
    );

    const msi = await seedBrand(
      "MSI",
      "msi",
      "Micro-Star International is a Taiwanese multinational company specializing in gaming hardware",
      "https://example.com/brands/msi-logo.png",
      1
    );

    const lenovo = await seedBrand(
      "Lenovo",
      "lenovo",
      "Lenovo Group Limited is a Chinese multinational technology company",
      "https://example.com/brands/lenovo-logo.png",
      2
    );

    const dell = await seedBrand(
      "Dell",
      "dell",
      "Dell Inc. is an American multinational computer technology company",
      "https://example.com/brands/dell-logo.png",
      3
    );

    const apple = await seedBrand(
      "Apple",
      "apple",
      "Apple Inc. is an American multinational technology company",
      "https://example.com/brands/apple-logo.png",
      4
    );

    const samsung = await seedBrand(
      "Samsung",
      "samsung",
      "Samsung Electronics is a South Korean multinational electronics company",
      "https://example.com/brands/samsung-logo.png",
      5
    );

    const steelcase = await seedBrand(
      "Steelcase",
      "steelcase",
      "Steelcase Inc. is an American furniture company known for office furniture and ergonomic seating",
      "https://example.com/brands/steelcase-logo.png",
      6
    );

    const hermanMiller = await seedBrand(
      "Herman Miller",
      "herman-miller",
      "Herman Miller is an American company known for modern furniture design and ergonomic office chairs",
      "https://example.com/brands/herman-miller-logo.png",
      7
    );

    // Add translations for all brands
    await seedBrandTranslations(asus.id, {
      en: {
        name: "ASUS",
        description:
          "ASUSTeK Computer Inc. is a Taiwanese multinational company known for computer hardware and electronics",
        slug: "asus",
      },
      fr: {
        name: "ASUS",
        description:
          "ASUSTeK Computer Inc. est une entreprise multinationale taïwanaise connue pour son matériel informatique et son électronique",
        slug: "asus",
      },
      ar: {
        name: "أسوس",
        description:
          "شركة ASUSTeK Computer Inc. هي شركة متعددة الجنسيات تايوانية معروفة بأجهزة الكمبيوتر والإلكترونيات",
        slug: "asus-ar",
      },
    });

    await seedBrandTranslations(msi.id, {
      en: {
        name: "MSI",
        description:
          "Micro-Star International is a Taiwanese multinational company specializing in gaming hardware",
        slug: "msi",
      },
      fr: {
        name: "MSI",
        description:
          "Micro-Star International est une entreprise multinationale taïwanaise spécialisée dans le matériel de jeu",
        slug: "msi",
      },
      ar: {
        name: "إم إس آي",
        description:
          "Micro-Star International هي شركة متعددة الجنسيات تايوانية متخصصة في أجهزة الألعاب",
        slug: "msi-ar",
      },
    });

    await seedBrandTranslations(lenovo.id, {
      en: {
        name: "Lenovo",
        description:
          "Lenovo Group Limited is a Chinese multinational technology company",
        slug: "lenovo",
      },
      fr: {
        name: "Lenovo",
        description:
          "Lenovo Group Limited est une entreprise technologique multinationale chinoise",
        slug: "lenovo",
      },
      ar: {
        name: "لينوفو",
        description:
          "Lenovo Group Limited هي شركة تكنولوجيا صينية متعددة الجنسيات",
        slug: "lenovo-ar",
      },
    });

    await seedBrandTranslations(dell.id, {
      en: {
        name: "Dell",
        description:
          "Dell Inc. is an American multinational computer technology company",
        slug: "dell",
      },
      fr: {
        name: "Dell",
        description:
          "Dell Inc. est une entreprise américaine multinationale de technologie informatique",
        slug: "dell",
      },
      ar: {
        name: "ديل",
        description:
          "Dell Inc. هي شركة أمريكية متعددة الجنسيات لتكنولوجيا الكمبيوتر",
        slug: "dell-ar",
      },
    });

    await seedBrandTranslations(apple.id, {
      en: {
        name: "Apple",
        description:
          "Apple Inc. is an American multinational technology company",
        slug: "apple",
      },
      fr: {
        name: "Apple",
        description:
          "Apple Inc. est une entreprise technologique américaine multinationale",
        slug: "apple",
      },
      ar: {
        name: "أبل",
        description: "Apple Inc. هي شركة تكنولوجيا أمريكية متعددة الجنسيات",
        slug: "apple-ar",
      },
    });

    await seedBrandTranslations(samsung.id, {
      en: {
        name: "Samsung",
        description:
          "Samsung Electronics is a South Korean multinational electronics company",
        slug: "samsung",
      },
      fr: {
        name: "Samsung",
        description:
          "Samsung Electronics est une entreprise d'électronique multinationale sud-coréenne",
        slug: "samsung",
      },
      ar: {
        name: "سامسونج",
        description:
          "Samsung Electronics هي شركة إلكترونيات كورية جنوبية متعددة الجنسيات",
        slug: "samsung-ar",
      },
    });

    await seedBrandTranslations(steelcase.id, {
      en: {
        name: "Steelcase",
        description:
          "Steelcase Inc. is an American furniture company known for office furniture and ergonomic seating",
        slug: "steelcase",
      },
      fr: {
        name: "Steelcase",
        description:
          "Steelcase Inc. est une entreprise américaine de meubles connue pour ses meubles de bureau et ses sièges ergonomiques",
        slug: "steelcase",
      },
      ar: {
        name: "ستيل كيس",
        description:
          "Steelcase Inc. هي شركة أثاث أمريكية معروفة بأثاث المكاتب والمقاعد المريحة",
        slug: "steelcase-ar",
      },
    });

    await seedBrandTranslations(hermanMiller.id, {
      en: {
        name: "Herman Miller",
        description:
          "Herman Miller is an American company known for modern furniture design and ergonomic office chairs",
        slug: "herman-miller",
      },
      fr: {
        name: "Herman Miller",
        description:
          "Herman Miller est une entreprise américaine connue pour son design de meubles modernes et ses chaises de bureau ergonomiques",
        slug: "herman-miller",
      },
      ar: {
        name: "هيرمان ميلر",
        description:
          "Herman Miller هي شركة أمريكية معروفة بتصميم الأثاث الحديث والكراسي المكتبية المريحة",
        slug: "herman-miller-ar",
      },
    });

    console.log("✔ Brands seeded with translations");

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

      if (exists.length > 0) {
        // Update existing record with new description
        await db
          .update(subCategories)
          .set({ name, categoryId, description, displayOrder })
          .where(eq(subCategories.slug, slug));
        return exists[0];
      }

      return (
        await db
          .insert(subCategories)
          .values({
            name,
            categoryId,
            slug,
            description,
            isActive: true,
            displayOrder,
          })
          .returning()
      )[0];
    }

    const laptopSub = await seedSubCategory(
      "Laptops",
      catElectronics.id,
      "laptops",
      "A versatile range of portable computing devices designed for productivity, entertainment, and professional use, featuring various screen sizes, processing power, and battery life to meet diverse user needs from casual browsing to intensive creative work.",
      0
    );
    const tabletSub = await seedSubCategory(
      "Tablets",
      catElectronics.id,
      "tablets",
      "Slim and lightweight touchscreen devices offering mobility and versatility for work, education, and entertainment, with capabilities ranging from basic web browsing to advanced creative applications and gaming.",
      1
    );
    const chairSub = await seedSubCategory(
      "Office Chairs",
      catFurniture.id,
      "office-chairs",
      "Professional seating solutions engineered for comfort and support during extended work sessions, featuring adjustable height, lumbar support, and ergonomic designs to promote proper posture and reduce fatigue.",
      0
    );

    // Add translations for subcategories
    await seedSubcategoryTranslations(laptopSub.id, {
      en: {
        name: "Laptops",
        description:
          "A versatile range of portable computing devices designed for productivity, entertainment, and professional use, featuring various screen sizes, processing power, and battery life to meet diverse user needs from casual browsing to intensive creative work.",
      },
      fr: {
        name: "Ordinateurs portables",
        description:
          "Une gamme polyvalente d'appareils informatiques portables conçus pour la productivité, le divertissement et l'usage professionnel, avec diverses tailles d'écran, puissance de traitement et autonomie de batterie pour répondre aux divers besoins des utilisateurs, de la navigation occasionnelle au travail créatif intensif.",
      },
      ar: {
        name: "أجهزة الكمبيوتر المحمولة",
        description:
          "مجموعة متنوعة من أجهزة الحوسبة المحمولة المصممة للإنتاجية والترفيه والاستخدام المهني، تتميز بأحجام شاشات مختلفة وقوة معالجة وعمر بطارية لتلبية احتياجات المستخدمين المتنوعة من التصفح العادي إلى العمل الإبداعي المكثف.",
      },
    });

    await seedSubcategoryTranslations(tabletSub.id, {
      en: {
        name: "Tablets",
        description:
          "Slim and lightweight touchscreen devices offering mobility and versatility for work, education, and entertainment, with capabilities ranging from basic web browsing to advanced creative applications and gaming.",
      },
      fr: {
        name: "Tablettes",
        description:
          "Appareils tactiles minces et légers offrant mobilité et polyvalence pour le travail, l'éducation et le divertissement, avec des capacités allant de la navigation Web de base aux applications créatives avancées et aux jeux.",
      },
      ar: {
        name: "أجهزة لوحية",
        description:
          "أجهزة شاشات لمس رفيعة وخفيفة الوزن توفر التنقل والتنوع للعمل والتعليم والترفيه، مع قدرات تتراوح من تصفح الويب الأساسي إلى التطبيقات الإبداعية المتقدمة والألعاب.",
      },
    });

    await seedSubcategoryTranslations(chairSub.id, {
      en: {
        name: "Office Chairs",
        description:
          "Professional seating solutions engineered for comfort and support during extended work sessions, featuring adjustable height, lumbar support, and ergonomic designs to promote proper posture and reduce fatigue.",
      },
      fr: {
        name: "Chaises de bureau",
        description:
          "Solutions d'assise professionnelles conçues pour le confort et le soutien lors de longues sessions de travail, avec hauteur réglable, soutien lombaire et designs ergonomiques pour favoriser une posture correcte et réduire la fatigue.",
      },
      ar: {
        name: "كراسي المكتب",
        description:
          "حلول جلوس احترافية مصممة للراحة والدعم أثناء جلسات العمل الممتدة، تتميز بارتفاع قابل للتعديل ودعم قطني وتصميمات مريحة لتعزيز الوضعية الصحيحة وتقليل التعب.",
      },
    });

    console.log("✔ Subcategories seeded with translations");

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
          .values({
            name,
            subCategoryId,
            slug,
            description,
            isActive: true,
            displayOrder,
          })
          .returning()
      )[0];
    }

    const gamingLaptopSub = await seedSubSubCategory(
      "Gaming Laptops",
      laptopSub.id,
      "gaming-laptops",
      "Powerful computing machines designed specifically for gaming enthusiasts, featuring high-end graphics cards, fast processors, advanced cooling systems, and high-refresh-rate displays to deliver immersive gaming experiences with smooth frame rates and stunning visuals.",
      0
    );
    const businessLaptopSub = await seedSubSubCategory(
      "Business Laptops",
      laptopSub.id,
      "business-laptops",
      "Reliable and secure computing solutions tailored for professional environments, offering robust security features, excellent battery life, lightweight designs, and compatibility with business software to support productivity and remote work requirements.",
      1
    );

    // Add translations for subsubcategories
    await seedSubsubcategoryTranslations(gamingLaptopSub.id, {
      en: {
        name: "Gaming Laptops",
        description:
          "Powerful computing machines designed specifically for gaming enthusiasts, featuring high-end graphics cards, fast processors, advanced cooling systems, and high-refresh-rate displays to deliver immersive gaming experiences with smooth frame rates and stunning visuals.",
        slug: "gaming-laptops",
      },
      fr: {
        name: "Ordinateurs portables de jeu",
        description:
          "Machines informatiques puissantes conçues spécifiquement pour les passionnés de jeux, dotées de cartes graphiques haut de gamme, de processeurs rapides, de systèmes de refroidissement avancés et d'écrans à taux de rafraîchissement élevé pour offrir des expériences de jeu immersives avec des fréquences d'images fluides et des visuels époustouflants.",
        slug: "ordinateurs-portables-jeu",
      },
      ar: {
        name: "أجهزة كمبيوتر محمولة للألعاب",
        description:
          "أجهزة حوسبة قوية مصممة خصيصًا لعشاق الألعاب، تتميز ببطاقات رسومات متطورة ومعالجات سريعة وأنظمة تبريد متقدمة وشاشات بمعدل تحديث عالٍ لتقديم تجارب ألعاب غامرة بمعدلات إطارات سلسة ومرئيات مذهلة.",
        slug: "gaming-laptops-ar",
      },
    });

    await seedSubsubcategoryTranslations(businessLaptopSub.id, {
      en: {
        name: "Business Laptops",
        description:
          "Reliable and secure computing solutions tailored for professional environments, offering robust security features, excellent battery life, lightweight designs, and compatibility with business software to support productivity and remote work requirements.",
        slug: "business-laptops",
      },
      fr: {
        name: "Ordinateurs portables professionnels",
        description:
          "Solutions informatiques fiables et sécurisées adaptées aux environnements professionnels, offrant des fonctionnalités de sécurité robustes, une excellente autonomie de batterie, des designs légers et une compatibilité avec les logiciels professionnels pour soutenir la productivité et les exigences du travail à distance.",
        slug: "ordinateurs-portables-professionnels",
      },
      ar: {
        name: "أجهزة كمبيوتر محمولة للأعمال",
        description:
          "حلول حوسبة موثوقة وآمنة مصممة للبيئات المهنية، توفر ميزات أمان قوية وعمر بطارية ممتاز وتصميمات خفيفة الوزن وتوافق مع برامج الأعمال لدعم الإنتاجية ومتطلبات العمل عن بُعد.",
        slug: "business-laptops-ar",
      },
    });

    console.log("✔ Subsubcategories seeded with translations");

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
            subCategoryId
              ? eq(attributes.subCategoryId, subCategoryId)
              : sql`${attributes.subCategoryId} IS NULL`,
            subSubCategoryId
              ? eq(attributes.subSubCategoryId, subSubCategoryId)
              : sql`${attributes.subSubCategoryId} IS NULL`
          )
        )
        .limit(1);

      if (exists.length > 0) return exists[0];

      return (
        await db
          .insert(attributes)
          .values({
            name,
            subCategoryId: subCategoryId ?? null,
            subSubCategoryId: subSubCategoryId ?? null,
          })
          .returning()
      )[0];
    }

    // Gaming Laptop attributes (subsubcategory level)
    const gpuAttr = await seedAttribute("GPU", undefined, gamingLaptopSub.id);
    const refreshRateAttr = await seedAttribute(
      "Refresh Rate",
      undefined,
      gamingLaptopSub.id
    );
    const gamingRamAttr = await seedAttribute(
      "RAM",
      undefined,
      gamingLaptopSub.id
    );
    const gamingCpuAttr = await seedAttribute(
      "Processor",
      undefined,
      gamingLaptopSub.id
    );
    const gamingStorageAttr = await seedAttribute(
      "Storage",
      undefined,
      gamingLaptopSub.id
    );

    // Business Laptop attributes (subsubcategory level)
    const weightAttr = await seedAttribute(
      "Weight",
      undefined,
      businessLaptopSub.id
    );
    const batteryLifeAttr = await seedAttribute(
      "Battery Life",
      undefined,
      businessLaptopSub.id
    );
    const businessRamAttr = await seedAttribute(
      "RAM",
      undefined,
      businessLaptopSub.id
    );
    const businessCpuAttr = await seedAttribute(
      "Processor",
      undefined,
      businessLaptopSub.id
    );
    const businessStorageAttr = await seedAttribute(
      "Storage",
      undefined,
      businessLaptopSub.id
    );

    // Tablet attributes (subcategory level - tablets have no subsubcategory)
    const screenSizeAttr = await seedAttribute("Screen Size", tabletSub.id);
    const tabletStorageAttr = await seedAttribute("Storage", tabletSub.id);

    // Chair attributes
    const materialAttr = await seedAttribute("Material", chairSub.id);
    const maxWeightAttr = await seedAttribute("Max Weight", chairSub.id);

    // Add attribute translations
    await seedAttributeTranslations(gpuAttr.id, {
      en: { name: "GPU" },
      fr: { name: "Carte graphique" },
      ar: { name: "بطاقة الرسومات" },
    });

    await seedAttributeTranslations(refreshRateAttr.id, {
      en: { name: "Refresh Rate" },
      fr: { name: "Taux de rafraîchissement" },
      ar: { name: "معدل التحديث" },
    });

    await seedAttributeTranslations(gamingRamAttr.id, {
      en: { name: "RAM" },
      fr: { name: "Mémoire vive" },
      ar: { name: "الذاكرة العشوائية" },
    });

    await seedAttributeTranslations(gamingCpuAttr.id, {
      en: { name: "Processor" },
      fr: { name: "Processeur" },
      ar: { name: "المعالج" },
    });

    await seedAttributeTranslations(gamingStorageAttr.id, {
      en: { name: "Storage" },
      fr: { name: "Stockage" },
      ar: { name: "التخزين" },
    });

    await seedAttributeTranslations(weightAttr.id, {
      en: { name: "Weight" },
      fr: { name: "Poids" },
      ar: { name: "الوزن" },
    });

    await seedAttributeTranslations(batteryLifeAttr.id, {
      en: { name: "Battery Life" },
      fr: { name: "Autonomie de la batterie" },
      ar: { name: "عمر البطارية" },
    });

    await seedAttributeTranslations(businessRamAttr.id, {
      en: { name: "RAM" },
      fr: { name: "Mémoire vive" },
      ar: { name: "الذاكرة العشوائية" },
    });

    await seedAttributeTranslations(businessCpuAttr.id, {
      en: { name: "Processor" },
      fr: { name: "Processeur" },
      ar: { name: "المعالج" },
    });

    await seedAttributeTranslations(businessStorageAttr.id, {
      en: { name: "Storage" },
      fr: { name: "Stockage" },
      ar: { name: "التخزين" },
    });

    await seedAttributeTranslations(screenSizeAttr.id, {
      en: { name: "Screen Size" },
      fr: { name: "Taille de l'écran" },
      ar: { name: "حجم الشاشة" },
    });

    await seedAttributeTranslations(tabletStorageAttr.id, {
      en: { name: "Storage" },
      fr: { name: "Stockage" },
      ar: { name: "التخزين" },
    });

    await seedAttributeTranslations(materialAttr.id, {
      en: { name: "Material" },
      fr: { name: "Matériau" },
      ar: { name: "المادة" },
    });

    await seedAttributeTranslations(maxWeightAttr.id, {
      en: { name: "Max Weight" },
      fr: { name: "Poids maximum" },
      ar: { name: "الوزن الأقصى" },
    });

    console.log("✔ Attributes seeded with translations");

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
    const gamingStorage1tb = await seedAttributeValue(
      gamingStorageAttr.id,
      "1TB SSD"
    );
    const gpuRtx4070 = await seedAttributeValue(gpuAttr.id, "RTX 4070");
    const gpuRtx4090 = await seedAttributeValue(gpuAttr.id, "RTX 4090");
    const refresh144 = await seedAttributeValue(refreshRateAttr.id, "144Hz");
    const refresh240 = await seedAttributeValue(refreshRateAttr.id, "240Hz");

    // Business laptop attribute values
    const businessRam16 = await seedAttributeValue(businessRamAttr.id, "16GB");
    const businessCpuI7 = await seedAttributeValue(
      businessCpuAttr.id,
      "Intel i7"
    );
    const businessStorage512 = await seedAttributeValue(
      businessStorageAttr.id,
      "512GB SSD"
    );
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
    const materialLeather = await seedAttributeValue(
      materialAttr.id,
      "Leather"
    );
    const materialMesh = await seedAttributeValue(materialAttr.id, "Mesh");
    const weight120 = await seedAttributeValue(maxWeightAttr.id, "120kg");
    const weight150 = await seedAttributeValue(maxWeightAttr.id, "150kg");

    // Add attribute value translations
    // Gaming laptop values
    await seedAttributeValueTranslations(gamingRam32.id, {
      en: { value: "32GB" },
      fr: { value: "32 Go" },
      ar: { value: "32 جيجابايت" },
    });

    await seedAttributeValueTranslations(gamingCpuI9.id, {
      en: { value: "Intel i9" },
      fr: { value: "Intel i9" },
      ar: { value: "إنتل i9" },
    });

    await seedAttributeValueTranslations(gamingStorage1tb.id, {
      en: { value: "1TB SSD" },
      fr: { value: "SSD 1 To" },
      ar: { value: "1 تيرابايت SSD" },
    });

    await seedAttributeValueTranslations(gpuRtx4070.id, {
      en: { value: "RTX 4070" },
      fr: { value: "RTX 4070" },
      ar: { value: "RTX 4070" },
    });

    await seedAttributeValueTranslations(gpuRtx4090.id, {
      en: { value: "RTX 4090" },
      fr: { value: "RTX 4090" },
      ar: { value: "RTX 4090" },
    });

    await seedAttributeValueTranslations(refresh144.id, {
      en: { value: "144Hz" },
      fr: { value: "144 Hz" },
      ar: { value: "144 هرتز" },
    });

    await seedAttributeValueTranslations(refresh240.id, {
      en: { value: "240Hz" },
      fr: { value: "240 Hz" },
      ar: { value: "240 هرتز" },
    });

    // Business laptop values
    await seedAttributeValueTranslations(businessRam16.id, {
      en: { value: "16GB" },
      fr: { value: "16 Go" },
      ar: { value: "16 جيجابايت" },
    });

    await seedAttributeValueTranslations(businessCpuI7.id, {
      en: { value: "Intel i7" },
      fr: { value: "Intel i7" },
      ar: { value: "إنتل i7" },
    });

    await seedAttributeValueTranslations(businessStorage512.id, {
      en: { value: "512GB SSD" },
      fr: { value: "SSD 512 Go" },
      ar: { value: "512 جيجابايت SSD" },
    });

    await seedAttributeValueTranslations(weight15kg.id, {
      en: { value: "1.5kg" },
      fr: { value: "1,5 kg" },
      ar: { value: "1.5 كجم" },
    });

    await seedAttributeValueTranslations(weight18kg.id, {
      en: { value: "1.8kg" },
      fr: { value: "1,8 kg" },
      ar: { value: "1.8 كجم" },
    });

    await seedAttributeValueTranslations(battery10h.id, {
      en: { value: "10 hours" },
      fr: { value: "10 heures" },
      ar: { value: "10 ساعات" },
    });

    await seedAttributeValueTranslations(battery15h.id, {
      en: { value: "15 hours" },
      fr: { value: "15 heures" },
      ar: { value: "15 ساعة" },
    });

    // Tablet values
    await seedAttributeValueTranslations(screen10.id, {
      en: { value: "10.5 inch" },
      fr: { value: "10,5 pouces" },
      ar: { value: "10.5 بوصة" },
    });

    await seedAttributeValueTranslations(screen11.id, {
      en: { value: "11 inch" },
      fr: { value: "11 pouces" },
      ar: { value: "11 بوصة" },
    });

    await seedAttributeValueTranslations(tablet128.id, {
      en: { value: "128GB" },
      fr: { value: "128 Go" },
      ar: { value: "128 جيجابايت" },
    });

    await seedAttributeValueTranslations(tablet256.id, {
      en: { value: "256GB" },
      fr: { value: "256 Go" },
      ar: { value: "256 جيجابايت" },
    });

    // Chair values
    await seedAttributeValueTranslations(materialLeather.id, {
      en: { value: "Leather" },
      fr: { value: "Cuir" },
      ar: { value: "جلد" },
    });

    await seedAttributeValueTranslations(materialMesh.id, {
      en: { value: "Mesh" },
      fr: { value: "Maille" },
      ar: { value: "شبكة" },
    });

    await seedAttributeValueTranslations(weight120.id, {
      en: { value: "120kg" },
      fr: { value: "120 kg" },
      ar: { value: "120 كجم" },
    });

    await seedAttributeValueTranslations(weight150.id, {
      en: { value: "150kg" },
      fr: { value: "150 kg" },
      ar: { value: "150 كجم" },
    });

    console.log("✔ Attribute values seeded with translations");

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
      subcategoryOrder: number = 0,
      subsubcategoryOrder: number = 0,
      brandId: number | null = null
    ) {
      const exists = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.name, name),
            subCategoryId
              ? eq(products.subCategoryId, subCategoryId)
              : sql`${products.subCategoryId} IS NULL`,
            subSubCategoryId
              ? eq(products.subSubCategoryId, subSubCategoryId)
              : sql`${products.subSubCategoryId} IS NULL`
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
            subcategoryOrder,
            subsubcategoryOrder,
            brandId: brandId,
          })
          .returning()
      )[0];
    }

    // Gaming Laptops (at subsubcategory level - need BOTH parent subcategory AND subsubcategory)
    const rog = await seedProduct(
      "ASUS ROG Strix",
      "High-end gaming laptop with RGB",
      "2299.99",
      25,
      laptopSub.id, // Parent subcategory (Laptops)
      gamingLaptopSub.id, // Subsubcategory (Gaming Laptops)
      ["rog.jpg"],
      null,
      "5",
      true,
      0, // subcategoryOrder (not used for subsubcategory products)
      1, // subsubcategoryOrder
      asus.id
    );

    const msiGaming = await seedProduct(
      "MSI GE76 Raider",
      "Powerful gaming laptop",
      "2599.99",
      15,
      laptopSub.id, // Parent subcategory (Laptops)
      gamingLaptopSub.id, // Subsubcategory (Gaming Laptops)
      ["msi.jpg"],
      null,
      "0",
      true,
      0, // subcategoryOrder (not used for subsubcategory products)
      2, // subsubcategoryOrder
      msi.id
    );

    // Business Laptops (at subsubcategory level - need BOTH parent subcategory AND subsubcategory)
    const thinkpad = await seedProduct(
      "ThinkPad X1 Carbon",
      "Ultra-portable business laptop",
      "1899.99",
      40,
      laptopSub.id, // Parent subcategory (Laptops)
      businessLaptopSub.id, // Subsubcategory (Business Laptops)
      ["thinkpad.jpg"],
      null,
      "10",
      true,
      0, // subcategoryOrder (not used for subsubcategory products)
      1, // subsubcategoryOrder
      lenovo.id
    );

    const latitude = await seedProduct(
      "Dell Latitude 9000",
      "Enterprise-grade laptop",
      "2099.99",
      30,
      laptopSub.id, // Parent subcategory (Laptops)
      businessLaptopSub.id, // Subsubcategory (Business Laptops)
      ["latitude.jpg"],
      null,
      "0",
      true,
      0, // subcategoryOrder (not used for subsubcategory products)
      2, // subsubcategoryOrder
      dell.id
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
      1, // subcategoryOrder
      0, // subsubcategoryOrder (not used for subcategory products)
      apple.id
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
      2, // subcategoryOrder
      0, // subsubcategoryOrder (not used for subcategory products)
      samsung.id
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
      1, // subcategoryOrder
      0, // subsubcategoryOrder (not used for subcategory products)
      steelcase.id
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
      2, // subcategoryOrder
      0, // subsubcategoryOrder (not used for subcategory products)
      hermanMiller.id
    );

    // Add product translations
    await seedProductTranslations(rog.id, {
      en: {
        name: "ASUS ROG Strix",
        description:
          "High-end gaming laptop with RGB lighting, powerful graphics, and exceptional performance for demanding games and creative work.",
        datasheet: "asus-rog-strix-datasheet-en.pdf",
      },
      fr: {
        name: "ASUS ROG Strix",
        description:
          "Ordinateur portable de gaming haut de gamme avec éclairage RGB, carte graphique puissante et performances exceptionnelles pour les jeux exigeants et le travail créatif.",
        datasheet: "asus-rog-strix-datasheet-fr.pdf",
      },
      ar: {
        name: "ASUS ROG Strix",
        description:
          "جهاز كمبيوتر محمول للألعاب عالي الجودة مع إضاءة RGB وبطاقة رسومات قوية وأداء استثنائي للألعاب المتطلبة والعمل الإبداعي.",
        datasheet: "asus-rog-strix-datasheet-ar.pdf",
      },
    });

    await seedProductTranslations(msiGaming.id, {
      en: {
        name: "MSI GE76 Raider",
        description:
          "Powerful gaming laptop with advanced cooling system, high refresh rate display, and cutting-edge components for the ultimate gaming experience.",
        datasheet: "msi-ge76-raider-datasheet-en.pdf",
      },
      fr: {
        name: "MSI GE76 Raider",
        description:
          "Ordinateur portable de gaming puissant avec système de refroidissement avancé, écran à taux de rafraîchissement élevé et composants de pointe pour une expérience de jeu ultime.",
        datasheet: "msi-ge76-raider-datasheet-fr.pdf",
      },
      ar: {
        name: "MSI GE76 Raider",
        description:
          "جهاز كمبيوتر محمول قوي للألعاب مع نظام تبريد متقدم وشاشة بمعدل تحديث عالي ومكونات حديثة لتجربة ألعاب نهائية.",
        datasheet: "msi-ge76-raider-datasheet-ar.pdf",
      },
    });

    await seedProductTranslations(thinkpad.id, {
      en: {
        name: "ThinkPad X1 Carbon",
        description:
          "Ultra-portable business laptop with military-grade durability, exceptional battery life, and enterprise-level security features for professionals on the go.",
        datasheet: "thinkpad-x1-carbon-datasheet-en.pdf",
      },
      fr: {
        name: "ThinkPad X1 Carbon",
        description:
          "Ordinateur portable professionnel ultra-portable avec durabilité de grade militaire, autonomie exceptionnelle et fonctionnalités de sécurité de niveau entreprise pour les professionnels en déplacement.",
        datasheet: "thinkpad-x1-carbon-datasheet-fr.pdf",
      },
      ar: {
        name: "ThinkPad X1 Carbon",
        description:
          "جهاز كمبيوتر محمول للأعمال فائق الحمل مع متانة عسكرية وعمر بطارية استثنائي وميزات أمان على مستوى المؤسسات للمحترفين أثناء التنقل.",
        datasheet: "thinkpad-x1-carbon-datasheet-ar.pdf",
      },
    });

    await seedProductTranslations(latitude.id, {
      en: {
        name: "Dell Latitude 9000",
        description:
          "Enterprise-grade laptop with AI-enhanced collaboration features, intelligent audio, and premium build quality designed for modern business environments.",
        datasheet: "dell-latitude-9000-datasheet-en.pdf",
      },
      fr: {
        name: "Dell Latitude 9000",
        description:
          "Ordinateur portable de niveau entreprise avec fonctionnalités de collaboration améliorées par l'IA, audio intelligent et qualité de fabrication premium conçu pour les environnements professionnels modernes.",
        datasheet: "dell-latitude-9000-datasheet-fr.pdf",
      },
      ar: {
        name: "Dell Latitude 9000",
        description:
          "جهاز كمبيوتر محمول على مستوى المؤسسات مع ميزات تعاون محسّنة بالذكاء الاصطناعي وصوت ذكي وجودة بناء متميزة مصممة لبيئات الأعمال الحديثة.",
        datasheet: "dell-latitude-9000-datasheet-ar.pdf",
      },
    });

    await seedProductTranslations(ipad.id, {
      en: {
        name: "iPad Air",
        description:
          "Lightweight and powerful tablet with stunning Liquid Retina display, M1 chip performance, and all-day battery life for creativity and productivity anywhere.",
        datasheet: "ipad-air-datasheet-en.pdf",
      },
      fr: {
        name: "iPad Air",
        description:
          "Tablette légère et puissante avec écran Liquid Retina époustouflant, performances de puce M1 et autonomie d'une journée pour la créativité et la productivité partout.",
        datasheet: "ipad-air-datasheet-fr.pdf",
      },
      ar: {
        name: "iPad Air",
        description:
          "جهاز لوحي خفيف وقوي مع شاشة Liquid Retina مذهلة وأداء شريحة M1 وعمر بطارية طوال اليوم للإبداع والإنتاجية في أي مكان.",
        datasheet: "ipad-air-datasheet-ar.pdf",
      },
    });

    await seedProductTranslations(galaxy.id, {
      en: {
        name: "Samsung Galaxy Tab S9",
        description:
          "Android tablet with S Pen included, powerful processor, vibrant AMOLED display, and seamless integration with Samsung ecosystem for enhanced productivity.",
        datasheet: "samsung-galaxy-tab-s9-datasheet-en.pdf",
      },
      fr: {
        name: "Samsung Galaxy Tab S9",
        description:
          "Tablette Android avec S Pen inclus, processeur puissant, écran AMOLED vibrant et intégration transparente avec l'écosystème Samsung pour une productivité améliorée.",
        datasheet: "samsung-galaxy-tab-s9-datasheet-fr.pdf",
      },
      ar: {
        name: "Samsung Galaxy Tab S9",
        description:
          "جهاز لوحي يعمل بنظام Android مع قلم S Pen مضمّن ومعالج قوي وشاشة AMOLED نابضة بالحياة وتكامل سلس مع نظام Samsung البيئي لإنتاجية محسّنة.",
        datasheet: "samsung-galaxy-tab-s9-datasheet-ar.pdf",
      },
    });

    await seedProductTranslations(ergomax.id, {
      en: {
        name: "ErgoMax Pro",
        description:
          "Premium ergonomic office chair with adjustable lumbar support, breathable mesh back, and multi-dimensional armrests for superior comfort during long work sessions.",
        datasheet: "ergomax-pro-datasheet-en.pdf",
      },
      fr: {
        name: "ErgoMax Pro",
        description:
          "Chaise de bureau ergonomique premium avec support lombaire réglable, dossier en maille respirante et accoudoirs multidimensionnels pour un confort supérieur pendant les longues sessions de travail.",
        datasheet: "ergomax-pro-datasheet-fr.pdf",
      },
      ar: {
        name: "ErgoMax Pro",
        description:
          "كرسي مكتب مريح متميز مع دعم قطني قابل للتعديل وظهر شبكي قابل للتنفس ومساند أذرع متعددة الأبعاد لراحة فائقة خلال جلسات العمل الطويلة.",
        datasheet: "ergomax-pro-datasheet-ar.pdf",
      },
    });

    await seedProductTranslations(herman.id, {
      en: {
        name: "Herman Miller Aeron",
        description:
          "Legendary office chair with patented PostureFit support, 8Z Pellicle suspension, and fully adjustable components engineered for optimal health and performance.",
        datasheet: "herman-miller-aeron-datasheet-en.pdf",
      },
      fr: {
        name: "Herman Miller Aeron",
        description:
          "Chaise de bureau légendaire avec support PostureFit breveté, suspension 8Z Pellicle et composants entièrement réglables conçus pour une santé et des performances optimales.",
        datasheet: "herman-miller-aeron-datasheet-fr.pdf",
      },
      ar: {
        name: "Herman Miller Aeron",
        description:
          "كرسي مكتب أسطوري مع دعم PostureFit المحمي ببراءة اختراع ونظام تعليق 8Z Pellicle ومكونات قابلة للتعديل بالكامل مصممة للصحة والأداء الأمثل.",
        datasheet: "herman-miller-aeron-datasheet-ar.pdf",
      },
    });

    console.log("✔ Products seeded with translations");

    // -------------------------------
    // PRODUCT ATTRIBUTE VALUE LINKING
    // -------------------------------
    async function link(
      productId: string,
      attributeId: number,
      valueId: number
    ) {
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
    await link(msiGaming.id, gamingRamAttr.id, gamingRam32.id);
    await link(msiGaming.id, gamingCpuAttr.id, gamingCpuI9.id);
    await link(msiGaming.id, gamingStorageAttr.id, gamingStorage1tb.id);
    await link(msiGaming.id, gpuAttr.id, gpuRtx4070.id);
    await link(msiGaming.id, refreshRateAttr.id, refresh144.id);

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
      status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled",
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
    await seedOrderItem(
      order1.id,
      rog.id,
      "ASUS ROG Strix",
      "2299.99",
      1,
      "2299.99"
    );

    // Order 2: ErgoMax + iPad
    await seedOrderItem(
      order2.id,
      ergomax.id,
      "ErgoMax Pro",
      "349.99",
      1,
      "349.99"
    );
    await seedOrderItem(order2.id, ipad.id, "iPad Air", "599.99", 1, "599.99");
    await seedOrderItem(
      order2.id,
      galaxy.id,
      "Samsung Galaxy Tab S9",
      "749.99",
      1,
      "749.99"
    );

    // Order 3: iPad only
    await seedOrderItem(order3.id, ipad.id, "iPad Air", "599.99", 1, "599.99");

    // Order 4: ThinkPad + Herman Miller
    await seedOrderItem(
      order4.id,
      thinkpad.id,
      "ThinkPad X1 Carbon",
      "1899.99",
      1,
      "1899.99"
    );
    await seedOrderItem(
      order4.id,
      herman.id,
      "Herman Miller Aeron",
      "1299.99",
      1,
      "1299.99"
    );

    // Order 5: MSI Gaming Laptop
    await seedOrderItem(
      order5.id,
      msiGaming.id,
      "MSI GE76 Raider",
      "2599.99",
      1,
      "2599.99"
    );

    // Order 6: Samsung Galaxy Tab (cancelled order)
    await seedOrderItem(
      order6.id,
      galaxy.id,
      "Samsung Galaxy Tab S9",
      "749.99",
      1,
      "749.99"
    );

    // Order 7: ThinkPad only
    await seedOrderItem(
      order7.id,
      thinkpad.id,
      "ThinkPad X1 Carbon",
      "1899.99",
      1,
      "1899.99"
    );

    // Order 8: Herman Miller chair
    await seedOrderItem(
      order8.id,
      herman.id,
      "Herman Miller Aeron",
      "1299.99",
      1,
      "1299.99"
    );

    // Order 9: ASUS ROG + MSI (2 gaming laptops)
    await seedOrderItem(
      order9.id,
      rog.id,
      "ASUS ROG Strix",
      "2299.99",
      1,
      "2299.99"
    );
    await seedOrderItem(
      order9.id,
      msiGaming.id,
      "MSI GE76 Raider",
      "2599.99",
      1,
      "2599.99"
    );

    // Order 10: ErgoMax chair only
    await seedOrderItem(
      order10.id,
      ergomax.id,
      "ErgoMax Pro",
      "349.99",
      1,
      "349.99"
    );

    // Order 11: iPad only
    await seedOrderItem(order11.id, ipad.id, "iPad Air", "599.99", 1, "599.99");

    // Order 12: Dell Latitude
    await seedOrderItem(
      order12.id,
      latitude.id,
      "Dell Latitude 9000",
      "2099.99",
      1,
      "2099.99"
    );

    // Order 13: iPad + Galaxy Tab + ErgoMax (variety)
    await seedOrderItem(order13.id, ipad.id, "iPad Air", "599.99", 1, "599.99");
    await seedOrderItem(
      order13.id,
      galaxy.id,
      "Samsung Galaxy Tab S9",
      "749.99",
      1,
      "749.99"
    );
    await seedOrderItem(
      order13.id,
      ergomax.id,
      "ErgoMax Pro",
      "349.99",
      2,
      "699.99"
    );
    await seedOrderItem(
      order13.id,
      thinkpad.id,
      "ThinkPad X1 Carbon",
      "1899.99",
      1,
      "1899.99"
    );

    // Order 14: ErgoMax + iPad
    await seedOrderItem(
      order14.id,
      ergomax.id,
      "ErgoMax Pro",
      "349.99",
      1,
      "349.99"
    );
    await seedOrderItem(order14.id, ipad.id, "iPad Air", "599.99", 1, "599.99");
    await seedOrderItem(
      order14.id,
      galaxy.id,
      "Samsung Galaxy Tab S9",
      "749.99",
      1,
      "749.99"
    );

    console.log("✔ Order items seeded");

    // -------------------------------
    // ORDER STATUS HISTORY
    // -------------------------------
    async function seedStatusHistory(
      orderId: number,
      oldStatus:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | null,
      newStatus:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled",
      changedBy: string
    ) {
      const exists = await db
        .select()
        .from(orderStatusHistory)
        .where(
          and(
            eq(orderStatusHistory.orderId, orderId),
            oldStatus !== null
              ? eq(orderStatusHistory.oldStatus, oldStatus)
              : sql`${orderStatusHistory.oldStatus} IS NULL`,
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
    await seedStatusHistory(
      order1.id,
      "pending",
      "confirmed",
      "admin@gmail.com"
    );
    await seedStatusHistory(
      order1.id,
      "confirmed",
      "processing",
      "admin@gmail.com"
    );
    await seedStatusHistory(
      order1.id,
      "processing",
      "shipped",
      "admin@gmail.com"
    );
    await seedStatusHistory(order1.id, "shipped", "delivered", "System");

    // Order 2 status history (processing)
    await seedStatusHistory(order2.id, null, "pending", "System");
    await seedStatusHistory(
      order2.id,
      "pending",
      "confirmed",
      "admin@gmail.com"
    );
    await seedStatusHistory(
      order2.id,
      "confirmed",
      "processing",
      "admin@gmail.com"
    );

    // Order 3 status history (pending)
    await seedStatusHistory(order3.id, null, "pending", "System");

    // Order 4 status history (shipped)
    await seedStatusHistory(order4.id, null, "pending", "System");
    await seedStatusHistory(
      order4.id,
      "pending",
      "confirmed",
      "admin@gmail.com"
    );
    await seedStatusHistory(
      order4.id,
      "confirmed",
      "processing",
      "admin@gmail.com"
    );
    await seedStatusHistory(
      order4.id,
      "processing",
      "shipped",
      "admin@gmail.com"
    );

    // Order 5 status history (confirmed)
    await seedStatusHistory(order5.id, null, "pending", "System");
    await seedStatusHistory(
      order5.id,
      "pending",
      "confirmed",
      "admin@gmail.com"
    );

    // Order 6 status history (cancelled)
    await seedStatusHistory(order6.id, null, "pending", "System");
    await seedStatusHistory(
      order6.id,
      "pending",
      "cancelled",
      "admin@gmail.com"
    );

    // Order 7 status history (delivered)
    await seedStatusHistory(order7.id, null, "pending", "System");
    await seedStatusHistory(
      order7.id,
      "pending",
      "confirmed",
      "admin@gmail.com"
    );
    await seedStatusHistory(
      order7.id,
      "confirmed",
      "processing",
      "admin@gmail.com"
    );
    await seedStatusHistory(
      order7.id,
      "processing",
      "shipped",
      "admin@gmail.com"
    );
    await seedStatusHistory(order7.id, "shipped", "delivered", "System");

    // Order 8 status history (processing)
    await seedStatusHistory(order8.id, null, "pending", "System");
    await seedStatusHistory(
      order8.id,
      "pending",
      "confirmed",
      "admin@gmail.com"
    );
    await seedStatusHistory(
      order8.id,
      "confirmed",
      "processing",
      "admin@gmail.com"
    );

    // Order 9 status history (pending)
    await seedStatusHistory(order9.id, null, "pending", "System");

    // Order 10 status history (shipped)
    await seedStatusHistory(order10.id, null, "pending", "System");
    await seedStatusHistory(
      order10.id,
      "pending",
      "confirmed",
      "admin@gmail.com"
    );
    await seedStatusHistory(
      order10.id,
      "confirmed",
      "processing",
      "admin@gmail.com"
    );
    await seedStatusHistory(
      order10.id,
      "processing",
      "shipped",
      "admin@gmail.com"
    );

    // Order 11 status history (delivered)
    await seedStatusHistory(order11.id, null, "pending", "System");
    await seedStatusHistory(
      order11.id,
      "pending",
      "confirmed",
      "admin@gmail.com"
    );
    await seedStatusHistory(
      order11.id,
      "confirmed",
      "processing",
      "admin@gmail.com"
    );
    await seedStatusHistory(
      order11.id,
      "processing",
      "shipped",
      "admin@gmail.com"
    );
    await seedStatusHistory(order11.id, "shipped", "delivered", "System");

    // Order 12 status history (confirmed)
    await seedStatusHistory(order12.id, null, "pending", "System");
    await seedStatusHistory(
      order12.id,
      "pending",
      "confirmed",
      "admin@gmail.com"
    );

    // Order 13 status history (processing)
    await seedStatusHistory(order13.id, null, "pending", "System");
    await seedStatusHistory(
      order13.id,
      "pending",
      "confirmed",
      "admin@gmail.com"
    );
    await seedStatusHistory(
      order13.id,
      "confirmed",
      "processing",
      "admin@gmail.com"
    );

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
          .values({ name, description, slug, isActive: true, displayOrder })
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

    // Add collection translations
    await seedCollectionTranslations(promotionsCollection.id, {
      en: {
        name: "Promotions",
        description:
          "Special offers and discounted products with exclusive deals and limited-time savings on premium electronics and office furniture.",
        slug: "promotions",
      },
      fr: {
        name: "Promotions",
        description:
          "Offres spéciales et produits à prix réduit avec des offres exclusives et des économies limitées dans le temps sur les appareils électroniques et meubles de bureau premium.",
        slug: "promotions",
      },
      ar: {
        name: "العروض الترويجية",
        description:
          "عروض خاصة ومنتجات مخفضة مع صفقات حصرية وتوفيرات محدودة الوقت على الإلكترونيات المتميزة وأثاث المكاتب.",
        slug: "promotions-ar",
      },
    });

    await seedCollectionTranslations(newArrivalsCollection.id, {
      en: {
        name: "New Arrivals",
        description:
          "Recently added products to our store featuring the latest technology, newest designs, and cutting-edge innovations in electronics and office solutions.",
        slug: "new-arrivals",
      },
      fr: {
        name: "Nouveautés",
        description:
          "Produits récemment ajoutés à notre magasin présentant les dernières technologies, les designs les plus récents et les innovations de pointe en électronique et solutions de bureau.",
        slug: "nouveautes",
      },
      ar: {
        name: "الوافدون الجدد",
        description:
          "منتجات تمت إضافتها مؤخرًا إلى متجرنا تعرض أحدث التقنيات والتصاميم الأحدث والابتكارات المتطورة في الإلكترونيات وحلول المكاتب.",
        slug: "new-arrivals-ar",
      },
    });

    await seedCollectionTranslations(premiumCollection.id, {
      en: {
        name: "Premium Products",
        description:
          "High-end and luxury items designed for professionals who demand the best quality, performance, and craftsmanship in their workspace technology.",
        slug: "premium-products",
      },
      fr: {
        name: "Produits Premium",
        description:
          "Articles haut de gamme et de luxe conçus pour les professionnels qui exigent la meilleure qualité, performance et artisanat dans leur technologie d'espace de travail.",
        slug: "produits-premium",
      },
      ar: {
        name: "المنتجات المتميزة",
        description:
          "منتجات راقية وفاخرة مصممة للمحترفين الذين يطالبون بأفضل جودة وأداء وحرفية في تقنية مساحة العمل الخاصة بهم.",
        slug: "premium-products-ar",
      },
    });

    await seedCollectionTranslations(gamingCollection.id, {
      en: {
        name: "Gaming Zone",
        description:
          "Everything for gamers including powerful gaming laptops with high refresh rate displays, advanced cooling systems, and top-tier graphics cards for immersive gameplay.",
        slug: "gaming-zone",
      },
      fr: {
        name: "Zone Gaming",
        description:
          "Tout pour les joueurs, y compris des ordinateurs portables de gaming puissants avec des écrans à taux de rafraîchissement élevé, des systèmes de refroidissement avancés et des cartes graphiques haut de gamme pour un gameplay immersif.",
        slug: "zone-gaming",
      },
      ar: {
        name: "منطقة الألعاب",
        description:
          "كل شيء للاعبين بما في ذلك أجهزة كمبيوتر محمولة قوية للألعاب مع شاشات عرض بمعدل تحديث عالي وأنظمة تبريد متقدمة وبطاقات رسومات من الدرجة الأولى لتجربة ألعاب غامرة.",
        slug: "gaming-zone-ar",
      },
    });

    await seedCollectionTranslations(workFromHomeCollection.id, {
      en: {
        name: "Work From Home Essentials",
        description:
          "Perfect setup for remote work with business laptops, ergonomic chairs, and productivity tools designed to create an efficient and comfortable home office environment.",
        slug: "work-from-home",
      },
      fr: {
        name: "Essentiels du Télétravail",
        description:
          "Configuration parfaite pour le travail à distance avec des ordinateurs portables professionnels, des chaises ergonomiques et des outils de productivité conçus pour créer un environnement de bureau à domicile efficace et confortable.",
        slug: "teletravail",
      },
      ar: {
        name: "أساسيات العمل من المنزل",
        description:
          "إعداد مثالي للعمل عن بُعد مع أجهزة كمبيوتر محمولة للأعمال وكراسي مريحة وأدوات إنتاجية مصممة لإنشاء بيئة مكتب منزلي فعالة ومريحة.",
        slug: "work-from-home-ar",
      },
    });

    await seedCollectionTranslations(mobilityCollection.id, {
      en: {
        name: "Mobile Productivity",
        description:
          "Portable devices for on-the-go professionals including lightweight tablets, ultra-portable laptops, and mobile accessories that keep you productive anywhere.",
        slug: "mobile-productivity",
      },
      fr: {
        name: "Productivité Mobile",
        description:
          "Appareils portables pour les professionnels en déplacement, y compris des tablettes légères, des ordinateurs portables ultra-portables et des accessoires mobiles qui vous maintiennent productif partout.",
        slug: "productivite-mobile",
      },
      ar: {
        name: "الإنتاجية المتنقلة",
        description:
          "أجهزة محمولة للمحترفين أثناء التنقل بما في ذلك أجهزة لوحية خفيفة الوزن وأجهزة كمبيوتر محمولة فائقة الحمل وملحقات متنقلة تبقيك منتجًا في أي مكان.",
        slug: "mobile-productivity-ar",
      },
    });

    console.log("✔ Collections seeded with translations");

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
    await linkProductToCollection(msiGaming.id, newArrivalsCollection.id, 1);
    await linkProductToCollection(latitude.id, newArrivalsCollection.id, 2);
    await linkProductToCollection(galaxy.id, newArrivalsCollection.id, 3);
    await linkProductToCollection(herman.id, newArrivalsCollection.id, 4);

    // Premium Products Collection (high-end items)
    await linkProductToCollection(herman.id, premiumCollection.id, 1); // $1299
    await linkProductToCollection(msiGaming.id, premiumCollection.id, 2); // $2599
    await linkProductToCollection(rog.id, premiumCollection.id, 3); // $2299
    await linkProductToCollection(latitude.id, premiumCollection.id, 4); // $2099
    await linkProductToCollection(thinkpad.id, premiumCollection.id, 5); // $1899

    // Gaming Zone Collection (gaming-related products)
    await linkProductToCollection(rog.id, gamingCollection.id, 1);
    await linkProductToCollection(msiGaming.id, gamingCollection.id, 2);

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
