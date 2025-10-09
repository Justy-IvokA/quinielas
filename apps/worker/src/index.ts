import { lockPredictionsJob } from "./jobs/lock-predictions";
import { syncFixturesJob } from "./jobs/sync-fixtures";
import { scoreFinalJob } from "./jobs/score-final";
import { leaderboardSnapshotJob } from "./jobs/leaderboard-snapshot";

console.log("🚀 Worker starting...");

// Schedule lock predictions job (every minute)
setInterval(async () => {
  try {
    await lockPredictionsJob();
  } catch (error) {
    console.error("[Worker] Error in lockPredictionsJob:", error);
  }
}, 60 * 1000); // Every 1 minute

// Schedule scoring job (every 5 minutes)
setInterval(async () => {
  try {
    await scoreFinalJob();
  } catch (error) {
    console.error("[Worker] Error in scoreFinalJob:", error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Schedule leaderboard snapshot job (every 10 minutes)
setInterval(async () => {
  try {
    await leaderboardSnapshotJob();
  } catch (error) {
    console.error("[Worker] Error in leaderboardSnapshotJob:", error);
  }
}, 10 * 60 * 1000); // Every 10 minutes

// Schedule fixtures sync job (every 15 minutes)
setInterval(async () => {
  try {
    // Get active seasons that need syncing
    // This is a placeholder - in production, you'd query for seasons that need updates
    console.log("[Worker] Fixtures sync scheduled (placeholder)");
  } catch (error) {
    console.error("[Worker] Error in syncFixturesJob:", error);
  }
}, 15 * 60 * 1000); // Every 15 minutes

console.log("✅ Worker jobs scheduled successfully");
console.log("  - Lock predictions: every 1 minute");
console.log("  - Score finals: every 5 minutes");
console.log("  - Leaderboard snapshots: every 10 minutes");
console.log("  - Fixtures sync: every 15 minutes");

// Keep process alive
process.on("SIGINT", () => {
  console.log("👋 Worker shutting down...");
  process.exit(0);
});

// Export jobs for manual triggering
export { lockPredictionsJob, syncFixturesJob, scoreFinalJob, leaderboardSnapshotJob };
