/**
 * Verification script for registration flows implementation
 * Run with: pnpm tsx scripts/verify-registration-flows.ts
 */

import { prisma } from "@qp/db";

interface VerificationResult {
  category: string;
  check: string;
  status: "✓" | "✗" | "⚠";
  message: string;
}

const results: VerificationResult[] = [];

function addResult(category: string, check: string, status: "✓" | "✗" | "⚠", message: string) {
  results.push({ category, check, status, message });
}

async function verifyDatabaseSchema() {
  console.log("\n🔍 Verifying Database Schema...\n");

  try {
    // Check AccessPolicy table
    const accessPolicyCount = await prisma.accessPolicy.count();
    addResult("Database", "AccessPolicy table", "✓", `Found ${accessPolicyCount} access policies`);

    // Check for AccessType enum values
    const policies = await prisma.accessPolicy.findMany({
      select: { accessType: true }
    });
    const types = new Set(policies.map(p => p.accessType));
    
    if (types.has("PUBLIC") || types.has("CODE") || types.has("EMAIL_INVITE")) {
      addResult("Database", "AccessType enum", "✓", `Found types: ${Array.from(types).join(", ")}`);
    } else {
      addResult("Database", "AccessType enum", "⚠", "No policies with standard access types found");
    }

    // Check Registration table
    const registrationCount = await prisma.registration.count();
    addResult("Database", "Registration table", "✓", `Found ${registrationCount} registrations`);

    // Check InviteCode table
    const codeCount = await prisma.inviteCode.count();
    addResult("Database", "InviteCode table", "✓", `Found ${codeCount} invite codes`);

    // Check Invitation table
    const invitationCount = await prisma.invitation.count();
    addResult("Database", "Invitation table", "✓", `Found ${invitationCount} invitations`);

  } catch (error) {
    addResult("Database", "Schema verification", "✗", `Error: ${error}`);
  }
}

async function verifyPoolConfiguration() {
  console.log("\n🔍 Verifying Pool Configuration...\n");

  try {
    // Find pools with access policies
    const poolsWithPolicies = await prisma.pool.findMany({
      where: {
        accessPolicy: {
          isNot: null
        }
      },
      include: {
        accessPolicy: true
      },
      take: 5
    });

    if (poolsWithPolicies.length === 0) {
      addResult("Pools", "Access policies", "⚠", "No pools with access policies found");
    } else {
      addResult("Pools", "Access policies", "✓", `Found ${poolsWithPolicies.length} pools with policies`);
      
      // Check each access type
      const publicPools = poolsWithPolicies.filter(p => p.accessPolicy?.accessType === "PUBLIC");
      const codePools = poolsWithPolicies.filter(p => p.accessPolicy?.accessType === "CODE");
      const invitePools = poolsWithPolicies.filter(p => p.accessPolicy?.accessType === "EMAIL_INVITE");

      addResult("Pools", "PUBLIC pools", publicPools.length > 0 ? "✓" : "⚠", `${publicPools.length} pools`);
      addResult("Pools", "CODE pools", codePools.length > 0 ? "✓" : "⚠", `${codePools.length} pools`);
      addResult("Pools", "EMAIL_INVITE pools", invitePools.length > 0 ? "✓" : "⚠", `${invitePools.length} pools`);
    }

    // Check for pools with registration windows
    const poolsWithWindows = await prisma.accessPolicy.count({
      where: {
        OR: [
          { registrationStartDate: { not: null } },
          { registrationEndDate: { not: null } }
        ]
      }
    });
    addResult("Pools", "Registration windows", poolsWithWindows > 0 ? "✓" : "⚠", `${poolsWithWindows} policies with windows`);

    // Check for pools with capacity limits
    const poolsWithLimits = await prisma.accessPolicy.count({
      where: {
        maxRegistrations: { not: null }
      }
    });
    addResult("Pools", "Capacity limits", poolsWithLimits > 0 ? "✓" : "⚠", `${poolsWithLimits} policies with limits`);

  } catch (error) {
    addResult("Pools", "Configuration check", "✗", `Error: ${error}`);
  }
}

