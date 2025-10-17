# Pool Landing, Predictions & Participants Implementation

## Overview
Complete implementation of the pool landing redesign with glassmorphism, predictions module with strict access control, and participants page with detailed metrics.

## Implementation Summary

### 1. Access Control & Security ✅

#### Middleware (`packages/api/src/middleware/require-registration.ts`)
- **`assertRegistrationAccess()`**: Server-side validation for pool access
- Enforces access policy rules:
  - **PUBLIC**: Registration required only
  - **CODE**: Valid redeemed code required (status ∈ {PARTIALLY_USED, USED}, within usage cap)
  - **EMAIL_INVITE**: Accepted invitation required (status = ACCEPTED)
- Validates tenant scoping
- Returns typed errors for clear client-side handling

#### tRPC Middleware
- **`requireRegistrationForPool()`**: Composable middleware for protected endpoints
- Applied to all prediction mutations and queries
- Prevents unauthorized access at API level

### 2. Glassmorphism UI Components ✅

#### GlassCard Component (`packages/ui/src/components/glass-card.tsx`)
- Variants: `default`, `compact`, `xl`
- Blur levels: `sm`, `md`, `lg`, `xl`
- CSS properties:
  - `backdrop-blur-{level}`
  - `bg-white/10 dark:bg-slate-900/20`
  - `border border-white/20 dark:border-white/10`
  - `shadow-xl rounded-2xl`
- Exported from `@qp/ui`

### 3. Pool Landing Redesign ✅

#### File: `apps/web/app/[locale]/[poolSlug]/components/pool-landing.tsx`

**Hero Section**:
- Full-screen hero with video/image background
- Gradient overlay: `from-black/40 via-black/20 to-transparent`
- Central glass card with:
  - Brand logo
  - Pool title (white text with drop-shadow)
  - Status badge (Active/Expired)
  - Description
  - Stats grid (participants, prizes, competition)
  - Dynamic CTAs

**CTAs**:
- **Registered**: "Hacer pronósticos" → `/pool/{slug}/predict`
- **Not Registered**: "Únete ahora" → `/register?pool={slug}`
- **Expired**: "Ver tabla final" → `/pool/{slug}/participants`

**Sections**:
- **How It Works**: 3-step process with glass cards
- **Prizes**: Grid of prize cards with glassmorphism
- **Rules**: Prize summary in glass card

### 4. Predictions Module ✅

#### Route Structure
```
apps/web/app/[locale]/pool/[poolSlug]/predict/
├── page.tsx                    # Server component with guards
└── _components/
    ├── predictions-view.tsx    # Client component
    ├── match-row.tsx           # Individual match input
    └── predictions-toolbar.tsx # Save controls
└── _lib/
    └── use-countdown.ts        # Countdown hook
```

#### Server-Side Guards (`page.tsx`)
1. Resolve tenant from host
2. Check authentication → redirect to landing if missing
3. Fetch pool
4. **Call `assertRegistrationAccess()`** → redirect with error code if fails
5. Check if pool finalized → redirect to participants
6. Render predictions view

#### Client Features (`predictions-view.tsx`)
- **Filters**: All, Pending, Today, Finished
- **Match rows** with:
  - Team logos and names
  - Score inputs (disabled when locked)
  - Lock icon + countdown to kickoff
  - Status badges
- **Dirty tracking**: Highlights unsaved changes
- **Bulk save**: `predictions.bulkSave` mutation
- **Optimistic UI**: Updates immediately, rolls back on error
- **Toast feedback**: Success/error messages via Sonner

#### Lock Enforcement
- **UI**: Inputs disabled if `locked || kickoffTime <= now()`
- **Server**: Mutations reject with `FORBIDDEN` + `MATCH_LOCKED` message
- **Countdown**: Updates every minute, shows time until kickoff

#### Validation
- Scores must be integers ≥ 0
- No saves on locked matches
- Backend double-checks lock status

### 5. Participants Page ✅

#### Route Structure
```
apps/web/app/[locale]/pool/[poolSlug]/participants/
├── page.tsx                       # Server component
└── _components/
    ├── participants-view.tsx      # Client component
    ├── participants-table.tsx     # Sortable table
    └── stat-card.tsx              # Summary cards
```

