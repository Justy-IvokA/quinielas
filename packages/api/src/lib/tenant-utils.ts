import { TRPCError } from "@trpc/server";
import type { PrismaClient, Tenant, Brand } from "@qp/db";

/**
 * Validate that a brand belongs to a tenant
 */
export function validateBrandBelongsToTenant(brand: Brand, tenant: Tenant): void {
  if (brand.tenantId !== tenant.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Brand does not belong to the current tenant"
    });
  }
}

/**
 * Validate that a resource belongs to a tenant
 */
export function validateResourceBelongsToTenant(
  resourceTenantId: string,
  tenant: Tenant,
  resourceType: string = "Resource"
): void {
  if (resourceTenantId !== tenant.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `${resourceType} does not belong to the current tenant`
    });
  }
}

/**
 * Helper to scope queries by tenant
 * Returns a where clause that includes tenantId filter
 */
export function scopeByTenant<T extends Record<string, unknown>>(
  tenantId: string,
  additionalWhere?: T
): T & { tenantId: string } {
  return {
    tenantId,
    ...additionalWhere
  } as T & { tenantId: string };
}

/**
 * Get tenant member role for a user
 */
export async function getTenantMemberRole(
  prisma: PrismaClient,
  tenantId: string,
  userId: string
): Promise<string | null> {
  const member = await prisma.tenantMember.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId
      }
    },
    select: {
      role: true
    }
  });

  return member?.role ?? null;
}

/**
 * Check if user has required role in tenant
 */
export async function requireTenantRole(
  prisma: PrismaClient,
  tenantId: string,
  userId: string,
  allowedRoles: string[]
): Promise<void> {
  const role = await getTenantMemberRole(prisma, tenantId, userId);

  if (!role || !allowedRoles.includes(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Insufficient permissions for this operation"
    });
  }
}
