# Quinielas WL (White-Label)

Multi-tenant sports prediction platform for FIFA World Cup 2026 and beyond.

## 📚 Documentation

- **[PRODUCTION_README.md](./PRODUCTION_README.md)** - Quick start para producción
- **[PRODUCTION_BUILD_GUIDE.md](./PRODUCTION_BUILD_GUIDE.md)** - Guía completa de build y despliegue
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Checklist de despliegue
- **[.windsurfrules](./.windsurfrules)** - Reglas y arquitectura del proyecto

## 🏗️ Architecture

**Monorepo** powered by Turborepo + PNPM workspaces.

### Apps
- **`apps/web`**: Player-facing Next.js 15 app (App Router, React 19)
- **`apps/admin`**: Admin/client panel (Next.js 15)
- **`apps/worker`**: Background jobs (fixtures sync, scoring, email batches)

### Packages
- **`packages/api`**: tRPC routers (server-side only)
- **`packages/db`**: Prisma client + schema + migrations + seed
- **`packages/auth`**: Auth.js config/adapters
- **`packages/ui`**: Shared UI library (Tailwind + Radix/shadcn)
- **`packages/branding`**: Theming resolver (CSS variables + asset map)
- **`packages/scoring`**: Rule engine and tie-break logic
- **`packages/utils`** and **`packages/config`**: Shared utilities and config presets

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PNPM 9+
- PostgreSQL 14+

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed demo data (tenant, brand, World Cup 2026 pool)
pnpm seed
```

### Development

```bash
# Start all apps in parallel
pnpm dev

# Start specific app
pnpm --filter @qp/web dev
pnpm --filter @qp/admin dev
pnpm --filter @qp/worker dev
```

### Build & Test

```bash
# Build all packages and apps
pnpm build

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Run tests
pnpm test
```

## 📦 Features Implemented

### ✅ Core Infrastructure
- [x] Turborepo monorepo with PNPM workspaces
- [x] Prisma schema (multi-tenant: tenants, brands, pools, access policies, invitations, fixtures)
- [x] tRPC API with health endpoint
- [x] Env loaders (Zod-based validation)
- [x] Next.js 15 apps with App Router
- [x] Tailwind CSS + Radix UI components
- [x] Theme system (light/dark mode, brand CSS variables)
- [x] GitHub Actions CI (build, typecheck, lint, test)

### ✅ Access Policies & Invitations
- [x] CRUD for access policies (PUBLIC, CODE, EMAIL_INVITE)
- [x] Code batch generation (8-char alphanumeric codes)
- [x] Email invitation system (token-based, expirable)
- [x] Admin UI for managing codes and invitations
- [x] Validation endpoints (code/token verification)

### ✅ Pool Lifecycle
- [x] CRUD for pools (name, slug, description, dates, rules)
- [x] Scoring rules configuration (exactScore, correctSign, goalDiffBonus)
- [x] Prize management (position, title, description, value, image)
- [x] Admin UI with tabs (basic info, rules, settings)
- [x] Pool details page with metrics (registrations, prizes, predictions)

### ✅ Registration Flows
- [x] Public registration (open access)
- [x] Code-based registration (validate + register)
- [x] Email invitation registration (token verification)
- [x] Real-time code validation
- [x] Duplicate prevention (`userId_poolId` unique constraint)
- [x] Audit logging for all registrations

### ✅ Fixtures Ingestion
- [x] tRPC router for fixtures (getBySeasonId, getById, getUpcoming, getLive)
- [x] Sync job infrastructure (placeholder for API-Football/Sportmonks)
- [x] External mapping system (`ExternalMap` for teams/matches/seasons)
- [x] Lock predictions job (runs every minute at kickoff time)
- [x] Worker app with scheduled jobs
- [x] Admin UI for fixtures management (upcoming, live, sync button)

## 🗄️ Database Schema

### Multi-Tenancy
- `Tenant` → `Brand` → `Pool`
- Row-level isolation via `tenantId` fields

### Access Control
- `AccessPolicy` (PUBLIC | CODE | EMAIL_INVITE)
- `CodeBatch` → `InviteCode` (status: UNUSED/PARTIALLY_USED/USED/EXPIRED)
- `Invitation` (status: PENDING/ACCEPTED/EXPIRED/REVOKED)

### Sports Catalog
- `Sport` → `Competition` → `Season` → `Match`
- `Team` → `TeamSeason` (many-to-many with Season)
- `ExternalSource` → `ExternalMap` (provider ID mapping)

### Predictions & Scoring
- `Registration` (user → pool)
- `Prediction` (user → match, locked at kickoff)
- `ScoreAudit` (scoring run history)
- `LeaderboardSnapshot` (point-in-time rankings)
- `Prize` → `PrizeAward` (winner assignments)

## 🔧 Environment Variables

### Required (all apps)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/quinielas"
```

