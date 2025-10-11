# Prizes & Awards Migration Guide

## Schema Changes

The following changes have been made to the Prisma schema:

### 1. New PrizeType Enum
```prisma
enum PrizeType {
  CASH
  DISCOUNT
  SERVICE
  DAY_OFF
  EXPERIENCE
  OTHER
}
```

### 2. Updated Prize Model
- Changed `position` to `rankFrom` and `rankTo` (rank ranges)
- Added `type` field (PrizeType enum)
- Added `metadata` JSON field
- Added `updatedAt` timestamp
- Updated unique constraint to `[poolId, rankFrom, rankTo]`

### 3. Updated PrizeAward Model
- Added `rank` field (Int)
- Added `deliveredAt` timestamp
- Added `evidence` JSON field
- Added `notified` boolean flag
- Added `createdAt` and `updatedAt` timestamps
- Added index on `userId`

### 4. Updated Invitation Model
- Added `openedAt`, `clickedAt`, `bouncedAt` timestamps for tracking
- Added `updatedAt` timestamp

### 5. Updated CodeBatch Model
- Added `prefix` field
- Added `metadata` JSON field
- Added `validFrom` and `validTo` timestamps

### 6. Updated LeaderboardSnapshot Model
- Added `kind` field (default "LIVE", can be "FINAL")
- Added index on `[poolId, kind]`

## Migration Steps

Run the following command to create and apply the migration:

```bash
cd packages/db
npx prisma migrate dev --name prizes_awards_analytics_enhancements
```

Or manually:

```bash
npx prisma migrate dev
```

## Post-Migration

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Update existing Prize records** (if any):
   ```sql
   -- This migration will require manual data transformation if you have existing prizes
   -- The old 'position' field needs to be mapped to 'rankFrom' and 'rankTo'
   ```

3. **Verify the migration:**
   ```bash
   npx prisma db push --accept-data-loss
   ```

## Rollback (if needed)

If you need to rollback:

```bash
npx prisma migrate resolve --rolled-back <migration-name>
```

## Notes

- The migration is **breaking** for existing Prize data due to field changes
- Backup your database before running the migration
- Test in development environment first
- The `position` field is replaced with `rankFrom` and `rankTo` for range-based prizes
