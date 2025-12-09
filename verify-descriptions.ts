import { db } from "./src/db/data-source";
import { categories } from "./src/db/schema/categories";
import { subCategories } from "./src/db/schema/subcategories";
import { subSubCategories } from "./src/db/schema/subsubcategories";
import { products } from "./src/db/schema/product";

async function verifyDescriptions() {
  console.log("🔍 Verifying seeded description values in database...\n");

  try {
    // Check categories
    console.log("📂 CATEGORIES:");
    const categoryResults = await db.select().from(categories);
    categoryResults.forEach((cat) => {
      console.log(
        `  ${cat.name}: ${
          cat.description ? "✓ Has description" : "✗ No description"
        }`
      );
      if (cat.description) {
        console.log(
          `    "${cat.description.substring(0, 100)}${
            cat.description.length > 100 ? "..." : ""
          }"`
        );
      }
    });

    console.log("\n📁 SUBCATEGORIES:");
    const subCategoryResults = await db.select().from(subCategories);
    subCategoryResults.forEach((sub) => {
      console.log(
        `  ${sub.name}: ${
          sub.description ? "✓ Has description" : "✗ No description"
        }`
      );
      if (sub.description) {
        console.log(
          `    "${sub.description.substring(0, 100)}${
            sub.description.length > 100 ? "..." : ""
          }"`
        );
      }
    });

    console.log("\n📄 SUBSUBCATEGORIES:");
    const subSubCategoryResults = await db.select().from(subSubCategories);
    subSubCategoryResults.forEach((subsub) => {
      console.log(
        `  ${subsub.name}: ${
          subsub.description ? "✓ Has description" : "✗ No description"
        }`
      );
      if (subsub.description) {
        console.log(
          `    "${subsub.description.substring(0, 100)}${
            subsub.description.length > 100 ? "..." : ""
          }"`
        );
      }
    });

    console.log("\n🛍️  PRODUCTS:");
    const productResults = await db.select().from(products);
    productResults.forEach((prod) => {
      console.log(
        `  ${prod.name}: ${
          prod.description ? "✓ Has description" : "✗ No description"
        }`
      );
      if (prod.description) {
        console.log(`    "${prod.description}"`);
      }
    });

    console.log("\n✅ Verification completed!");
  } catch (error) {
    console.error("❌ Error verifying descriptions:", error);
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifyDescriptions().then(() => process.exit(0));
}

export { verifyDescriptions };
