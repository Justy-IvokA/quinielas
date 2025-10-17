# Invitations & Codes Management - Next Steps

## What Was Completed

### ✅ 1. Backend Analysis
- Verified all tRPC routers exist and are functional:
  - `packages/api/src/routers/access/index.ts` - Complete with all mutations and queries
  - `packages/api/src/services/invites.service.ts` - Full invitation management
  - `packages/api/src/services/codes.service.ts` - Full code batch management

### ✅ 2. i18n Messages
- Added comprehensive Spanish translations to `apps/admin/messages/es-MX.json`:
  - **invitations** section (60+ keys)
  - **codes** section (50+ keys)
  - Includes all UI labels, messages, tooltips, and error states

### ✅ 3. Documentation
- Created `INVITATIONS_CODES_IMPLEMENTATION.md` with:
  - Complete implementation guide
  - File structure
  - tRPC integration examples
  - Feature specifications
  - Testing checklist

## What Needs To Be Done

### 🔧 1. Fix Corrupted Invitations Page
**File**: `apps/admin/app/[locale]/(authenticated)/pools/[id]/invitations/page.tsx`

**Issue**: File got corrupted during incremental edits due to complex string replacements.

**Solution**: Rewrite the file from scratch using the implementation guide. Key sections:
1. Imports (all UI components, icons, tRPC)
2. State management (search, filters, selection, modals)
3. tRPC queries (pool, accessPolicy, invitations, stats)
4. tRPC mutations (upload, send, resend)
5. Handler functions (CSV upload, create, send, resend, copy link)
6. Filter logic (useMemo for search + status filter)
7. UI components (stats cards, progress bar, filters, table)
8. Modals (create invitations, send confirmation)

### 🔧 2. Enhance Codes Page
**File**: `apps/admin/app/[locale]/(authenticated)/pools/[id]/codes/page.tsx`

**Current State**: Basic structure exists but needs:
- tRPC integration for queries and mutations
- Batch details modal
- CSV download functionality
- Pause/unpause batch actions
- Better UI with Card components

**Changes Needed**:
1. Add tRPC queries for batches and stats
2. Replace basic modals with proper Dialog components
3. Add CSV download handler using `downloadCodes` query
4. Implement batch details modal with codes list
5. Add pause/unpause functionality
6. Use i18n translations

### 🔧 3. Create Modal Components

#### a. CreateInvitationsModal.tsx
```
apps/admin/app/[locale]/(authenticated)/pools/[id]/invitations/_components/CreateInvitationsModal.tsx
```

**Props**:
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolId: string;
  accessPolicyId: string;
  tenantId: string;
  brandId: string;
  onSuccess: () => void;
}
```

**Features**:
- Textarea for emails (one per line)
- Live validation and count
- Submit with loading state
- Success/error handling

#### b. SendInvitationsModal.tsx
```
apps/admin/app/[locale]/(authenticated)/pools/[id]/invitations/_components/SendInvitationsModal.tsx
```

**Props**:
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolId: string;
  tenantId: string;
  brandId: string;
  selectedIds: string[];
  onSuccess: () => void;
}
```

**Features**:
- Confirmation dialog
- Show count of invitations to send
- Loading state during send
- Success feedback

#### c. CreateCodeBatchModal.tsx
```
apps/admin/app/[locale]/(authenticated)/pools/[id]/codes/_components/CreateCodeBatchModal.tsx
```

**Props**:
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessPolicyId: string;
  tenantId: string;
  onSuccess: (batchId: string) => void;
}
```

**Features**:
- Form with all batch fields
- Code preview showing format
- Validation (quantity 1-1000, prefix max 10)
- Progress indicator during generation
- Option to download CSV immediately

#### d. CodeBatchDetailsModal.tsx
```
apps/admin/app/[locale]/(authenticated)/pools/[id]/codes/_components/CodeBatchDetailsModal.tsx
```

**Props**:
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  tenantId: string;
}
```

**Features**:
- Table of all codes in batch
- Search functionality
- Export CSV button
- Pause/unpause individual codes
- Status badges

### 🔧 4. Wizard Integration
**File**: `apps/admin/app/[locale]/(authenticated)/pools/new/components/steps/StepAccess.tsx`

**Changes**:
1. Add helper text when CODE or EMAIL_INVITE is selected
2. Show message: "You can manage codes/invitations after creating the pool"
3. Optional: Add quick links in StepReview to navigate to invitations/codes pages after pool creation

**Example Addition**:
```tsx
{accessType === "CODE" && (
  <Alert>
    <Info className="h-4 w-4" />
    <AlertTitle>Códigos de Invitación</AlertTitle>
    <AlertDescription>
      Podrás crear y gestionar lotes de códigos después de crear la quiniela.
    </AlertDescription>
  </Alert>
)}

{accessType === "EMAIL_INVITE" && (
  <Alert>
    <Mail className="h-4 w-4" />
    <AlertTitle>Invitaciones por Email</AlertTitle>
    <AlertDescription>
      Podrás crear y enviar invitaciones por email después de crear la quiniela.
    </AlertDescription>
  </Alert>
)}
```

