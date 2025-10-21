/**
 * Superadmin Templates Router
 * 
 * CRUD operations for pool templates
 * All mutations require SUPERADMIN role
 */

import { TRPCError } from "@trpc/server";
import { prisma } from "@qp/db";
import { router, publicProcedure } from "../../trpc";
import { requireSuperAdmin } from "../../middleware/require-role";
import { previewTemplateImport, provisionTemplateToTenant } from "../../services/templateProvision.service";
import {
  listTemplatesSchema,
  getTemplateSchema,
  createTemplateSchema,
  updateTemplateSchema,
  publishTemplateSchema,
  archiveTemplateSchema,
  cloneTemplateSchema,
  deleteTemplateSchema,
  previewImportSchema,
  assignToTenantSchema
} from "./schemas";

export const superadminTemplatesRouter = router({
  /**
   * List all templates with pagination and filters
   */
  list: publicProcedure
    .use(requireSuperAdmin)
    .input(listTemplatesSchema)
    .query(async ({ input }) => {
      const { status, search, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } }
        ];
      }

      const [templates, total] = await Promise.all([
        prisma.poolTemplate.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            sport: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            _count: {
              select: {
                assignments: true
              }
            }
          }
        }),
        prisma.poolTemplate.count({ where })
      ]);

      return {
        templates,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    }),

  /**
   * Get single template with full details
   */
  get: publicProcedure
    .use(requireSuperAdmin)
    .input(getTemplateSchema)
    .query(async ({ input }) => {
      const template = await prisma.poolTemplate.findUnique({
        where: { id: input.id },
        include: {
          sport: true,
          assignments: {
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            },
            orderBy: { createdAt: "desc" }
          }
        }
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found"
        });
      }

      return template;
    }),

  /**
   * Create new template
   */
  create: publicProcedure
    .use(requireSuperAdmin)
    .input(createTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      // Check slug uniqueness
      const existing = await prisma.poolTemplate.findUnique({
        where: { slug: input.slug }
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A template with this slug already exists"
        });
      }

      // Validate sportId if provided
      if (input.sportId) {
        const sport = await prisma.sport.findUnique({
          where: { id: input.sportId }
        });

        if (!sport) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Sport not found"
          });
        }
      }

      const template = await prisma.poolTemplate.create({
        data: {
          slug: input.slug,
          title: input.title,
          description: input.description,
          status: input.status,
          sportId: input.sportId,
          competitionExternalId: input.competitionExternalId,
          seasonYear: input.seasonYear,
          stageLabel: input.stageLabel,
          roundLabel: input.roundLabel,
          rules: input.rules as any,
          accessDefaults: input.accessDefaults as any,
          prizesDefaults: input.prizesDefaults as any,
          brandHints: input.brandHints as any,
          meta: input.meta as any
        },
        include: {
          sport: true
        }
      });

      // Create audit log (use a system tenant or skip tenantId for global actions)
      // For now, we'll create without tenantId since this is a global template
      // Note: This might need adjustment based on your audit log requirements

      return template;
    }),

  /**
   * Update template
   */
  update: publicProcedure
    .use(requireSuperAdmin)
    .input(updateTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      // Check if template exists
      const existing = await prisma.poolTemplate.findUnique({
        where: { id }
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found"
        });
      }

      // Check slug uniqueness if changing
      if (data.slug && data.slug !== existing.slug) {
        const slugTaken = await prisma.poolTemplate.findUnique({
          where: { slug: data.slug }
        });

        if (slugTaken) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A template with this slug already exists"
          });
        }
      }

      // Validate sportId if provided
      if (data.sportId) {
        const sport = await prisma.sport.findUnique({
          where: { id: data.sportId }
        });

        if (!sport) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Sport not found"
          });
        }
      }

      const template = await prisma.poolTemplate.update({
        where: { id },
        data: {
          slug: data.slug,
          title: data.title,
          description: data.description,
          sportId: data.sportId,
          competitionExternalId: data.competitionExternalId,
          seasonYear: data.seasonYear,
          stageLabel: data.stageLabel,
          roundLabel: data.roundLabel,
          rules: data.rules as any,
          accessDefaults: data.accessDefaults as any,
          prizesDefaults: data.prizesDefaults as any,
          brandHints: data.brandHints as any,
          meta: data.meta as any
        },
        include: {
          sport: true
        }
      });

      return template;
    }),

  /**
   * Publish template (make it available for assignment)
   */
  publish: publicProcedure
    .use(requireSuperAdmin)
    .input(publishTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      const template = await prisma.poolTemplate.findUnique({
        where: { id: input.id }
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found"
        });
      }

      if (template.status === "PUBLISHED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Template is already published"
        });
      }

      // Validate template has required fields
      if (!template.competitionExternalId || !template.seasonYear) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Template must have competitionExternalId and seasonYear to be published"
        });
      }

      const updated = await prisma.poolTemplate.update({
        where: { id: input.id },
        data: { status: "PUBLISHED" },
        include: { sport: true }
      });

      return updated;
    }),

  /**
   * Archive template
   */
  archive: publicProcedure
    .use(requireSuperAdmin)
    .input(archiveTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      const template = await prisma.poolTemplate.findUnique({
        where: { id: input.id }
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found"
        });
      }

      const updated = await prisma.poolTemplate.update({
        where: { id: input.id },
        data: { status: "ARCHIVED" },
        include: { sport: true }
      });

      return updated;
    }),

  /**
   * Clone template
   */
  clone: publicProcedure
    .use(requireSuperAdmin)
    .input(cloneTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      const original = await prisma.poolTemplate.findUnique({
        where: { id: input.id }
      });

      if (!original) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found"
        });
      }

      // Check new slug uniqueness
      const existing = await prisma.poolTemplate.findUnique({
        where: { slug: input.newSlug }
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A template with this slug already exists"
        });
      }

      const cloned = await prisma.poolTemplate.create({
        data: {
          slug: input.newSlug,
          title: `${original.title} (Copy)`,
          description: original.description,
          status: "DRAFT", // Always start as draft
          sportId: original.sportId,
          competitionExternalId: original.competitionExternalId,
          seasonYear: original.seasonYear,
          stageLabel: original.stageLabel,
          roundLabel: original.roundLabel,
          rules: original.rules as any,
          accessDefaults: original.accessDefaults as any,
          prizesDefaults: original.prizesDefaults as any,
          brandHints: original.brandHints as any,
          meta: original.meta as any
        },
        include: {
          sport: true
        }
      });

      return cloned;
    }),

  /**
   * Delete template (only if DRAFT and no assignments)
   */
  delete: publicProcedure
    .use(requireSuperAdmin)
    .input(deleteTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      const template = await prisma.poolTemplate.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              assignments: true
            }
          }
        }
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found"
        });
      }

      if (template.status !== "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only DRAFT templates can be deleted"
        });
      }

      if (template._count.assignments > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete template with ${template._count.assignments} assignment(s)`
        });
      }

      await prisma.poolTemplate.delete({
        where: { id: input.id }
      });

      return { success: true };
    }),

  /**
   * Preview import (get estimated counts without creating anything)
   */
  previewImport: publicProcedure
    .use(requireSuperAdmin)
    .input(previewImportSchema)
    .query(async ({ input }) => {
      return await previewTemplateImport(input.id);
    }),

  /**
   * Assign template to tenant (single assignment)
   */
  assignToTenant: publicProcedure
    .use(requireSuperAdmin)
    .input(assignToTenantSchema)
    .mutation(async ({ input, ctx }) => {
      const { templateId, tenantId } = input;

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

      // Validate template exists and is PUBLISHED
      const template = await prisma.poolTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found"
        });
      }

      if (template.status !== "PUBLISHED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only PUBLISHED templates can be assigned"
        });
      }

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

        // Create audit log
        await prisma.auditLog.create({
          data: {
            tenantId,
            actorId: ctx.session?.user?.id,
            action: "TEMPLATE_ASSIGN",
            resourceType: "TENANT_TEMPLATE_ASSIGNMENT",
            resourceId: assignment.id,
            metadata: {
              templateId,
              result
            } as any
          }
        });

        return {
          success: true,
          assignmentId: assignment.id,
          result
        };
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

        throw error;
      }
    })
});
