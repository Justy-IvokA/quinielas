import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@qp/db";

import { publicProcedure, router } from "../../trpc";
import { withAuth, withTenant } from "../../middleware/with-tenant";
import {
  checkRegistrationSchema,
  registerPublicSchema,
  registerWithCodeSchema,
  registerWithEmailInviteSchema,
  validateInviteCodeSchema,
  validateInviteTokenSchema
} from "./schema";

export const registrationRouter = router({
  // Check if user is already registered
  checkRegistration: publicProcedure.input(checkRegistrationSchema).query(async ({ input }) => {
    const registration = await prisma.registration.findUnique({
      where: {
        userId_poolId: {
          userId: input.userId,
          poolId: input.poolId
        }
      }
    });

    return {
      isRegistered: !!registration,
      registration
    };
  }),

  // Check registration status by pool slug (uses ctx.tenant and ctx.session)
  checkByPoolSlug: publicProcedure
    .use(withTenant)
    .use(withAuth)
    .input(z.object({ poolSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      // Find pool in tenant
      const pool = await prisma.pool.findFirst({
        where: {
          slug: input.poolSlug,
          tenantId: ctx.tenant.id
        }
      });

      if (!pool) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pool not found"
        });
      }

      // Check registration
      const registration = await prisma.registration.findUnique({
        where: {
          userId_poolId: {
            userId: ctx.session.user.id,
            poolId: pool.id
          }
        }
      });

      return {
        isRegistered: !!registration,
        registration,
        poolId: pool.id
      };
    }),

  // Validate invite code
  validateInviteCode: publicProcedure.input(validateInviteCodeSchema).query(async ({ input }) => {
    const pool = await prisma.pool.findUnique({
      where: { id: input.poolId },
      include: {
        accessPolicy: {
          include: {
            codeBatches: {
              include: {
                codes: {
                  where: {
                    code: input.code,
                    status: { in: ["UNUSED", "PARTIALLY_USED"] }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!pool?.accessPolicy || pool.accessPolicy.accessType !== "CODE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This pool does not accept invite codes"
      });
    }

    const code = pool.accessPolicy.codeBatches
      .flatMap((batch) => batch.codes)
      .find((c) => c.code === input.code);

    if (!code) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid invite code"
      });
    }

    if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invite code has expired"
      });
    }

    if (code.usedCount >= code.usesPerCode) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invite code has reached its usage limit"
      });
    }

    return {
      valid: true,
      code: {
        id: code.id,
        usesRemaining: code.usesPerCode - code.usedCount
      }
    };
  }),

  // Validate invite token (email invitation)
  validateInviteToken: publicProcedure.input(validateInviteTokenSchema).query(async ({ input }) => {
    const pool = await prisma.pool.findUnique({
      where: { id: input.poolId },
      include: {
        accessPolicy: {
          include: {
            invitations: {
              where: {
                token: input.token,
                status: "PENDING"
              }
            }
          }
        }
      }
    });

    if (!pool?.accessPolicy || pool.accessPolicy.accessType !== "EMAIL_INVITE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This pool does not accept email invitations"
      });
    }

    const invitation = pool.accessPolicy.invitations[0];

    if (!invitation) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid or already used invitation token"
      });
    }

    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" }
      });

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invitation has expired"
      });
    }

    return {
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email
      }
    };
  }),

  // Register with public access
  registerPublic: publicProcedure.input(registerPublicSchema).mutation(async ({ input }) => {
    const pool = await prisma.pool.findUnique({
      where: { id: input.poolId },
      include: {
        accessPolicy: true,
        _count: { select: { registrations: true } }
      }
    });

    if (!pool) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pool not found"
      });
    }

    if (!pool.isActive) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This pool is not accepting registrations"
      });
    }

    if (!pool.accessPolicy || pool.accessPolicy.accessType !== "PUBLIC") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This pool requires an invitation"
      });
    }

    // Check registration window
    const now = new Date();
    if (pool.accessPolicy.registrationStartDate && now < pool.accessPolicy.registrationStartDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Registration has not started yet"
      });
    }

    if (pool.accessPolicy.registrationEndDate && now > pool.accessPolicy.registrationEndDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Registration period has ended"
      });
    }

    // Check max registrations
    if (pool.accessPolicy.maxRegistrations && pool._count.registrations >= pool.accessPolicy.maxRegistrations) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This pool has reached its maximum number of registrations"
      });
    }

    // Check if already registered
    const existing = await prisma.registration.findUnique({
      where: {
        userId_poolId: {
          userId: input.userId,
          poolId: input.poolId
        }
      }
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "You are already registered for this pool"
      });
    }

    // TODO: Validate CAPTCHA if required
    if (pool.accessPolicy.requireCaptcha && !input.captchaToken) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "CAPTCHA verification is required"
      });
    }

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        userId: input.userId,
        poolId: input.poolId,
        tenantId: pool.tenantId,
        displayName: input.displayName,
        email: input.email,
        phone: input.phone || null,
        phoneVerified: false,
        emailVerified: !pool.accessPolicy.requireEmailVerification
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        tenantId: pool.tenantId,
        action: "REGISTRATION_PUBLIC",
        userId: input.userId,
        resourceType: "REGISTRATION",
        resourceId: registration.id,
        metadata: {
          poolId: input.poolId,
          displayName: input.displayName
        }
      }
    });

    return registration;
  }),

  // Register with invite code
  registerWithCode: publicProcedure.input(registerWithCodeSchema).mutation(async ({ input, ctx }) => {
    // Validate code first
    const validation = await registrationRouter.createCaller(ctx).validateInviteCode({
      poolId: input.poolId,
      code: input.inviteCode
    });

    const pool = await prisma.pool.findUnique({
      where: { id: input.poolId },
      include: {
        accessPolicy: {
          include: {
            codeBatches: {
              include: {
                codes: {
                  where: { code: input.inviteCode }
                }
              }
            }
          }
        }
      }
    });

    if (!pool?.accessPolicy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pool or access policy not found"
      });
    }

    // Check if already registered
    const existing = await prisma.registration.findUnique({
      where: {
        userId_poolId: {
          userId: input.userId,
          poolId: input.poolId
        }
      }
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "You are already registered for this pool"
      });
    }

    const inviteCode = pool.accessPolicy.codeBatches
      .flatMap((batch) => batch.codes)
      .find((c) => c.code === input.inviteCode);

    if (!inviteCode) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invite code not found"
      });
    }

    // Create registration and update code usage in transaction
    const [registration] = await prisma.$transaction([
      prisma.registration.create({
        data: {
          userId: input.userId,
          poolId: input.poolId,
          tenantId: pool.tenantId,
          displayName: input.displayName,
          email: input.email,
          phone: input.phone || null,
          phoneVerified: false,
          emailVerified: !pool.accessPolicy.requireEmailVerification,
          inviteCodeId: inviteCode.id
        }
      }),
      prisma.inviteCode.update({
        where: { id: inviteCode.id },
        data: {
          usedCount: { increment: 1 },
          status: inviteCode.usedCount + 1 >= inviteCode.usesPerCode ? "USED" : "PARTIALLY_USED"
        }
      }),
      prisma.auditLog.create({
        data: {
          tenantId: pool.tenantId,
          action: "REGISTRATION_CODE",
          userId: input.userId,
          resourceType: "REGISTRATION",
          resourceId: inviteCode.id,
          metadata: {
            poolId: input.poolId,
            inviteCode: input.inviteCode
          }
        }
      })
    ]);

    return registration;
  }),

  // Register with email invitation
  registerWithEmailInvite: publicProcedure.input(registerWithEmailInviteSchema).mutation(async ({ input, ctx }) => {
    // Validate token first
    const validation = await registrationRouter.createCaller(ctx).validateInviteToken({
      poolId: input.poolId,
      token: input.inviteToken
    });

    const pool = await prisma.pool.findUnique({
      where: { id: input.poolId },
      include: {
        accessPolicy: {
          include: {
            invitations: {
              where: { token: input.inviteToken }
            }
          }
        }
      }
    });

    if (!pool?.accessPolicy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pool or access policy not found"
      });
    }

    const invitation = pool.accessPolicy.invitations[0];

    if (!invitation) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invitation not found"
      });
    }

    // Verify email matches invitation
    if (invitation.email.toLowerCase() !== input.email.toLowerCase()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Email does not match the invitation"
      });
    }

    // Check if already registered
    const existing = await prisma.registration.findUnique({
      where: {
        userId_poolId: {
          userId: input.userId,
          poolId: input.poolId
        }
      }
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "You are already registered for this pool"
      });
    }

    // Create registration and mark invitation as accepted
    const [registration] = await prisma.$transaction([
      prisma.registration.create({
        data: {
          userId: input.userId,
          poolId: input.poolId,
          tenantId: pool.tenantId,
          displayName: input.displayName,
          email: input.email,
          phone: input.phone || null,
          phoneVerified: false,
          emailVerified: true,
          invitationId: invitation.id
        }
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date()
        }
      }),
      prisma.auditLog.create({
        data: {
          tenantId: pool.tenantId,
          action: "REGISTRATION_EMAIL_INVITE",
          userId: input.userId,
          resourceType: "REGISTRATION",
          resourceId: invitation.id,
          metadata: {
            poolId: input.poolId,
            email: input.email
          }
        }
      })
    ]);

    return registration;
  })
});
