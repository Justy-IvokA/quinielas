# Fixtures & Predictions Quick Start Guide

## 🚀 Getting Started (5 minutes)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Environment Variables
Create `.env` files in `apps/web`, `apps/admin`, and `apps/worker`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/quinielas"

# Sports Provider
SPORTS_PROVIDER=mock  # Use 'api-football' for production
SPORTS_API_KEY=your-api-sports-key-here  # Only needed for api-football

# Auth (NextAuth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### 3. Run Database Migrations
```bash
cd packages/db
pnpm prisma migrate dev
pnpm prisma db seed  # Creates demo data
```

### 4. Start Development Servers
```bash
# Terminal 1 - Web App
cd apps/web
pnpm dev  # http://localhost:3000

# Terminal 2 - Admin App
cd apps/admin
pnpm dev  # http://localhost:3001

# Terminal 3 - Worker (optional for dev)
cd apps/worker
pnpm dev
```

---

## 📋 Step-by-Step Workflow

### Step 1: Create a Pool (Admin)
1. Navigate to `http://localhost:3001`
2. Go to **Pools** → **Create New**
3. Fill in:
   - Name: "World Cup 2026"
   - Season: Select existing or create new
   - Access Type: PUBLIC (for testing)
4. Click **Create Pool**

### Step 2: Sync Fixtures (Admin)
1. Go to **Fixtures** page
2. Click **Sync Now** button
3. Wait for success toast
4. Verify fixtures appear in table

**Or via CLI:**
```bash
cd apps/worker
pnpm tsx src/index.ts sync-fixtures \
  --seasonId=<season-id> \
  --competitionId=1 \
  --year=2026
```

### Step 3: Register to Pool (Web)
1. Navigate to `http://localhost:3000`
2. Sign in (or create account)
3. Go to `/pool/world-cup-2026/register`
4. Complete registration form
5. Click **Join Pool**

### Step 4: Make Predictions (Web)
1. Go to `/pool/world-cup-2026/fixtures`
2. Enter scores for upcoming matches:
   - Home score: 2
   - Away score: 1
3. Click **Save** (individual) or **Save All** (bulk)
4. Verify success toast

### Step 5: Lock Predictions (Automatic)
Predictions lock automatically at kickoff time. To test manually:

```bash
cd apps/worker
pnpm tsx src/index.ts lock-predictions
```

Verify:
- Inputs are disabled
- Lock icon appears
- Status badge shows "Locked"

### Step 6: Update Match Results (Admin or Worker)
**Option A - Admin UI:**
1. Go to admin fixtures page
2. Click match to edit
3. Update scores and status to "FINISHED"
4. Save

**Option B - Worker (simulates provider sync):**
```bash
cd apps/worker
pnpm tsx src/index.ts sync-fixtures --seasonId=<id>
```

### Step 7: Score Predictions (Worker)
```bash
cd apps/worker
pnpm tsx src/index.ts score-final
```

This will:
- Find finished matches
- Calculate points (exact=5, sign=3, diff=1)
- Update `Prediction.awardedPoints`
- Create `ScoreAudit` records

### Step 8: View Leaderboard (Web)
1. Go to `/pool/world-cup-2026/leaderboard`
2. See live rankings
3. Auto-refreshes every 30s
4. Check stats: points, exact, sign

---

## 🧪 Testing Scenarios

### Scenario 1: Late Prediction (Should Fail)
```typescript
// Manually set match kickoff to past
await prisma.match.update({
  where: { id: "match-123" },
  data: { kickoffTime: new Date(Date.now() - 1000) }
});

// Try to save prediction → Should get error toast
```

### Scenario 2: Bulk Save with Mixed States
```typescript
// Some matches locked, some open
// Bulk save should:
// - Save unlocked matches
// - Skip locked matches
// - Show partial success toast
```

### Scenario 3: Leaderboard Tie
```typescript
// Create two users with same points
// Verify tie-breaker:
// 1. More exact scores wins
// 2. More correct signs wins
// 3. Same rank shown
```

---

## 🔧 Development Tips

### Mock Provider (Default)
The mock provider generates fake data for testing:
```typescript
// packages/utils/src/sports/mock.ts
// Returns 48 matches for World Cup 2026
// Includes realistic teams, dates, venues
```

