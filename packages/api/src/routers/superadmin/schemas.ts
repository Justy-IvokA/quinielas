/**
 * Zod schemas for SUPERADMIN routers
 */

import { z } from "zod";
import { AccessType, PrizeType, TenantRole } from "@qp/db";

// ========================================
// TENANT SCHEMAS
// ========================================

export const listTenantsSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

export const getTenantSchema = z.object({
  id: z.string().cuid()
});

export const createTenantSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  brands: z.array(z.object({
    name: z.string().min(3),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    domains: z.array(z.string()).optional()
  })).optional()
});

export const updateTenantSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(3).max(100).optional(),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional()
});

export const deleteTenantSchema = z.object({
  id: z.string().cuid()
});

export const addTenantMemberSchema = z.object({
  tenantId: z.string().cuid(),
  userEmail: z.string().email(),
  role: z.enum([TenantRole.TENANT_ADMIN, TenantRole.TENANT_EDITOR, TenantRole.PLAYER])
});

export const removeTenantMemberSchema = z.object({
  tenantId: z.string().cuid(),
  userId: z.string().cuid()
});

export const setMemberRoleSchema = z.object({
  tenantId: z.string().cuid(),
  userId: z.string().cuid(),
  role: z.enum([TenantRole.TENANT_ADMIN, TenantRole.TENANT_EDITOR, TenantRole.PLAYER])
});

export const assignTemplatesSchema = z.object({
  tenantId: z.string().cuid(),
  templateIds: z.array(z.string().cuid()).min(1)
});

export const assignTemplatesToTenantSchema = z.object({
  tenantId: z.string().cuid(),
  templateIds: z.array(z.string().cuid())
});

// ========================================
// BRAND DOMAINS SCHEMAS
// ========================================

export const getBrandSchema = z.object({
  id: z.string().cuid()
});

export const updateBrandDomainsSchema = z.object({
  brandId: z.string().cuid(),
  domains: z.array(z.string().min(3).max(255))
});

export const addBrandDomainSchema = z.object({
  brandId: z.string().cuid(),
  domain: z.string().min(3).max(255)
});

export const removeBrandDomainSchema = z.object({
  brandId: z.string().cuid(),
  domain: z.string()
});

// ========================================
// TEMPLATE SCHEMAS
// ========================================

export const listTemplatesSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

export const getTemplateSchema = z.object({
  id: z.string().cuid()
});

export const createTemplateSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  
  // Sport scope
  sportId: z.string().cuid().optional(),
  
  // External provider scope
  competitionExternalId: z.string().optional(),
  seasonYear: z.number().int().optional(),
  stageLabel: z.string().optional(),
  roundLabel: z.string().optional(),
  
  // Default configuration
  rules: z.object({
    exactScore: z.number().int().default(5),
    correctSign: z.number().int().default(3),
    goalDiffBonus: z.number().int().default(1),
    tieBreakers: z.array(z.string()).default(["EXACT_SCORES", "CORRECT_SIGNS"])
  }).optional(),
  
  accessDefaults: z.object({
    accessType: z.nativeEnum(AccessType).default("PUBLIC"),
    requireCaptcha: z.boolean().default(false),
    requireEmailVerification: z.boolean().default(false),
    emailDomains: z.array(z.string()).optional(),
    maxUsers: z.number().int().positive().optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional()
  }).optional(),
  
  prizesDefaults: z.array(z.object({
    rankFrom: z.number().int().positive(),
    rankTo: z.number().int().positive(),
    type: z.nativeEnum(PrizeType),
    title: z.string().min(1),
    description: z.string().optional(),
    value: z.string().optional(),
    metadata: z.any().optional()
  })).optional(),
  
  brandHints: z.any().optional(),
  meta: z.any().optional()
});

export const updateTemplateSchema = z.object({
  id: z.string().cuid(),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  
  // Sport scope
  sportId: z.string().cuid().optional().nullable(),
  
  // External provider scope
  competitionExternalId: z.string().optional().nullable(),
  seasonYear: z.number().int().optional().nullable(),
  stageLabel: z.string().optional().nullable(),
  roundLabel: z.string().optional().nullable(),
  
  // Default configuration
  rules: z.object({
    exactScore: z.number().int(),
    correctSign: z.number().int(),
    goalDiffBonus: z.number().int(),
    tieBreakers: z.array(z.string())
  }).optional().nullable(),
  
  accessDefaults: z.object({
    accessType: z.nativeEnum(AccessType),
    requireCaptcha: z.boolean(),
    requireEmailVerification: z.boolean(),
    emailDomains: z.array(z.string()).optional(),
    maxUsers: z.number().int().positive().optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional()
  }).optional().nullable(),
  
  prizesDefaults: z.array(z.object({
    rankFrom: z.number().int().positive(),
    rankTo: z.number().int().positive(),
    type: z.nativeEnum(PrizeType),
    title: z.string().min(1),
    description: z.string().optional(),
    value: z.string().optional(),
    metadata: z.any().optional()
  })).optional().nullable(),
  
  brandHints: z.any().optional().nullable(),
  meta: z.any().optional().nullable()
});

export const publishTemplateSchema = z.object({
  id: z.string().cuid()
});

export const archiveTemplateSchema = z.object({
  id: z.string().cuid()
});

export const cloneTemplateSchema = z.object({
  id: z.string().cuid(),
  newSlug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/)
});

export const deleteTemplateSchema = z.object({
  id: z.string().cuid()
});

export const previewImportSchema = z.object({
  id: z.string().cuid()
});

export const assignToTenantSchema = z.object({
  templateId: z.string().cuid(),
  tenantId: z.string().cuid()
});

// Type exports
export type ListTenantsInput = z.infer<typeof listTenantsSchema>;
export type GetTenantInput = z.infer<typeof getTenantSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type DeleteTenantInput = z.infer<typeof deleteTenantSchema>;
export type AddTenantMemberInput = z.infer<typeof addTenantMemberSchema>;
export type RemoveTenantMemberInput = z.infer<typeof removeTenantMemberSchema>;
export type SetMemberRoleInput = z.infer<typeof setMemberRoleSchema>;
export type AssignTemplatesInput = z.infer<typeof assignTemplatesSchema>;

export type ListTemplatesInput = z.infer<typeof listTemplatesSchema>;
export type GetTemplateInput = z.infer<typeof getTemplateSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type PublishTemplateInput = z.infer<typeof publishTemplateSchema>;
export type ArchiveTemplateInput = z.infer<typeof archiveTemplateSchema>;
export type CloneTemplateInput = z.infer<typeof cloneTemplateSchema>;
export type DeleteTemplateInput = z.infer<typeof deleteTemplateSchema>;
export type PreviewImportInput = z.infer<typeof previewImportSchema>;
export type AssignToTenantInput = z.infer<typeof assignToTenantSchema>;
