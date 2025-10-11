import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../trpc";
import { prisma } from "@qp/db";
import { getIpLoggingEnabled } from "../../lib/settings";
import {
  getMyConsentsSchema,
  acceptPolicySchema,
  checkConsentSchema,
} from "./schema";

export const consentRouter = router({
  /**
   * Get all consent records for the current user
   */
  getMyConsents: protectedProcedure
    .input(getMyConsentsSchema)
    .query(async ({ input, ctx }) => {
      const { tenantId, poolId } = input;

      const consents = await prisma.consentRecord.findMany({
        where: {
          userId: ctx.session.user.id,
          tenantId,
          ...(poolId && { poolId }),
        },
        orderBy: {
          consentedAt: "desc",
        },
      });

      return consents;
    }),

  /**
   * Check if user has consented to current version of a policy
   */
  checkConsent: protectedProcedure
    .input(checkConsentSchema)
    .query(async ({ input, ctx }) => {
      const { tenantId, poolId, policyType } = input;

      // Get current policy version
      const currentPolicy = await prisma.policyDocument.findFirst({
        where: {
          tenantId,
          poolId: poolId ?? null,
          type: policyType,
        },
        orderBy: {
          version: "desc",
        },
        select: {
          version: true,
        },
      });

      if (!currentPolicy) {
        return {
          required: false,
          hasConsented: true,
          currentVersion: null,
        };
      }

      // Check if user has consented to this version
      const consent = await prisma.consentRecord.findUnique({
        where: {
          userId_tenantId_poolId_policyType_version: {
            userId: ctx.session.user.id,
            tenantId,
            poolId: poolId!,
            policyType,
            version: currentPolicy.version,
          },
        },
      });

      return {
        required: true,
        hasConsented: !!consent,
        currentVersion: currentPolicy.version,
        consentedAt: consent?.consentedAt,
      };
    }),

  /**
   * Accept a policy (create consent record)
   */
  accept: protectedProcedure
    .input(acceptPolicySchema)
    .mutation(async ({ input, ctx }) => {
      const { tenantId, poolId, policyType, version } = input;

      // Verify the policy version exists
      const policy = await prisma.policyDocument.findUnique({
        where: {
          tenantId_poolId_type_version: {
            tenantId,
            poolId: poolId!,
            type: policyType,
            version,
          },
        },
      });

      if (!policy) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Policy version not found",
        });
      }

      // Check if IP logging is enabled
      const ipLoggingEnabled = await getIpLoggingEnabled({ tenantId, poolId });
      const ipAddress = ipLoggingEnabled ? ctx.ip : null;

      // Create or update consent record
      const consent = await prisma.consentRecord.upsert({
        where: {
          userId_tenantId_poolId_policyType_version: {
            userId: ctx.session.user.id,
            tenantId,
            poolId: poolId!,
            policyType,
            version,
          },
        },
        create: {
          userId: ctx.session.user.id,
          tenantId,
          poolId: poolId!,
          policyType,
          version,
          ipAddress,
          userAgent: ctx.userAgent,
        },
        update: {
          consentedAt: new Date(),
          ipAddress,
          userAgent: ctx.userAgent,
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          tenantId,
          actorId: ctx.session.user.id,
          action: "CONSENT_ACCEPT",
          metadata: {
            policyType,
            version,
            poolId,
          },
          ipAddress,
          userAgent: ctx.userAgent,
        },
      });

      return consent;
    }),

  /**
   * Get consent status for all required policies
   */
  getConsentStatus: protectedProcedure
    .input(getMyConsentsSchema)
    .query(async ({ input, ctx }) => {
      const { tenantId, poolId } = input;

      // Get current versions of both policies
      const [termsPolicy, privacyPolicy] = await Promise.all([
        prisma.policyDocument.findFirst({
          where: {
            tenantId,
            poolId: poolId ?? null,
            type: "TERMS",
          },
          orderBy: { version: "desc" },
          select: { version: true },
        }),
        prisma.policyDocument.findFirst({
          where: {
            tenantId,
            poolId: poolId!,
            type: "PRIVACY",
          },
          orderBy: { version: "desc" },
          select: { version: true },
        }),
      ]);

      // Check consents
      const consents = await prisma.consentRecord.findMany({
        where: {
          userId: ctx.session.user.id,
          tenantId,
          poolId: poolId ?? null,
          policyType: { in: ["TERMS", "PRIVACY"] },
        },
      });

      const termsConsent = consents.find(
        (c) => c.policyType === "TERMS" && c.version === termsPolicy?.version
      );
      const privacyConsent = consents.find(
        (c) => c.policyType === "PRIVACY" && c.version === privacyPolicy?.version
      );

      return {
        terms: {
          required: !!termsPolicy,
          currentVersion: termsPolicy?.version ?? null,
          hasConsented: !!termsConsent,
          consentedAt: termsConsent?.consentedAt,
        },
        privacy: {
          required: !!privacyPolicy,
          currentVersion: privacyPolicy?.version ?? null,
          hasConsented: !!privacyConsent,
          consentedAt: privacyConsent?.consentedAt,
        },
        allAccepted:
          (!termsPolicy || !!termsConsent) && (!privacyPolicy || !!privacyConsent),
      };
    }),
});
