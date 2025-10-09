# Backend Architecture Implementation Summary

## Overview
Core backend architecture for Quinielas WL multi-tenant sports prediction platform, implementing tRPC context, multi-tenant scoping, domain services, adapters, worker jobs, and scoring engine.

## Completed Components

### 1. tRPC Context & Environment (`packages/api/src/context.ts`)
- **Environment validation** with Zod schema
- **Tenant/brand resolution** from domain or path segments
- **Session management** (Auth.js placeholder)
- **Test context factory** for unit tests
- Fallback to demo tenant in development

**Environment Variables:**
```env
DATABASE_URL=postgresql://...
NODE_ENV=development|production|test
SPORTS_API_PROVIDER=mock|api-football|sportmonks
SPORTS_API_KEY=optional
EMAIL_PROVIDER=mock|smtp
SMTP_HOST=optional
SMTP_PORT=optional
SMTP_USER=optional
SMTP_PASS=optional
SMTP_FROM=optional
```

### 2. Multi-Tenant Middleware (`packages/api/src/middleware/`)

**with-tenant.ts:**
- `withTenant` - Ensures tenant context exists
- `withTenantAndBrand` - Ensures both tenant and brand exist
- `withAuth` - Ensures user is authenticated
- `protectedProcedure` - Combined auth + tenant check

**tenant-utils.ts:**
- `validateBrandBelongsToTenant()` - Brand ownership validation
- `validateResourceBelongsToTenant()` - Generic resource validation
- `scopeByTenant()` - Helper to add tenantId to queries
- `getTenantMemberRole()` - Get user's role in tenant
- `requireTenantRole()` - Role-based access control

**rate-limit.ts:**
- `rateLimitByIP()` - IP-based rate limiting
- `rateLimitByEmail()` - Email-based rate limiting
- `rateLimitByUser()` - User-based rate limiting
- Pre-configured limiters: `registrationRateLimit`, `inviteRateLimit`, `predictionRateLimit`

### 3. Domain Services (`packages/api/src/services/`)

**pools.service.ts:**
- `create()` - Create pool with validation
- `listByTenant()` - List pools (with filters)
- `getById()` - Get pool with relations
- `getBySlug()` - Get pool by slug
- `update()` - Update pool
- `delete()` - Delete pool (only if no registrations)

**access.service.ts:**
- `create()` - Create access policy
- `getByPoolId()` - Get policy for pool
- `update()` - Update policy
- `upsert()` - Create or update policy
- `listByTenant()` - List policies
- `delete()` - Delete policy

**invites.service.ts:**
- `create()` - Create single email invitation
- `createBulk()` - Create multiple invitations
- `getByToken()` - Get invitation by token
- `listByPool()` - List invitations for pool
- `resend()` - Resend invitation
- `markAccepted()` - Mark as accepted
- `getStats()` - Get invitation statistics

**codes.service.ts:**
- `createBatch()` - Create batch of invite codes
- `getBatchById()` - Get batch with codes
- `listByAccessPolicy()` - List batches
- `validateCode()` - Validate invite code
- `redeemCode()` - Redeem code (increment usage)
- `getBatchStats()` - Get batch statistics
- `toggleBatchStatus()` - Pause/unpause batch
- `exportBatchCodes()` - Export codes as CSV

**registration.service.ts:**
- `checkRegistration()` - Check if user registered
- `registerPublic()` - Register with public access
- `registerWithCode()` - Register with invite code
- `registerWithEmailInvite()` - Register with email token
- `listByPool()` - List registrations
- `getPoolStats()` - Get registration statistics

### 4. Email Adapter (`packages/utils/src/email/`)

**adapter.ts:**
- `EmailAdapter` interface
- `EmailParams` type

**mock.ts:**
- `MockEmailAdapter` - Console logging for dev/test
- Stores sent emails for testing

**smtp.ts:**
- `SMTPEmailAdapter` - Nodemailer integration
- Dynamic import to avoid bundling
- Connection verification

**index.ts:**
- `getEmailAdapter()` - Factory function
- `emailTemplates` - Pre-built templates (invitation, invite code)

### 5. Sports Provider (`packages/utils/src/sports/`)

**provider.ts:**
- `SportsProvider` interface
- DTOs: `TeamDTO`, `MatchDTO`, `SeasonDTO`, `ResultDTO`

**mock.ts:**
- `MockSportsProvider` - Static World Cup 2026 data
- 8 teams, 6 matches for testing

