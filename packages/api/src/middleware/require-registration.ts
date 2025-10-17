import { TRPCError } from "@trpc/server";
import { prisma } from "@qp/db";
import type { AppContext } from "../context";

interface RequireRegistrationOptions {
  poolId: string;
  userId: string;
  tenantId: string;
}

/**
 * Validates that a user has proper registration and access rights to a pool.
 * Enforces access policy rules (PUBLIC, CODE, EMAIL_INVITE).
 */
export async function assertRegistrationAccess({
  poolId,
  userId,
  tenantId
}: RequireRegistrationOptions) {
  // Fetch registration with related data
  const registration = await prisma.registration.findUnique({
    where: {
      userId_poolId: {
        userId,
        poolId
      }
    },
    include: {
      pool: {
        include: {
          accessPolicy: true
        }
      },
      inviteCode: true,
      invitation: true
    }
  });

  if (!registration) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "REGISTRATION_REQUIRED"
    });
  }

  // Verify tenant scoping
  if (registration.tenantId !== tenantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "TENANT_MISMATCH"
    });
  }

  const accessPolicy = registration.pool.accessPolicy;
  if (!accessPolicy) {
    // No access policy means PUBLIC by default
    return registration;
  }

  // Validate based on access type
  switch (accessPolicy.accessType) {
    case "PUBLIC":
      // No additional checks needed
      break;

    case "CODE":
      // Must have a valid invite code
      if (!registration.inviteCodeId || !registration.inviteCode) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "CODE_REQUIRED"
        });
      }

      // Check code status
      const code = registration.inviteCode;
      if (code.status === "EXPIRED" || code.status === "PAUSED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "CODE_INVALID"
        });
      }

      // Check if code usage is within cap
      if (code.usedCount > code.usesPerCode) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "CODE_EXHAUSTED"
        });
      }

      // Check code expiration
      if (code.expiresAt && code.expiresAt < new Date()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "CODE_EXPIRED"
        });
      }
      break;

    case "EMAIL_INVITE":
      // Must have a valid invitation
      if (!registration.invitationId || !registration.invitation) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "INVITATION_REQUIRED"
        });
      }

      // Check invitation status - must be ACCEPTED
      const invitation = registration.invitation;
      if (invitation.status !== "ACCEPTED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "INVITATION_NOT_ACCEPTED"
        });
      }

      // Check invitation expiration
      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "INVITATION_EXPIRED"
        });
      }
      break;

    default:
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "UNKNOWN_ACCESS_TYPE"
      });
  }

  return registration;
}

/**
 * tRPC middleware that enforces registration access for a pool.
 * Expects input to contain { poolId: string }.
 * Adds registration to context for use in procedures.
 */
export function requireRegistrationForPool<TInput extends { poolId: string }>() {
  return async ({ ctx, input, next }: { ctx: AppContext; input: TInput; next: () => any }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "AUTHENTICATION_REQUIRED"
      });
    }

    if (!ctx.tenant?.id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "TENANT_REQUIRED"
      });
    }

    const registration = await assertRegistrationAccess({
      poolId: input.poolId,
      userId: ctx.session.user.id,
      tenantId: ctx.tenant.id
    });

    // Add registration to context
    return next({
      ctx: {
        ...ctx,
        registration
      }
    });
  };
}
