/**
 * Purge old audit logs based on data retention policies
 */

import { prisma as db } from "@qp/db/client";

interface PurgeAuditLogsResult {
  tenantId: string;
  deleted: number;
  retentionDays: number;
}

/**
 * Purges audit logs older than the retention period
 * Note: Some logs may be flagged to keep (future enhancement)
 */
export async function purgeAuditLogs(): Promise<PurgeAuditLogsResult[]> {
  console.log("[purge-audit-logs] Starting purge job...");

  const results: PurgeAuditLogsResult[] = [];

  // Get all data retention policies
  const policies = await db.dataRetentionPolicy.findMany({
    where: {
      poolId: null, // Only tenant-level policies
    },
  });

  for (const policy of policies) {
    const rules = policy.rules as any;
    const auditDays = rules?.auditDays ?? 365; // Default 1 year

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - auditDays);

    // Delete audit logs older than cutoff
    // Future: Add a "keepFlag" field to preserve important logs
    const deleteResult = await db.auditLog.deleteMany({
      where: {
        tenantId: policy.tenantId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(
      `[purge-audit-logs] Tenant ${policy.tenantId}: Deleted ${deleteResult.count} logs older than ${auditDays} days`
    );

    results.push({
      tenantId: policy.tenantId,
      deleted: deleteResult.count,
      retentionDays: auditDays,
    });
  }

  // Also purge for tenants without explicit policies (use default 365 days)
  const tenantsWithPolicies = policies.map((p) => p.tenantId);
  const tenantsWithoutPolicies = await db.tenant.findMany({
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
    const defaultDays = 365;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - defaultDays);

    const deleteResult = await db.auditLog.deleteMany({
      where: {
        tenantId: tenant.id,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    if (deleteResult.count > 0) {
      console.log(
        `[purge-audit-logs] Tenant ${tenant.id} (default policy): Deleted ${deleteResult.count} logs`
      );

      results.push({
        tenantId: tenant.id,
        deleted: deleteResult.count,
        retentionDays: defaultDays,
      });
    }
  }

  console.log(
    `[purge-audit-logs] Completed. Total deleted: ${results.reduce((sum, r) => sum + r.deleted, 0)}`
  );

  return results;
}
