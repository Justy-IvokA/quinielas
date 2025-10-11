# 🚀 Installation & Setup Guide

## Prerequisites
- Node.js 20+
- PNPM 9+
- PostgreSQL 14+
- Git

---

## Step 1: Install Dependencies

```bash
# Install PNPM globally (if not installed)
npm install -g pnpm

# Install all dependencies
pnpm install
```

This will install dependencies for all packages and apps in the monorepo.

---

## Step 2: Database Setup

### Create Database
```bash
# PostgreSQL
createdb quinielas

# Or via psql
psql -U postgres
CREATE DATABASE quinielas;
\q
```

### Configure Database URL
Create `.env` in `packages/db/`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/quinielas"
```

### Run Migrations
```bash
cd packages/db
pnpm prisma migrate dev
```

### Seed Database (Optional)
```bash
pnpm prisma db seed
```

This creates:
- Demo tenant
- Demo sport (Football)
- Demo competition (World Cup 2026)
- Demo season
- Demo pool
- Demo users

---

## Step 3: Configure Apps

### Web App (`apps/web/.env`)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/quinielas"

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Sports Provider (use mock for dev)
SPORTS_PROVIDER=mock
SPORTS_API_KEY=  # Leave empty for mock

# Optional: Branding
NEXT_PUBLIC_APP_NAME="Quinielas WL"
```

### Admin App (`apps/admin/.env`)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/quinielas"

# Auth
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here

# Sports Provider
SPORTS_PROVIDER=mock
SPORTS_API_KEY=
```

### Worker (`apps/worker/.env`)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/quinielas"

# Sports Provider
SPORTS_PROVIDER=mock
SPORTS_API_KEY=

# Optional
LOG_LEVEL=info
```

---

## Step 4: Generate Prisma Client

```bash
cd packages/db
pnpm prisma generate
```

---

## Step 5: Start Development Servers

### Option A: All at Once (Recommended)
```bash
# From root directory
pnpm dev
```

This starts:
- Web app on http://localhost:3000
- Admin app on http://localhost:3001
- Worker (if configured)

### Option B: Individual Apps
```bash
# Terminal 1 - Web App
cd apps/web
pnpm dev

# Terminal 2 - Admin App
cd apps/admin
pnpm dev

# Terminal 3 - Worker (optional)
cd apps/worker
pnpm dev
```

---

## Step 6: Verify Installation

### Check Web App
1. Open http://localhost:3000
2. You should see the landing page
3. Try navigating to `/pool/demo-pool` (if seeded)

### Check Admin App
1. Open http://localhost:3001
2. Sign in with demo credentials (if seeded)
3. Navigate to Fixtures page
4. Click "Sync Now" button

### Check Database
```bash
psql quinielas
\dt  # List tables
SELECT COUNT(*) FROM "Match";  # Should show matches if synced
```

---

## Step 7: Test Complete Flow

### 1. Sync Fixtures
```bash
cd apps/worker
pnpm tsx src/index.ts sync-fixtures \
  --seasonId=$(psql quinielas -t -c "SELECT id FROM \"Season\" LIMIT 1") \
  --competitionId=1 \
  --year=2026
```

### 2. Register to Pool
1. Go to http://localhost:3000
2. Sign in (create account if needed)
3. Navigate to `/pool/demo-pool/register`
4. Complete registration

### 3. Make Predictions
1. Go to `/pool/demo-pool/fixtures`
2. Enter scores for upcoming matches
3. Click "Save All"
4. Verify success toast

### 4. Lock Predictions (Manual Test)
```bash
cd apps/worker
pnpm tsx src/index.ts lock-predictions
```

Refresh fixtures page - inputs should be disabled.

### 5. Score Matches
```bash
# First, set a match to finished
psql quinielas -c "UPDATE \"Match\" SET status='FINISHED', homeScore=2, awayScore=1 WHERE id=(SELECT id FROM \"Match\" LIMIT 1);"

# Then run scoring
cd apps/worker
pnpm tsx src/index.ts score-final
```

