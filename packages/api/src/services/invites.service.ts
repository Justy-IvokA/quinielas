import type { PrismaClient, Invitation, InvitationStatus } from "@qp/db";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";

export interface CreateInvitationInput {
  poolId: string;
  accessPolicyId: string;
  tenantId: string;
  email: string;
  expiresAt?: Date;
}

export interface CreateBulkInvitationsInput {
  poolId: string;
  accessPolicyId: string;
  tenantId: string;
  emails: string[];
  expiresAt?: Date;
}

export class InvitesService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate secure invite token
   */
  private generateToken(): string {
    return randomBytes(32).toString("hex");
  }

  /**
   * Create a single email invitation
   */
  async create(input: CreateInvitationInput): Promise<Invitation> {
    // Verify access policy is EMAIL_INVITE type
    const policy = await this.prisma.accessPolicy.findFirst({
      where: {
        id: input.accessPolicyId,
        tenantId: input.tenantId,
        accessType: "EMAIL_INVITE"
      }
    });

    if (!policy) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Access policy must be of type EMAIL_INVITE"
      });
    }

    // Check if invitation already exists for this email/pool
    const existing = await this.prisma.invitation.findFirst({
      where: {
        poolId: input.poolId,
        email: input.email.toLowerCase(),
        status: "PENDING"
      }
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "An active invitation already exists for this email"
      });
    }

    const token = this.generateToken();
    const expiresAt = input.expiresAt || new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h default

    return this.prisma.invitation.create({
      data: {
        poolId: input.poolId,
        accessPolicyId: input.accessPolicyId,
        tenantId: input.tenantId,
        email: input.email.toLowerCase(),
        token,
        expiresAt,
        status: "PENDING"
      }
    });
  }

  /**
   * Create multiple invitations at once
   */
  async createBulk(input: CreateBulkInvitationsInput): Promise<Invitation[]> {
    // Verify access policy
    const policy = await this.prisma.accessPolicy.findFirst({
      where: {
        id: input.accessPolicyId,
        tenantId: input.tenantId,
        accessType: "EMAIL_INVITE"
      }
    });

    if (!policy) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Access policy must be of type EMAIL_INVITE"
      });
    }

    const expiresAt = input.expiresAt || new Date(Date.now() + 72 * 60 * 60 * 1000);

    // Filter out emails that already have pending invitations
    const existingEmails = await this.prisma.invitation.findMany({
      where: {
        poolId: input.poolId,
        email: { in: input.emails.map((e) => e.toLowerCase()) },
        status: "PENDING"
      },
      select: { email: true }
    });

    const existingEmailSet = new Set(existingEmails.map((inv: { email: string }) => inv.email));
    const newEmails = input.emails.filter((email) => !existingEmailSet.has(email.toLowerCase()));

    if (newEmails.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "All emails already have active invitations"
      });
    }

    // Create invitations
    const invitations = newEmails.map((email) => ({
      poolId: input.poolId,
      accessPolicyId: input.accessPolicyId,
      tenantId: input.tenantId,
      email: email.toLowerCase(),
      token: this.generateToken(),
      expiresAt,
      status: "PENDING" as InvitationStatus
    }));

    await this.prisma.invitation.createMany({
      data: invitations
    });

    // Return created invitations
    return this.prisma.invitation.findMany({
      where: {
        poolId: input.poolId,
        email: { in: newEmails.map((e) => e.toLowerCase()) },
        status: "PENDING"
      }
    });
  }

  /**
   * Get invitation by token
   */
  async getByToken(token: string, tenantId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        token,
        tenantId
      },
      include: {
        pool: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    if (!invitation) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invitation not found"
      });
    }

    return invitation;
  }

  /**
   * List invitations for a pool
   */
  async listByPool(poolId: string, tenantId: string) {
    return this.prisma.invitation.findMany({
      where: {
        poolId,
        tenantId
      },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Resend invitation (increment sent count)
   */
  async resend(invitationId: string, tenantId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        id: invitationId,
        tenantId
      }
    });

    if (!invitation) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invitation not found"
      });
    }

    if (invitation.status === "ACCEPTED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invitation has already been accepted"
      });
    }

    if (invitation.status === "EXPIRED" || (invitation.expiresAt && invitation.expiresAt < new Date())) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invitation has expired"
      });
    }

    return this.prisma.invitation.update({
      where: { id: invitationId },
      data: {
        sentCount: { increment: 1 },
        lastSentAt: new Date()
      }
    });
  }

  /**
   * Mark invitation as accepted
   */
  async markAccepted(invitationId: string, tenantId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        id: invitationId,
        tenantId
      }
    });

    if (!invitation) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invitation not found"
      });
    }

    return this.prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date()
      }
    });
  }

  /**
   * Get invitation stats for a pool
   */
  async getStats(poolId: string, tenantId: string) {
    const invitations = await this.prisma.invitation.findMany({
      where: {
        poolId,
        tenantId
      },
      select: {
        status: true,
        sentCount: true
      }
    });

    return {
      total: invitations.length,
      pending: invitations.filter((inv: { status: string }) => inv.status === "PENDING").length,
      accepted: invitations.filter((inv: { status: string }) => inv.status === "ACCEPTED").length,
      expired: invitations.filter((inv: { status: string }) => inv.status === "EXPIRED").length,
      totalSent: invitations.reduce((sum: number, inv: { sentCount: number }) => sum + inv.sentCount, 0)
    };
  }
}
