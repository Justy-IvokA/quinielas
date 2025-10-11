# Fixtures, Predictions & Leaderboard Implementation

## Overview
Complete implementation of fixtures sync, predictions with locking UX, and live leaderboard for Quinielas WL platform.

## Components Implemented

### 1. API-Football Provider (`packages/utils/src/sports/api-football.ts`)
**Features:**
- ✅ Full API-Football integration (API-Sports v3 direct endpoint)
- ✅ Retry logic with exponential backoff (3 retries, configurable)
- ✅ Rate-limit handling (429 status)
- ✅ Batch fetching for results (20 matches per batch)
- ✅ Status mapping (NS/TBD → SCHEDULED, 1H/2H/HT → LIVE, FT → FINISHED)
- ✅ Round and matchday parsing from API response

**Usage:**
```typescript
import { getSportsProvider } from "@qp/utils";

const provider = getSportsProvider({
  provider: "api-football",
  apiKey: process.env.SPORTS_API_KEY
});

const season = await provider.fetchSeason({
  competitionExternalId: "1", // World Cup
  year: 2026
});

const results = await provider.fetchResults({
  matchExternalIds: ["100", "101", "102"]
});
```

**Environment Variables:**
```env
SPORTS_PROVIDER=api-football
SPORTS_API_KEY=your-api-sports-key-here
```

**Important:** Get your API key from https://dashboard.api-football.com/ (NOT RapidAPI)

---

### 2. Cache Layer (`packages/api/src/lib/cache.ts`)
**Features:**
- ✅ LRU in-memory cache with TTL
- ✅ Separate caches for providers (60s), leaderboard (30s), fixtures (60s)
- ✅ Pattern-based invalidation
- ✅ Helper functions for cache key generation

**Usage:**
```typescript
import { providerCache, leaderboardCache, cacheKey, invalidatePoolCaches } from "@qp/api/lib/cache";

// Set cache
const key = cacheKey("season", seasonId, "fixtures");
providerCache.set(key, data, 60); // 60s TTL

// Get cache
const cached = providerCache.get(key);

// Invalidate all caches for a pool
invalidatePoolCaches(poolId);
```

---

### 3. tRPC Routers

#### Predictions Router (`packages/api/src/routers/predictions/`)
**Endpoints:**
- `predictions.getByPool` - Get user's predictions for a pool
- `predictions.save` - Create/update single prediction
- `predictions.bulkSave` - Save multiple predictions at once
- `predictions.delete` - Delete prediction (only if not locked)

**Access Control:**
- ✅ Requires authentication
- ✅ Requires pool registration
- ✅ Validates match lock status
- ✅ Validates kickoff time (client + server)
- ✅ Score validation (0-99)

**Example:**
```typescript
// Save single prediction
const prediction = await trpc.predictions.save.mutate({
  poolId: "pool-123",
  matchId: "match-456",
  homeScore: 2,
  awayScore: 1
});

// Bulk save
const result = await trpc.predictions.bulkSave.mutate({
  poolId: "pool-123",
  predictions: [
    { matchId: "match-1", homeScore: 2, awayScore: 1 },
    { matchId: "match-2", homeScore: 1, awayScore: 1 }
  ]
});
```

#### Leaderboard Router (`packages/api/src/routers/leaderboard/`)
**Endpoints:**
- `leaderboard.get` - Get live or snapshot leaderboard
- `leaderboard.getSnapshots` - Get historical snapshots

**Features:**
- ✅ Live computation from predictions
- ✅ Snapshot fallback (if < 60s old)
- ✅ Pagination support
- ✅ Cached results (15-30s TTL)
- ✅ Rank calculation with tie-breakers
- ✅ Stats: total points, exact count, sign count

**Example:**
```typescript
const leaderboard = await trpc.leaderboard.get.query({
  poolId: "pool-123",
  useLive: true,
  limit: 100,
  offset: 0
});

// Returns:
// {
//   poolId: string,
//   isLive: boolean,
//   isFinal: boolean,
//   snapshotAt: Date | null,
//   entries: Array<{
//     rank: number,
//     userId: string,
//     userName: string,
//     totalPoints: number,
//     exactCount: number,
//     signCount: number,
//     predictionsCount: number
//   }>,
//   total: number
// }
```

---

### 4. Worker Jobs

