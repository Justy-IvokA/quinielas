import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env file
config({ path: resolve(__dirname, "../.env") });

import { lockPredictionsJob } from "./jobs/lock-predictions";
import { syncFixturesJob } from "./jobs/sync-fixtures";
import { autoSyncFixturesJob } from "./jobs/auto-sync-fixtures";
import { scoreFinalJob } from "./jobs/score-final";
import { leaderboardSnapshotJob } from "./jobs/leaderboard-snapshot";

console.log("🚀 Worker starting...");
console.log(`📊 Sports Provider: ${process.env.SPORTS_PROVIDER || "mock"}`);
console.log(`🔑 API Key configured: ${process.env.SPORTS_API_KEY ? "✅ Yes" : "❌ No"}`);

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

// Schedule auto fixtures sync job (every 6 hours)
setInterval(async () => {
  try {
    await autoSyncFixturesJob();
  } catch (error) {
    console.error("[Worker] Error in autoSyncFixturesJob:", error);
  }
}, 6 * 60 * 60 * 1000); // Every 6 hours

// Run auto sync on startup (after 30 seconds)
setTimeout(async () => {
  try {
    console.log("[Worker] Running initial fixtures sync...");
    await autoSyncFixturesJob();
  } catch (error) {
    console.error("[Worker] Error in initial autoSyncFixturesJob:", error);
  }
}, 30 * 1000);

console.log("✅ Worker jobs scheduled successfully");
console.log("  - Lock predictions: every 1 minute");
console.log("  - Score finals: every 5 minutes");
console.log("  - Leaderboard snapshots: every 10 minutes");
console.log("  - Auto fixtures sync: every 6 hours (+ on startup)");

// Keep process alive
process.on("SIGINT", () => {
  console.log("👋 Worker shutting down...");
  process.exit(0);
});

// Export jobs for manual triggering
export { lockPredictionsJob, syncFixturesJob, scoreFinalJob, leaderboardSnapshotJob };