#### API Endpoint (`packages/api/src/routers/participants/index.ts`)
**`participants.metrics`** query:
- **Input**: `poolId`, `search`, `sortBy`, `sortOrder`, `page`, `pageSize`
- **Returns**:
  - `participants[]`: Array of user metrics
  - `summary`: Aggregate stats
  - Pagination metadata

**Metrics per participant**:
- `totalPoints`: Sum of awarded points
- `exactCount`: Exact score predictions
- `signCount`: Correct 1X2 predictions
- `missCount`: Incorrect predictions
- `drawHits`: Correctly predicted draws
- `predictionsCount`: Total predictions made
- `onTimePercentage`: % made before kickoff
- `finishedMatches`: Matches scored

#### Features
- **Search**: Filter by name/email
- **Sortable columns**: Points, Exacts, Signs, Predictions, Name
- **Pagination**: 20 per page
- **Summary cards**: Total participants, avg points, avg exacts, total predictions
- **Rank badges**: Gold/Silver/Bronze for top 3

### 6. API Updates ✅

#### Updated Routers
**`predictions` router**:
- Applied `requireRegistrationForPool()` middleware to:
  - `getByPool`
  - `save`
  - `bulkSave`
- Changed error messages to typed codes (e.g., `MATCH_LOCKED`)

**New `participants` router**:
- `metrics` query with search, sort, pagination
- Calculates all metrics server-side
- Tenant-scoped queries

#### Main Router
Added `participants: participantsRouter` to `appRouter`

### 7. Translations ✅

#### Added to `apps/web/messages/es-MX.json`:

**`pool` namespace**:
- `howItWorks.step1/2/3.title/description`
- `sections.rules`
- `status.active`

**`predictions` namespace**:
- `title`, `saveAll`, `saving`, `loading`, `noMatches`
- `unsavedChanges`, `savedSuccess`, `savedWithErrors`
- `filters.*`, `status.*`, `errors.*`
- `homeScore`, `awayScore`

**`participants` namespace**:
- `title`, `loading`, `noParticipants`, `searchPlaceholder`
- `status.finalized`
- `stats.*` (totalParticipants, averagePoints, etc.)
- `columns.*` (name, points, exacts, signs, misses, draws, predictions, onTime)
- `pagination.*`

### 8. Testing ✅

#### Unit Tests
**`require-registration.test.ts`**:
- ✅ PUBLIC pool with valid registration
- ✅ No registration → FORBIDDEN
- ✅ CODE policy without code → FORBIDDEN
- ✅ CODE policy with valid code → OK
- ✅ CODE policy with expired code → FORBIDDEN
- ✅ EMAIL_INVITE without accepted invitation → FORBIDDEN
- ✅ EMAIL_INVITE with accepted invitation → OK

#### Integration Tests (Recommended)
```typescript
// Test with createCaller
- Unauthenticated user → UNAUTHORIZED
- Registered via PUBLIC → predictions.save OK
- CODE policy without redeemed code → FORBIDDEN
- CODE policy after redeem → predictions.save OK
- EMAIL_INVITE without ACCEPTED → FORBIDDEN
- EMAIL_INVITE after accept → predictions.save OK
- Locked match → mutation rejected
- participants.metrics respects sort/pagination
```

## File Structure

```
packages/
├── api/src/
│   ├── middleware/
│   │   ├── require-registration.ts       # NEW: Access control
│   │   └── require-registration.test.ts  # NEW: Tests
│   └── routers/
│       ├── participants/                 # NEW: Participants router
│       │   ├── index.ts
│       │   └── schema.ts
│       ├── predictions/
│       │   └── index.ts                  # UPDATED: Added middleware
│       └── index.ts                      # UPDATED: Added participants
└── ui/src/components/
    └── glass-card.tsx                    # NEW: Glassmorphism component

apps/web/app/[locale]/
├── [poolSlug]/
│   ├── components/
│   │   └── pool-landing.tsx              # UPDATED: Glassmorphism redesign
│   └── page.tsx                          # Existing
└── pool/[poolSlug]/
    ├── predict/                          # NEW: Predictions module
    │   ├── page.tsx
    │   ├── _components/
    │   │   ├── predictions-view.tsx
    │   │   ├── match-row.tsx
    │   │   └── predictions-toolbar.tsx
    │   └── _lib/
    │       └── use-countdown.ts
    └── participants/                     # NEW: Participants page
        ├── page.tsx
        └── _components/
            ├── participants-view.tsx
            ├── participants-table.tsx
            └── stat-card.tsx
```

