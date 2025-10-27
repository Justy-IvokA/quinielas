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

// Sync Settings Schemas
export const syncSettingsSchema = z.object({
  "sync:auto-sync-fixtures:cron": z.string().optional(),
  "sync:leaderboard-snapshot:cron": z.string().optional(),
  "sync:purge-audit-logs:cron": z.string().optional(),
  "sync:purge-invitations:cron": z.string().optional(),
  "sync:purge-tokens:cron": z.string().optional(),
  "sync:refresh-standings:cron": z.string().optional(),
  "sync:lock-predictions:cron": z.string().optional(),
  "sync:update-live-matches:cron": z.string().optional(),
  "sync:score-final:cron": z.string().optional(),
});

export const updateSyncSettingsSchema = z.object({
  settings: syncSettingsSchema,
});
