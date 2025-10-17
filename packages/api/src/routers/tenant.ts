import { z } from "zod";
import { router, procedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { requireSuperAdmin } from "../middleware/require-role";
import { Prisma } from "@qp/db";

/**
 * Tenant router - SUPERADMIN only
 * All procedures require SUPERADMIN role
 */
export const tenantRouter = router({
  /**
   * List all tenants with pagination and search
   */
  list: procedure
    .use(requireSuperAdmin)
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input;
      const skip = (page - 1) * limit;

      const where: Prisma.TenantWhereInput = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } }
            ]
          }
        : {};

      const [tenants, total] = await Promise.all([
        ctx.prisma.tenant.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: {
                brands: true,
                pools: true,
                members: true
              }
            }
          }
        }),
        ctx.prisma.tenant.count({ where })
      ]);

      return {
        tenants,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    }),

  /**
   * Get tenant by ID with details
   */
  getById: procedure
    .use(requireSuperAdmin)
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: input.id },
        include: {
          brands: {
            select: {
              id: true,
              slug: true,
              name: true,
              logoUrl: true,
              domains: true,
              createdAt: true
            }
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  createdAt: true
                }
              }
            },
            orderBy: { createdAt: "desc" }
          },
          _count: {
            select: {
              pools: true,
              registrations: true,
              predictions: true
            }
          }
        }
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant not found"
        });
      }

      return tenant;
    }),

  /**
   * Create new tenant
   */
  create: procedure
    .use(requireSuperAdmin)
    .input(
      z.object({
        name: z.string().min(1).max(255),
        slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
        description: z.string().optional(),
        defaultBrand: z
          .object({
            name: z.string().min(1),
            slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
            description: z.string().optional()
          })
          .optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { defaultBrand, ...tenantData } = input;

      try {
        // Check if slug is already taken
        const existing = await ctx.prisma.tenant.findUnique({
          where: { slug: input.slug }
        });

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Tenant with slug '${input.slug}' already exists`
          });
        }

        // Create tenant with optional default brand
        const tenant = await ctx.prisma.tenant.create({
          data: {
            ...tenantData,
            brands: defaultBrand
              ? {
                  create: {
                    name: defaultBrand.name,
                    slug: defaultBrand.slug,
                    description: defaultBrand.description
                  }
                }
              : undefined
          },
          include: {
            brands: true,
            _count: {
              select: {
                members: true,
                pools: true
              }
            }
          }
        });

        return tenant;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if ((error as Prisma.PrismaClientKnownRequestError).code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A tenant with this slug already exists"
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create tenant"
        });
      }
    }),

  /**
   * Update tenant
   */
  update: procedure
    .use(requireSuperAdmin)
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
        description: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      try {
        // Check if tenant exists
        const existing = await ctx.prisma.tenant.findUnique({
          where: { id }
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tenant not found"
          });
        }

        // If updating slug, check for conflicts
        if (updateData.slug && updateData.slug !== existing.slug) {
          const slugTaken = await ctx.prisma.tenant.findUnique({
            where: { slug: updateData.slug }
          });

          if (slugTaken) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Tenant with slug '${updateData.slug}' already exists`
            });
          }
        }

        const tenant = await ctx.prisma.tenant.update({
          where: { id },
          data: updateData,
          include: {
            _count: {
              select: {
                brands: true,
                pools: true,
                members: true
              }
            }
          }
        });

        return tenant;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if ((error as Prisma.PrismaClientKnownRequestError).code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A tenant with this slug already exists"
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update tenant"
        });
      }
    }),

  /**
   * Delete tenant (hard delete if no dependencies, otherwise error)
   */
  delete: procedure
    .use(requireSuperAdmin)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const tenant = await ctx.prisma.tenant.findUnique({
          where: { id: input.id },
          include: {
            _count: {
              select: {
                pools: true,
                registrations: true,
                predictions: true
              }
            }
          }
        });

        if (!tenant) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tenant not found"
          });
        }

        // Check for dependencies
        const hasData =
          tenant._count.pools > 0 ||
          tenant._count.registrations > 0 ||
          tenant._count.predictions > 0;

        if (hasData) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Cannot delete tenant with existing pools, registrations, or predictions. Remove all data first."
          });
        }

        await ctx.prisma.tenant.delete({
          where: { id: input.id }
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete tenant"
        });
      }
    }),

  /**
   * Add member to tenant
   */
  addMember: procedure
    .use(requireSuperAdmin)
    .input(
      z.object({
        tenantId: z.string(),
        userEmail: z.string().email(),
        role: z.enum(["SUPERADMIN", "TENANT_ADMIN", "TENANT_EDITOR", "PLAYER"])
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Find or create user
        let user = await ctx.prisma.user.findUnique({
          where: { email: input.userEmail }
        });

        if (!user) {
          user = await ctx.prisma.user.create({
            data: {
              email: input.userEmail,
              name: input.userEmail.split("@")[0] // Default name from email
            }
          });
        }

        // Upsert membership
        const membership = await ctx.prisma.tenantMember.upsert({
          where: {
            tenantId_userId: {
              tenantId: input.tenantId,
              userId: user.id
            }
          },
          update: {
            role: input.role
          },
          create: {
            tenantId: input.tenantId,
            userId: user.id,
            role: input.role
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        });

        return membership;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if ((error as Prisma.PrismaClientKnownRequestError).code === "P2003") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Tenant not found"
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add member"
        });
      }
    }),

  /**
   * Remove member from tenant
   */
  removeMember: procedure
    .use(requireSuperAdmin)
    .input(
      z.object({
        tenantId: z.string(),
        userId: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.tenantMember.delete({
          where: {
            tenantId_userId: {
              tenantId: input.tenantId,
              userId: input.userId
            }
          }
        });

        return { success: true };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if ((error as Prisma.PrismaClientKnownRequestError).code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Membership not found"
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove member"
        });
      }
    }),

  /**
   * Update member role
   */
  setMemberRole: procedure
    .use(requireSuperAdmin)
    .input(
      z.object({
        tenantId: z.string(),
        userId: z.string(),
        role: z.enum(["SUPERADMIN", "TENANT_ADMIN", "TENANT_EDITOR", "PLAYER"])
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const membership = await ctx.prisma.tenantMember.update({
          where: {
            tenantId_userId: {
              tenantId: input.tenantId,
              userId: input.userId
            }
          },
          data: {
            role: input.role
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        });

        return membership;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if ((error as Prisma.PrismaClientKnownRequestError).code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Membership not found"
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update member role"
        });
      }
    }),

  /**
   * List brands for current tenant (tenant-scoped)
   */
  listBrands: procedure
    .input(z.object({ tenantId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      // Use tenant from context if available, otherwise from input
      const tenantId = ctx.tenant?.id || input?.tenantId;

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant ID required"
        });
      }

      return ctx.prisma.brand.findMany({
        where: { tenantId },
        orderBy: { name: "asc" },
        select: {
          id: true,
          slug: true,
          name: true,
          logoUrl: true,
          domains: true
        }
      });
    })
});