### 🔧 5. CSV Utilities
**File**: `apps/admin/src/lib/csv-utils.ts` (NEW)

Create utility functions for CSV handling:

```typescript
export function parseEmailsCsv(text: string): string[] {
  const lines = text.split('\n');
  return lines
    .map(line => line.trim())
    .filter(line => line && line.includes('@'));
}

export function generateCodesCsv(codes: Array<{
  code: string;
  status: string;
  usedCount: number;
  usesPerCode: number;
  expiresAt?: string;
}>): string {
  const headers = ['Code', 'Status', 'Used Count', 'Uses Per Code', 'Expires At'];
  const rows = codes.map(c => [
    c.code,
    c.status,
    c.usedCount.toString(),
    c.usesPerCode.toString(),
    c.expiresAt || 'Never'
  ]);
  
  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

## Implementation Order

1. **Create CSV utilities** (easiest, no dependencies)
2. **Fix invitations page** (most complex, reference for codes page)
3. **Create invitation modals** (can be done in parallel with #2)
4. **Enhance codes page** (similar to invitations page)
5. **Create code modals** (similar to invitation modals)
6. **Wizard integration** (final touch, simple)

## Testing Strategy

### Manual Testing
1. Create a pool with EMAIL_INVITE access type
2. Navigate to invitations page
3. Test CSV upload
4. Test manual email entry
5. Test search and filters
6. Test bulk selection and send
7. Test individual resend and copy link
8. Verify stats update correctly

9. Create a pool with CODE access type
10. Navigate to codes page
11. Test batch creation with various parameters
12. Test CSV download
13. Test batch details modal
14. Test pause/unpause
15. Verify stats update correctly

### Automated Testing (Future)
- Unit tests for CSV utilities
- Integration tests for tRPC mutations
- E2E tests for critical flows (Playwright)

## Known Issues & Considerations

1. **Email Sending**: Backend has TODO comments for actual email integration. Currently just logs URLs.
2. **File Upload Size**: Consider adding file size validation for CSV uploads
3. **Rate Limiting**: Backend should implement rate limiting for bulk operations
4. **Pagination**: Invitations/codes lists may need pagination for large datasets
5. **Real-time Updates**: Consider WebSocket updates for invitation status changes

## Resources

- **Backend Routers**: `packages/api/src/routers/access/index.ts`
- **Services**: `packages/api/src/services/{invites,codes}.service.ts`
- **i18n**: `apps/admin/messages/es-MX.json` (lines 710-855)
- **UI Components**: `packages/ui/src/components/`
- **Similar Implementations**: 
  - `apps/admin/app/[locale]/(authenticated)/pools/[id]/edit/_components/prizes-table.tsx` (for table patterns)
  - `apps/admin/app/[locale]/(authenticated)/pools/[id]/edit/_components/general-form.tsx` (for form patterns)

## Quick Start Command

To fix the corrupted invitations page, you can:

1. **Option A**: Manually rewrite using the guide in `INVITATIONS_CODES_IMPLEMENTATION.md`
2. **Option B**: Use git to restore and start fresh:
   ```powershell
   # Note: This won't work due to parentheses in path, need to escape or use full path
   git restore "apps/admin/app/[locale]/(authenticated)/pools/[id]/invitations/page.tsx"
   ```
3. **Option C**: Copy from a working example and adapt

## Success Criteria

- [ ] Invitations page loads without errors
- [ ] Can create invitations via CSV or manual entry
- [ ] Can send invitations (bulk and individual)
- [ ] Can resend and copy invitation links
- [ ] Stats display correctly
- [ ] Codes page loads without errors
- [ ] Can create code batches
- [ ] Can download code CSV
- [ ] Can view batch details
- [ ] Can pause/unpause batches
- [ ] All strings use i18n translations
- [ ] Mobile responsive (tables scroll horizontally)
- [ ] Loading states work correctly
- [ ] Error handling is user-friendly

## Estimated Time

- CSV utilities: 30 minutes
- Fix invitations page: 2-3 hours
- Create invitation modals: 1-2 hours
- Enhance codes page: 2-3 hours
- Create code modals: 1-2 hours
- Wizard integration: 30 minutes
- Testing: 1-2 hours

**Total**: ~10-14 hours

## Contact

If you encounter issues or need clarification, refer to:
- `INVITATIONS_CODES_IMPLEMENTATION.md` for detailed specs
- Backend router code for API contracts
- Existing admin pages for UI patterns
