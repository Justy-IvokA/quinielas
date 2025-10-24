import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env file
config({ path: resolve(__dirname, "../.env") });

import { lockPredictionsJob } from "./jobs/lock-predictions";
import { syncFixturesJob } from "./jobs/sync-fixtures";
import { autoSyncFixturesJob } from "./jobs/auto-sync-fixtures";
import { updateLiveMatchesJob } from "./jobs/update-live-matches";
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

// Schedule live matches update job (every 5 minutes)
setInterval(async () => {
  try {
    await updateLiveMatchesJob();
  } catch (error) {
    console.error("[Worker] Error in updateLiveMatchesJob:", error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Schedule scoring job (every 5 minutes, offset by 2 minutes)
setTimeout(() => {
  setInterval(async () => {
    try {
      await scoreFinalJob();
    } catch (error) {
      console.error("[Worker] Error in scoreFinalJob:", error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}, 2 * 60 * 1000); // Start after 2 minutes

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

// Run initial updates on startup
setTimeout(async () => {
  try {
    console.log("[Worker] Running initial live matches update...");
    await updateLiveMatchesJob();
  } catch (error) {
    console.error("[Worker] Error in initial updateLiveMatchesJob:", error);
  }
}, 10 * 1000); // After 10 seconds

setTimeout(async () => {
  try {
    console.log("[Worker] Running initial scoring...");
    await scoreFinalJob();
  } catch (error) {
    console.error("[Worker] Error in initial scoreFinalJob:", error);
  }
}, 15 * 1000); // After 15 seconds

setTimeout(async () => {
  try {
    console.log("[Worker] Running initial fixtures sync...");
    await autoSyncFixturesJob();
  } catch (error) {
    console.error("[Worker] Error in initial autoSyncFixturesJob:", error);
  }
}, 30 * 1000); // After 30 seconds

console.log("✅ Worker jobs scheduled successfully");
console.log("  - Lock predictions: every 1 minute");
console.log("  - Update live matches: every 5 minutes (+ on startup)");
console.log("  - Score finals: every 5 minutes (+ on startup, offset 2min)");
console.log("  - Leaderboard snapshots: every 10 minutes");
console.log("  - Auto fixtures sync: every 6 hours (+ on startup)");

// Keep process alive
process.on("SIGINT", () => {
  console.log("👋 Worker shutting down...");
  process.exit(0);
});

// Export jobs for manual triggering
export { 
  lockPredictionsJob, 
  syncFixturesJob, 
  updateLiveMatchesJob,
  scoreFinalJob, 
  leaderboardSnapshotJob 
};
