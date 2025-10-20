/**
 * Superadmin Brands Router
 * 
 * Manage brand domains and configuration
 * All mutations require SUPERADMIN role
 */

import { TRPCError } from "@trpc/server";
import { prisma } from "@qp/db";
import { router, publicProcedure } from "../../trpc";
import { requireSuperAdmin } from "../../middleware/require-role";
import {
  getBrandSchema,
  updateBrandDomainsSchema,
  addBrandDomainSchema,
  removeBrandDomainSchema
} from "./schemas";

export const superadminBrandsRouter = router({
  /**
   * Get brand details with domains
   */
  get: publicProcedure
    .use(requireSuperAdmin)
    .input(getBrandSchema)
    .query(async ({ input }) => {
      const brand = await prisma.brand.findUnique({
        where: { id: input.id },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              pools: true
            }
          }
        }
      });

      if (!brand) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand not found"
        });
      }

      return brand;
    }),

  /**
   * Update brand domains (replace all)
   */
  updateDomains: publicProcedure
    .use(requireSuperAdmin)
    .input(updateBrandDomainsSchema)
    .mutation(async ({ input, ctx }) => {
      const { brandId, domains } = input;

      // Validate brand exists
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
        include: { tenant: true }
      });

      if (!brand) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand not found"
        });
      }

      // Validate domain format
      const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}(:[0-9]{1,5})?$/i;
      const localhostRegex = /^[a-z0-9-]+\.localhost(:[0-9]{1,5})?$/i;

      for (const domain of domains) {
        if (!domainRegex.test(domain) && !localhostRegex.test(domain)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid domain format: ${domain}`
          });
        }
      }

      // Check for duplicates in other brands
      if (domains.length > 0) {
        const existingBrands = await prisma.brand.findMany({
          where: {
            id: { not: brandId },
            domains: {
              hasSome: domains
            }
          },
          select: {
            id: true,
            name: true,
            domains: true
          }
        });

        if (existingBrands.length > 0) {
          const conflicts = existingBrands.map(b => ({
            brand: b.name,
            domains: b.domains.filter(d => domains.includes(d))
          }));

          throw new TRPCError({
            code: "CONFLICT",
            message: `Domain(s) already in use: ${JSON.stringify(conflicts)}`
          });
        }
      }

      // Update domains
      const updated = await prisma.brand.update({
        where: { id: brandId },
        data: { domains },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId: brand.tenantId,
          actorId: ctx.session?.user?.id,
          action: "UPDATE_BRAND_DOMAINS",
          resourceType: "BRAND",
          resourceId: brandId,
          metadata: {
            oldDomains: brand.domains,
            newDomains: domains
          }
        }
      });

      return updated;
    }),

  /**
   * Add single domain to brand
   */
  addDomain: publicProcedure
    .use(requireSuperAdmin)
    .input(addBrandDomainSchema)
    .mutation(async ({ input, ctx }) => {
      const { brandId, domain } = input;

      // Validate brand exists
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
        include: { tenant: true }
      });

      if (!brand) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand not found"
        });
      }

      // Validate domain format
      const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}(:[0-9]{1,5})?$/i;
      const localhostRegex = /^[a-z0-9-]+\.localhost(:[0-9]{1,5})?$/i;

      if (!domainRegex.test(domain) && !localhostRegex.test(domain)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid domain format: ${domain}`
        });
      }

      // Check if domain already exists in this brand
      if (brand.domains.includes(domain)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Domain already exists in this brand"
        });
      }

      // Check if domain exists in other brands
      const existingBrand = await prisma.brand.findFirst({
        where: {
          id: { not: brandId },
          domains: {
            has: domain
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      if (existingBrand) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Domain already in use by brand: ${existingBrand.name}`
        });
      }

      // Add domain
      const updated = await prisma.brand.update({
        where: { id: brandId },
        data: {
          domains: {
            push: domain
          }
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId: brand.tenantId,
          actorId: ctx.session?.user?.id,
          action: "ADD_BRAND_DOMAIN",
          resourceType: "BRAND",
          resourceId: brandId,
          metadata: {
            domain
          }
        }
      });

      return updated;
    }),

  /**
   * Remove single domain from brand
   */
  removeDomain: publicProcedure
    .use(requireSuperAdmin)
    .input(removeBrandDomainSchema)
    .mutation(async ({ input, ctx }) => {
      const { brandId, domain } = input;

      // Validate brand exists
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
        include: { tenant: true }
      });

      if (!brand) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand not found"
        });
      }

      // Check if domain exists
      if (!brand.domains.includes(domain)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Domain not found in this brand"
        });
      }

      // Remove domain
      const updated = await prisma.brand.update({
        where: { id: brandId },
        data: {
          domains: brand.domains.filter(d => d !== domain)
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId: brand.tenantId,
          actorId: ctx.session?.user?.id,
          action: "REMOVE_BRAND_DOMAIN",
          resourceType: "BRAND",
          resourceId: brandId,
          metadata: {
            domain
          }
        }
      });

      return updated;
    })
});
