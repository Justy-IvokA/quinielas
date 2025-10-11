import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@qp/db";
import {
  getSetting,
  getAllSettings,
  upsertSetting,
  validateSettingValue,
  getCaptchaLevel,
} from "./settings";

describe("Settings Resolution", () => {
  let testTenantId: string;
  let testPoolId: string;

  beforeAll(async () => {
    // Create test tenant and pool
    const tenant = await prisma.tenant.create({
      data: {
        slug: "test-settings",
        name: "Test Settings Tenant",
      },
    });
    testTenantId = tenant.id;

    const sport = await prisma.sport.upsert({
      where: { slug: "test-sport" },
      update: {},
      create: { slug: "test-sport", name: "Test Sport" },
    });

    const competition = await prisma.competition.create({
      data: {
        sportId: sport.id,
        slug: "test-comp",
        name: "Test Competition",
      },
    });

    const season = await prisma.season.create({
      data: {
        competitionId: competition.id,
        name: "2026",
        year: 2026,
      },
    });

    const pool = await prisma.pool.create({
      data: {
        tenantId: testTenantId,
        seasonId: season.id,
        name: "Test Pool",
        slug: "test-pool",
      },
    });
    testPoolId = pool.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.setting.deleteMany({
      where: {
        OR: [
          { tenantId: testTenantId },
          { poolId: testPoolId },
        ],
      },
    });
    await prisma.pool.delete({ where: { id: testPoolId } });
    await prisma.tenant.delete({ where: { id: testTenantId } });
  });

  it("should validate setting values correctly", () => {
    expect(validateSettingValue("antiAbuse.captchaLevel", "auto")).toBe(true);
    expect(validateSettingValue("antiAbuse.captchaLevel", "invalid")).toBe(false);
    expect(
      validateSettingValue("antiAbuse.rateLimit", { windowSec: 60, max: 60 })
    ).toBe(true);
    expect(validateSettingValue("antiAbuse.rateLimit", { invalid: true })).toBe(
      false
    );
  });

  it("should return default value when no settings exist", async () => {
    const setting = await getSetting("antiAbuse.captchaLevel");
    expect(setting.value).toBe("auto");
    expect(setting.source).toBe("default");
  });

  it("should cascade from global to tenant to pool", async () => {
    // Set global
    await upsertSetting("antiAbuse.captchaLevel", "off", "GLOBAL");

    let setting = await getSetting("antiAbuse.captchaLevel");
    expect(setting.value).toBe("off");
    expect(setting.source).toBe("global");

    // Set tenant override
    await upsertSetting("antiAbuse.captchaLevel", "force", "TENANT", {
      tenantId: testTenantId,
    });

    setting = await getSetting("antiAbuse.captchaLevel", {
      tenantId: testTenantId,
    });
    expect(setting.value).toBe("force");
    expect(setting.source).toBe("tenant");

    // Set pool override
    await upsertSetting("antiAbuse.captchaLevel", "auto", "POOL", {
      tenantId: testTenantId,
      poolId: testPoolId,
    });

    setting = await getSetting("antiAbuse.captchaLevel", {
      tenantId: testTenantId,
      poolId: testPoolId,
    });
    expect(setting.value).toBe("auto");
    expect(setting.source).toBe("pool");

    // Verify tenant still returns tenant override
    setting = await getSetting("antiAbuse.captchaLevel", {
      tenantId: testTenantId,
    });
    expect(setting.value).toBe("force");
    expect(setting.source).toBe("tenant");
  });

  it("should get all settings with correct cascade", async () => {
    const allSettings = await getAllSettings({
      tenantId: testTenantId,
      poolId: testPoolId,
    });

    expect(allSettings["antiAbuse.captchaLevel"].value).toBe("auto");
    expect(allSettings["antiAbuse.captchaLevel"].source).toBe("pool");
    expect(allSettings["privacy.ipLogging"]).toBeDefined();
  });

  it("should use typed getters correctly", async () => {
    const captchaLevel = await getCaptchaLevel({
      tenantId: testTenantId,
      poolId: testPoolId,
    });
    expect(captchaLevel).toBe("auto");
  });

  it("should throw error for invalid scope constraints", async () => {
    await expect(
      upsertSetting("antiAbuse.captchaLevel", "auto", "GLOBAL", {
        tenantId: testTenantId,
      })
    ).rejects.toThrow("Global settings cannot have tenantId");

    await expect(
      upsertSetting("antiAbuse.captchaLevel", "auto", "TENANT", {})
    ).rejects.toThrow("Tenant settings must have tenantId");

    await expect(
      upsertSetting("antiAbuse.captchaLevel", "auto", "POOL", {
        tenantId: testTenantId,
      })
    ).rejects.toThrow("Pool settings must have both tenantId and poolId");
  });
});