### Auth (apps/web, apps/admin)
```env
AUTH_SECRET="your-secret-key"
AUTH_EMAIL_FROM="noreply@quinielas.app"
AUTH_EMAIL_SERVER="smtp://..."
```

### External API (apps/worker)
```env
RAPIDAPI_KEY="your-rapidapi-key"
EXTERNAL_API_PROVIDER="API_FOOTBALL" # or SPORTMONKS
```

### App-specific
```env
# apps/web
NEXT_PUBLIC_APP_NAME="Quinielas WL"
NEXT_PUBLIC_TENANT_SLUG="demo"
NEXT_PUBLIC_BRAND_SLUG="default"
NEXT_PUBLIC_WEBAPP_URL="http://localhost:3000"

# apps/admin
NEXT_PUBLIC_APP_NAME="Quinielas WL Admin"
NEXT_PUBLIC_TENANT_SLUG="demo"
NEXT_PUBLIC_BRAND_SLUG="default"
```

## 📚 API Routes

### tRPC Endpoints
- **Health**: `trpc.health.useQuery()`
- **Access**: `trpc.access.*` (getByPoolId, create, update, delete, createCodeBatch, createEmailInvitation)
- **Pools**: `trpc.pools.*` (listByTenant, getById, create, update, delete, prizes.*)
- **Registration**: `trpc.registration.*` (checkRegistration, validateInviteCode, validateInviteToken, registerPublic, registerWithCode, registerWithEmailInvite)
- **Fixtures**: `trpc.fixtures.*` (getBySeasonId, getById, getUpcoming, getLive, syncSeasonFixtures, updateMatchResult, lockMatchPredictions)

### REST Endpoints
- `GET /api/health` → `{ ok: true }`
- `GET|POST /api/trpc/[...trpc]` → tRPC handler

## 🎨 UI Components

Exported from `@qp/ui`:
- **Forms**: Button, Input, Textarea, Select, Checkbox, Switch, Label, FormField
- **Layout**: Card, Alert, Badge, Separator, Tabs, Dialog, Popover
- **Data**: Table, EmptyState, Skeleton, Progress
- **Feedback**: Toast (via Sonner), ThemeToggle
- **Advanced**: DatePicker, ColorPicker, Slider

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Test specific package
pnpm --filter @qp/api test
pnpm --filter @qp/config test
```

### Test Coverage
- ✅ Env parser validation (`packages/config/src/__tests__/env.test.ts`)
- ✅ Health router (`packages/api/src/__tests__/health.test.ts`)

## 📖 Documentation

### ✅ Fixtures & Predictions (COMPLETE)
- ✅ **[FIXTURES_QUICK_START.md](./FIXTURES_QUICK_START.md)** - 5-minute setup guide
- ✅ **[FIXTURES_IMPLEMENTATION.md](./FIXTURES_IMPLEMENTATION.md)** - Complete technical reference
- ✅ **[INSTALLATION_STEPS.md](./INSTALLATION_STEPS.md)** - Step-by-step installation
- ✅ **[apps/worker/README.md](./apps/worker/README.md)** - Worker jobs reference
- ✅ **[FIXTURES_COMPLETE_SUMMARY.md](./FIXTURES_COMPLETE_SUMMARY.md)** - Implementation summary

### Features Implemented
- ✅ Prediction CRUD (create, update before lock)
- ✅ Scoring engine (apply rules, calculate points)
- ✅ Leaderboard generation (with tie-breakers)
- ✅ Score audit trail
- ✅ API-Football provider integration
- ✅ Real-time locking mechanism
- ✅ Live leaderboard with auto-refresh
- ✅ Admin fixtures management

## 📖 Next Steps

### Email & Notifications
- [ ] Email templates (MJML / React Email)
- [ ] Invitation emails (with token links)
- [ ] Match reminders (24h before kickoff)
- [ ] Results notifications

### Analytics & Reports
- [ ] Pool analytics (participation rate, prediction completion)
- [ ] User engagement metrics
- [ ] Prize distribution reports

### Advanced Features
- [ ] Premium matches (higher weight for tie-breakers)
- [ ] Tie-breaker questions (custom predictions)
- [ ] Social features (comments, reactions)
- [ ] Mobile apps (React Native / Expo)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test: `pnpm build && pnpm test`
3. Commit with conventional commits: `git commit -m "feat: add feature"`
4. Push and open a PR

## 📄 License

Private - All rights reserved.

## 👥 Team

- **Victor Mancera** (Ivoka) - Lead Developer
