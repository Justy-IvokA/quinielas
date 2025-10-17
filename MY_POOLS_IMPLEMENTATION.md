# My Pools Page Implementation

## Overview
Implemented the **My Pools** page at route `/pools` in `apps/web`. This page displays all pools where the current user is registered or has pending invitations, scoped to the current tenant.

## Features Implemented

### 1. **Route & Authentication Guard**
- **Page**: `apps/web/app/[locale]/pools/page.tsx`
- Server-side tenant resolution from host
- Requires authenticated session (redirects to `/auth/signin` if not logged in)
- Safe callback URL handling after authentication
- No `tenantId` exposed to client

### 2. **tRPC Router: `userPools`**
- **Location**: `packages/api/src/routers/userPools/`
- **Procedure**: `userPools.list`
- **Features**:
  - Combines user's registrations with pending email invitations
  - Filters: ALL, ACTIVE, FINALIZED, PENDING
  - Search: by pool title, description, season, or competition name
  - Sort: RECENT, NEXT_KICKOFF, FINALIZED_RECENT
  - Pagination: configurable page size (default 24)
  - Tenant scoping via `ctx.tenant.id`
  - Returns enriched pool data with:
    - Pool metadata (id, slug, title, brand, season)
    - Status (ACTIVE/FINALIZED)
    - Next kickoff time
    - Registration details (method, joined date)
    - Invitation status (PENDING)
    - Participant count

### 3. **UI Components**

#### **UserPoolCard** (`_components/UserPoolCard.tsx`)
- Glass morphism design with backdrop blur
- Displays:
  - Brand logo (optimized)
  - Pool title and brand name
  - Status badge (Active/Finalized/Pending Invite)
  - Season/competition label
  - Participant count
  - Next kickoff time (relative format)
- Dynamic CTA based on state:
  - **Registered & Active**: "Mis pronósticos" → `/pool/{slug}/predict`
  - **Registered & Finalized**: "Ver resultados" → `/{slug}`
  - **Pending Invitation**: "Aceptar invitación" → `/{slug}`
  - **Not Registered & Public**: "Unirme" → `/{slug}`
- Hover effects with scale and shadow transitions
- Fully accessible with focus states

#### **UserPoolsToolbar** (`_components/UserPoolsToolbar.tsx`)
- Search input with icon
- Filter dropdown (All/Active/Finalized/Pending)
- Sort dropdown (Recent/Next Kickoff/Finalized Recent)
- Responsive layout (stacks on mobile)
- Glass-styled inputs consistent with theme

#### **MyPoolsView** (`_components/MyPoolsView.tsx`)
- Client component managing state
- Debounced search (300ms)
- URL sync for filters/search/sort/page
- Loading state with spinner
- Error state with retry button
- Empty states:
  - No pools: "Aún no formas parte de ninguna quiniela"
  - No results: "No se encontraron quinielas con los filtros aplicados"
- Responsive grid (1 col mobile, 2-3 cols desktop)
- Pagination controls

### 4. **i18n Translations**
- **File**: `apps/web/messages/es-MX.json`
- Added `myPools` namespace with:
  - Page title and subtitle
  - Filter labels (all, active, finalized, pending)
  - Sort options (recent, next kickoff, finalized recent)
  - Status labels
  - Action labels (my predictions, view results, accept invite, join now)
  - Info messages (participants, next match, all finished)
  - Empty states
  - Error messages
- Added `nav.myPools` for navigation

## Technical Details

### **Data Flow**
1. Server component (`page.tsx`) resolves tenant and checks auth
2. Passes initial filter/search/sort to client component
3. Client component fetches data via tRPC
4. Router merges registrations + invitations
5. Applies filters, search, and sorting
6. Returns paginated results

### **Tenant Scoping**
- All queries filtered by `ctx.tenant.id` from host resolution
- No tenant data exposed to client
- Middleware ensures tenant context exists

### **Performance**
- Server component for initial render
- Client-side data fetching with React Query (via tRPC)
- Debounced search to reduce API calls
- Pagination to limit data transfer
- Optimized media URLs for brand logos