## Security Guarantees

1. **No user identity in URL**: Session-only authentication
2. **Server-side validation**: All access checks happen in API layer
3. **Tenant scoping**: All queries scoped to resolved tenant
4. **Double lock enforcement**: UI + backend validation
5. **Typed errors**: Clear error codes for client handling
6. **Registration verification**: Middleware checks on every mutation

## Accessibility

- ✅ Inputs have `aria-label` attributes
- ✅ Focus visible on all interactive elements
- ✅ Keyboard navigation supported
- ✅ Color contrast meets WCAG AA (white text on dark overlays)
- ✅ Semantic HTML structure

## Performance

- ✅ Video with `preload="metadata"` and poster
- ✅ Lazy loading for images
- ✅ Pagination for participants (20/page)
- ✅ Countdown updates every 60s (not every second)
- ✅ Optimistic UI updates
- ✅ tRPC query caching

## Next Steps

1. **Run migrations** (if schema changed)
2. **Test flows**:
   - Register → Predict → Save → View Participants
   - Test CODE and EMAIL_INVITE access types
   - Verify lock enforcement at kickoff
3. **Add E2E tests** with Playwright
4. **Monitor performance** on large participant lists
5. **Add CSV export** for participants (optional)

## Usage Examples

### Accessing Predictions
```typescript
// User must be authenticated and registered
// Route: /pool/mundial-2026/predict

// Server validates:
// 1. Session exists
// 2. Registration exists for pool
// 3. Access policy satisfied (PUBLIC/CODE/EMAIL_INVITE)
// 4. Pool not finalized
```

### Saving Predictions
```typescript
// Client
const mutation = trpc.predictions.bulkSave.useMutation();
await mutation.mutateAsync({
  poolId: "pool_123",
  predictions: [
    { matchId: "match_1", homeScore: 2, awayScore: 1 },
    { matchId: "match_2", homeScore: 0, awayScore: 0 }
  ]
});

// Server validates:
// - Registration via middleware
// - Match not locked
// - Scores are valid integers
```

### Viewing Participants
```typescript
// Public endpoint (no auth required)
const { data } = trpc.participants.metrics.useQuery({
  poolId: "pool_123",
  search: "john",
  sortBy: "points",
  sortOrder: "desc",
  page: 1,
  pageSize: 20
});
```

## Compliance with Requirements

✅ **Glassmorphism aesthetic**: GlassCard component with backdrop-blur and transparency  
✅ **Modern/minimal design**: Clean layout, clear typography, CSS variables  
✅ **Predictions UX**: Load/save states, lock enforcement, countdown timers  
✅ **Participants metrics**: Points, exacts, signs, misses, draws, on-time %  
✅ **Strict access control**: Server-side guards, middleware, no URL params  
✅ **Tenant scoping**: All queries scoped via host resolution  
✅ **Theming**: Respects CSS variables from branding  
✅ **Sonner integration**: Toast feedback for all actions  
✅ **tRPC**: All data fetching via tRPC  
✅ **Tests**: Unit tests for access control  
✅ **Lint/typecheck**: TypeScript strict mode, no errors  

## Error Handling

**Client-side**:
- Redirects to landing with error query param
- Toast messages for save failures
- Clear error states in UI

**Server-side**:
- Typed TRPCError codes
- Descriptive error messages
- Audit logging for security events

**Error Codes**:
- `REGISTRATION_REQUIRED`: User not registered
- `CODE_REQUIRED`: CODE policy without code
- `CODE_INVALID`: Code expired/paused
- `INVITATION_REQUIRED`: EMAIL_INVITE without invitation
- `INVITATION_NOT_ACCEPTED`: Invitation not accepted
- `MATCH_LOCKED`: Attempt to save on locked match
- `TENANT_MISMATCH`: Registration tenant mismatch

---

**Status**: ✅ Implementation Complete  
**Last Updated**: 2025-01-14  
**Author**: Windsurf (Cascade)
