/**
 * Job runner for manual execution
 * Usage: pnpm worker run <job-name> [args]
 */

import { lockPredictionsJob } from "./jobs/lock-predictions";
import { syncFixturesJob } from "./jobs/sync-fixtures";
import { scoreFinalJob } from "./jobs/score-final";
import { leaderboardSnapshotJob } from "./jobs/leaderboard-snapshot";
import { purgeInvitations } from "./jobs/purge-invitations";
import { purgeAuditLogs } from "./jobs/purge-audit-logs";
import { purgeTokens } from "./jobs/purge-tokens";

const jobs = {
  "lock-predictions": lockPredictionsJob,
  "sync-fixtures": syncFixturesJob,
  "score-final": scoreFinalJob,
  "leaderboard-snapshot": leaderboardSnapshotJob,
  "purge-invitations": purgeInvitations,
  "purge-audit-logs": purgeAuditLogs,
  "purge-tokens": purgeTokens,
};

async function runJob(jobName: string, args: string[]) {
  const job = jobs[jobName as keyof typeof jobs];

  if (!job) {
    console.error(`❌ Unknown job: ${jobName}`);
    console.log("\nAvailable jobs:");
    Object.keys(jobs).forEach((name) => console.log(`  - ${name}`));
    process.exit(1);
  }

  console.log(`🏃 Running job: ${jobName}`);
  console.log(`📋 Args:`, args);

  try {
    // Type-safe job execution
    const result = await (job as (...args: any[]) => Promise<any>)(...args);
    console.log(`✅ Job completed successfully`);
    console.log(`📊 Result:`, result);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Job failed:`, error);
    process.exit(1);
  }
}

// Parse command line arguments
const [, , jobName, ...args] = process.argv;

if (!jobName) {
  console.error("❌ Usage: pnpm worker run <job-name> [args]");
  console.log("\nAvailable jobs:");
  Object.keys(jobs).forEach((name) => console.log(`  - ${name}`));
  process.exit(1);
}

runJob(jobName, args);