### **Accessibility**
- Semantic HTML structure
- ARIA labels on interactive elements
- Focus visible states
- Keyboard navigation support
- Screen reader friendly

## Files Created

```
packages/api/src/routers/userPools/
├── index.ts          # Router with list procedure
└── schema.ts         # Zod input schemas

apps/web/app/[locale]/pools/
├── page.tsx          # Server component with auth guard
└── _components/
    ├── MyPoolsView.tsx        # Client component (main view)
    ├── UserPoolCard.tsx       # Pool card component
    └── UserPoolsToolbar.tsx   # Filter/search/sort toolbar
```

## Files Modified

```
packages/api/src/routers/index.ts
└── Added userPoolsRouter to appRouter

apps/web/messages/es-MX.json
└── Added myPools translations and nav.myPools
```

## Testing Recommendations

### **Integration Tests** (using `createCaller`)
1. User with registration in active pool → appears with "Mis pronósticos" CTA
2. User with registration in finalized pool → appears with "Ver resultados" CTA
3. User with pending invitation → appears in "Pendientes" with "Aceptar invitación" CTA
4. Filter/search/sort/pagination work correctly
5. Tenant scoping enforced (no cross-tenant data)

### **Unit Tests**
1. Merge logic for registrations + invitations (no duplicates)
2. Status calculation (ACTIVE vs FINALIZED)
3. Sort algorithms (RECENT, NEXT_KICKOFF, FINALIZED_RECENT)
4. Search filtering across multiple fields

### **UI Tests** (Playwright)
1. Empty state renders correct copy
2. Navigation on card click works
3. CTA buttons navigate to correct routes
4. Filter/search/sort update URL params
5. Pagination controls work

## Usage

### **Access the Page**
```
https://your-tenant-domain.com/es-MX/pools
```

### **URL Parameters**
- `filter`: all | active | finalized | pending
- `search`: search query string
- `page`: page number (default 1)
- `sort`: recent | next_kickoff | finalized_recent

### **Example URLs**
```
/pools                                    # All pools
/pools?filter=active                      # Active pools only
/pools?filter=pending                     # Pending invitations
/pools?search=mundial                     # Search for "mundial"
/pools?sort=next_kickoff                  # Sort by next match
/pools?filter=active&sort=next_kickoff    # Active pools, sorted by next match
```

## Design System

### **Colors** (via CSS tokens)
- Glass cards: `bg-white/10 dark:bg-slate-900/20`
- Borders: `border-white/20 dark:border-white/10`
- Text: `text-white` with opacity variants
- Badges: Status-specific colors (green/yellow/slate)

### **Typography**
- Title: `text-4xl font-bold`
- Card title: `text-lg font-bold`
- Body: `text-sm` to `text-base`

### **Spacing**
- Container: `px-4 py-8`
- Card padding: `p-6`
- Grid gap: `gap-6`

## Acceptance Criteria ✅

- [x] `/pools` lists only user's pools within current tenant
- [x] Shows registered pools + pending invitations
- [x] Click on card navigates to `/{poolSlug}`
- [x] CTAs navigate to predict or results based on status
- [x] Filters/search/sort operational
- [x] Glass morphism design consistent with branding
- [x] No `tenantId` from client; all scoping via context
- [x] Sonner toasts ready for actions (e.g., resend invitation)
- [x] TypeScript compiles without errors in new files
- [x] i18n translations in Spanish (es-MX)

## Next Steps

1. **Add navigation link**: Update main navigation to include "Mis Quinielas" link
2. **Implement invitation actions**: Add "Resend invitation" functionality with Sonner toasts
3. **Add tests**: Create integration and UI tests as outlined above
4. **Mobile optimization**: Test and refine mobile layout
5. **Analytics**: Track page views and user interactions
6. **Performance monitoring**: Monitor query performance with large datasets

## Notes

- Pre-existing TypeScript errors in `require-registration.ts` and `leaderboard/index.ts` are unrelated to this implementation
- The page requires a valid tenant context (resolved from host)
- Empty states guide users to join pools or check for invitations
- All data fetching respects tenant boundaries for security
