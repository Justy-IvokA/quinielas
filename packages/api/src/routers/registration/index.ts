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

/**
 * Helper function to get user data from existing registrations
 * Used when user is already authenticated and doesn't need to provide personal data again
 */
async function getUserDataFromExistingRegistration(userId: string) {
  const existingReg = await prisma.registration.findFirst({
    where: { userId },
    orderBy: { joinedAt: 'desc' }
  });

  if (existingReg) {
    return {
      displayName: existingReg.displayName,
      email: existingReg.email,
      phone: existingReg.phone
    };
  }

  return null;
}

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

  // Check if user has any previous registrations (for returning user detection)
  hasExistingData: publicProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .query(async ({ input }) => {
      const existingReg = await prisma.registration.findFirst({
        where: { userId: input.userId },
        orderBy: { joinedAt: 'desc' }
      });

      return {
        hasData: !!existingReg,
        displayName: existingReg?.displayName,
        email: existingReg?.email,
        phone: existingReg?.phone
      };
    }),

  // Check registration status by pool slug (uses ctx.tenant and ctx.session)
  checkByPoolSlug: publicProcedure
    .use(withTenant)
    .use(withAuth)
    .input(z.object({ poolSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Tenant context required"
        });
      }

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
      .flatMap((batch: any) => batch.codes)
      .find((c: any) => c.code === input.code);

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
        accessPolicy: true
      }
    });

    if (!pool?.accessPolicy) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This pool does not have an access policy configured"
      });
    }

    // Find invitation by token directly (not through accessPolicy relation)
    const invitation = await prisma.invitation.findFirst({
      where: {
        token: input.token,
        poolId: input.poolId,
        status: "PENDING"
      }
    });

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

    // Get user data from input or existing registration
    let displayName = input.displayName;
    let email = input.email;
    let phone = input.phone;

    if (!displayName || !email) {
      const userData = await getUserDataFromExistingRegistration(input.userId);
      if (!userData) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Display name and email are required for first-time registration"
        });
      }
      displayName = displayName || userData.displayName || undefined;
      email = email || userData.email || undefined;
      phone = phone || userData.phone || undefined;
    }

    // Update User model if phone is provided and not already set
    if (phone) {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { phone: true }
      });

      if (!user?.phone) {
        await prisma.user.update({
          where: { id: input.userId },
          data: { phone }
        });
      }
    }

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        userId: input.userId,
        poolId: input.poolId,
        tenantId: pool.tenantId,
        displayName,
        email,
        phone: phone || null,
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
      .flatMap((batch: any) => batch.codes)
      .find((c: any) => c.code === input.inviteCode);

    if (!inviteCode) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invite code not found"
      });
    }

    // Get user data from input or existing registration
    let displayName = input.displayName;
    let email = input.email;
    let phone = input.phone;

    if (!displayName || !email) {
      const userData = await getUserDataFromExistingRegistration(input.userId);
      if (!userData) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Display name and email are required for first-time registration"
        });
      }
      displayName = displayName || userData.displayName || undefined;
      email = email || userData.email || undefined;
      phone = phone || userData.phone || undefined;
    }

    // Create registration and update code usage in transaction
    const [registration] = await prisma.$transaction([
      prisma.registration.create({
        data: {
          userId: input.userId,
          poolId: input.poolId,
          tenantId: pool.tenantId,
          displayName,
          email,
          phone: phone || null,
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

    // Verify email matches invitation (only if email is provided)
    if (input.email && invitation.email.toLowerCase() !== input.email.toLowerCase()) {
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

    // Get user data from input or existing registration
    let displayName = input.displayName;
    let email = input.email || invitation.email; // Use invitation email if not provided
    let phone = input.phone;

    if (!displayName) {
      const userData = await getUserDataFromExistingRegistration(input.userId);
      if (!userData) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Display name is required for first-time registration"
        });
      }
      displayName = displayName || userData.displayName || undefined;
      phone = phone || userData.phone || undefined;
    }

    // Create registration and mark invitation as accepted
    const [registration] = await prisma.$transaction([
      prisma.registration.create({
        data: {
          userId: input.userId,
          poolId: input.poolId,
          tenantId: pool.tenantId,
          displayName,
          email,
          phone: phone || null,
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
