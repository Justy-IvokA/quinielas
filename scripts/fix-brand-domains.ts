/**
 * Script to fix Brand.domains field
 * Converts empty objects {} to empty arrays []
 */

import { prisma } from "@qp/db";

async function fixBrandDomains() {
  console.log("🔧 Fixing Brand.domains field...\n");

  // Get all brands
  const brands = await prisma.brand.findMany({
    include: { tenant: true }
  });

  console.log(`Found ${brands.length} brands\n`);

  for (const brand of brands) {
    console.log(`\n📦 Brand: ${brand.name} (${brand.slug})`);
    console.log(`   Tenant: ${brand.tenant.name} (${brand.tenant.slug})`);
    console.log(`   Current domains:`, brand.domains);
    console.log(`   Type:`, typeof brand.domains);
    console.log(`   Is Array:`, Array.isArray(brand.domains));

    // Check if domains is not an array or is an empty object
    if (!Array.isArray(brand.domains)) {
      console.log(`   ⚠️  domains is not an array! Fixing...`);
      
      await prisma.brand.update({
        where: { id: brand.id },
        data: { domains: [] }
      });
      
      console.log(`   ✅ Fixed! Set to empty array []`);
    } else if (brand.domains.length === 0) {
      console.log(`   ✅ domains is already an empty array`);
    } else {
      console.log(`   ✅ domains has ${brand.domains.length} entries:`, brand.domains);
    }
  }

  console.log("\n\n✅ Done! All brands checked and fixed.\n");
}

fixBrandDomains()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
