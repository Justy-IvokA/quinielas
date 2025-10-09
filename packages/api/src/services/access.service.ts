import type { PrismaClient, AccessPolicy, AccessType } from "@qp/db";
import { TRPCError } from "@trpc/server";

export interface CreateAccessPolicyInput {
  poolId: string;
  tenantId: string;
  accessType: AccessType;
  requireCaptcha?: boolean;
  requireEmailVerification?: boolean;
  domainAllowList?: string[];
  maxRegistrations?: number;
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  userCap?: number;
  windowStart?: Date;
  windowEnd?: Date;
}

export interface UpdateAccessPolicyInput {
  accessType?: AccessType;
  requireCaptcha?: boolean;
  requireEmailVerification?: boolean;
  domainAllowList?: string[];
  maxRegistrations?: number;
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  userCap?: number;
  windowStart?: Date;
  windowEnd?: Date;
}

export class AccessService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create access policy for a pool
   */
  async create(input: CreateAccessPolicyInput): Promise<AccessPolicy> {
    // Check if policy already exists
    const existing = await this.prisma.accessPolicy.findUnique({
      where: { poolId: input.poolId }
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Access policy already exists for this pool"
      });
    }

    // Verify pool belongs to tenant
    const pool = await this.prisma.pool.findFirst({
      where: {
        id: input.poolId,
        tenantId: input.tenantId
      }
    });

    if (!pool) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pool not found or does not belong to tenant"
      });
    }

    return this.prisma.accessPolicy.create({
      data: input
    });
  }

  /**
   * Get access policy by pool ID
   */
  async getByPoolId(poolId: string, tenantId: string) {
    const policy = await this.prisma.accessPolicy.findFirst({
      where: {
        poolId,
        tenantId
      },
      include: {
        pool: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    if (!policy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Access policy not found"
      });
    }

    return policy;
  }

  /**
   * Update access policy
   */
  async update(policyId: string, tenantId: string, input: UpdateAccessPolicyInput) {
    // Verify policy belongs to tenant
    const policy = await this.prisma.accessPolicy.findFirst({
      where: {
        id: policyId,
        tenantId
      }
    });

    if (!policy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Access policy not found"
      });
    }

    return this.prisma.accessPolicy.update({
      where: { id: policyId },
      data: input
    });
  }

  /**
   * Upsert access policy (create or update)
   */
  async upsert(poolId: string, tenantId: string, input: CreateAccessPolicyInput) {
    // Verify pool belongs to tenant
    const pool = await this.prisma.pool.findFirst({
      where: {
        id: poolId,
        tenantId
      }
    });

    if (!pool) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pool not found or does not belong to tenant"
      });
    }

    return this.prisma.accessPolicy.upsert({
      where: { poolId },
      create: input,
      update: input
    });
  }

  /**
   * List access policies by tenant
   */
  async listByTenant(tenantId: string) {
    return this.prisma.accessPolicy.findMany({
      where: { tenantId },
      include: {
        pool: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Delete access policy
   */
  async delete(policyId: string, tenantId: string) {
    const policy = await this.prisma.accessPolicy.findFirst({
      where: {
        id: policyId,
        tenantId
      }
    });

    if (!policy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Access policy not found"
      });
    }

    return this.prisma.accessPolicy.delete({
      where: { id: policyId }
    });
  }
}
