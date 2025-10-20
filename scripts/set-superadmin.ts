/**
 * Script to set a user as SUPERADMIN
 * 
 * Usage:
 * npx tsx scripts/set-superadmin.ts <email>
 * 
 * Example:
 * npx tsx scripts/set-superadmin.ts admin@example.com
 */

import { prisma } from "../packages/db";

async function setSuperAdmin(email: string) {
  console.log(`Setting SUPERADMIN role for user: ${email}`);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          tenant: true
        }
      }
    }
  });

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name || user.email}`);
  console.log(`   ID: ${user.id}`);

  // Get all tenants
  const tenants = await prisma.tenant.findMany();

  if (tenants.length === 0) {
    console.error(`❌ No tenants found in database`);
    process.exit(1);
  }

  console.log(`\n📋 Found ${tenants.length} tenant(s)`);

  // Add SUPERADMIN membership to all tenants
  for (const tenant of tenants) {
    const existingMembership = await prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: user.id
        }
      }
    });

    if (existingMembership) {
      if (existingMembership.role === "SUPERADMIN") {
        console.log(`   ✓ Already SUPERADMIN in tenant: ${tenant.name}`);
      } else {
        await prisma.tenantMember.update({
          where: { id: existingMembership.id },
          data: { role: "SUPERADMIN" }
        });
        console.log(`   ✓ Updated to SUPERADMIN in tenant: ${tenant.name}`);
      }
    } else {
      await prisma.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: "SUPERADMIN"
        }
      });
      console.log(`   ✓ Added as SUPERADMIN to tenant: ${tenant.name}`);
    }
  }

  console.log(`\n✅ User ${email} is now SUPERADMIN in all tenants!`);
  console.log(`\n🔄 Please refresh your browser to see the SUPERADMIN menu.`);
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error(`❌ Usage: npx tsx scripts/set-superadmin.ts <email>`);
  process.exit(1);
}

setSuperAdmin(email)
  .catch((error) => {
    console.error(`❌ Error:`, error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
