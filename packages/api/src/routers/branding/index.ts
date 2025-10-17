import { z } from "zod";
import { router, procedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { requireTenantAdmin } from "../../middleware/require-tenant-member";
import { brandThemeSchema, brandThemeUpdateSchema, brandThemeDeepUpdateSchema, mediaUploadSchema } from "@qp/branding";
import { 
  getStorageAdapter, 
  validateUpload, 
  generateFileKey,
  type StorageConfig 
} from "@qp/utils/storage/adapter";

/**
 * Get storage configuration from environment
 */
function getStorageConfig(): StorageConfig {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageConfig['provider'];
  
  return {
    provider,
    // Local
    localPath: process.env.STORAGE_LOCAL_PATH || './public/uploads',
    localBaseUrl: process.env.STORAGE_LOCAL_BASE_URL || '/uploads',
    // Cloudinary
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    cloudinaryFolder: process.env.CLOUDINARY_FOLDER || 'quinielas',
    // Firebase
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseCredentials: process.env.FIREBASE_CREDENTIALS,
    // S3
    s3Bucket: process.env.S3_BUCKET,
    s3Region: process.env.S3_REGION,
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    s3Endpoint: process.env.S3_ENDPOINT
  };
}

/**
 * Branding router - Tenant-scoped brand management
 */
export const brandingRouter = router({
  /**
   * Get current brand for the tenant
   */
  getCurrentBrand: procedure
    .query(async ({ ctx }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant context required"
        });
      }

      // Get the first brand for this tenant (or primary brand)
      const brand = await ctx.prisma.brand.findFirst({
        where: { tenantId: ctx.tenant.id },
        orderBy: { createdAt: "asc" }
      });

      if (!brand) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No brand found for this tenant"
        });
      }

      return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl,
        theme: brand.theme as any, // JSON field
        domains: brand.domains,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt
      };
    }),

  /**
   * Update brand theme
   * Requires TENANT_ADMIN role
   */
  updateBrandTheme: procedure
    .use(requireTenantAdmin)
    .input(
      z.object({
        brandId: z.string().optional(), // Optional: defaults to first brand
        theme: brandThemeDeepUpdateSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant context required"
        });
      }

      // Find brand
      const brand = input.brandId
        ? await ctx.prisma.brand.findFirst({
            where: {
              id: input.brandId,
              tenantId: ctx.tenant.id
            }
          })
        : await ctx.prisma.brand.findFirst({
            where: { tenantId: ctx.tenant.id },
            orderBy: { createdAt: "asc" }
          });

      if (!brand) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand not found"
        });
      }

      // Merge with existing theme
      const existingTheme = (brand.theme as any) || {};
      const updatedTheme = {
        ...existingTheme,
        ...input.theme,
        // Deep merge colors if provided
        colors: input.theme.colors
          ? { ...existingTheme.colors, ...input.theme.colors }
          : existingTheme.colors,
        // Deep merge other nested objects
        logo: input.theme.logo
          ? { ...existingTheme.logo, ...input.theme.logo }
          : existingTheme.logo,
        heroAssets: input.theme.heroAssets
          ? { ...existingTheme.heroAssets, ...input.theme.heroAssets }
          : existingTheme.heroAssets,
        mainCard: input.theme.mainCard
          ? { ...existingTheme.mainCard, ...input.theme.mainCard }
          : existingTheme.mainCard,
        typography: input.theme.typography
          ? { ...existingTheme.typography, ...input.theme.typography }
          : existingTheme.typography
      };

      // Update brand
      const updatedBrand = await ctx.prisma.brand.update({
        where: { id: brand.id },
        data: {
          theme: updatedTheme,
          updatedAt: new Date()
        }
      });

      // Audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenant.id,
          actorId: ctx.session?.user?.id,
          action: "brand.theme.update",
          resourceType: "Brand",
          resourceId: brand.id,
          metadata: {
            brandId: brand.id,
            updatedFields: Object.keys(input.theme)
          },
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent
        }
      });

      return {
        id: updatedBrand.id,
        theme: updatedBrand.theme
      };
    }),

  /**
   * Upload media file (logo, hero, mainCard)
   * Requires TENANT_ADMIN role
   */
  uploadMedia: procedure
    .use(requireTenantAdmin)
    .input(
      z.object({
        kind: z.enum(["logo", "logotype", "hero", "mainCard", "poster"]),
        filename: z.string(),
        contentType: z.string(),
        size: z.number(),
        // Base64 encoded file data
        data: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant context required"
        });
      }

      // Validate upload
      const validation = validateUpload(input.contentType, input.size);
      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.error
        });
      }

      try {
        // Decode base64 data
        const buffer = Buffer.from(input.data, 'base64');

        // Generate unique key
        const key = generateFileKey(
          input.filename,
          `${ctx.tenant.slug}/${input.kind}`
        );

        // Get storage adapter and upload
        const storage = getStorageAdapter(getStorageConfig());
        const result = await storage.upload(buffer, key, input.contentType);

        // Audit log
        await ctx.prisma.auditLog.create({
          data: {
            tenantId: ctx.tenant.id,
            actorId: ctx.session?.user?.id,
            action: "brand.media.upload",
            resourceType: "Brand",
            metadata: {
              kind: input.kind,
              filename: input.filename,
              contentType: input.contentType,
              size: input.size,
              url: result.url
            },
            ipAddress: ctx.ip,
            userAgent: ctx.userAgent
          }
        });

        return {
          url: result.url,
          kind: input.kind
        };
      } catch (error) {
        console.error("[branding] Upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload file"
        });
      }
    }),

  /**
   * Get brand by ID (read-only, any authenticated user)
   */
  getBrandById: procedure
    .input(z.object({ brandId: z.string() }))
    .query(async ({ ctx, input }) => {
      const brand = await ctx.prisma.brand.findUnique({
        where: { id: input.brandId },
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

      if (!brand) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand not found"
        });
      }

      // Check if user has access to this tenant
      if (ctx.tenant && brand.tenantId !== ctx.tenant.id) {
        // Allow superadmin to view any brand
        const isSuperAdmin = ctx.session?.user?.highestRole === "SUPERADMIN";
        if (!isSuperAdmin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied"
          });
        }
      }

      return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl,
        theme: brand.theme,
        domains: brand.domains,
        tenant: brand.tenant,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt
      };
    }),

  /**
   * Reset brand theme to defaults
   * Requires TENANT_ADMIN role
   */
  resetTheme: procedure
    .use(requireTenantAdmin)
    .input(
      z.object({
        brandId: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant context required"
        });
      }

      // Find brand
      const brand = input.brandId
        ? await ctx.prisma.brand.findFirst({
            where: {
              id: input.brandId,
              tenantId: ctx.tenant.id
            }
          })
        : await ctx.prisma.brand.findFirst({
            where: { tenantId: ctx.tenant.id },
            orderBy: { createdAt: "asc" }
          });

      if (!brand) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand not found"
        });
      }

      // Import default theme
      const { defaultBrandTheme } = await import("@qp/branding");

      // Update brand with default theme
      const updatedBrand = await ctx.prisma.brand.update({
        where: { id: brand.id },
        data: {
          theme: defaultBrandTheme as any,
          updatedAt: new Date()
        }
      });

      // Audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenant.id,
          actorId: ctx.session?.user?.id,
          action: "brand.theme.reset",
          resourceType: "Brand",
          resourceId: brand.id,
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent
        }
      });

      return {
        id: updatedBrand.id,
        theme: updatedBrand.theme
      };
    })
});
