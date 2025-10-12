/**
 * Verification script for Pool Editor implementation
 * Run with: pnpm tsx scripts/verify-pool-editor.ts
 */

import { prisma } from "@qp/db";

async function verifyPoolEditor() {
  console.log("🔍 Verifying Pool Editor Implementation...\n");

  try {
    // 1. Check if we have test data
    console.log("1️⃣ Checking test data...");
    const tenant = await prisma.tenant.findFirst({
      include: {
        brands: true,
        pools: {
          include: {
            season: true,
            accessPolicy: true,
            prizes: true
          }
        }
      }
    });

    if (!tenant) {
      console.log("❌ No tenant found. Run seed script first.");
      return;
    }

    console.log(`✅ Found tenant: ${tenant.name} (${tenant.slug})`);
    console.log(`   - Brands: ${tenant.brands.length}`);
    console.log(`   - Pools: ${tenant.pools.length}`);

    // 2. Check pool structure
    if (tenant.pools.length > 0) {
      const pool = tenant.pools[0];
      console.log("\n2️⃣ Checking pool structure...");
      console.log(`✅ Pool: ${pool.name}`);
      console.log(`   - ID: ${pool.id}`);
      console.log(`   - Slug: ${pool.slug}`);
      console.log(`   - Brand: ${pool.brandId ? "✅" : "⚠️ Missing"}`);
      console.log(`   - Season: ${pool.season.name} (${pool.season.year})`);
      console.log(`   - Active: ${pool.isActive ? "✅" : "❌"}`);
      console.log(`   - Public: ${pool.isPublic ? "✅" : "❌"}`);

      // 3. Check access policy
      console.log("\n3️⃣ Checking access policy...");
      if (pool.accessPolicy) {
        console.log(`✅ Access policy exists`);
        console.log(`   - Type: ${pool.accessPolicy.accessType}`);
        console.log(`   - CAPTCHA: ${pool.accessPolicy.requireCaptcha ? "✅" : "❌"}`);
        console.log(`   - Email verification: ${pool.accessPolicy.requireEmailVerification ? "✅" : "❌"}`);
      } else {
        console.log("⚠️ No access policy (can be created via edit page)");
      }

      // 4. Check prizes
      console.log("\n4️⃣ Checking prizes...");
      if (pool.prizes.length > 0) {
        console.log(`✅ Found ${pool.prizes.length} prize(s)`);
        pool.prizes.forEach((prize, idx) => {
          console.log(`   ${idx + 1}. ${prize.title} (Rank ${prize.rankFrom}-${prize.rankTo})`);
        });

        // Check for overlaps
        const hasOverlap = pool.prizes.some((p1, i) =>
          pool.prizes.some((p2, j) => {
            if (i >= j) return false;
            const overlapStart = Math.max(p1.rankFrom, p2.rankFrom);
            const overlapEnd = Math.min(p1.rankTo, p2.rankTo);
            return overlapStart <= overlapEnd;
          })
        );
        if (hasOverlap) {
          console.log("   ⚠️ WARNING: Overlapping prize ranges detected!");
        } else {
          console.log("   ✅ No overlapping ranges");
        }
      } else {
        console.log("⚠️ No prizes configured (can be added via edit page)");
      }

      // 5. Check matches
      console.log("\n5️⃣ Checking fixtures...");
      const matches = await prisma.match.count({
        where: { seasonId: pool.seasonId }
      });
      console.log(`${matches > 0 ? "✅" : "⚠️"} Found ${matches} match(es) for season`);

      // 6. Check settings
      console.log("\n6️⃣ Checking settings...");
      const poolSettings = await prisma.setting.count({
        where: { poolId: pool.id, scope: "POOL" }
      });
      const tenantSettings = await prisma.setting.count({
        where: { tenantId: tenant.id, scope: "TENANT" }
      });
      console.log(`   - Pool settings: ${poolSettings}`);
      console.log(`   - Tenant settings: ${tenantSettings}`);

      // 7. Generate edit URL
      console.log("\n7️⃣ Edit page URL:");
      console.log(`   📝 http://localhost:3001/es-MX/pools/${pool.id}/edit`);

      // 8. Generate public URL (if brand has domains)
      if (pool.brandId) {
        const brand = tenant.brands.find((b) => b.id === pool.brandId);
        if (brand && brand.domains.length > 0) {
          console.log("\n8️⃣ Public pool URL:");
          console.log(`   🌐 https://${brand.domains[0]}/${pool.slug}`);
        } else {
          console.log("\n8️⃣ Public pool URL:");
          console.log("   ⚠️ Brand has no domains configured");
        }
      }
    } else {
      console.log("\n❌ No pools found. Create a pool first.");
    }

    console.log("\n✅ Verification complete!");
    console.log("\n📋 Next steps:");
    console.log("   1. Start admin app: cd apps/admin && pnpm dev");
    console.log("   2. Navigate to the edit URL above");
    console.log("   3. Test each tab (General, Access, Prizes, Settings, Fixtures)");
    console.log("   4. Verify auth guards (try as non-admin user)");
    console.log("   5. Test form validations and save operations");

  } catch (error) {
    console.error("❌ Error during verification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPoolEditor();
