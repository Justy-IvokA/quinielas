# Worker Sync Settings Implementation

## Overview

This feature allows Super Admins to configure cron schedules for background worker jobs through the admin UI. Settings are stored in the database and loaded by the worker on startup.

## Architecture

### Components

1. **UI Layer** (`apps/admin`)
   - `SyncSettingsForm.tsx`: React component for managing sync settings
   - `settings/page.tsx`: Main settings page with conditional rendering for Super Admins

2. **API Layer** (`packages/api`)
   - `routers/settings/index.ts`: tRPC procedures for getting/updating sync settings
   - `routers/settings/schema.ts`: Zod schemas for validation

3. **Worker Layer** (`apps/worker`)
   - `src/index.ts`: Loads settings from database and schedules jobs dynamically

4. **Database** (`packages/db`)
   - `seed.ts`: Initializes default sync settings
   - `seedSync.ts`: Standalone script to seed sync settings

## Features

### UI Features

- **Super Admin Only**: Settings section only visible to users with `SUPERADMIN` role
- **Job Configuration**: 9 configurable worker jobs:
  - `auto-sync-fixtures` (default: every 6 hours)
  - `leaderboard-snapshot` (default: every 10 minutes)
  - `purge-audit-logs` (default: daily at 2 AM)
  - `purge-invitations` (default: daily at 3 AM)
  - `purge-tokens` (default: daily at 4 AM)
  - `refresh-standings` (default: every 12 hours)
  - `lock-predictions` (default: every minute)
  - `update-live-matches` (default: every 5 minutes)
  - `score-final` (default: every 5 minutes)

- **Cron Format Support**: Standard 5-field cron format (minute hour day month day-of-week)
- **Validation**: Basic cron string validation with regex
- **Feedback**: Toast notifications for success/error states
- **Edit Mode**: Toggle between view and edit modes
- **Warning Banner**: Explains that changes require worker re-deploy

### API Endpoints

#### `settings.getSyncSettings` (Query)
- **Access**: SUPERADMIN only
- **Returns**: Object mapping cron keys to values
- **Example Response**:
```json
{
  "sync:auto-sync-fixtures:cron": "0 */6 * * *",
  "sync:leaderboard-snapshot:cron": "*/10 * * * *"
}
```

#### `settings.updateSyncSettings` (Mutation)
- **Access**: SUPERADMIN only
- **Input**: Object with cron settings
- **Validation**: Cron format validation
- **Audit**: Logs all changes to audit log
- **Example Input**:
```json
{
  "settings": {
    "sync:auto-sync-fixtures:cron": "0 */4 * * *",
    "sync:leaderboard-snapshot:cron": "*/15 * * * *"
  }
}
```

### Worker Integration

The worker reads settings on startup:

1. **Initialization**: `initializeWorker()` async function
2. **Database Fetch**: Queries `Setting` model for keys starting with `sync:`
3. **Fallback**: Uses hardcoded defaults if database fetch fails
4. **Dynamic Scheduling**: Converts cron strings to milliseconds and schedules jobs
5. **Logging**: Detailed logs of loaded settings and scheduled intervals

#### Cron to Milliseconds Conversion

Supports common patterns:
- `* * * * *` → 60,000 ms (every minute)
- `*/5 * * * *` → 300,000 ms (every 5 minutes)
- `*/10 * * * *` → 600,000 ms (every 10 minutes)
- `0 * * * *` → 3,600,000 ms (every hour)
- `0 0 * * *` → 86,400,000 ms (daily)
- `0 */6 * * *` → 21,600,000 ms (every 6 hours)
- `0 */12 * * *` → 43,200,000 ms (every 12 hours)

## Database Schema

### Setting Model

```prisma
model Setting {
  id        String       @id @default(cuid())
  scope     SettingScope  // GLOBAL, TENANT, POOL
  tenantId  String?
  poolId    String?
  key       String
  value     Json
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  tenant Tenant? @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  pool   Pool?   @relation(fields: [poolId], references: [id], onDelete: Cascade)

  @@unique([scope, tenantId, poolId, key])
  @@index([scope, key])
  @@index([tenantId])
  @@index([poolId])
}
```

**Sync Settings Keys**:
- Scope: `GLOBAL`
- TenantId: Agencia/SUPERADMIN tenant ID
- PoolId: `null`
- Key Format: `sync:{job-name}:cron`
- Value: Cron string (e.g., `"0 */6 * * *"`)

## Internationalization

### Spanish (es-MX)
Located in `apps/admin/messages/es-MX.json`:
- `settings.sync.title`: "Configuración de Sincronización de Workers"
- `settings.sync.description`: Full description
- `settings.sync.warning`: Important warning about re-deploy
- `settings.sync.jobs.{job-name}.label`: Job display name
- `settings.sync.jobs.{job-name}.description`: Job description
- `settings.sync.jobs.{job-name}.default`: Default cron value
- `settings.sync.cronHelp`: Cron format explanation
- `settings.sync.cronExamples`: Common cron examples
- `settings.sync.saveSuccess`: Success message
- `settings.sync.saveError`: Error message template
- `settings.sync.saving`: Saving state message

### English (en-US)
Located in `apps/admin/messages/en-US.json`:
- Same keys as Spanish with English translations

## Seeding

### Main Seed (`packages/db/src/seed.ts`)

Automatically creates default sync settings during main seed:
```bash
pnpm db:seed
```

Creates 9 sync settings with default cron values for the Agencia tenant.

### Standalone Seed (`packages/db/src/seedSync.ts`)

Useful for re-seeding or updating sync settings:
```bash
npx ts-node packages/db/src/seedSync.ts
```

