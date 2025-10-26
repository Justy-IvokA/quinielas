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
 * Extract file key from URL for deletion
 * Validates that the file belongs to the specified tenant
 */
function extractFileKeyFromUrl(url: string, tenantSlug: string): string | null {
  try {
    const config = getStorageConfig();
    
    // Handle different storage providers
    switch (config.provider) {
      case 'local': {
        // Local: http://localhost:3001/branding/tenant-slug/kind/filename.ext
        const baseUrl = config.localBaseUrl || '/uploads';
        if (url.includes(baseUrl)) {
          const parts = url.split(baseUrl)[1];
          if (parts && parts.startsWith(`/${tenantSlug}/`)) {
            return parts.substring(1); // Remove leading slash
          }
        }
        break;
      }
      
      case 'firebase': {
        // Firebase: https://storage.googleapis.com/bucket/tenant-slug/kind/filename.ext
        const bucket = config.firebaseStorageBucket;
        if (bucket && url.includes(`storage.googleapis.com/${bucket}/`)) {
          const parts = url.split(`storage.googleapis.com/${bucket}/`)[1];
          if (parts && parts.startsWith(`${tenantSlug}/`)) {
            // Remove query params if any
            return parts.split('?')[0];
          }
        }
        break;
      }
      
      case 'cloudinary': {
        // Cloudinary: https://res.cloudinary.com/cloud/image/upload/v123/folder/tenant-slug/kind/filename.ext
        const folder = config.cloudinaryFolder || 'quinielas';
        if (url.includes(`/${folder}/${tenantSlug}/`)) {
          const parts = url.split(`/${folder}/`)[1];
          if (parts && parts.startsWith(`${tenantSlug}/`)) {
            // Return path without version and transformations
            return parts.split('?')[0];
          }
        }
        break;
      }
      
      case 's3': {
        // S3: https://bucket.s3.region.amazonaws.com/tenant-slug/kind/filename.ext
        const bucket = config.s3Bucket;
        if (bucket && url.includes(bucket)) {
          // Try to extract key from URL
          const urlObj = new URL(url);
          const pathname = urlObj.pathname;
          if (pathname.startsWith(`/${tenantSlug}/`)) {
            return pathname.substring(1); // Remove leading slash
          }
        }
        break;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[branding] Error extracting file key from URL:', error);
    return null;
  }
}

/**
 * Branding router - Tenant-scoped brand management
 */
export const brandingRouter = router({
  /**
   * Get current brand for the tenant
   * Uses the brand resolved from hostname (ctx.brand)
   */
  getCurrentBrand: procedure
    .query(async ({ ctx }) => {
      // Use the brand resolved from hostname
      if (ctx.brand) {
        return {
          id: ctx.brand.id,
          name: ctx.brand.name,
          slug: ctx.brand.slug,
          logoUrl: ctx.brand.logoUrl,
          theme: ctx.brand.theme as any, // JSON field
          domains: ctx.brand.domains,
          createdAt: ctx.brand.createdAt,
          updatedAt: ctx.brand.updatedAt
        };
      }

      // Fallback: if no brand in context, require tenant and find brand by tenant slug
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant context required"
        });
      }

      // Try to find brand matching tenant slug first (most common case)
      let brand = await ctx.prisma.brand.findFirst({
        where: {
          tenantId: ctx.tenant.id,
          slug: ctx.tenant.slug
        }
      });

      // If not found, fallback to first brand for this tenant
      if (!brand) {
        brand = await ctx.prisma.brand.findFirst({
          where: { tenantId: ctx.tenant.id },
          orderBy: { createdAt: "asc" }
        });
      }

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
        brandId: z.string().optional(), // Optional: defaults to current brand
        theme: brandThemeDeepUpdateSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find brand: use brandId if provided, otherwise use ctx.brand, fallback to first brand
      let brand;
      
      if (input.brandId) {
        // Explicit brandId provided
        if (!ctx.tenant) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tenant context required"
          });
        }
        brand = await ctx.prisma.brand.findFirst({
          where: {
            id: input.brandId,
            tenantId: ctx.tenant.id
          }
        });
      } else if (ctx.brand) {
        // Use brand from context (resolved from hostname)
        brand = ctx.brand;
      } else if (ctx.tenant) {
        // Fallback: first brand for tenant
        brand = await ctx.prisma.brand.findFirst({
          where: { tenantId: ctx.tenant.id },
          orderBy: { createdAt: "asc" }
        });
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant or brand context required"
        });
      }

      if (!brand) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand not found"
        });
      }

      // Merge with existing theme
      const existingTheme = (brand.theme as any) || {};
      
      // Debug logging
      console.log("[updateBrandTheme] Existing theme logo:", existingTheme.logo);
      console.log("[updateBrandTheme] Input theme logo:", input.theme.logo);
      
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
      
      console.log("[updateBrandTheme] Updated theme logo:", updatedTheme.logo);

      // Update brand
      const updatedBrand = await ctx.prisma.brand.update({
        where: { id: brand.id },
        data: {
          theme: updatedTheme,
          updatedAt: new Date()
        }
      });

      // Audit log
      if (ctx.tenant) {
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
      }

      return {
        id: updatedBrand.id,
        theme: updatedBrand.theme
      };
    }),

  /**
   * Upload media file (logo, hero, mainCard)
   * Requires TENANT_ADMIN role
   * Automatically deletes old files to prevent storage bloat
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
        // Get current brand to find old file URL
        const brand = await ctx.prisma.brand.findFirst({
          where: { tenantId: ctx.tenant.id },
          orderBy: { createdAt: "asc" }
        });

        let oldFileUrl: string | null = null;

        // Extract old file URL based on kind
        if (brand?.theme) {
          const theme = brand.theme as any;
          switch (input.kind) {
            case "logo":
              oldFileUrl = theme?.logo?.url || null;
              break;
            case "logotype":
              oldFileUrl = theme?.logotype?.url || null;
              break;
            case "hero":
              oldFileUrl = theme?.heroAssets?.url || null;
              break;
            case "poster":
              oldFileUrl = theme?.heroAssets?.poster || null;
              break;
            case "mainCard":
              oldFileUrl = theme?.mainCard?.url || null;
              break;
          }
        }

        // Decode base64 data
        const buffer = Buffer.from(input.data, 'base64');

        // Generate unique key
        const key = generateFileKey(
          input.filename,
          `${ctx.tenant.slug}/${input.kind}`
        );

        // Get storage adapter
        const storage = getStorageAdapter(getStorageConfig());

        // Delete old file if exists and is from our storage
        if (oldFileUrl && storage.remove) {
          try {
            // Extract file key from URL
            const oldKey = extractFileKeyFromUrl(oldFileUrl, ctx.tenant.slug);
            if (oldKey) {
              await storage.remove(oldKey);
              console.log(`[branding] Deleted old file: ${oldKey}`);
            }
          } catch (deleteError) {
            // Log but don't fail the upload if deletion fails
            console.warn(`[branding] Failed to delete old file: ${oldFileUrl}`, deleteError);
          }
        }

        // Upload new file
        const result = await storage.upload(buffer, key, input.contentType);

        // Audit log - only if user exists
        const actorId = ctx.session?.user?.id;
        if (actorId) {
          // Verify user exists before creating audit log
          const userExists = await ctx.prisma.user.findUnique({
            where: { id: actorId },
            select: { id: true }
          });

          if (userExists) {
            await ctx.prisma.auditLog.create({
              data: {
                tenantId: ctx.tenant.id,
                actorId: actorId,
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
          }
        }

        return {
          url: result.url,
          kind: input.kind,
          oldFileDeleted: !!oldFileUrl
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
   * Delete media file from storage
   * Requires TENANT_ADMIN role
   */
  deleteMedia: procedure
    .use(requireTenantAdmin)
    .input(
      z.object({
        url: z.string(),
        kind: z.enum(["logo", "logotype", "hero", "mainCard", "poster"])
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant context required"
        });
      }

      try {
        const storage = getStorageAdapter(getStorageConfig());
        
        if (!storage.remove) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Storage provider does not support file deletion"
          });
        }

        // Extract file key from URL
        const fileKey = extractFileKeyFromUrl(input.url, ctx.tenant.slug);
        
        if (!fileKey) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid file URL or file does not belong to this tenant"
          });
        }

        // Delete file
        await storage.remove(fileKey);

        // Audit log - only if user exists
        const actorId = ctx.session?.user?.id;
        if (actorId) {
          // Verify user exists before creating audit log
          const userExists = await ctx.prisma.user.findUnique({
            where: { id: actorId },
            select: { id: true }
          });

          if (userExists) {
            await ctx.prisma.auditLog.create({
              data: {
                tenantId: ctx.tenant.id,
                actorId: actorId,
                action: "brand.media.delete",
                resourceType: "Brand",
                metadata: {
                  kind: input.kind,
                  url: input.url,
                  fileKey
                },
                ipAddress: ctx.ip,
                userAgent: ctx.userAgent
              }
            });
          }
        }

        return {
          success: true,
          deletedKey: fileKey
        };
      } catch (error) {
        console.error("[branding] Delete error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete file"
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

      // Audit log - only if user exists
      const actorId = ctx.session?.user?.id;
      if (actorId) {
        // Verify user exists before creating audit log
        const userExists = await ctx.prisma.user.findUnique({
          where: { id: actorId },
          select: { id: true }
        });

        if (userExists) {
          await ctx.prisma.auditLog.create({
            data: {
              tenantId: ctx.tenant.id,
              actorId: actorId,
              action: "brand.theme.reset",
              resourceType: "Brand",
              resourceId: brand.id,
              ipAddress: ctx.ip,
              userAgent: ctx.userAgent
            }
          });
        }
      }

      return {
        id: updatedBrand.id,
        theme: updatedBrand.theme
      };
    })
});
