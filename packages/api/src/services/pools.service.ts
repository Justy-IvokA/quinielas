import type { PrismaClient, Pool, Prisma } from "@qp/db";
import { TRPCError } from "@trpc/server";

export interface CreatePoolInput {
  tenantId: string;
  brandId?: string;
  seasonId: string;
  name: string;
  slug: string;
  description?: string;
  prizeSummary?: string;
  ruleSet?: Prisma.InputJsonValue;
  isActive?: boolean;
  isPublic?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdatePoolInput {
  name?: string;
  description?: string;
  prizeSummary?: string;
  ruleSet?: Prisma.InputJsonValue;
  isActive?: boolean;
  isPublic?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export class PoolsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new pool
   */
  async create(input: CreatePoolInput): Promise<Pool> {
    // Check for slug uniqueness within tenant
    const existing = await this.prisma.pool.findFirst({
      where: {
        tenantId: input.tenantId,
        slug: input.slug
      }
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A pool with this slug already exists in this tenant"
      });
    }

    // Validate dates
    if (input.startDate && input.endDate && input.endDate <= input.startDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "End date must be after start date"
      });
    }

    return this.prisma.pool.create({
      data: input,
      include: {
        brand: true,
        season: {
          include: {
            competition: true
          }
        }
      }
    });
  }

  /**
   * List pools by tenant
   */
  async listByTenant(
    tenantId: string,
    options?: {
      includeInactive?: boolean;
      brandId?: string;
    }
  ) {
    return this.prisma.pool.findMany({
      where: {
        tenantId,
        ...(options?.includeInactive ? {} : { isActive: true }),
        ...(options?.brandId ? { brandId: options.brandId } : {})
      },
      include: {
        brand: {
          select: { name: true, slug: true }
        },
        season: {
          select: { name: true, year: true }
        },
        _count: {
          select: {
            registrations: true,
            prizes: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Get pool by ID
   */
  async getById(poolId: string, tenantId: string) {
    const pool = await this.prisma.pool.findFirst({
      where: {
        id: poolId,
        tenantId
      },
      include: {
        tenant: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true, logoUrl: true, theme: true } },
        season: {
          include: {
            competition: true
          }
        },
        accessPolicy: true,
        prizes: { orderBy: { position: "asc" } },
        _count: {
          select: {
            registrations: true,
            predictions: true
          }
        }
      }
    });

    if (!pool) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pool not found"
      });
    }

    return pool;
  }

  /**
   * Get pool by slug
   */
  async getBySlug(tenantId: string, slug: string) {
    const pool = await this.prisma.pool.findFirst({
      where: {
        tenantId,
        slug
      },
      include: {
        tenant: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true, logoUrl: true, theme: true } },
        season: {
          include: {
            competition: true
          }
        },
        accessPolicy: true,
        prizes: { orderBy: { position: "asc" } },
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });

    if (!pool) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pool not found"
      });
    }

    return pool;
  }

  /**
   * Update pool
   */
  async update(poolId: string, tenantId: string, input: UpdatePoolInput) {
    // Verify pool belongs to tenant
    const pool = await this.prisma.pool.findFirst({
      where: { id: poolId, tenantId }
    });

    if (!pool) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pool not found"
      });
    }

    // Validate dates if provided
    if (input.startDate && input.endDate && input.endDate <= input.startDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "End date must be after start date"
      });
    }

    return this.prisma.pool.update({
      where: { id: poolId },
      data: input
    });
  }

  /**
   * Delete pool (only if no registrations)
   */
  async delete(poolId: string, tenantId: string) {
    const pool = await this.prisma.pool.findFirst({
      where: { id: poolId, tenantId },
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    });

    if (!pool) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pool not found"
      });
    }

    if (pool._count.registrations > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete pool with existing registrations. Deactivate it instead."
      });
    }

    return this.prisma.pool.delete({
      where: { id: poolId }
    });
  }
}
