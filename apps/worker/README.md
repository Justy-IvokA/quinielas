# Worker Jobs - Command Reference

## Overview
Background jobs for Quinielas WL platform. Handles fixtures sync, predictions locking, scoring, and leaderboard snapshots.

---

## Quick Start

### Development
```bash
cd apps/worker
pnpm install
pnpm dev
```

### Production
```bash
cd apps/worker
pnpm build
pnpm start
```

---

## Available Jobs

### 1. Sync Fixtures
Fetches season data from sports provider and syncs to database.

**Command:**
```bash
pnpm tsx src/index.ts sync-fixtures \
  --seasonId=<season-id> \
  --competitionId=<external-competition-id> \
  --year=<year>
```

**Example:**
```bash
# World Cup 2026
pnpm tsx src/index.ts sync-fixtures \
  --seasonId=clx123abc \
  --competitionId=1 \
  --year=2026

# Premier League 2024/25
pnpm tsx src/index.ts sync-fixtures \
  --seasonId=clx456def \
  --competitionId=39 \
  --year=2024
```

**What it does:**
- Fetches teams and matches from provider
- Upserts teams with external mappings
- Creates TeamSeason records
- Upserts matches with status/scores
- Creates/updates ExternalMap entries

**Output:**
```json
{
  "seasonId": "clx123abc",
  "syncedCount": 48,
  "errorCount": 0,
  "totalFixtures": 48,
  "totalTeams": 32
}
```

---

### 2. Lock Predictions
Locks predictions for matches that have started.

**Command:**
```bash
pnpm tsx src/index.ts lock-predictions
```

**What it does:**
- Finds matches where `kickoffTime <= now()` and `locked = false`
- Sets `Match.locked = true`
- Prevents new predictions from being saved

**Output:**
```json
{
  "matchesLocked": 5,
  "totalChecked": 48
}
```

**Recommended Schedule:**
```bash
# Every 5 minutes
*/5 * * * * cd /app/worker && pnpm tsx src/index.ts lock-predictions
```

---

### 3. Score Final
Calculates points for finished matches.

**Command:**
```bash
pnpm tsx src/index.ts score-final
```

**What it does:**
- Finds matches with `status = FINISHED` and unscored predictions
- Applies pool rule set (exact=5, sign=3, diff=1)
- Updates `Prediction.awardedPoints` and `isExact`
- Creates `ScoreAudit` records

**Output:**
```json
{
  "matchesScored": 3,
  "predictionsScored": 150
}
```

**Recommended Schedule:**
```bash
# Every 10 minutes
*/10 * * * * cd /app/worker && pnpm tsx src/index.ts score-final
```

---

### 4. Leaderboard Snapshot
Creates a snapshot of current leaderboard standings.

**Command:**
```bash
pnpm tsx src/index.ts leaderboard-snapshot \
  --poolId=<pool-id>
```

**Example:**
```bash
pnpm tsx src/index.ts leaderboard-snapshot \
  --poolId=clx789ghi
```

**What it does:**
- Aggregates predictions and points per user
- Generates ranked leaderboard
- Saves to `LeaderboardSnapshot` table
- Used for historical data and performance

**Output:**
```json
{
  "poolId": "clx789ghi",
  "snapshotId": "clx999jkl",
  "entriesCount": 250,
  "createdAt": "2026-06-15T20:00:00Z"
}
```

**Recommended Schedule:**
```bash
# Every hour during active season
0 * * * * cd /app/worker && pnpm tsx src/index.ts leaderboard-snapshot --poolId=clx789ghi

# Or daily for less active pools
0 0 * * * cd /app/worker && pnpm tsx src/index.ts leaderboard-snapshot --poolId=clx789ghi
```

---

## Environment Variables

Create `.env` file in `apps/worker/`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/quinielas"

# Sports Provider
SPORTS_PROVIDER=api-football  # or 'mock' for development
SPORTS_API_KEY=your-rapidapi-key-here

# Optional: Logging
LOG_LEVEL=info  # debug, info, warn, error
```

---

## Cron Setup (Production)

### Using node-cron (Recommended)

Create `apps/worker/src/scheduler.ts`:

```typescript
import cron from "node-cron";
import { syncFixturesJob } from "./jobs/sync-fixtures";
import { lockPredictionsJob } from "./jobs/lock-predictions";
import { scoreFinalJob } from "./jobs/score-final";
import { leaderboardSnapshotJob } from "./jobs/leaderboard-snapshot";

// Sync fixtures daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("[Scheduler] Running sync-fixtures...");
  await syncFixturesJob({
    seasonId: process.env.ACTIVE_SEASON_ID!,
    competitionExternalId: "1",
    year: 2026
  });
});

// Lock predictions every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("[Scheduler] Running lock-predictions...");
  await lockPredictionsJob();
});

// Score finished matches every 10 minutes
cron.schedule("*/10 * * * *", async () => {
  console.log("[Scheduler] Running score-final...");
  await scoreFinalJob();
});

// Create snapshots every hour
cron.schedule("0 * * * *", async () => {
  console.log("[Scheduler] Running leaderboard-snapshot...");
  const activePools = await getActivePools(); // Your logic
  for (const pool of activePools) {
    await leaderboardSnapshotJob({ poolId: pool.id });
  }
});

