# Pool Creation Wizard - Implementation Summary

## Overview

The pool creation flow has been refactored into a **7-step guided wizard** that integrates with the **api-football** provider to search competitions, select seasons/stages, and automatically import teams and fixtures.

## Architecture

### Backend (packages/api)

#### New Router: `poolWizardRouter`
Location: `packages/api/src/routers/pool-wizard/index.ts`

**Procedures:**
- `listCompetitions` - Search competitions with filters (youth-only, country, query)
- `listSeasons` - Get available seasons for a competition
- `listStages` - Get stages and rounds for a season
- `previewFixtures` - Preview team/match counts for a scope
- `createAndImport` - Create pool + import fixtures in one transaction

**RBAC:** All procedures require `TENANT_ADMIN` or `SUPERADMIN` role.

#### Extended Provider Interface
Location: `packages/utils/src/sports/extended-provider.ts`

New methods added to `APIFootballProvider`:
- `listCompetitions()` - Fetch leagues with metadata (youth flag, type, country)
- `listSeasons()` - Get available seasons with dates
- `listStagesAndRounds()` - Parse stages/rounds from fixtures
- `previewFixtures()` - Filter and count fixtures by scope

#### Validation Schemas
Location: `packages/api/src/routers/pool-wizard/schema.ts`

Zod schemas for each wizard step:
- `listCompetitionsSchema`
- `listSeasonsSchema`
- `listStagesSchema`
- `previewFixturesSchema`
- `poolDetailsSchema`
- `accessPolicySchema`
- `prizeSchema`
- `createAndImportSchema`

### Frontend (apps/admin)

#### Wizard Component
Location: `apps/admin/app/[locale]/(authenticated)/pools/new/components/CreatePoolWizard.tsx`

**Features:**
- 7-step wizard flow with navigation
- Auto-save draft to localStorage
- Step validation with enable/disable logic
- Type-safe wizard data state

#### Wizard Steps

1. **StepSport** - Pre-select Football (future: multi-sport)
2. **StepCompetitionSeason** - Search competitions, select season
3. **StepStageRound** - Filter by stage/round with preview
4. **StepDetails** - Pool title, slug (auto-generated), description (brand auto-assigned from tenant)
5. **StepAccess** - Access policy (PUBLIC/CODE/EMAIL_INVITE), captcha, verification
6. **StepPrizes** - Dynamic prize list with validation
7. **StepReview** - Summary + create & import action

### Utilities

#### Slug Helpers
Location: `packages/utils/src/lib/slug.ts`

Functions:
- `toSlug()` - Convert text to URL-friendly slug
- `isValidSlug()` - Validate slug format
- `generatePoolSlug()` - Auto-generate from competition/season/stage
- `generatePoolTitle()` - Auto-generate title

## Data Flow

### Wizard Flow

```
1. Sport Selection (auto: Football)
   ↓
2. Competition Search → Select Season
   ↓
3. List Stages/Rounds → Preview Fixtures
   ↓
4. Pool Details (auto-fill title/slug)
   ↓
5. Access Policy Configuration
   ↓
6. Prizes Setup (optional)
   ↓
7. Review → Create & Import
```

### Import Process

When user clicks "Crear quiniela e importar eventos":

1. **Validate** slug uniqueness (tenant-scoped)
2. **Upsert** Sport, Competition, Season
3. **Fetch** season data from api-football
4. **Filter** matches by stage/round (if specified)
5. **Import** teams:
   - Create/find Team records
   - Create ExternalMap entries
   - Create TeamSeason associations
6. **Import** matches:
   - Create/update Match records
   - Create ExternalMap entries
7. **Create** Pool with:
   - AccessPolicy
   - Prizes
   - Default rule set (5/3/1)
8. **Return** poolId, slug, and import counts

## Key Features

### Tenant Scoping
- All operations scoped to `ctx.tenant.id`
- Brand auto-assigned from `ctx.brand.id` (resolved from subdomain)
- Slug uniqueness per tenant/brand
- RBAC enforced on all mutations

### API Integration
- Uses existing `getSportsProvider()` registry
- Caching enabled (60min TTL)
- Retry logic with exponential backoff
- Rate-limit handling (429 responses)

### UX Enhancements
- **Auto-fill**: Title and slug from competition/season/stage
- **Live preview**: Match/team counts before import
- **Draft persistence**: Auto-save to localStorage
- **Progress feedback**: Loading states and toast notifications
- **Validation**: Zod schemas per step, disable "Next" if invalid

