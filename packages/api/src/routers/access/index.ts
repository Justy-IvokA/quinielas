import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@qp/db";
import { buildInvitationUrl } from "../../lib/host-tenant";

import { publicProcedure, router } from "../../trpc";
import {
  createAccessPolicySchema,
  createCodeBatchSchema,
  createEmailInvitationSchema,
  updateAccessPolicySchema,
  upsertAccessPolicySchema,
  uploadInvitationsCsvSchema,
  sendInvitationsSchema,
  invitationStatsSchema,
  codeStatsSchema,
  downloadCodesSchema
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

  // Upsert access policy (create or update)
  upsert: publicProcedure.input(upsertAccessPolicySchema).mutation(async ({ input }) => {
    const { poolId, tenantId, ...data } = input;

    const existing = await prisma.accessPolicy.findUnique({
      where: { poolId }
    });

    if (existing) {
      return prisma.accessPolicy.update({
        where: { poolId },
        data
      });
    }

    return prisma.accessPolicy.create({
      data: {
        poolId,
        tenantId,
        ...data
      }
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
    const { accessPolicyId, tenantId, name, prefix, quantity, usesPerCode, description, metadata, validFrom, validTo, expiresAt } = input;

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
      code: prefix ? `${prefix}-${generateInviteCode()}` : generateInviteCode(),
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
        prefix,
        description,
        metadata,
        validFrom,
        validTo,
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
    const { poolId, accessPolicyId, tenantId, brandId, email, expiresAt } = input;

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

    // Get brand and pool info to build invitation URL
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { tenant: true }
    });

    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      select: { slug: true }
    });

    if (!brand || !pool) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Brand or pool not found"
      });
    }

    // Build invitation URL with correct subdomain
    const invitationUrl = buildInvitationUrl(brand as any, pool.slug, token);

    const invitation = await prisma.invitation.create({
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

    // TODO: Send email with invitationUrl using email adapter
    // For now, just log the URL
    console.log(`[access] Invitation URL for ${email}: ${invitationUrl}`);

    return invitation;
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
  resendEmailInvitation: publicProcedure
    .input(z.object({ 
      id: z.string().cuid(),
      brandId: z.string().cuid()
    }))
    .mutation(async ({ input }) => {
      const invitation = await prisma.invitation.findUnique({
        where: { id: input.id },
        include: {
          pool: {
            select: { slug: true, name: true }
          }
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
          message: "Invitation already accepted"
        });
      }

      // Get brand info
      const brand = await prisma.brand.findUnique({
        where: { id: input.brandId },
        include: { tenant: true }
      });

      if (!brand) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand not found"
        });
      }

      // Build invitation URL
      const invitationUrl = buildInvitationUrl(brand as any, invitation.pool.slug, invitation.token);

      // TODO: Send email with invitationUrl
      console.log(`[access] Resending invitation to ${invitation.email}: ${invitationUrl}`);

      // Update sent count and timestamp
      return prisma.invitation.update({
        where: { id: input.id },
        data: {
          sentCount: { increment: 1 },
          lastSentAt: new Date()
        }
      });
    }),

  // Upload CSV of email invitations
  uploadInvitationsCsv: publicProcedure.input(uploadInvitationsCsvSchema).mutation(async ({ input }) => {
    const { poolId, accessPolicyId, tenantId, brandId, emails, expiresAt } = input;

    const policy = await prisma.accessPolicy.findUnique({
      where: { id: accessPolicyId }
    });

    if (!policy || policy.accessType !== "EMAIL_INVITE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Access policy must be of type EMAIL_INVITE"
      });
    }

    // Check for duplicates within the batch
    const uniqueEmails = [...new Set(emails)];
    if (uniqueEmails.length !== emails.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Duplicate emails found in CSV"
      });
    }

    // Check for existing invitations
    const existing = await prisma.invitation.findMany({
      where: {
        poolId,
        email: { in: uniqueEmails }
      },
      select: { email: true }
    });

    if (existing.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Some emails already have invitations: ${existing.map((e: { email: string }) => e.email).join(", ")}`
      });
    }

    // Get brand and pool info
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { tenant: true }
    });

    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      select: { slug: true }
    });

    if (!brand || !pool) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Brand or pool not found"
      });
    }

    // Create invitations in batch
    const invitations = uniqueEmails.map(email => {
      const token = generateInviteToken();
      const invitationUrl = buildInvitationUrl(brand as any, pool.slug, token);
      
      // TODO: Queue email sending with invitationUrl
      console.log(`[access] Invitation URL for ${email}: ${invitationUrl}`);
      
      return {
        poolId,
        accessPolicyId,
        tenantId,
        email,
        token,
        status: "PENDING" as const,
        expiresAt: expiresAt || new Date(Date.now() + 72 * 60 * 60 * 1000)
      };
    });

    await prisma.invitation.createMany({
      data: invitations
    });

    return {
      created: invitations.length,
      emails: uniqueEmails
    };
  }),

  // Send invitations (all or specific IDs)
  sendInvitations: publicProcedure.input(sendInvitationsSchema).mutation(async ({ input }) => {
    const { poolId, tenantId, brandId, invitationIds } = input;

    // Get brand and pool info
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { tenant: true }
    });

    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      select: { slug: true, name: true }
    });

    if (!brand || !pool) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Brand or pool not found"
      });
    }

    const where = invitationIds
      ? { id: { in: invitationIds }, poolId, tenantId }
      : { poolId, tenantId, status: "PENDING" as const };

    const invitations = await prisma.invitation.findMany({
      where,
      select: { id: true, email: true, status: true, token: true }
    });

    if (invitations.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No invitations found to send"
      });
    }

    // Build invitation URLs for each invitation
    const invitationsWithUrls = invitations.map((inv: { id: string; email: string; token: string }) => ({
      ...inv,
      url: buildInvitationUrl(brand as any, pool.slug, inv.token)
    }));

    // Update sent count and timestamp
    await prisma.invitation.updateMany({
      where: { id: { in: invitations.map((i: { id: string }) => i.id) } },
      data: {
        sentCount: { increment: 1 },
        lastSentAt: new Date()
      }
    });

    // TODO: Integrate with email service (EmailAdapter)
    // Send emails with correct subdomain URLs
    invitationsWithUrls.forEach((inv) => {
      console.log(`[access] Sending invitation to ${inv.email}: ${inv.url}`);
      // emailAdapter.send({
      //   to: inv.email,
      //   ...emailTemplates.invitation({
      //     poolName: pool.name,
      //     inviteUrl: inv.url,
      //     expiresAt: ...,
      //     brandName: brand.name
      //   })
      // });
    });

    return {
      sent: invitations.length,
      emails: invitations.map((i: { email: string }) => i.email)
    };
  }),

  // Get invitation statistics
  invitationStats: publicProcedure.input(invitationStatsSchema).query(async ({ input }) => {
    const { poolId, tenantId } = input;

    const stats = await prisma.invitation.groupBy({
      by: ["status"],
      where: { poolId, tenantId },
      _count: true
    });

    const total = stats.reduce((sum: number, s: { _count: number }) => sum + s._count, 0);
    const pending = stats.find((s: { status: string, _count: number }) => s.status === "PENDING")?._count || 0;
    const accepted = stats.find((s: { status: string, _count: number }) => s.status === "ACCEPTED")?._count || 0;
    const expired = stats.find((s: { status: string, _count: number }) => s.status === "EXPIRED")?._count || 0;

    // Count invitations with tracking data
    const opened = await prisma.invitation.count({
      where: { poolId, tenantId, openedAt: { not: null } }
    });

    const clicked = await prisma.invitation.count({
      where: { poolId, tenantId, clickedAt: { not: null } }
    });

    const bounced = await prisma.invitation.count({
      where: { poolId, tenantId, bouncedAt: { not: null } }
    });

    const sent = await prisma.invitation.count({
      where: { poolId, tenantId, lastSentAt: { not: null } }
    });

    return {
      total,
      pending,
      accepted,
      expired,
      sent,
      opened,
      clicked,
      bounced,
      activationRate: total > 0 ? Math.round((accepted / total) * 10000) / 100 : 0,
      openRate: sent > 0 ? Math.round((opened / sent) * 10000) / 100 : 0,
      clickRate: sent > 0 ? Math.round((clicked / sent) * 10000) / 100 : 0
    };
  }),

  // Get code statistics
  codeStats: publicProcedure.input(codeStatsSchema).query(async ({ input }) => {
    const { poolId, tenantId } = input;

    // Get access policy for this pool
    const policy = await prisma.accessPolicy.findUnique({
      where: { poolId },
      select: { id: true }
    });

    if (!policy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Access policy not found"
      });
    }

    // Get all batches for this policy
    const batches = await prisma.codeBatch.findMany({
      where: { accessPolicyId: policy.id, tenantId },
      include: {
        codes: {
          select: {
            status: true,
            usedCount: true,
            usesPerCode: true
          }
        }
      }
    });

    const totalCodes = batches.reduce((sum: number, b: { totalCodes: number }) => sum + b.totalCodes, 0);
    const usedCodes = batches.reduce((sum: number, b: { usedCodes: number }) => sum + b.usedCodes, 0);

    // Count by status
    let unused = 0;
    let partiallyUsed = 0;
    let used = 0;
    let expired = 0;

    batches.forEach((batch: { codes: { status: string }[] }) => {
      batch.codes.forEach((code: { status: string }) => {
        if (code.status === "UNUSED") unused++;
        else if (code.status === "PARTIALLY_USED") partiallyUsed++;
        else if (code.status === "USED") used++;
        else if (code.status === "EXPIRED") expired++;
      });
    });

    // Total redemptions
    const totalRedemptions = batches.reduce((sum: number, b: { codes: { usedCount: number }[] }) => 
      sum + b.codes.reduce((codeSum: number, c: { usedCount: number }) => codeSum + c.usedCount, 0), 0
    );

    return {
      totalBatches: batches.length,
      totalCodes,
      usedCodes,
      unused,
      partiallyUsed,
      used,
      expired,
      totalRedemptions,
      redemptionRate: totalCodes > 0 ? Math.round((usedCodes / totalCodes) * 10000) / 100 : 0
    };
  }),

  // Download codes CSV
  downloadCodes: publicProcedure.input(downloadCodesSchema).query(async ({ input }) => {
    const { batchId, tenantId } = input;

    const batch = await prisma.codeBatch.findUnique({
      where: { id: batchId, tenantId },
      include: {
        codes: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!batch) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Code batch not found"
      });
    }

    // Return structured data for CSV generation
    return {
      batchName: batch.name || "Unnamed Batch",
      codes: batch.codes.map((code) => ({
        code: code.code,
        status: code.status,
        usedCount: code.usedCount,
        usesPerCode: code.usesPerCode,
        expiresAt: code.expiresAt?.toISOString() || "",
        createdAt: code.createdAt.toISOString()
      }))
    };
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
