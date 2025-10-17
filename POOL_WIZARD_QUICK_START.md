# Pool Wizard - Quick Start Guide

## Prerequisites

1. **Environment Variable**: Set your API-Football key in `.env`:
   ```env
   SPORTS_API_KEY=your_api_football_key_here
   ```

2. **Database**: Ensure migrations are up to date:
   ```bash
   pnpm db:migrate
   ```

3. **Seed Data**: Create initial Sport/ExternalSource records (optional - wizard auto-creates):
   ```bash
   pnpm db:seed
   ```

## Usage

### For Admins

1. **Navigate to Pool Creation**:
   - Go to `/pools/new` in the admin panel
   - You must be logged in as `TENANT_ADMIN` or `SUPERADMIN`

2. **Follow the Wizard Steps**:

   **Step 1: Sport Selection**
   - Football is pre-selected (only sport available in MVP)
   - Click "Next" to continue

   **Step 2: Competition & Season**
   - Search for a competition (e.g., "World Cup U20", "Champions League")
   - Toggle "Solo Sub-20" to filter youth competitions
   - Select a season from the list
   - Click "Next" when both are selected

   **Step 3: Stage & Round**
   - Choose a specific stage (e.g., "Final Stages")
   - Optionally select a round (e.g., "Semi-finals")
   - Preview shows estimated teams and matches
   - Or skip to import entire season

   **Step 4: Pool Details**
   - Title and slug are auto-filled based on your selections
   - Click the wand icon (🪄) to regenerate
   - Optionally select a brand
   - Add a description
   - Click "Next"

   **Step 5: Access Policy**
   - Choose access type:
     - **PUBLIC**: Anyone can register
     - **CODE**: Requires invitation code
     - **EMAIL_INVITE**: Requires email invitation
   - Toggle security options (CAPTCHA, email verification)
   - Set advanced options (domain allowlist, user cap, date windows)
   - Click "Next"

   **Step 6: Prizes**
   - Add prizes for top positions
   - Define rank ranges (e.g., 1-1 for 1st place, 2-3 for 2nd-3rd)
   - Set prize type, title, description, value
   - Click "+" to add more prizes
   - Click "Next"

   **Step 7: Review & Create**
   - Review all selections
   - Click "Crear quiniela e importar eventos"
   - Wait for import to complete (shows progress)
   - On success, choose:
     - "Ver quiniela" → Go to pool detail page
     - "Configurar invitaciones" → Set up codes/invitations

3. **Post-Creation**:
   - Configure invitation codes or email invites (if not PUBLIC)
   - Review imported fixtures
   - Activate the pool when ready

## Example: World Cup U20 Semifinals

1. Search: "World Cup U20"
2. Select: Season "2025"
3. Stage: "Final Stages" → Round: "Semi-finals"
4. Title: "Mundial U20 — Semifinales 2025" (auto-filled)
5. Slug: "mundial-u20-semifinales-2025" (auto-filled)
6. Access: PUBLIC with CAPTCHA enabled
7. Prizes:
   - 1st: $5,000 MXN
   - 2nd-3rd: $2,000 MXN each
8. Create → Imports ~2 matches and ~4 teams

## API Endpoints (tRPC)

### `poolWizard.listCompetitions`
```typescript
const { data } = trpc.poolWizard.listCompetitions.useQuery({
  query: "World Cup",
  youthOnly: true,
  limit: 20
});
```

### `poolWizard.listSeasons`
```typescript
const { data } = trpc.poolWizard.listSeasons.useQuery({
  competitionExternalId: "123"
});
```

### `poolWizard.listStages`
```typescript
const { data } = trpc.poolWizard.listStages.useQuery({
  competitionExternalId: "123",
  seasonYear: 2025
});
```

### `poolWizard.previewFixtures`
```typescript
const { data } = trpc.poolWizard.previewFixtures.useQuery({
  competitionExternalId: "123",
  seasonYear: 2025,
  stageLabel: "Final Stages",
  roundLabel: "Semi-finals"
});
```

### `poolWizard.createAndImport`
```typescript
const mutation = trpc.poolWizard.createAndImport.useMutation();

await mutation.mutateAsync({
  competitionExternalId: "123",
  seasonYear: 2025,
  stageLabel: "Final Stages",
  roundLabel: "Semi-finals",
  pool: {
    title: "Mundial U20 — Semifinales 2025",
    slug: "mundial-u20-semifinales-2025",
    description: "..."
  },
  access: {
    accessType: "PUBLIC",
    requireCaptcha: true
  },
  prizes: [
    { rankFrom: 1, rankTo: 1, title: "$5,000 MXN", type: "CASH" }
  ]
});
```

## Troubleshooting

### "API key is required for api-football provider"
- Set `SPORTS_API_KEY` in your `.env` file
- Restart the dev server

### "No external mapping found for competition"
- The competition hasn't been imported yet
- The wizard will auto-create it on first import

### "Rate limit exceeded"
- API-Football has request limits
- Wait a few minutes and try again
- Check your API plan limits

### "Failed to fetch competitions"
- Check your API key is valid
- Verify network connectivity
- Check API-Football service status

### Wizard draft not saving
- Check localStorage is enabled in browser
- Clear browser cache and try again

### TypeScript errors in wizard components
- Run `pnpm install` to ensure all dependencies are installed
- Check that `@qp/ui`, `@qp/api`, and `@qp/utils` are built
- Run `pnpm build` in the root

## Development

### Testing the Wizard Locally

1. Start the dev server:
   ```bash
   pnpm dev
   ```

2. Navigate to admin panel:
   ```
   http://localhost:3001/pools/new
   ```

3. Use mock data (optional):
   - Set `provider: "mock"` in `pool-wizard/index.ts`
   - No API key required

### Adding New Sports

1. Update `StepSport.tsx` to show multiple sports
2. Add sport-specific provider logic
3. Update database seed with new Sport records

### Customizing Auto-Fill Logic

Edit `packages/utils/src/lib/slug.ts`:
- `generatePoolTitle()` - Customize title format
- `generatePoolSlug()` - Customize slug format

### Extending the Wizard

Add new steps in `CreatePoolWizard.tsx`:
```typescript
const steps: WizardStep[] = [
  // ... existing steps
  {
    title: "New Step",
    description: "Description",
    content: (setIsPending, nav) => (
      <YourNewStepComponent onSubmit={(data) => {
        updateWizardData({ newField: data });
        nav.onNext();
      }} />
    )
  }
];
```

## Performance Notes

- **Caching**: API-Football responses are cached for 60 minutes
- **Rate Limits**: Provider implements exponential backoff
- **Batch Imports**: Teams and matches are imported in batches
- **Draft Persistence**: Wizard state saved to localStorage every change

## Security

- **RBAC**: All endpoints require `TENANT_ADMIN` or `SUPERADMIN`
- **Tenant Scoping**: All operations scoped to `ctx.tenant.id`
- **Slug Validation**: Enforced uniqueness per tenant/brand
- **Input Sanitization**: Zod schemas validate all inputs
- **API Key**: Never exposed to client (server-only)

## Next Steps

After creating a pool:
1. Review imported fixtures at `/pools/{id}/edit`
2. Configure access codes/invitations at `/pools/{id}/invitations`
3. Set up prize images and details
4. Test registration flow
5. Activate the pool for users