#### Sync Fixtures Job (`apps/worker/src/jobs/sync-fixtures.ts`)
**Features:**
- ✅ Fetches season data from provider
- ✅ Upserts teams with external mappings
- ✅ Creates TeamSeason records
- ✅ Upserts matches with status/scores
- ✅ Idempotent (safe to re-run)
- ✅ Detailed logging

**Usage:**
```typescript
import { syncFixturesJob } from "./jobs/sync-fixtures";

const result = await syncFixturesJob({
  seasonId: "season-123",
  competitionExternalId: "1", // World Cup
  year: 2026,
  providerName: "api-football", // optional, reads from env
  apiKey: "your-key" // optional, reads from env
});

// Returns:
// {
//   seasonId: string,
//   syncedCount: number,
//   errorCount: number,
//   totalFixtures: number,
//   totalTeams: number
// }
```

**Run via CLI:**
```bash
cd apps/worker
pnpm tsx src/index.ts sync-fixtures --seasonId=season-123 --competitionId=1 --year=2026
```

#### Score Final Job (`apps/worker/src/jobs/score-final.ts`)
**Features:**
- ✅ Finds finished matches with unscored predictions
- ✅ Applies pool rule set (exact=5, sign=3, diff=1)
- ✅ Updates prediction.awardedPoints and isExact
- ✅ Creates ScoreAudit records
- ✅ Deterministic and auditable

**Already implemented** - no changes needed.

#### Lock Predictions Job (`apps/worker/src/jobs/lock-predictions.ts`)
**Features:**
- ✅ Locks matches at kickoff time
- ✅ Prevents late predictions

**Already implemented** - no changes needed.

---

### 5. Admin UI (`apps/admin/app/[locale]/fixtures/`)
**Features:**
- ✅ View upcoming and live matches
- ✅ Sync fixtures button with toast feedback
- ✅ Match status badges (locked, open, live)
- ✅ Predictions count per match
- ✅ Tabs for upcoming/live matches

**Already implemented** - uses existing `FixturesManager` component.

---

### 6. Web UI - Fixtures & Predictions (`apps/web/app/[locale]/pool/[poolSlug]/fixtures/`)
**Features:**
- ✅ Registration check with friendly error
- ✅ Grouped by date
- ✅ Lock indicators with countdown
- ✅ Score inputs (disabled when locked)
- ✅ Individual save + bulk save
- ✅ Optimistic UI with error rollback
- ✅ Auto-refresh every 60s
- ✅ Team logos and names
- ✅ Live scores display
- ✅ Status badges (open, locked, live, finished)

**Access Control:**
- Requires authentication → redirect to sign-in
- Requires registration → CTA to join pool
- Public pools show read-only fixtures

**UX:**
- Lock icon + countdown tooltip
- Sonner toasts for save success/error
- Disabled inputs for locked/started matches
- Real-time status updates via polling

---

### 7. Web UI - Leaderboard (`apps/web/app/[locale]/pool/[poolSlug]/leaderboard/`)
**Features:**
- ✅ Live leaderboard with auto-refresh (30s)
- ✅ Rank badges (gold/silver/bronze for top 3)
- ✅ Trophy icons for podium
- ✅ Stats: points, exact, sign, predictions count
- ✅ Live/Final badges
- ✅ Snapshot history tab
- ✅ Pagination support
- ✅ Refresh button

**Tie-breakers (from scoring engine):**
1. Total points
2. More exact scores
3. More correct signs
4. Premium match points (if applicable)

---

## Database Schema (Relevant Tables)

### Match
```prisma
model Match {
  id           String      @id @default(cuid())
  seasonId     String
  round        Int?
  matchday     Int?
  status       MatchStatus @default(SCHEDULED)
  kickoffTime  DateTime
  homeTeamId   String
  awayTeamId   String
  homeScore    Int?
  awayScore    Int?
  venue        String?
  locked       Boolean     @default(false)
  finishedAt   DateTime?
  
  predictions Prediction[]
}
```

### Prediction
```prisma
model Prediction {
  id           String    @id @default(cuid())
  matchId      String
  poolId       String
  userId       String
  tenantId     String
  homeScore    Int
  awayScore    Int
  awardedPoints Int      @default(0)
  isExact      Boolean   @default(false)
  
  @@unique([matchId, poolId, userId])
}
```

### LeaderboardSnapshot
```prisma
model LeaderboardSnapshot {
  id        String   @id @default(cuid())
  poolId    String
  tenantId  String
  createdAt DateTime @default(now())
  data      Json
}
```

---

## Scoring Rules (Baseline)

