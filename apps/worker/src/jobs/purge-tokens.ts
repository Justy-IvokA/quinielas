/**
 * Purge expired verification tokens and invite codes
 */

import { prisma as db } from "@qp/db/client";

interface PurgeTokensResult {
  verificationTokens: number;
  inviteCodes: number;
}

/**
 * Purges expired verification tokens and used/expired invite codes
 */
export async function purgeTokens(): Promise<PurgeTokensResult> {
  console.log("[purge-tokens] Starting purge job...");

  // Get default retention from global settings or use 30 days
  const defaultTokenDays = 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - defaultTokenDays);

  // Purge expired verification tokens
  const verificationResult = await db.verificationToken.deleteMany({
    where: {
      expires: {
        lt: cutoffDate,
      },
    },
  });

  console.log(
    `[purge-tokens] Deleted ${verificationResult.count} expired verification tokens`
  );

  // Purge used/expired invite codes older than retention period
  const inviteCodesResult = await db.inviteCode.deleteMany({
    where: {
      OR: [
        {
          status: "USED",
          updatedAt: {
            lt: cutoffDate,
          },
        },
        {
          status: "EXPIRED",
          expiresAt: {
            lt: cutoffDate,
          },
        },
      ],
    },
  });

  console.log(
    `[purge-tokens] Deleted ${inviteCodesResult.count} used/expired invite codes`
  );

  const result = {
    verificationTokens: verificationResult.count,
    inviteCodes: inviteCodesResult.count,
  };

  console.log(
    `[purge-tokens] Completed. Total deleted: ${result.verificationTokens + result.inviteCodes}`
  );

  return result;
}