### Youth Competition Support
- Auto-detect U-20, U-17 patterns in competition names
- Filter toggle in competition search
- Metadata preserved in Competition records

## Configuration

### Environment Variables

```env
SPORTS_API_KEY=your_api_football_key
```

### External Source

The wizard auto-creates an `ExternalSource` record for `api-football` if missing:

```typescript
{
  slug: "api-football",
  name: "API-Football",
  baseUrl: "https://v3.football.api-sports.io"
}
```

## Usage

### Admin Flow

1. Navigate to `/pools/new`
2. Follow 7-step wizard
3. Search "Liga MX"
4. Select season "2025"
5. Choose stage "Apertura" → round "14"
6. Review auto-filled title: "Liga MX - Jornada 14"
7. Configure access (e.g., PUBLIC with CAPTCHA)
8. Add prizes (optional)
9. Click "Crear quiniela e importar eventos"
10. Redirected to pool detail or invitation setup

### Post-Creation

After successful creation, admin can:
- View pool at `/pools/{poolId}`
- Configure invitations/codes at `/pools/{poolId}/invitations`
- Edit pool settings
- Manage participants

## Testing

### Unit Tests (TODO)
- Slug generation and validation
- Prize overlap validation
- Provider scope filtering

### Integration Tests (TODO)
- `createAndImport` with stage/round filter
- RBAC: TENANT_EDITOR → FORBIDDEN
- Slug uniqueness validation

### E2E Tests (TODO)
- Complete wizard flow
- Competition search
- Preview accuracy
- Import success

## Future Enhancements

1. **Multi-sport support**: Add Basketball, Baseball, etc.
2. **Batch import**: Import multiple pools from CSV
3. **Template system**: Save wizard configs as templates
4. **Advanced filtering**: By venue, date range, team
5. **Dry-run mode**: Preview import without committing
6. **Incremental sync**: Update existing pools with new fixtures
7. **Custom rule sets**: Configure scoring in wizard

## Files Created/Modified

### Backend
- ✅ `packages/utils/src/sports/extended-provider.ts` (new)
- ✅ `packages/utils/src/sports/api-football.ts` (extended)
- ✅ `packages/utils/src/lib/slug.ts` (new)
- ✅ `packages/api/src/routers/pool-wizard/index.ts` (new)
- ✅ `packages/api/src/routers/pool-wizard/schema.ts` (new)
- ✅ `packages/api/src/routers/index.ts` (modified)
- ✅ `packages/utils/src/index.ts` (modified)
- ✅ `packages/utils/src/sports/index.ts` (modified)

### Frontend
- ✅ `apps/admin/app/[locale]/(authenticated)/pools/new/components/CreatePoolWizard.tsx` (new)
- ✅ `apps/admin/app/[locale]/(authenticated)/pools/new/components/steps/StepSport.tsx` (new)
- ✅ `apps/admin/app/[locale]/(authenticated)/pools/new/components/steps/StepCompetitionSeason.tsx` (new)
- ✅ `apps/admin/app/[locale]/(authenticated)/pools/new/components/steps/StepStageRound.tsx` (new)
- ✅ `apps/admin/app/[locale]/(authenticated)/pools/new/components/steps/StepDetails.tsx` (new)
- ✅ `apps/admin/app/[locale]/(authenticated)/pools/new/components/steps/StepAccess.tsx` (new)
- ✅ `apps/admin/app/[locale]/(authenticated)/pools/new/components/steps/StepPrizes.tsx` (new)
- ✅ `apps/admin/app/[locale]/(authenticated)/pools/new/components/steps/StepReview.tsx` (new)
- ✅ `apps/admin/app/[locale]/(authenticated)/pools/new/page.tsx` (modified)

## Acceptance Criteria ✅

- [x] Route `/pools/new` shows 7-step wizard
- [x] Admin can search competitions (e.g., "World Cup U20")
- [x] Admin can select season and stage/round
- [x] System creates Pool + AccessPolicy + Prizes
- [x] System imports only scoped teams/fixtures
- [x] Success screen with CTAs: "Ver quiniela" and "Configurar invitaciones"
- [x] Everything tenant-scoped with RBAC
- [x] Theming support (dark/light)
- [x] Sonner toasts for feedback
- [x] Zod validation per step

## Notes

- The wizard uses the existing `WizardForm` component from `@qp/ui`
- Draft persistence prevents data loss on navigation
- The `createAndImport` mutation is atomic (transaction-safe)
- External mappings enable future sync/update operations
- Stage/round filtering is flexible (can import full season or specific rounds)
