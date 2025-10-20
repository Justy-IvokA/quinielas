/**
 * Refresh Standings Job
 * Updates cached competition standings from external API
 * Runs daily to keep standings data fresh
 */

import { refreshStaleStandings, cleanupOldStandings } from "@qp/api/services/standings";

export interface RefreshStandingsJobInput {
  olderThanHours?: number;
  cleanupOlderThanDays?: number;
}

export async function refreshStandingsJob(input: RefreshStandingsJobInput = {}) {
  const { olderThanHours = 24, cleanupOlderThanDays = 365 } = input;

  console.log("🔄 Starting refresh-standings job...");
  console.log(`📊 Configuration: olderThanHours=${olderThanHours}, cleanupOlderThanDays=${cleanupOlderThanDays}`);

  try {
    // Step 1: Refresh stale standings
    console.log(`\n📥 Step 1: Refreshing standings older than ${olderThanHours} hours...`);
    const refreshed = await refreshStaleStandings(olderThanHours);
    console.log(`✅ Refreshed ${refreshed} standings`);

    // Step 2: Cleanup old standings
    console.log(`\n🗑️  Step 2: Cleaning up standings older than ${cleanupOlderThanDays} days...`);
    const deleted = await cleanupOldStandings(cleanupOlderThanDays);
    console.log(`✅ Deleted ${deleted} old standings records`);

    console.log("\n✅ Refresh-standings job completed successfully");
    
    return {
      success: true,
      refreshed,
      deleted,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Error in refresh-standings job:", error);
    throw error;
  }
}

// Allow direct execution for testing
if (require.main === module) {
  refreshStandingsJob()
    .then((result) => {
      console.log("\n📊 Job Result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Job Failed:", error);
      process.exit(1);
    });
}