Features:
- Creates or updates all sync settings
- Reports created vs updated counts
- Validates Agencia tenant exists
- Graceful error handling

## Usage

### For Super Admins

1. Navigate to `/settings` in admin panel
2. Scroll to "Configuración de Sincronización de Workers" section
3. Click "Editar" to enter edit mode
4. Modify cron schedules for desired jobs
5. Click "Guardar" to save
6. See success toast notification
7. **Important**: Contact DevOps to re-deploy worker for changes to take effect

### For Developers

#### Reading Settings in Worker

```typescript
const settings = await prisma.setting.findMany({
  where: {
    scope: "GLOBAL",
    key: { startsWith: "sync:" }
  }
});
```

#### Adding New Sync Job

1. Add job name to `SYNC_JOBS` array in `SyncSettingsForm.tsx`
2. Add translation keys in `es-MX.json` and `en-US.json`
3. Add default cron to `DEFAULT_CRONS` in `apps/worker/src/index.ts`
4. Add cron-to-ms conversion pattern in `cronToMs()` function
5. Schedule job in `initializeWorker()` function
6. Add setting to `seedSync.ts` and `seed.ts`

## Important Notes

### Re-deploy Requirement

Changes to sync settings require a **worker re-deploy** to take effect because:
- Cron schedules are set at worker startup
- Cloudflare Workers (if used) require re-deploy for schedule changes
- This is a limitation of the current architecture (Option A from requirements)

**Future Enhancement**: Implement Option B (dynamic scheduler) to allow runtime changes without re-deploy.

### Validation

- **Cron Format**: Basic regex validation (5 fields)
- **No Advanced Validation**: Doesn't validate specific ranges (e.g., day > 31)
- **Fallback**: Invalid cron strings are rejected with error message

### Audit Logging

All sync setting changes are logged to `AuditLog` table:
- Action: `SYNC_SETTINGS_UPDATE`
- Metadata: List of updated keys
- Actor: SUPERADMIN user ID
- IP Address & User Agent: Captured for security

### Error Handling

- **Database Connection Failure**: Worker falls back to hardcoded defaults
- **Missing Settings**: Uses defaults for any missing keys
- **Invalid Cron**: API rejects with validation error
- **Permission Denied**: Returns 403 Forbidden for non-SUPERADMIN users

## Testing

### Manual Testing

1. **Verify UI Visibility**:
   - Log in as SUPERADMIN → Settings visible
   - Log in as TENANT_ADMIN → Settings hidden

2. **Test Save Flow**:
   - Edit a cron value
   - Click Save
   - Verify toast success message
   - Refresh page
   - Verify value persisted

3. **Test Validation**:
   - Try invalid cron format
   - Verify error message
   - Try valid format
   - Verify success

4. **Test Worker Loading**:
   - Check worker logs on startup
   - Verify settings loaded from database
   - Verify fallback to defaults if DB unavailable

### Automated Testing

Recommended test cases:
- `getSyncSettings` returns correct values for SUPERADMIN
- `getSyncSettings` returns 403 for non-SUPERADMIN
- `updateSyncSettings` validates cron format
- `updateSyncSettings` persists to database
- `updateSyncSettings` creates audit log entry
- Worker loads settings on startup
- Worker falls back to defaults on DB error

## Files Modified

### Created
- `apps/admin/app/[locale]/(authenticated)/settings/components/SyncSettingsForm.tsx`
- `packages/db/src/seedSync.ts`
- `WORKER_SYNC_SETTINGS_IMPLEMENTATION.md` (this file)

### Modified
- `apps/admin/app/[locale]/(authenticated)/settings/page.tsx`
- `apps/admin/messages/es-MX.json`
- `apps/admin/messages/en-US.json`
- `packages/api/src/routers/settings/index.ts`
- `packages/api/src/routers/settings/schema.ts`
- `apps/worker/src/index.ts`
- `packages/db/src/seed.ts`

## Troubleshooting

### Settings Not Appearing in UI

1. Verify you're logged in as SUPERADMIN
2. Check browser console for errors
3. Verify tRPC query is being called: `settings.getSyncSettings`
4. Check database for settings: `SELECT * FROM "Setting" WHERE key LIKE 'sync:%'`

### Worker Not Using New Settings

1. Verify settings saved to database
2. Re-deploy worker
3. Check worker logs for "Loaded sync settings from database"
4. Verify cron-to-ms conversion is correct

### Cron Validation Errors

1. Verify format: `minute hour day month day-of-week`
2. Check ranges: minute (0-59), hour (0-23), day (1-31), month (1-12), day-of-week (0-6)
3. Use `*` for any value or `*/n` for intervals
4. Examples:
   - `0 * * * *` ✅ Every hour
   - `*/15 * * * *` ✅ Every 15 minutes
   - `0 0 * * *` ✅ Daily
   - `0 0 * * 0` ✅ Weekly (Sunday)
   - `0 0 1 * *` ✅ Monthly

## Future Enhancements

1. **Dynamic Scheduling (Option B)**:
   - Implement runtime scheduler that checks DB every minute
   - Allow changes without re-deploy
   - More complex but more flexible

2. **Advanced Cron Validation**:
   - Full cron expression validation
   - Suggest next run times
   - Conflict detection

3. **Monitoring & Analytics**:
   - Track job execution times
   - Alert on job failures
   - Dashboard for sync health

4. **Per-Tenant Settings**:
   - Allow different schedules per tenant
   - Tenant-specific overrides

5. **UI Enhancements**:
   - Cron expression builder
   - Visual schedule preview
   - Timezone support
