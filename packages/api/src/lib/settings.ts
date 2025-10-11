/**
 * Settings resolution library with hierarchical cascade:
 * Pool override > Tenant override > Global default > Fallback
 */

import { z } from "zod";
import { prisma } from "@qp/db";
import type { SettingScope } from "@qp/db";
import type { Prisma } from "@qp/db";

// ========================================
// SETTING KEY SCHEMAS
// ========================================

const antiAbuseCaptchaLevelSchema = z.enum(["auto", "off", "force"]);
const antiAbuseRateLimitSchema = z.object({
  windowSec: z.number().int().positive(),
  max: z.number().int().positive(),
});

const privacyIpLoggingSchema = z.boolean();
const privacyCookieBannerSchema = z.boolean();
const privacyDeviceFingerprintSchema = z.boolean();

// Map of setting keys to their validation schemas
const settingSchemas: Record<string, z.ZodSchema> = {
  "antiAbuse.captchaLevel": antiAbuseCaptchaLevelSchema,
  "antiAbuse.rateLimit": antiAbuseRateLimitSchema,
  "privacy.ipLogging": privacyIpLoggingSchema,
  "privacy.cookieBanner": privacyCookieBannerSchema,
  "privacy.deviceFingerprint": privacyDeviceFingerprintSchema,
};

// Default values for global settings
const defaultSettings: Record<string, unknown> = {
  "antiAbuse.captchaLevel": "auto",
  "antiAbuse.rateLimit": { windowSec: 60, max: 60 },
  "privacy.ipLogging": true,
  "privacy.cookieBanner": true,
  "privacy.deviceFingerprint": false,
};

// ========================================
// TYPES
// ========================================

export interface SettingContext {
  tenantId?: string;
  poolId?: string;
}

export interface SettingValue {
  key: string;
  value: unknown;
  scope: SettingScope;
  source: "pool" | "tenant" | "global" | "default";
}

// ========================================
// CORE FUNCTIONS
// ========================================

/**
 * Validates a setting value against its schema
 */
export function validateSettingValue(key: string, value: unknown): boolean {
  const schema = settingSchemas[key];
  if (!schema) {
    return false;
  }
  const result = schema.safeParse(value);
  return result.success;
}

/**
 * Gets a single setting with cascade resolution
 */
export async function getSetting(
  key: string,
  context: SettingContext = {}
): Promise<SettingValue> {
  const { tenantId, poolId } = context;

  // Try pool override first
  if (poolId && tenantId) {
    const poolSetting = await prisma.setting.findFirst({
      where: {
        scope: "POOL",
        poolId,
        tenantId,
        key,
      },
    });

    if (poolSetting) {
      return {
        key,
        value: poolSetting.value,
        scope: "POOL",
        source: "pool",
      };
    }
  }

  // Try tenant override
  if (tenantId) {
    const tenantSetting = await prisma.setting.findFirst({
      where: {
        scope: "TENANT",
        tenantId,
        poolId: null,
        key,
      },
    });

    if (tenantSetting) {
      return {
        key,
        value: tenantSetting.value,
        scope: "TENANT",
        source: "tenant",
      };
    }
  }

  // Try global setting
  const globalSetting = await prisma.setting.findFirst({
    where: {
      scope: "GLOBAL",
      tenantId: null,
      poolId: null,
      key,
    },
  });

  if (globalSetting) {
    return {
      key,
      value: globalSetting.value,
      scope: "GLOBAL",
      source: "global",
    };
  }

  // Fallback to default
  const defaultValue = defaultSettings[key];
  return {
    key,
    value: defaultValue,
    scope: "GLOBAL",
    source: "default",
  };
}

/**
 * Gets all settings merged with cascade resolution
 */
export async function getAllSettings(
  context: SettingContext = {}
): Promise<Record<string, SettingValue>> {
  const allKeys = Object.keys(defaultSettings);
  const results: Record<string, SettingValue> = {};

  for (const key of allKeys) {
    results[key] = await getSetting(key, context);
  }

  return results;
}

/**
 * Gets effective settings as a flat object (values only)
 */
export async function getEffectiveSettings(
  context: SettingContext = {}
): Promise<Record<string, unknown>> {
  const allSettings = await getAllSettings(context);
  const effective: Record<string, unknown> = {};

  for (const [key, settingValue] of Object.entries(allSettings)) {
    effective[key] = settingValue.value;
  }

  return effective;
}

/**
 * Upserts a setting at a specific scope
 */
export async function upsertSetting(
  key: string,
  value: unknown,
  scope: SettingScope,
  context: SettingContext = {}
): Promise<void> {
  // Validate the value
  if (!validateSettingValue(key, value)) {
    throw new Error(`Invalid value for setting key: ${key}`);
  }

  const { tenantId, poolId } = context;

  // Validate scope constraints
  if (scope === "GLOBAL" && (tenantId || poolId)) {
    throw new Error("Global settings cannot have tenantId or poolId");
  }

  if (scope === "TENANT" && (!tenantId || poolId)) {
    throw new Error("Tenant settings must have tenantId and no poolId");
  }

  if (scope === "POOL" && (!tenantId || !poolId)) {
    throw new Error("Pool settings must have both tenantId and poolId");
  }

  // Upsert the setting
  await prisma.setting.upsert({
    where: {
      scope_tenantId_poolId_key: {
        scope,
        tenantId: tenantId!,
        poolId: poolId!,
        key,
      },
    },
    create: {
      scope,
      tenantId: tenantId || null,
      poolId: poolId || null,
      key,
      value: value as Prisma.InputJsonValue,
    },
    update: {
      value: value as Prisma.InputJsonValue,
    },
  });
}

/**
 * Deletes a setting at a specific scope
 */
export async function deleteSetting(
  key: string,
  scope: SettingScope,
  context: SettingContext = {}
): Promise<void> {
  const { tenantId, poolId } = context;

  await prisma.setting.deleteMany({
    where: {
      scope,
      tenantId: tenantId || null,
      poolId: poolId || null,
      key,
    },
  });
}

// ========================================
// TYPED GETTERS FOR SPECIFIC SETTINGS
// ========================================

export async function getCaptchaLevel(
  context: SettingContext = {}
): Promise<"auto" | "off" | "force"> {
  const setting = await getSetting("antiAbuse.captchaLevel", context);
  return setting.value as "auto" | "off" | "force";
}

export async function getRateLimit(
  context: SettingContext = {}
): Promise<{ windowSec: number; max: number }> {
  const setting = await getSetting("antiAbuse.rateLimit", context);
  return setting.value as { windowSec: number; max: number };
}

export async function getIpLoggingEnabled(
  context: SettingContext = {}
): Promise<boolean> {
  const setting = await getSetting("privacy.ipLogging", context);
  return setting.value as boolean;
}

export async function getCookieBannerEnabled(
  context: SettingContext = {}
): Promise<boolean> {
  const setting = await getSetting("privacy.cookieBanner", context);
  return setting.value as boolean;
}

export async function getDeviceFingerprintEnabled(
  context: SettingContext = {}
): Promise<boolean> {
  const setting = await getSetting("privacy.deviceFingerprint", context);
  return setting.value as boolean;
}