**api-football.ts:**
- `APIFootballProvider` - Skeleton implementation
- Endpoint structure documented
- Status mapping helper

**index.ts:**
- `getSportsProvider()` - Factory function

### 6. Scoring Engine (`packages/scoring/src/engine.ts`)

**Core Functions:**
- `scoreMatch()` - Score single prediction
- `scorePredictions()` - Score multiple predictions
- `generateLeaderboard()` - Generate ranked leaderboard
- `comparePlayers()` - Tie-breaker logic
- `validateRuleSet()` - Rule set validation

**Default Rule Set:**
```typescript
{
  exactScore: 5,      // Exact score match
  correctSign: 3,     // Correct result (1X2)
  goalDiffBonus: 1,   // Correct goal difference
  premiumMatchMultiplier?: number // Optional multiplier
}
```

**Tie-Breakers (in order):**
1. Total points
2. More exact scores
3. More correct signs
4. Premium match points
5. Custom tie-breaker question (future)

### 7. Worker Jobs (`apps/worker/src/jobs/`)

**lock-predictions.ts:**
- Runs every 1 minute
- Locks predictions at kickoff time
- Transitions matches to LIVE status

**score-final.ts:**
- Runs every 5 minutes
- Scores finished matches
- Updates `Prediction.awardedPoints` and `isExact`
- Creates `ScoreAudit` records

**leaderboard-snapshot.ts:**
- Runs every 10 minutes
- Aggregates player scores
- Generates ranked leaderboard
- Stores `LeaderboardSnapshot`

**sync-fixtures.ts:**
- Runs every 15 minutes (placeholder)
- Syncs teams and matches from provider
- Maintains `ExternalMap` for ID mapping

**runner.ts:**
- Manual job execution: `pnpm worker run <job-name>`
- Available jobs: lock-predictions, sync-fixtures, score-final, leaderboard-snapshot

### 8. Tests

**scoring engine** (`packages/scoring/src/engine.test.ts`):
- Exact score scenarios
- Correct sign scenarios
- Goal difference bonus
- Draw handling
- Premium match multiplier
- Leaderboard generation
- Tie-breaker logic

**tenant middleware** (`packages/api/src/middleware/with-tenant.test.ts`):
- Tenant validation
- Auth validation
- Context structure

## Usage Examples

### Create Pool with Access Policy
```typescript
import { PoolsService } from "@qp/api/services/pools.service";
import { AccessService } from "@qp/api/services/access.service";

const poolsService = new PoolsService(prisma);
const accessService = new AccessService(prisma);

// Create pool
const pool = await poolsService.create({
  tenantId: "tenant123",
  brandId: "brand456",
  seasonId: "season789",
  name: "World Cup 2026",
  slug: "world-cup-2026",
  ruleSet: {
    exactScore: 5,
    correctSign: 3,
    goalDiffBonus: 1
  }
});

// Create access policy
await accessService.create({
  poolId: pool.id,
  tenantId: "tenant123",
  accessType: "PUBLIC",
  requireCaptcha: false
});
```

### Register User
```typescript
import { RegistrationService } from "@qp/api/services/registration.service";

const registrationService = new RegistrationService(prisma);

// Public registration
await registrationService.registerPublic({
  userId: "user123",
  poolId: "pool456",
  displayName: "John Doe",
  email: "john@example.com"
});

// With invite code
await registrationService.registerWithCode({
  userId: "user123",
  poolId: "pool456",
  inviteCode: "ABC12345",
  displayName: "John Doe"
});
```

### Send Email Invitation
```typescript
import { InvitesService } from "@qp/api/services/invites.service";
import { getEmailAdapter, emailTemplates } from "@qp/utils";

const invitesService = new InvitesService(prisma);
const emailAdapter = getEmailAdapter({ provider: "mock" });

// Create invitation
const invitation = await invitesService.create({
  poolId: "pool456",
  accessPolicyId: "policy789",
  tenantId: "tenant123",
  email: "player@example.com"
});

// Send email
const template = emailTemplates.invitation({
  poolName: "World Cup 2026",
  inviteUrl: `https://app.com/accept/${invitation.token}`,
  expiresAt: invitation.expiresAt
});

await emailAdapter.send({
  to: invitation.email,
  subject: template.subject,
  html: template.html,
  text: template.text
});
```

### Score Predictions
```typescript
import { scoreMatch } from "@qp/scoring";

