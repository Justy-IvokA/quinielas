import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@qp/db";

import { publicProcedure, router } from "../../trpc";
import {
  createAccessPolicySchema,
  createCodeBatchSchema,
  createEmailInvitationSchema,
  updateAccessPolicySchema
} from "./schema";

export const accessRouter = router({
  // Get access policy by pool ID
  getByPoolId: publicProcedure.input(z.object({ poolId: z.string().cuid() })).query(async ({ input }) => {
    const policy = await prisma.accessPolicy.findUnique({
      where: { poolId: input.poolId },
      include: {
        pool: { select: { name: true, slug: true } }
      }
    });

    if (!policy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Access policy not found for this pool"
      });
    }

    return policy;
  }),

  // Create access policy
  create: publicProcedure.input(createAccessPolicySchema).mutation(async ({ input }) => {
    const existingPolicy = await prisma.accessPolicy.findUnique({
      where: { poolId: input.poolId }
    });

    if (existingPolicy) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Access policy already exists for this pool"
      });
    }

    return prisma.accessPolicy.create({
      data: input
    });
  }),

  // Update access policy
  update: publicProcedure.input(updateAccessPolicySchema).mutation(async ({ input }) => {
    const { id, ...data } = input;

    return prisma.accessPolicy.update({
      where: { id },
      data
    });
  }),

  // Delete access policy
  delete: publicProcedure.input(z.object({ id: z.string().cuid() })).mutation(async ({ input }) => {
    return prisma.accessPolicy.delete({
      where: { id: input.id }
    });
  }),

  // Create code batch
  createCodeBatch: publicProcedure.input(createCodeBatchSchema).mutation(async ({ input }) => {
    const { accessPolicyId, tenantId, name, quantity, usesPerCode, description, expiresAt } = input;

    const policy = await prisma.accessPolicy.findUnique({
      where: { id: accessPolicyId }
    });

    if (!policy || policy.accessType !== "CODE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Access policy must be of type CODE"
      });
    }

    // Generate unique codes
    const codes = Array.from({ length: quantity }, () => ({
      tenantId,
      code: generateInviteCode(),
      usesPerCode,
      usedCount: 0,
      status: "UNUSED" as const,
      expiresAt
    }));

    const batch = await prisma.codeBatch.create({
      data: {
        accessPolicyId,
        tenantId,
        name,
        description,
        totalCodes: quantity,
        usedCodes: 0,
        maxUsesPerCode: usesPerCode,
        codes: {
          create: codes
        }
      },
      include: {
        codes: true
      }
    });

    return batch;
  }),

  // Get code batches for policy
  getCodeBatches: publicProcedure.input(z.object({ accessPolicyId: z.string().cuid() })).query(async ({ input }) => {
    return prisma.codeBatch.findMany({
      where: { accessPolicyId: input.accessPolicyId },
      include: {
        codes: {
          select: {
            id: true,
            code: true,
            status: true,
            usedCount: true,
            usesPerCode: true,
            expiresAt: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }),

  // Create email invitation
  createEmailInvitation: publicProcedure.input(createEmailInvitationSchema).mutation(async ({ input }) => {
    const { poolId, accessPolicyId, tenantId, email, expiresAt } = input;

    const policy = await prisma.accessPolicy.findUnique({
      where: { id: accessPolicyId }
    });

    if (!policy || policy.accessType !== "EMAIL_INVITE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Access policy must be of type EMAIL_INVITE"
      });
    }

    const token = generateInviteToken();

    return prisma.invitation.create({
      data: {
        poolId,
        accessPolicyId,
        tenantId,
        email,
        token,
        status: "PENDING",
        expiresAt: expiresAt || new Date(Date.now() + 72 * 60 * 60 * 1000) // 72h default
      }
    });
  }),

  // Get email invitations for policy
  getEmailInvitations: publicProcedure
    .input(z.object({ accessPolicyId: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.invitation.findMany({
        where: { accessPolicyId: input.accessPolicyId },
        orderBy: { createdAt: "desc" }
      });
    }),

  // Resend email invitation
  resendEmailInvitation: publicProcedure.input(z.object({ id: z.string().cuid() })).mutation(async ({ input }) => {
    const invitation = await prisma.invitation.findUnique({
      where: { id: input.id }
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
        message: "Invitation already accepted"
      });
    }

    // Update sent count and timestamp
    return prisma.invitation.update({
      where: { id: input.id },
      data: {
        sentCount: { increment: 1 },
        lastSentAt: new Date()
      }
    });
  })
});

// Helper functions
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateInviteToken(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}
