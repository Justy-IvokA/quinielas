import type { PrismaClient, CodeBatch, InviteCode, CodeBatchStatus, InviteCodeStatus } from "@qp/db";
import { TRPCError } from "@trpc/server";

export interface CreateCodeBatchInput {
  accessPolicyId: string;
  tenantId: string;
  name?: string;
  description?: string;
  quantity: number;
  usesPerCode?: number;
  expiresAt?: Date;
}

export class CodesService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate a random invite code
   */
  private generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate unique codes (check for duplicates)
   */
  private async generateUniqueCodes(tenantId: string, quantity: number): Promise<string[]> {
    const codes: string[] = [];
    const attempts = quantity * 3; // Allow some retries

    for (let i = 0; i < attempts && codes.length < quantity; i++) {
      const code = this.generateCode();

      // Check if code already exists in this tenant
      const existing = await this.prisma.inviteCode.findFirst({
        where: {
          tenantId,
          code
        }
      });

      if (!existing && !codes.includes(code)) {
        codes.push(code);
      }
    }

    if (codes.length < quantity) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate enough unique codes"
      });
    }

    return codes;
  }

  /**
   * Create a batch of invite codes
   */
  async createBatch(input: CreateCodeBatchInput): Promise<CodeBatch> {
    // Verify access policy is CODE type
    const policy = await this.prisma.accessPolicy.findFirst({
      where: {
        id: input.accessPolicyId,
        tenantId: input.tenantId,
        accessType: "CODE"
      }
    });

    if (!policy) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Access policy must be of type CODE"
      });
    }

    // Generate unique codes
    const codes = await this.generateUniqueCodes(input.tenantId, input.quantity);

    const usesPerCode = input.usesPerCode ?? 1;

    // Create batch with codes
    const batch = await this.prisma.codeBatch.create({
      data: {
        accessPolicyId: input.accessPolicyId,
        tenantId: input.tenantId,
        name: input.name,
        description: input.description,
        totalCodes: input.quantity,
        usedCodes: 0,
        maxUsesPerCode: usesPerCode,
        status: "UNUSED",
        codes: {
          create: codes.map((code) => ({
            tenantId: input.tenantId,
            code,
            usesPerCode,
            usedCount: 0,
            status: "UNUSED" as InviteCodeStatus,
            expiresAt: input.expiresAt
          }))
        }
      },
      include: {
        codes: true
      }
    });

    return batch;
  }

  /**
   * Get code batch by ID
   */
  async getBatchById(batchId: string, tenantId: string) {
    const batch = await this.prisma.codeBatch.findFirst({
      where: {
        id: batchId,
        tenantId
      },
      include: {
        codes: {
          orderBy: { createdAt: "asc" }
        },
        accessPolicy: {
          include: {
            pool: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    if (!batch) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Code batch not found"
      });
    }

    return batch;
  }

  /**
   * List code batches for an access policy
   */
  async listByAccessPolicy(accessPolicyId: string, tenantId: string) {
    return this.prisma.codeBatch.findMany({
      where: {
        accessPolicyId,
        tenantId
      },
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
  }

  /**
   * Validate and get invite code
   */
  async validateCode(code: string, poolId: string, tenantId: string) {
    const inviteCode = await this.prisma.inviteCode.findFirst({
      where: {
        code,
        tenantId,
        batch: {
          accessPolicy: {
            poolId
          }
        }
      },
      include: {
        batch: {
          include: {
            accessPolicy: true
          }
        }
      }
    });

    if (!inviteCode) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid invite code"
      });
    }

    // Check if expired
    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invite code has expired"
      });
    }

    // Check if paused
    if (inviteCode.status === "PAUSED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invite code is currently paused"
      });
    }

    // Check usage limit
    if (inviteCode.usedCount >= inviteCode.usesPerCode) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invite code has reached its usage limit"
      });
    }

    return inviteCode;
  }

  /**
   * Redeem a code (increment usage)
   */
  async redeemCode(codeId: string, tenantId: string) {
    const code = await this.prisma.inviteCode.findFirst({
      where: {
        id: codeId,
        tenantId
      }
    });

    if (!code) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Code not found"
      });
    }

    const newUsedCount = code.usedCount + 1;
    const newStatus: InviteCodeStatus =
      newUsedCount >= code.usesPerCode ? "USED" : "PARTIALLY_USED";

    // Update code and batch in transaction
    const [updatedCode] = await this.prisma.$transaction([
      this.prisma.inviteCode.update({
        where: { id: codeId },
        data: {
          usedCount: newUsedCount,
          status: newStatus
        }
      }),
      this.prisma.codeBatch.update({
        where: { id: code.codeBatchId },
        data: {
          usedCodes: { increment: newStatus === "USED" ? 1 : 0 }
        }
      })
    ]);

    return updatedCode;
  }

  /**
   * Get batch stats
   */
  async getBatchStats(batchId: string, tenantId: string) {
    const batch = await this.prisma.codeBatch.findFirst({
      where: {
        id: batchId,
        tenantId
      },
      include: {
        codes: {
          select: {
            status: true,
            usedCount: true
          }
        }
      }
    });

    if (!batch) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Batch not found"
      });
    }

    const codes = batch.codes;

    return {
      totalCodes: batch.totalCodes,
      unusedCodes: codes.filter((c) => c.status === "UNUSED").length,
      partiallyUsedCodes: codes.filter((c) => c.status === "PARTIALLY_USED").length,
      usedCodes: codes.filter((c) => c.status === "USED").length,
      expiredCodes: codes.filter((c) => c.status === "EXPIRED").length,
      pausedCodes: codes.filter((c) => c.status === "PAUSED").length,
      totalRedemptions: codes.reduce((sum, c) => sum + c.usedCount, 0)
    };
  }

  /**
   * Pause/unpause a code batch
   */
  async toggleBatchStatus(batchId: string, tenantId: string, pause: boolean) {
    const batch = await this.prisma.codeBatch.findFirst({
      where: {
        id: batchId,
        tenantId
      }
    });

    if (!batch) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Batch not found"
      });
    }

    const newStatus: CodeBatchStatus = pause ? "PAUSED" : batch.status === "PAUSED" ? "UNUSED" : batch.status;

    return this.prisma.codeBatch.update({
      where: { id: batchId },
      data: { status: newStatus }
    });
  }

  /**
   * Export codes as CSV data
   */
  async exportBatchCodes(batchId: string, tenantId: string): Promise<string> {
    const batch = await this.getBatchById(batchId, tenantId);

    const headers = ["Code", "Status", "Used Count", "Uses Per Code", "Expires At"];
    const rows = batch.codes.map((code: InviteCode) => [
      code.code,
      code.status,
      code.usedCount.toString(),
      code.usesPerCode.toString(),
      code.expiresAt ? code.expiresAt.toISOString() : "Never"
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    return csv;
  }
}
