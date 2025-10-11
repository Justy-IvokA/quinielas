# Prizes, Awards, Invitations & Analytics Implementation

## Summary

Implemented comprehensive prizes & awards system, invitations/codes management, and analytics dashboards for Quinielas WL platform.

## ✅ Completed Features

### 1. Database Schema Updates

**New Enum:**
- `PrizeType`: CASH, DISCOUNT, SERVICE, DAY_OFF, EXPERIENCE, OTHER

**Updated Models:**
- **Prize**: Changed from position-based to rank ranges (`rankFrom`, `rankTo`), added type, metadata, timestamps
- **PrizeAward**: Added rank, deliveredAt, evidence (JSON), notified flag, timestamps
- **Invitation**: Added tracking fields (openedAt, clickedAt, bouncedAt)
- **CodeBatch**: Added prefix, metadata, validFrom/validTo
- **LeaderboardSnapshot**: Added kind field ("LIVE" or "FINAL")

### 2. Backend API (tRPC Routers)

#### Prizes Router (`packages/api/src/routers/prizes/`)
- `listByPool`: Get all prizes for a pool
- `getById`: Get single prize details
- `create`: Create prize with rank range validation
- `update`: Update prize with overlap checking
- `delete`: Delete prize (prevents if awards exist)
- `reorder`: Batch update rank ranges
- **Validation**: Prevents overlapping rank ranges

#### Awards Router (`packages/api/src/routers/awards/`)
- `listByPool`: List awards with filters (delivered/pending)
- `getUserAwards`: Get awards for a specific user
- `recordEvidence`: Record delivery evidence and notes
- `exportCsv`: Export awards data as CSV

#### Analytics Router (`packages/api/src/routers/analytics/`)
- `adoption`: Registrations, invitation stats, completion rates
- `predictions`: Volume, timing, accuracy metrics
- `traffic`: Registration peaks by hour, top actions

#### Access Router Extensions (`packages/api/src/routers/access/`)
- `uploadInvitationsCsv`: Bulk upload emails from CSV
- `sendInvitations`: Send all or specific invitations
- `invitationStats`: Detailed invitation metrics
- `codeStats`: Code batch statistics and redemption rates
- `downloadCodes`: Export code batch as CSV

### 3. CSV Utilities (`packages/utils/src/csv/`)

- **awards.ts**: Generate awards CSV with BOM for Excel
- **invitations.ts**: Generate/parse invitation CSVs
- **codes.ts**: Generate code batch CSVs

### 4. Worker Jobs (`apps/worker/src/jobs/`)

#### award-prizes.ts
- Reads FINAL leaderboard snapshot
- Assigns prizes to winners based on rank ranges
- **Idempotent**: Skips existing awards
- Creates audit log
- Supports dry-run mode

#### finalize-pool.ts
- Verifies all matches finished (or force)
- Calculates final leaderboard with tie-breaking
- Creates FINAL snapshot
- Triggers award-prizes job
- Marks pool as inactive
- Creates audit log

### 5. Admin UI Pages (`apps/admin/app/[locale]/`)

#### Prizes Page (`pools/[id]/prizes/page.tsx`)
- List prizes with rank ranges
- Add/Edit/Delete prizes
- Validation feedback via Sonner toasts
- Drag-reorder support (TODO: implement)

#### Awards Page (`pools/[id]/awards/page.tsx`)
- List all awards with filters (all/delivered/pending)
- Record delivery evidence modal
- Export CSV functionality
- Winner details display

#### Invitations Page (`pools/[id]/invitations/page.tsx`)
- Upload CSV of emails
- Stats cards (total, sent, opened, activated)
- Progress bar for activation rate
- Send all/resend individual invitations
- Table view with status tracking

#### Codes Page (`pools/[id]/codes/page.tsx`)
- Create code batches with prefix
- Stats cards (total, used, redemption rate)
- Download CSV per batch
- Usage progress bars
- Batch management

#### Analytics Page (`analytics/[poolId]/page.tsx`)
- Date range filters
- Adoption metrics section
- Predictions metrics section
- Traffic metrics section
- Export JSON functionality
- Chart placeholders (ready for charting library)

## 🔧 Integration Steps

### 1. Run Migration

```bash
cd packages/db
npx prisma migrate dev --name prizes_awards_analytics_enhancements
npx prisma generate
```

### 2. Update Seed Data (Optional)

Update `packages/db/src/seed.ts` to include sample prizes:

```typescript
await prisma.prize.createMany({
  data: [
    {
      poolId: pool.id,
      tenantId: tenant.id,
      rankFrom: 1,
      rankTo: 1,
      type: "CASH",
      title: "First Place",
      value: "$1000",
      description: "Grand prize winner"
    },
    {
      poolId: pool.id,
      tenantId: tenant.id,
      rankFrom: 2,
      rankTo: 3,
      type: "DISCOUNT",
      title: "Runner Up",
      value: "50% off",
      description: "Second and third place"
    }
  ]
});
```

### 3. Connect tRPC in UI

Each admin page has TODO comments where tRPC hooks should be added:

```typescript
// Example for prizes page
import { trpc } from "@/lib/trpc";

const { data: prizes, isLoading } = trpc.prizes.listByPool.useQuery({ poolId });
const createPrize = trpc.prizes.create.useMutation();
```

### 4. Add Navigation Links

Update admin sidebar/navigation to include:
- Prizes (per pool)
- Awards (per pool)
- Invitations (per pool)
- Codes (per pool)
- Analytics (per pool)

### 5. Email Integration

Update `sendInvitations` and worker jobs to use EmailAdapter:

```typescript
import { EmailAdapter } from "@qp/email";

await EmailAdapter.send({
  to: invitation.email,
  subject: "You're invited!",
  template: "invitation",
  data: { token: invitation.token, poolName: pool.name }
});
```

## 📊 Usage Examples

### Award Prizes Manually

```typescript
import { awardPrizesJob } from "./jobs/award-prizes";

// Dry run first
const dryRun = await awardPrizesJob({
  poolId: "pool123",
  tenantId: "tenant123",
  dryRun: true
});

console.log(`Would create ${dryRun.awardsCreated} awards`);

// Then run for real
const result = await awardPrizesJob({
  poolId: "pool123",
  tenantId: "tenant123"
});
```

### Finalize Pool

```typescript
import { finalizePoolJob } from "./jobs/finalize-pool";

const result = await finalizePoolJob({
  poolId: "pool123",
  tenantId: "tenant123",
  force: false // Set true to finalize with unfinished matches
});

console.log(`Created ${result.awardsCreated} awards`);
console.log("Top winners:", result.topWinners);
```

### Upload Invitations

```typescript
const result = await trpc.access.uploadInvitationsCsv.mutate({
  poolId,
  accessPolicyId,
  tenantId,
  emails: ["user1@example.com", "user2@example.com"],
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
});
```

## 🧪 Testing Checklist

- [ ] Create prize with valid rank range
- [ ] Attempt to create overlapping prize (should fail)
- [ ] Update prize rank range
- [ ] Delete prize without awards
- [ ] Attempt to delete prize with awards (should fail)
- [ ] Upload CSV of invitations
- [ ] Send invitations
- [ ] Create code batch with prefix
- [ ] Download code batch CSV
- [ ] Run award-prizes job (dry-run)
- [ ] Run finalize-pool job
- [ ] Record delivery evidence
- [ ] Export awards CSV
- [ ] View analytics with date filters
- [ ] Export analytics JSON

## 🎨 UI Enhancements (Optional)

1. **Add charting library** (e.g., Recharts, Chart.js):
   - Registrations over time
   - Predictions by matchday
   - Traffic by hour

2. **Drag-and-drop for prizes reorder**:
   - Use `@dnd-kit/core` or similar

3. **Rich text editor for prize descriptions**:
   - Use Tiptap or similar

4. **Image upload for prize images**:
   - Integrate with storage provider

5. **Real-time updates**:
   - Use tRPC subscriptions for live stats

## 🔒 Security Notes

- All mutations check `tenantId` for multi-tenant isolation
- Rate limiting should be added to CSV upload endpoints
- Email sending should be queued (not blocking)
- Prize deletion prevented if awards exist
- Finalize pool requires explicit confirmation

## 📝 Next Steps

1. Run migration and generate Prisma client
2. Connect tRPC hooks in UI components
3. Add navigation links to admin sidebar
4. Integrate email service for invitations
5. Add tests for critical flows
6. Deploy and test in staging environment

## 🐛 Known Limitations

- UI pages are client-side only (no SSR)
- Charts are placeholders (need charting library)
- Email sending is stubbed (needs EmailAdapter integration)
- No pagination on large lists
- No search/filter on awards/invitations tables
- CSV parsing is basic (no validation for malformed files)