async function verifyInviteCodes() {
  console.log("\n🔍 Verifying Invite Codes...\n");

  try {
    // Check for valid codes
    const validCodes = await prisma.inviteCode.count({
      where: {
        status: { in: ["UNUSED", "PARTIALLY_USED"] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    addResult("Invite Codes", "Valid codes", validCodes > 0 ? "✓" : "⚠", `${validCodes} valid codes available`);

    // Check code format (should be 8 chars)
    const codes = await prisma.inviteCode.findMany({
      select: { code: true },
      take: 10
    });
    
    const invalidFormat = codes.filter(c => c.code.length !== 8 || !/^[A-Z0-9]+$/.test(c.code));
    if (invalidFormat.length > 0) {
      addResult("Invite Codes", "Code format", "⚠", `${invalidFormat.length} codes with invalid format`);
    } else if (codes.length > 0) {
      addResult("Invite Codes", "Code format", "✓", "All codes have valid format (8 chars, A-Z0-9)");
    }

    // Check for codes with remaining uses
    const codesWithUses = await prisma.inviteCode.count({
      where: {
        usedCount: { lt: prisma.inviteCode.fields.usesPerCode }
      }
    });
    addResult("Invite Codes", "Available uses", codesWithUses > 0 ? "✓" : "⚠", `${codesWithUses} codes with remaining uses`);

  } catch (error) {
    addResult("Invite Codes", "Verification", "✗", `Error: ${error}`);
  }
}

async function verifyInvitations() {
  console.log("\n🔍 Verifying Email Invitations...\n");

  try {
    // Check for pending invitations
    const pendingInvitations = await prisma.invitation.count({
      where: {
        status: "PENDING",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    addResult("Invitations", "Pending invitations", pendingInvitations > 0 ? "✓" : "⚠", `${pendingInvitations} pending invitations`);

    // Check token format (should be 64 chars hex)
    const invitations = await prisma.invitation.findMany({
      select: { token: true },
      take: 10
    });
    
    const invalidTokens = invitations.filter(i => i.token.length !== 64 || !/^[a-f0-9]+$/.test(i.token));
    if (invalidTokens.length > 0) {
      addResult("Invitations", "Token format", "⚠", `${invalidTokens.length} tokens with invalid format`);
    } else if (invitations.length > 0) {
      addResult("Invitations", "Token format", "✓", "All tokens have valid format (64 chars, hex)");
    }

    // Check for accepted invitations
    const acceptedCount = await prisma.invitation.count({
      where: { status: "ACCEPTED" }
    });
    addResult("Invitations", "Accepted invitations", "✓", `${acceptedCount} invitations accepted`);

  } catch (error) {
    addResult("Invitations", "Verification", "✗", `Error: ${error}`);
  }
}

async function verifyRegistrations() {
  console.log("\n🔍 Verifying Registrations...\n");

  try {
    // Check registrations by type
    const publicRegs = await prisma.registration.count({
      where: {
        inviteCodeId: null,
        invitationId: null
      }
    });
    addResult("Registrations", "Public registrations", "✓", `${publicRegs} public registrations`);

    const codeRegs = await prisma.registration.count({
      where: {
        inviteCodeId: { not: null }
      }
    });
    addResult("Registrations", "Code registrations", "✓", `${codeRegs} code-based registrations`);

    const inviteRegs = await prisma.registration.count({
      where: {
        invitationId: { not: null }
      }
    });
    addResult("Registrations", "Invite registrations", "✓", `${inviteRegs} invite-based registrations`);

    // Check for registrations with phone numbers
    const withPhone = await prisma.registration.count({
      where: {
        phone: { not: null }
      }
    });
    addResult("Registrations", "Phone numbers", "✓", `${withPhone} registrations with phone`);

  } catch (error) {
    addResult("Registrations", "Verification", "✗", `Error: ${error}`);
  }
}

function printResults() {
  console.log("\n" + "=".repeat(80));
  console.log("📊 VERIFICATION RESULTS");
  console.log("=".repeat(80) + "\n");

  const grouped = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, VerificationResult[]>);

  for (const [category, items] of Object.entries(grouped)) {
    console.log(`\n${category}:`);
    console.log("-".repeat(80));
    for (const item of items) {
      console.log(`  ${item.status} ${item.check.padEnd(30)} ${item.message}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  
  const passed = results.filter(r => r.status === "✓").length;
  const warnings = results.filter(r => r.status === "⚠").length;
  const failed = results.filter(r => r.status === "✗").length;
  
  console.log(`\nSummary: ${passed} passed, ${warnings} warnings, ${failed} failed`);
  console.log("=".repeat(80) + "\n");
}

async function main() {
  console.log("🚀 Starting Registration Flows Verification\n");

  await verifyDatabaseSchema();
  await verifyPoolConfiguration();
  await verifyInviteCodes();
  await verifyInvitations();
  await verifyRegistrations();

  printResults();

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Verification failed:", error);
  process.exit(1);
});
