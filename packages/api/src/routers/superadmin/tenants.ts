/**
 * Superadmin Tenants Router
 * 
 * CRUD operations for tenants, members, and template assignments
 * All mutations require SUPERADMIN role
 */

import { TRPCError } from "@trpc/server";
import { prisma } from "@qp/db";
import { router, publicProcedure } from "../../trpc";
import { requireSuperAdmin } from "../../middleware/require-role";
import { provisionTemplateToTenant } from "../../services/templateProvision.service";
import {
  listTenantsSchema,
  getTenantSchema,
  createTenantSchema,
  updateTenantSchema,
  deleteTenantSchema,
  addTenantMemberSchema,
  removeTenantMemberSchema,
  setMemberRoleSchema,
  assignTemplatesSchema
} from "./schemas";

export const superadminTenantsRouter = router({
  /**
   * List all tenants with pagination and search
   */
  list: publicProcedure
    .use(requireSuperAdmin)
    .input(listTenantsSchema)
    .query(async ({ input }) => {
      const { search, page, limit } = input;
      const skip = (page - 1) * limit;

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { slug: { contains: search, mode: "insensitive" as const } }
            ]
          }
        : {};

      const [tenants, total] = await Promise.all([
        prisma.tenant.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            brands: {
              select: {
                id: true,
                name: true,
                slug: true,
                domains: true
              }
            },
            _count: {
              select: {
                members: true,
                pools: true
              }
            }
          }
        }),
        prisma.tenant.count({ where })
      ]);

      return {
        tenants,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    }),

  /**
   * Get single tenant with full details
   */
  get: publicProcedure
    .use(requireSuperAdmin)
    .input(getTenantSchema)
    .query(async ({ input }) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: input.id },
        include: {
          brands: {
            select: {
              id: true,
              name: true,
              slug: true,
              domains: true,
              logoUrl: true,
              theme: true
            }
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  image: true
                }
              }
            },
            orderBy: { createdAt: "desc" }
          },
          pools: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
              createdAt: true
            },
            orderBy: { createdAt: "desc" }
          },
          templateAssignments: {
            include: {
              template: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  status: true
                }
              }
            },
            orderBy: { createdAt: "desc" }
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
  create: publicProcedure
    .use(requireSuperAdmin)
    .input(createTenantSchema)
    .mutation(async ({ input, ctx }) => {
      // Check slug uniqueness
      const existing = await prisma.tenant.findUnique({
        where: { slug: input.slug }
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A tenant with this slug already exists"
        });
      }

      // Create tenant with brands
      const tenant = await prisma.tenant.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          brands: input.brands
            ? {
                create: input.brands.map(brand => ({
                  name: brand.name,
                  slug: brand.slug,
                  description: brand.description,
                  domains: brand.domains || []
                }))
              }
            : undefined
        },
        include: {
          brands: true
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          actorId: ctx.session?.user?.id,
          action: "TENANT_CREATE",
          resourceType: "TENANT",
          resourceId: tenant.id,
          metadata: {
            name: tenant.name,
            slug: tenant.slug
          }
        }
      });

      return tenant;
    }),

  /**
   * Update tenant
   */
  update: publicProcedure
    .use(requireSuperAdmin)
    .input(updateTenantSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      // Check if tenant exists
      const existing = await prisma.tenant.findUnique({
        where: { id }
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant not found"
        });
      }

      // Check slug uniqueness if changing
      if (data.slug && data.slug !== existing.slug) {
        const slugTaken = await prisma.tenant.findUnique({
          where: { slug: data.slug }
        });

        if (slugTaken) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A tenant with this slug already exists"
          });
        }
      }

      const tenant = await prisma.tenant.update({
        where: { id },
        data,
        include: {
          brands: true
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          actorId: ctx.session?.user?.id,
          action: "TENANT_UPDATE",
          resourceType: "TENANT",
          resourceId: tenant.id,
          metadata: data
        }
      });

      return tenant;
    }),

  /**
   * Delete tenant (only if no dependencies)
   */
  delete: publicProcedure
    .use(requireSuperAdmin)
    .input(deleteTenantSchema)
    .mutation(async ({ input, ctx }) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              pools: true,
              members: true,
              registrations: true
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
      if (tenant._count.pools > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete tenant with ${tenant._count.pools} pool(s). Delete pools first.`
        });
      }

      if (tenant._count.registrations > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete tenant with ${tenant._count.registrations} registration(s).`
        });
      }

      // Delete tenant (cascade will handle brands and members)
      await prisma.tenant.delete({
        where: { id: input.id }
      });

      // Create audit log in a different tenant context (or skip tenantId)
      // Since tenant is deleted, we'll log without tenantId
      await prisma.auditLog.create({
        data: {
          tenantId: input.id, // Keep for historical reference
          actorId: ctx.session?.user?.id,
          action: "TENANT_DELETE",
          resourceType: "TENANT",
          resourceId: input.id,
          metadata: {
            name: tenant.name,
            slug: tenant.slug
          }
        }
      });

      return { success: true };
    }),

  /**
   * Add member to tenant
   */
  addMember: publicProcedure
    .use(requireSuperAdmin)
    .input(addTenantMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const { tenantId, userEmail, role } = input;

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email: userEmail }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: userEmail,
            name: userEmail.split("@")[0]
          }
        });
      }

      // Check if already a member
      const existing = await prisma.tenantMember.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: user.id
          }
        }
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member of this tenant"
        });
      }

      const member = await prisma.tenantMember.create({
        data: {
          tenantId,
          userId: user.id,
          role
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true
            }
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          actorId: ctx.session?.user?.id,
          userId: user.id,
          action: "TENANT_MEMBER_ADD",
          resourceType: "TENANT_MEMBER",
          resourceId: member.id,
          metadata: {
            userEmail,
            role
          }
        }
      });

      return member;
    }),

  /**
   * Remove member from tenant
   */
  removeMember: publicProcedure
    .use(requireSuperAdmin)
    .input(removeTenantMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const { tenantId, userId } = input;

      const member = await prisma.tenantMember.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId
          }
        }
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found"
        });
      }

      await prisma.tenantMember.delete({
        where: {
          tenantId_userId: {
            tenantId,
            userId
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          actorId: ctx.session?.user?.id,
          userId,
          action: "TENANT_MEMBER_REMOVE",
          resourceType: "TENANT_MEMBER",
          resourceId: member.id,
          metadata: {
            role: member.role
          }
        }
      });

      return { success: true };
    }),

  /**
   * Set member role
   */
  setMemberRole: publicProcedure
    .use(requireSuperAdmin)
    .input(setMemberRoleSchema)
    .mutation(async ({ input, ctx }) => {
      const { tenantId, userId, role } = input;

      const member = await prisma.tenantMember.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId
          }
        }
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found"
        });
      }

      const updated = await prisma.tenantMember.update({
        where: {
          tenantId_userId: {
            tenantId,
            userId
          }
        },
        data: { role },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true
            }
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          actorId: ctx.session?.user?.id,
          userId,
          action: "TENANT_MEMBER_ROLE_CHANGE",
          resourceType: "TENANT_MEMBER",
          resourceId: member.id,
          metadata: {
            oldRole: member.role,
            newRole: role
          }
        }
      });

      return updated;
    }),

  /**
   * Assign templates to tenant (auto-provision pools)
   */
  assignTemplates: publicProcedure
    .use(requireSuperAdmin)
    .input(assignTemplatesSchema)
    .mutation(async ({ input, ctx }) => {
      const { tenantId, templateIds } = input;

      // Validate tenant exists and get its primary brand
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          brands: {
            where: { isPrimary: true },
            take: 1
          }
        }
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant not found"
        });
      }

      // Get primary brand ID
      const primaryBrand = tenant.brands[0];
      if (!primaryBrand) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant does not have a primary brand"
        });
      }

      // Validate all templates exist and are PUBLISHED
      const templates = await prisma.poolTemplate.findMany({
        where: {
          id: { in: templateIds }
        }
      });

      if (templates.length !== templateIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or more templates not found"
        });
      }

      const unpublished = templates.filter(t => t.status !== "PUBLISHED");
      if (unpublished.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot assign unpublished templates: ${unpublished.map(t => t.slug).join(", ")}`
        });
      }

      // Create assignments and provision
      const results = [];

      for (const templateId of templateIds) {
        // Create assignment record
        const assignment = await prisma.tenantTemplateAssignment.create({
          data: {
            tenantId,
            templateId,
            status: "RUNNING"
          }
        });

        try {
          // Provision the template
          const result = await provisionTemplateToTenant({
            templateId,
            tenantId,
            brandId: primaryBrand.id
          });

          // Update assignment with success
          await prisma.tenantTemplateAssignment.update({
            where: { id: assignment.id },
            data: {
              status: "DONE",
              result: result as any
            }
          });

          results.push({
            assignmentId: assignment.id,
            templateId,
            status: "DONE",
            result
          });
        } catch (error) {
          // Update assignment with failure
          await prisma.tenantTemplateAssignment.update({
            where: { id: assignment.id },
            data: {
              status: "FAILED",
              result: {
                error: error instanceof Error ? error.message : "Unknown error"
              } as any
            }
          });

          results.push({
            assignmentId: assignment.id,
            templateId,
            status: "FAILED",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          actorId: ctx.session?.user?.id,
          action: "TEMPLATE_ASSIGN",
          resourceType: "TENANT",
          resourceId: tenantId,
          metadata: {
            templateIds,
            successCount: results.filter(r => r.status === "DONE").length,
            failureCount: results.filter(r => r.status === "FAILED").length,
            results: results.map(r => {
              if (r.status === "DONE") {
                return {
                  assignmentId: r.assignmentId,
                  templateId: r.templateId,
                  status: r.status,
                  result: r.result ? {
                    poolId: r.result.poolId,
                    poolSlug: r.result.poolSlug,
                    imported: {
                      teams: r.result.imported.teams,
                      matches: r.result.imported.matches
                    }
                  } : null
                };
              } else {
                return {
                  assignmentId: r.assignmentId,
                  templateId: r.templateId,
                  status: r.status,
                  error: r.error || "Unknown error"
                };
              }
            })
          } as any
        }
      });

      return {
        success: true,
        results
      };
    })
});