### Real API-Football Provider
1. Get API key from [API-Sports Dashboard](https://dashboard.api-football.com/)
2. Set `SPORTS_PROVIDER=api-football`
3. Set `SPORTS_API_KEY=your-key`
4. **Important:** Use direct API-Sports endpoint (v3.football.api-sports.io), NOT RapidAPI
4. Competition IDs:
   - World Cup: `1`
   - Champions League: `2`
   - Premier League: `39`
   - La Liga: `140`

### Cache Debugging
```typescript
// In Node REPL or API route
import { leaderboardCache, fixturesCache } from "@qp/api/lib/cache";

console.log("Leaderboard cache size:", leaderboardCache.size());
console.log("Fixtures cache size:", fixturesCache.size());

// Clear all caches
leaderboardCache.clear();
fixturesCache.clear();
```

### Database Queries
```sql
-- Check predictions
SELECT u.email, m.kickoffTime, p.homeScore, p.awayScore, p.awardedPoints
FROM "Prediction" p
JOIN "User" u ON p.userId = u.id
JOIN "Match" m ON p.matchId = m.id
WHERE p.poolId = 'pool-id'
ORDER BY m.kickoffTime;

-- Check leaderboard manually
SELECT 
  u.email,
  SUM(p.awardedPoints) as totalPoints,
  COUNT(CASE WHEN p.isExact THEN 1 END) as exactCount
FROM "Prediction" p
JOIN "User" u ON p.userId = u.id
WHERE p.poolId = 'pool-id'
GROUP BY u.id, u.email
ORDER BY totalPoints DESC;

-- Check locked matches
SELECT id, kickoffTime, locked, status
FROM "Match"
WHERE seasonId = 'season-id'
AND locked = true;
```

---

## 📱 UI Component Hierarchy

### Web App (Player)
```
/pool/[poolSlug]/fixtures
├── FixturesAndPredictions (client component)
│   ├── Registration check
│   ├── Fixtures list (grouped by date)
│   ├── Prediction inputs
│   ├── Lock indicators
│   └── Save buttons

/pool/[poolSlug]/leaderboard
├── LeaderboardView (client component)
│   ├── Live/Final badge
│   ├── Auto-refresh toggle
│   ├── Rankings table
│   └── Snapshots history
```

### Admin App
```
/fixtures
├── FixturesManager (client component)
│   ├── Sync button
│   ├── Upcoming tab
│   └── Live tab
```

---

## 🎨 Theming & Branding

All components use `@qp/ui` with Sonner toasts:
```typescript
import { toastSuccess, toastError, toastPromise } from "@qp/ui";

// Success
toastSuccess("Prediction saved!");

// Error
toastError("Match has already started");

// Promise (with loading state)
toastPromise(
  savePrediction.mutateAsync(data),
  {
    loading: "Saving...",
    success: "Saved!",
    error: "Failed to save"
  }
);
```

---

## 🐛 Common Errors & Solutions

### Error: "Cannot find module '@qp/utils'"
**Solution:** Run `pnpm install` in root directory

### Error: "TRPC procedure not found"
**Solution:** 
1. Check router is exported in `packages/api/src/routers/index.ts`
2. Restart dev server
3. Clear `.next` cache

### Error: "Prediction save failed: FORBIDDEN"
**Solution:** User not registered to pool
1. Check `Registration` table
2. Complete registration flow
3. Verify `userId` and `poolId` match

### Error: "Rate limit exceeded" (API-Football)
**Solution:**
1. Free tier: 100 requests/day
2. Use mock provider for dev: `SPORTS_PROVIDER=mock`
3. Implement request queuing
4. Upgrade to paid tier

### Error: "Leaderboard shows 0 points"
**Solution:**
1. Run score-final job: `pnpm tsx src/index.ts score-final`
2. Check match status is "FINISHED"
3. Verify `homeScore` and `awayScore` are set
4. Check `Prediction.awardedPoints` in database

---

## 📊 Performance Benchmarks

### Expected Response Times (Local Dev)
- `fixtures.getBySeasonId`: ~50ms (cached), ~200ms (uncached)
- `predictions.getByPool`: ~30ms
- `predictions.save`: ~100ms
- `leaderboard.get`: ~150ms (live), ~20ms (cached)

### Scaling Considerations
- **< 100 users:** Live leaderboard works great
- **100-1000 users:** Use snapshots every 5 minutes
- **> 1000 users:** Pre-compute snapshots, cache aggressively

### Database Indexes (Already in Schema)
```prisma
@@index([seasonId, kickoffTime]) // Match
@@index([userId]) // Prediction
@@index([poolId, createdAt]) // LeaderboardSnapshot
```

---

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] Set `SPORTS_PROVIDER=api-football`
- [ ] Set `SPORTS_API_KEY` (production key)
- [ ] Run migrations: `pnpm prisma migrate deploy`
- [ ] Set up cron jobs (see FIXTURES_IMPLEMENTATION.md)
- [ ] Configure cache TTLs for load
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Test with production data
- [ ] Load test leaderboard endpoint

### Cron Jobs (Example with node-cron)
```typescript
// apps/worker/src/scheduler.ts
import cron from "node-cron";
import { syncFixturesJob } from "./jobs/sync-fixtures";
import { scoreFinalJob } from "./jobs/score-final";
import { lockPredictionsJob } from "./jobs/lock-predictions";

// Sync fixtures daily at midnight
cron.schedule("0 0 * * *", async () => {
  await syncFixturesJob({ seasonId: "...", competitionExternalId: "1", year: 2026 });
});

// Lock predictions every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  await lockPredictionsJob();
});

// Score finished matches every 10 minutes
cron.schedule("*/10 * * * *", async () => {
  await scoreFinalJob();
});
```

---

## 📚 Additional Resources

- **API-Football Docs:** https://www.api-football.com/documentation-v3
- **tRPC Docs:** https://trpc.io/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Next.js App Router:** https://nextjs.org/docs/app
- **Sonner (Toasts):** https://sonner.emilkowal.ski/

---

## 🤝 Contributing

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- Small PRs (< 300 LOC)

### Testing
```bash
# Unit tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

---

## 📞 Support

For issues or questions:
1. Check `FIXTURES_IMPLEMENTATION.md` for detailed docs
2. Review error logs in console
3. Check database state with SQL queries above
4. Open GitHub issue with reproduction steps

---

**Happy coding! ⚽🏆**