### 6. View Leaderboard
1. Go to `/pool/demo-pool/leaderboard`
2. Verify your points appear
3. Check ranking

---

## Step 8: Production Setup (Optional)

### API-Football Integration
1. Sign up at https://rapidapi.com/api-sports/api/api-football
2. Get API key
3. Update `.env` files:
   ```env
   SPORTS_PROVIDER=api-football
   SPORTS_API_KEY=your-rapidapi-key
   ```

### Build for Production
```bash
# Build all apps
pnpm build

# Or individual apps
cd apps/web
pnpm build

cd apps/admin
pnpm build
```

### Start Production Servers
```bash
# Web
cd apps/web
pnpm start  # Runs on port 3000

# Admin
cd apps/admin
pnpm start  # Runs on port 3001
```

### Set Up Cron Jobs
See `apps/worker/README.md` for cron setup instructions.

---

## Troubleshooting

### "Cannot find module '@qp/...'"
**Solution:** Run `pnpm install` in root directory

### "Prisma Client not generated"
**Solution:**
```bash
cd packages/db
pnpm prisma generate
```

### "Database connection failed"
**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in `.env`
3. Test connection: `psql $DATABASE_URL`

### "TRPC procedure not found"
**Solution:**
1. Restart dev server
2. Clear `.next` cache: `rm -rf apps/web/.next`
3. Verify router is exported in `packages/api/src/routers/index.ts`

### "Port already in use"
**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3002 pnpm dev
```

### "API-Football rate limit"
**Solution:**
- Free tier: 100 requests/day
- Use mock provider for dev: `SPORTS_PROVIDER=mock`
- Upgrade to paid tier for production

---

## Next Steps

1. **Read Documentation:**
   - `FIXTURES_QUICK_START.md` - Developer guide
   - `FIXTURES_IMPLEMENTATION.md` - Technical reference
   - `apps/worker/README.md` - Worker jobs reference

2. **Customize:**
   - Update branding in `packages/branding`
   - Add custom translations in `apps/web/messages`
   - Configure rule sets per pool

3. **Deploy:**
   - Set up hosting (Vercel, Railway, etc.)
   - Configure production database
   - Set up cron jobs for worker
   - Add monitoring (Sentry, LogRocket)

4. **Test:**
   - Run unit tests: `pnpm test`
   - Run type check: `pnpm typecheck`
   - Run linter: `pnpm lint`

---

## Useful Commands

```bash
# Development
pnpm dev                    # Start all apps
pnpm build                  # Build all apps
pnpm test                   # Run all tests
pnpm typecheck              # Type check all packages
pnpm lint                   # Lint all packages

# Database
cd packages/db
pnpm prisma studio          # Open Prisma Studio (GUI)
pnpm prisma migrate dev     # Create migration
pnpm prisma migrate reset   # Reset database
pnpm prisma db seed         # Seed database

# Worker
cd apps/worker
pnpm tsx src/index.ts sync-fixtures --seasonId=... --competitionId=1 --year=2026
pnpm tsx src/index.ts lock-predictions
pnpm tsx src/index.ts score-final
pnpm tsx src/index.ts leaderboard-snapshot --poolId=...

# Clean
pnpm clean                  # Clean all build artifacts
rm -rf node_modules         # Remove all node_modules
pnpm install                # Reinstall dependencies
```

---

## Support & Resources

- **Documentation:** See `FIXTURES_IMPLEMENTATION.md`
- **Quick Start:** See `FIXTURES_QUICK_START.md`
- **Worker Jobs:** See `apps/worker/README.md`
- **API-Football Docs:** https://www.api-football.com/documentation-v3
- **tRPC Docs:** https://trpc.io/docs
- **Prisma Docs:** https://www.prisma.io/docs

---

**Installation complete! Ready to build your quiniela platform! 🎉⚽**
