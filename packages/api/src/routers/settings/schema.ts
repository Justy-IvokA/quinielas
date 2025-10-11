import { z } from "zod";

export const settingScopeSchema = z.enum(["GLOBAL", "TENANT", "POOL"]);

export const listSettingsSchema = z.object({
  scope: settingScopeSchema.optional(),
  tenantId: z.string().optional(),
  poolId: z.string().optional(),
});

export const upsertSettingSchema = z.object({
  scope: settingScopeSchema,
  tenantId: z.string().optional(),
  poolId: z.string().optional(),
  key: z.string(),
  value: z.unknown(),
});

export const deleteSettingSchema = z.object({
  scope: settingScopeSchema,
  tenantId: z.string().optional(),
  poolId: z.string().optional(),
  key: z.string(),
});

export const effectiveSettingsSchema = z.object({
  tenantId: z.string().optional(),
  poolId: z.string().optional(),
});
