import { describe, it, expect, beforeEach, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { prisma } from "@qp/db";
import { assertRegistrationAccess } from "./require-registration";

vi.mock("@qp/db", () => ({
  prisma: {
    registration: {
      findUnique: vi.fn()
    }
  }
}));

describe("assertRegistrationAccess", () => {
  const mockUserId = "user_123";
  const mockPoolId = "pool_123";
  const mockTenantId = "tenant_123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow access for PUBLIC pool with valid registration", async () => {
    vi.mocked(prisma.registration.findUnique).mockResolvedValue({
      id: "reg_123",
      userId: mockUserId,
      poolId: mockPoolId,
      tenantId: mockTenantId,
      displayName: null,
      email: null,
      emailVerified: false,
      phone: null,
      phoneVerified: false,
      inviteCodeId: null,
      invitationId: null,
      joinedAt: new Date(),
      pool: {
        id: mockPoolId,
        tenantId: mockTenantId,
        brandId: null,
        seasonId: "season_123",
        name: "Test Pool",
        slug: "test-pool",
        description: null,
        prizeSummary: null,
        ruleSet: null,
        isActive: true,
        isPublic: true,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        accessPolicy: {
          id: "policy_123",
          poolId: mockPoolId,
          tenantId: mockTenantId,
          accessType: "PUBLIC",
          requireCaptcha: false,
          requireEmailVerification: false,
          domainAllowList: [],
          maxRegistrations: null,
          registrationStartDate: null,
          registrationEndDate: null,
          userCap: null,
          windowStart: null,
          windowEnd: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      inviteCode: null,
      invitation: null
    } as any);

    const result = await assertRegistrationAccess({
      poolId: mockPoolId,
      userId: mockUserId,
      tenantId: mockTenantId
    });

    expect(result).toBeDefined();
    expect(result.userId).toBe(mockUserId);
  });

  it("should throw FORBIDDEN when registration not found", async () => {
    vi.mocked(prisma.registration.findUnique).mockResolvedValue(null);

    await expect(
      assertRegistrationAccess({
        poolId: mockPoolId,
        userId: mockUserId,
        tenantId: mockTenantId
      })
    ).rejects.toThrow(TRPCError);

    await expect(
      assertRegistrationAccess({
        poolId: mockPoolId,
        userId: mockUserId,
        tenantId: mockTenantId
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "REGISTRATION_REQUIRED"
    });
  });

  it("should throw FORBIDDEN for CODE policy without valid code", async () => {
    vi.mocked(prisma.registration.findUnique).mockResolvedValue({
      id: "reg_123",
      userId: mockUserId,
      poolId: mockPoolId,
      tenantId: mockTenantId,
      displayName: null,
      email: null,
      emailVerified: false,
      phone: null,
      phoneVerified: false,
      inviteCodeId: null,
      invitationId: null,
      joinedAt: new Date(),
      pool: {
        id: mockPoolId,
        tenantId: mockTenantId,
        brandId: null,
        seasonId: "season_123",
        name: "Test Pool",
        slug: "test-pool",
        description: null,
        prizeSummary: null,
        ruleSet: null,
        isActive: true,
        isPublic: false,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        accessPolicy: {
          id: "policy_123",
          poolId: mockPoolId,
          tenantId: mockTenantId,
          accessType: "CODE",
          requireCaptcha: false,
          requireEmailVerification: false,
          domainAllowList: [],
          maxRegistrations: null,
          registrationStartDate: null,
          registrationEndDate: null,
          userCap: null,
          windowStart: null,
          windowEnd: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      inviteCode: null,
      invitation: null
    } as any);

    await expect(
      assertRegistrationAccess({
        poolId: mockPoolId,
        userId: mockUserId,
        tenantId: mockTenantId
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "CODE_REQUIRED"
    });
  });

  it("should allow access for CODE policy with valid code", async () => {
    vi.mocked(prisma.registration.findUnique).mockResolvedValue({
      id: "reg_123",
      userId: mockUserId,
      poolId: mockPoolId,
      tenantId: mockTenantId,
      displayName: null,
      email: null,
      emailVerified: false,
      phone: null,
      phoneVerified: false,
      inviteCodeId: "code_123",
      invitationId: null,
      joinedAt: new Date(),
      pool: {
        id: mockPoolId,
        tenantId: mockTenantId,
        brandId: null,
        seasonId: "season_123",
        name: "Test Pool",
        slug: "test-pool",
        description: null,
        prizeSummary: null,
        ruleSet: null,
        isActive: true,
        isPublic: false,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        accessPolicy: {
          id: "policy_123",
          poolId: mockPoolId,
          tenantId: mockTenantId,
          accessType: "CODE",
          requireCaptcha: false,
          requireEmailVerification: false,
          domainAllowList: [],
          maxRegistrations: null,
          registrationStartDate: null,
          registrationEndDate: null,
          userCap: null,
          windowStart: null,
          windowEnd: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      inviteCode: {
        id: "code_123",
        codeBatchId: "batch_123",
        tenantId: mockTenantId,
        code: "TEST123",
        status: "PARTIALLY_USED",
        usesPerCode: 10,
        usedCount: 5,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      invitation: null
    } as any);

    const result = await assertRegistrationAccess({
      poolId: mockPoolId,
      userId: mockUserId,
      tenantId: mockTenantId
    });

    expect(result).toBeDefined();
  });

  it("should throw FORBIDDEN for EMAIL_INVITE policy without accepted invitation", async () => {
    vi.mocked(prisma.registration.findUnique).mockResolvedValue({
      id: "reg_123",
      userId: mockUserId,
      poolId: mockPoolId,
      tenantId: mockTenantId,
      displayName: null,
      email: "test@example.com",
      emailVerified: true,
      phone: null,
      phoneVerified: false,
      inviteCodeId: null,
      invitationId: "invite_123",
      joinedAt: new Date(),
      pool: {
        id: mockPoolId,
        tenantId: mockTenantId,
        brandId: null,
        seasonId: "season_123",
        name: "Test Pool",
        slug: "test-pool",
        description: null,
        prizeSummary: null,
        ruleSet: null,
        isActive: true,
        isPublic: false,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        accessPolicy: {
          id: "policy_123",
          poolId: mockPoolId,
          tenantId: mockTenantId,
          accessType: "EMAIL_INVITE",
          requireCaptcha: false,
          requireEmailVerification: true,
          domainAllowList: [],
          maxRegistrations: null,
          registrationStartDate: null,
          registrationEndDate: null,
          userCap: null,
          windowStart: null,
          windowEnd: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      inviteCode: null,
      invitation: {
        id: "invite_123",
        poolId: mockPoolId,
        accessPolicyId: "policy_123",
        tenantId: mockTenantId,
        email: "test@example.com",
        token: "token_123",
        expiresAt: new Date(Date.now() + 86400000),
        acceptedAt: null,
        status: "PENDING",
        sentCount: 1,
        lastSentAt: new Date(),
        openedAt: null,
        clickedAt: null,
        bouncedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } as any);

    await expect(
      assertRegistrationAccess({
        poolId: mockPoolId,
        userId: mockUserId,
        tenantId: mockTenantId
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "INVITATION_NOT_ACCEPTED"
    });
  });

  it("should allow access for EMAIL_INVITE policy with accepted invitation", async () => {
    vi.mocked(prisma.registration.findUnique).mockResolvedValue({
      id: "reg_123",
      userId: mockUserId,
      poolId: mockPoolId,
      tenantId: mockTenantId,
      displayName: null,
      email: "test@example.com",
      emailVerified: true,
      phone: null,
      phoneVerified: false,
      inviteCodeId: null,
      invitationId: "invite_123",
      joinedAt: new Date(),
      pool: {
        id: mockPoolId,
        tenantId: mockTenantId,
        brandId: null,
        seasonId: "season_123",
        name: "Test Pool",
        slug: "test-pool",
        description: null,
        prizeSummary: null,
        ruleSet: null,
        isActive: true,
        isPublic: false,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        accessPolicy: {
          id: "policy_123",
          poolId: mockPoolId,
          tenantId: mockTenantId,
          accessType: "EMAIL_INVITE",
          requireCaptcha: false,
          requireEmailVerification: true,
          domainAllowList: [],
          maxRegistrations: null,
          registrationStartDate: null,
          registrationEndDate: null,
          userCap: null,
          windowStart: null,
          windowEnd: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      inviteCode: null,
      invitation: {
        id: "invite_123",
        poolId: mockPoolId,
        accessPolicyId: "policy_123",
        tenantId: mockTenantId,
        email: "test@example.com",
        token: "token_123",
        expiresAt: new Date(Date.now() + 86400000),
        acceptedAt: new Date(),
        status: "ACCEPTED",
        sentCount: 1,
        lastSentAt: new Date(),
        openedAt: new Date(),
        clickedAt: new Date(),
        bouncedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } as any);

    const result = await assertRegistrationAccess({
      poolId: mockPoolId,
      userId: mockUserId,
      tenantId: mockTenantId
    });

    expect(result).toBeDefined();
  });
});