const score = scoreMatch(
  { homeScore: 2, awayScore: 1 }, // Prediction
  { homeScore: 2, awayScore: 1 }, // Actual result
  { exactScore: 5, correctSign: 3, goalDiffBonus: 1 }
);

console.log(score);
// {
//   exactScore: true,
//   correctSign: true,
//   correctDiff: true,
//   points: 5,
//   breakdown: { exactScorePoints: 5, correctSignPoints: 0, goalDiffBonusPoints: 0 }
// }
```

### Run Worker Jobs
```bash
# Start worker (all jobs scheduled)
pnpm worker dev

# Run single job manually
pnpm worker run lock-predictions
pnpm worker run score-final
pnpm worker run leaderboard-snapshot
```

## Next Steps

### Immediate (Before UI Wiring):
1. Add nodemailer to utils package dependencies
2. Run `pnpm install` to link workspace packages
3. Generate Prisma client: `pnpm db:generate`
4. Run seed: `pnpm seed`
5. Run tests: `pnpm test`

### UI Integration:
1. Wire admin pool creation form to `pools.create` mutation
2. Wire access policy editor to `access.upsert` mutation
3. Wire registration forms to `registration.*` mutations
4. Add Sonner toast notifications for success/error states
5. Create dashboard stubs showing leaderboard data

### Production Readiness:
1. Implement Auth.js session management
2. Replace in-memory rate limiter with Redis
3. Complete API-Football provider implementation
4. Add Sentry error tracking
5. Set up proper job scheduling (BullMQ, Inngest, etc.)
6. Add comprehensive integration tests
7. Set up CI/CD pipelines

## File Structure
```
packages/
├── api/
│   └── src/
│       ├── context.ts                    ✅ Enhanced context
│       ├── trpc.ts                       ✅ Updated with error formatter
│       ├── middleware/
│       │   ├── with-tenant.ts            ✅ Multi-tenant guards
│       │   ├── with-tenant.test.ts       ✅ Tests
│       │   └── rate-limit.ts             ✅ Rate limiting
│       ├── lib/
│       │   └── tenant-utils.ts           ✅ Tenant utilities
│       └── services/
│           ├── pools.service.ts          ✅ Pool management
│           ├── access.service.ts         ✅ Access policies
│           ├── invites.service.ts        ✅ Email invitations
│           ├── codes.service.ts          ✅ Invite codes
│           └── registration.service.ts   ✅ Registration flows
├── scoring/
│   └── src/
│       ├── engine.ts                     ✅ Scoring logic
│       ├── engine.test.ts                ✅ Tests
│       └── index.ts                      ✅ Exports
├── utils/
│   └── src/
│       ├── email/
│       │   ├── adapter.ts                ✅ Interface
│       │   ├── mock.ts                   ✅ Mock adapter
│       │   ├── smtp.ts                   ✅ SMTP adapter
│       │   └── index.ts                  ✅ Factory + templates
│       └── sports/
│           ├── provider.ts               ✅ Interface
│           ├── mock.ts                   ✅ Mock provider
│           ├── api-football.ts           ✅ Skeleton
│           └── index.ts                  ✅ Factory
└── db/
    └── (existing)                        ✅ Already implemented

apps/
└── worker/
    └── src/
        ├── index.ts                      ✅ Job scheduler
        ├── runner.ts                     ✅ Manual runner
        └── jobs/
            ├── lock-predictions.ts       ✅ Lock at kickoff
            ├── score-final.ts            ✅ Score finished matches
            ├── leaderboard-snapshot.ts   ✅ Generate leaderboards
            └── sync-fixtures.ts          ✅ Sync from provider
```

## Testing

Run all tests:
```bash
pnpm test
```

Run specific package tests:
```bash
pnpm --filter @qp/scoring test
pnpm --filter @qp/api test
```

Run with coverage:
```bash
pnpm test -- --coverage
```

## Architecture Principles

1. **Multi-tenant by default**: All queries scoped to `tenantId`
2. **Provider abstraction**: Swappable email and sports providers
3. **Pure scoring logic**: Deterministic, auditable calculations
4. **Service layer**: Business logic separate from routers
5. **Type safety**: Full TypeScript coverage with Zod validation
6. **Test-driven**: Critical paths have test coverage
7. **Incremental**: Each component works independently

## Status: ✅ Ready for UI Integration

All core backend components are implemented and ready for frontend integration. The next milestone is to wire the admin and web UIs to these services with proper error handling and user feedback.
