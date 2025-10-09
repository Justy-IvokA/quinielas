import type { PrismaClient, Registration, AccessType } from "@qp/db";
import { TRPCError } from "@trpc/server";

export interface RegisterPublicInput {
  userId: string;
  poolId: string;
  displayName?: string;
  email?: string;
  captchaToken?: string;
}

export interface RegisterWithCodeInput {
  userId: string;
  poolId: string;
  inviteCode: string;
  displayName?: string;
  email?: string;
}

export interface RegisterWithEmailInviteInput {
  userId: string;
  poolId: string;
  inviteToken: string;
  email: string;
  displayName?: string;
}

export class RegistrationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check if user is already registered
   */
  async checkRegistration(userId: string, poolId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: {
        userId_poolId: {
          userId,
          poolId
        }
      }
    });

    return {
      isRegistered: !!registration,
      registration
    };
  }

  /**
   * Register with public access
   */
  async registerPublic(input: RegisterPublicInput): Promise<Registration> {
    const pool = await this.prisma.pool.findUnique({
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
    const existing = await this.prisma.registration.findUnique({
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
    const registration = await this.prisma.registration.create({
      data: {
        userId: input.userId,
        poolId: input.poolId,
        tenantId: pool.tenantId,
        displayName: input.displayName,
        email: input.email,
        emailVerified: !pool.accessPolicy.requireEmailVerification
      }
    });

    // Log audit
    await this.prisma.auditLog.create({
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
  }

  /**
   * Register with invite code
   */
  async registerWithCode(input: RegisterWithCodeInput): Promise<Registration> {
    const pool = await this.prisma.pool.findUnique({
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

    if (!pool?.accessPolicy || pool.accessPolicy.accessType !== "CODE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This pool does not accept invite codes"
      });
    }

    // Find the code
    const inviteCode = pool.accessPolicy.codeBatches
      .flatMap((batch) => batch.codes)
      .find((c) => c.code === input.inviteCode);

    if (!inviteCode) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid invite code"
      });
    }

    // Validate code
    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invite code has expired"
      });
    }

    if (inviteCode.status === "PAUSED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invite code is currently paused"
      });
    }

    if (inviteCode.usedCount >= inviteCode.usesPerCode) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invite code has reached its usage limit"
      });
    }

    // Check if already registered
    const existing = await this.prisma.registration.findUnique({
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

    // Create registration and update code usage in transaction
    const [registration] = await this.prisma.$transaction([
      this.prisma.registration.create({
        data: {
          userId: input.userId,
          poolId: input.poolId,
          tenantId: pool.tenantId,
          displayName: input.displayName,
          email: input.email,
          emailVerified: !pool.accessPolicy.requireEmailVerification,
          inviteCodeId: inviteCode.id
        }
      }),
      this.prisma.inviteCode.update({
        where: { id: inviteCode.id },
        data: {
          usedCount: { increment: 1 },
          status: inviteCode.usedCount + 1 >= inviteCode.usesPerCode ? "USED" : "PARTIALLY_USED"
        }
      }),
      this.prisma.auditLog.create({
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
  }

  /**
   * Register with email invitation
   */
  async registerWithEmailInvite(input: RegisterWithEmailInviteInput): Promise<Registration> {
    const pool = await this.prisma.pool.findUnique({
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

    // Check expiration
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" }
      });

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invitation has expired"
      });
    }

    // Check status
    if (invitation.status !== "PENDING") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invitation is no longer valid"
      });
    }

    // Verify email matches
    if (invitation.email.toLowerCase() !== input.email.toLowerCase()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Email does not match the invitation"
      });
    }

    // Check if already registered
    const existing = await this.prisma.registration.findUnique({
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
    const [registration] = await this.prisma.$transaction([
      this.prisma.registration.create({
        data: {
          userId: input.userId,
          poolId: input.poolId,
          tenantId: pool.tenantId,
          displayName: input.displayName,
          email: input.email,
          emailVerified: true,
          invitationId: invitation.id
        }
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date()
        }
      }),
      this.prisma.auditLog.create({
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
  }

  /**
   * List registrations for a pool
   */
  async listByPool(poolId: string, tenantId: string) {
    return this.prisma.registration.findMany({
      where: {
        poolId,
        tenantId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { joinedAt: "desc" }
    });
  }

  /**
   * Get registration stats for a pool
   */
  async getPoolStats(poolId: string, tenantId: string) {
    const registrations = await this.prisma.registration.findMany({
      where: {
        poolId,
        tenantId
      },
      select: {
        emailVerified: true,
        inviteCodeId: true,
        invitationId: true
      }
    });

    return {
      total: registrations.length,
      emailVerified: registrations.filter((r) => r.emailVerified).length,
      viaCode: registrations.filter((r) => r.inviteCodeId).length,
      viaInvite: registrations.filter((r) => r.invitationId).length,
      public: registrations.filter((r) => !r.inviteCodeId && !r.invitationId).length
    };
  }
}