console.log("[Scheduler] All cron jobs scheduled");
```

Then run:
```bash
pnpm tsx src/scheduler.ts
```

### Using System Cron (Alternative)

Edit crontab:
```bash
crontab -e
```

Add:
```bash
# Quinielas Worker Jobs
0 0 * * * cd /app/worker && pnpm tsx src/index.ts sync-fixtures --seasonId=clx123 --competitionId=1 --year=2026
*/5 * * * * cd /app/worker && pnpm tsx src/index.ts lock-predictions
*/10 * * * * cd /app/worker && pnpm tsx src/index.ts score-final
0 * * * * cd /app/worker && pnpm tsx src/index.ts leaderboard-snapshot --poolId=clx789
```

---

## Monitoring & Logging

### View Logs
```bash
# Development
pnpm tsx src/index.ts sync-fixtures --seasonId=... 2>&1 | tee logs/sync.log

# Production (with PM2)
pm2 logs worker
```

### Success Indicators
- `[SyncFixtures] Completed. Synced: X, Errors: 0`
- `[LockPredictions] Locked X matches`
- `[ScoreFinal] Completed. Matches: X, Predictions: Y`
- `[LeaderboardSnapshot] Created snapshot with X entries`

### Error Handling
All jobs log errors to console and continue execution. Check logs for:
- `Error syncing match`
- `Error scoring prediction`
- `API-Football request failed`

---

## Troubleshooting

### Job Not Running
1. Check environment variables are set
2. Verify database connection: `pnpm tsx -e "import {prisma} from '@qp/db'; prisma.$connect()"`
3. Check cron syntax: https://crontab.guru/

### API-Football Rate Limit
```
Error: API-Football rate limit exceeded
```

**Solutions:**
- Free tier: 100 requests/day
- Use mock provider for dev: `SPORTS_PROVIDER=mock`
- Upgrade to paid tier
- Reduce sync frequency

### No Matches to Score
```
[ScoreFinal] No finished matches to score
```

**Possible causes:**
- No matches have finished yet
- Matches already scored
- Match status not set to FINISHED

**Check:**
```sql
SELECT id, status, homeScore, awayScore 
FROM "Match" 
WHERE status = 'FINISHED' 
AND homeScore IS NOT NULL;
```

### Predictions Not Locking
```
[LockPredictions] Locked 0 matches
```

**Possible causes:**
- No matches at kickoff time
- Matches already locked
- System time incorrect

**Check:**
```sql
SELECT id, kickoffTime, locked 
FROM "Match" 
WHERE kickoffTime <= NOW() 
AND locked = false;
```

---

## Testing Jobs Locally

### 1. Sync Fixtures (Mock Provider)
```bash
# Set mock provider
export SPORTS_PROVIDER=mock

# Run sync
pnpm tsx src/index.ts sync-fixtures \
  --seasonId=<your-season-id> \
  --competitionId=1 \
  --year=2026

# Verify in database
psql -c "SELECT COUNT(*) FROM \"Match\" WHERE seasonId='<your-season-id>';"
```

### 2. Lock Predictions
```bash
# Manually set a match to past kickoff
psql -c "UPDATE \"Match\" SET kickoffTime = NOW() - INTERVAL '1 minute' WHERE id='<match-id>';"

# Run lock job
pnpm tsx src/index.ts lock-predictions

# Verify
psql -c "SELECT locked FROM \"Match\" WHERE id='<match-id>';"
# Should return: locked = true
```

### 3. Score Final
```bash
# Set match to finished with scores
psql -c "UPDATE \"Match\" SET status='FINISHED', homeScore=2, awayScore=1 WHERE id='<match-id>';"

# Create a test prediction
psql -c "INSERT INTO \"Prediction\" (id, matchId, poolId, userId, tenantId, homeScore, awayScore) VALUES ('test-pred', '<match-id>', '<pool-id>', '<user-id>', '<tenant-id>', 2, 1);"

# Run score job
pnpm tsx src/index.ts score-final

# Verify points awarded
psql -c "SELECT awardedPoints, isExact FROM \"Prediction\" WHERE id='test-pred';"
# Should return: awardedPoints = 5, isExact = true
```

---

## Performance Benchmarks

### Expected Execution Times
- **sync-fixtures:** 2-5s for 48 matches (World Cup)
- **lock-predictions:** < 1s for 100 matches
- **score-final:** 1-3s for 1000 predictions
- **leaderboard-snapshot:** 2-5s for 1000 users

### Optimization Tips
1. **Batch operations** - Already implemented in sync job
2. **Indexes** - Ensure indexes on `Match.seasonId`, `Match.status`
3. **Connection pooling** - Prisma handles this
4. **Parallel processing** - For multiple pools, run in parallel

---

## API-Football Competition IDs

Common competition IDs for reference:

| Competition | ID | Season Format |
|------------|-----|---------------|
| World Cup | 1 | 2026 |
| Champions League | 2 | 2024 |
| Premier League | 39 | 2024 |
| La Liga | 140 | 2024 |
| Bundesliga | 78 | 2024 |
| Serie A | 135 | 2024 |
| Ligue 1 | 61 | 2024 |
| MLS | 253 | 2024 |
| Liga MX | 262 | 2024 |

Full list: https://www.api-football.com/documentation-v3#tag/Leagues

---

## Support

For issues:
1. Check logs for error messages
2. Verify environment variables
3. Test database connection
4. Review `FIXTURES_IMPLEMENTATION.md` for detailed docs
5. Check API-Football status: https://status.api-football.com/

---

**Happy scheduling! ⚽⏰**