**Default Rule Set:**
- Exact score: **5 points**
- Correct sign (1X2): **3 points**
- Goal difference bonus: **1 point** (only if sign is correct)

**Example:**
- Prediction: 2-1, Result: 2-1 → **5 points** (exact)
- Prediction: 2-1, Result: 3-2 → **4 points** (sign + diff)
- Prediction: 2-1, Result: 1-0 → **3 points** (sign only)
- Prediction: 2-1, Result: 1-2 → **0 points** (wrong)

---

## Testing

### Unit Tests
```bash
# Test API-Football provider
cd packages/utils
pnpm test src/sports/api-football.test.ts

# Test scoring engine
cd packages/scoring
pnpm test

# Test predictions logic
cd packages/api
pnpm test src/routers/predictions/predictions.test.ts
```

### Integration Tests (Manual)
1. **Sync fixtures:**
   ```bash
   cd apps/worker
   pnpm tsx src/index.ts sync-fixtures --seasonId=<id> --competitionId=1 --year=2026
   ```

2. **Register to pool:**
   - Navigate to `/pool/demo-pool/register`
   - Complete registration

3. **Make predictions:**
   - Navigate to `/pool/demo-pool/fixtures`
   - Enter scores for upcoming matches
   - Click "Save All"

4. **Lock predictions:**
   - Wait for kickoff or run lock job manually
   - Verify inputs are disabled

5. **Score matches:**
   - Update match results (admin or worker)
   - Run score-final job
   - Check leaderboard updates

6. **View leaderboard:**
   - Navigate to `/pool/demo-pool/leaderboard`
   - Verify live updates
   - Check rankings and stats

---

## Deployment Checklist

### Environment Variables
```env
# Sports Provider
SPORTS_PROVIDER=api-football
SPORTS_API_KEY=your-rapidapi-key

# Database
DATABASE_URL=postgresql://...

# Auth (if using NextAuth)
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret
```

### Cron Jobs (Production)
```yaml
# Sync fixtures daily
0 0 * * * cd /app/worker && pnpm tsx src/index.ts sync-fixtures

# Lock predictions every 5 minutes
*/5 * * * * cd /app/worker && pnpm tsx src/index.ts lock-predictions

# Score finished matches every 10 minutes
*/10 * * * * cd /app/worker && pnpm tsx src/index.ts score-final

# Create leaderboard snapshots hourly
0 * * * * cd /app/worker && pnpm tsx src/index.ts leaderboard-snapshot
```

### Performance Considerations
- Cache TTLs tuned for balance (30-60s)
- Leaderboard computed live for < 1000 users
- Snapshots for historical data
- Batch provider requests (20 matches)
- Indexes on: `Match.seasonId`, `Match.status`, `Prediction.userId`, `Prediction.poolId`

---

## Next Steps / Future Enhancements

1. **Real-time updates** - WebSocket/SSE for live scores
2. **Push notifications** - Match starting, results available
3. **Advanced analytics** - User stats, head-to-head
4. **Premium matches** - Multiplier for finals/semis
5. **Tie-breaker questions** - Custom questions for final tie-break
6. **Mobile app** - React Native with same tRPC backend
7. **Multi-sport** - Basketball, baseball adapters
8. **Gamification** - Badges, achievements, streaks

---

## Support & Troubleshooting

### Common Issues

**"Cannot save prediction: match has started"**
- Match kickoff has passed or match is locked
- Check system time sync
- Verify match.kickoffTime in database

**"You must be registered for this pool"**
- User not in Registration table
- Complete registration flow first

**"API-Football rate limit exceeded"**
- Free tier: 100 requests/day
- Implement request queuing
- Use mock provider for development

**Leaderboard not updating**
- Check cache TTL (30s default)
- Verify score-final job ran
- Check predictions.awardedPoints values

### Debug Commands
```bash
# Check match lock status
psql -c "SELECT id, kickoffTime, locked, status FROM Match WHERE seasonId='...';"

# Check predictions
psql -c "SELECT userId, matchId, homeScore, awayScore, awardedPoints FROM Prediction WHERE poolId='...';"

# Check leaderboard cache
# (in Node REPL)
const { leaderboardCache } = require("@qp/api/lib/cache");
console.log(leaderboardCache.size());
```

---

## License & Credits
Part of Quinielas WL platform by Victor Mancera (Agencia).
Built with Next.js, tRPC, Prisma, and Tailwind CSS.
