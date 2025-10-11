/**
 * Purge expired invitations based on data retention policies
 */

import { prisma } from "@qp/db/client";

interface PurgeInvitationsResult {
  tenantId: string;
  deleted: number;
  retentionDays: number;
}

/**
 * Purges expired invitations older than the retention period
 */
export async function purgeInvitations(): Promise<PurgeInvitationsResult[]> {
  console.log("[purge-invitations] Starting purge job...");

  const results: PurgeInvitationsResult[] = [];

  // Get all data retention policies
  const policies = await prisma.dataRetentionPolicy.findMany({
    where: {
      poolId: null, // Only tenant-level policies for now
    },
  });

  for (const policy of policies) {
    const rules = policy.rules as any;
    const invitesDays = rules?.invitesDays ?? 90; // Default 90 days

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - invitesDays);

    // Delete expired invitations older than cutoff
    const deleteResult = await prisma.invitation.deleteMany({
      where: {
        tenantId: policy.tenantId,
        status: "EXPIRED",
        expiresAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(
      `[purge-invitations] Tenant ${policy.tenantId}: Deleted ${deleteResult.count} invitations older than ${invitesDays} days`
    );

    results.push({
      tenantId: policy.tenantId,
      deleted: deleteResult.count,
      retentionDays: invitesDays,
    });
  }

  // Also purge for tenants without explicit policies (use default 90 days)
  const tenantsWithPolicies = policies.map((p) => p.tenantId);
  const tenantsWithoutPolicies = await prisma.tenant.findMany({
    where: {
      id: {
        notIn: tenantsWithPolicies,
      },
    },
    select: {
      id: true,
    },
  });

  for (const tenant of tenantsWithoutPolicies) {
    const defaultDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - defaultDays);

    const deleteResult = await prisma.invitation.deleteMany({
      where: {
        tenantId: tenant.id,
        status: "EXPIRED",
        expiresAt: {
          lt: cutoffDate,
        },
      },
    });

    if (deleteResult.count > 0) {
      console.log(
        `[purge-invitations] Tenant ${tenant.id} (default policy): Deleted ${deleteResult.count} invitations`
      );

      results.push({
        tenantId: tenant.id,
        deleted: deleteResult.count,
        retentionDays: defaultDays,
      });
    }
  }

  console.log(
    `[purge-invitations] Completed. Total deleted: ${results.reduce((sum, r) => sum + r.deleted, 0)}`
  );

  return results;
}
