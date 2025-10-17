# Testing Guide: Pool Predictions & Participants

## Quick Start Testing

### 1. Prerequisites
```bash
# Ensure database is running and migrated
pnpm db:push

# Seed data if needed
pnpm db:seed

# Start dev server
pnpm dev
```

### 2. Test Pool Landing (Glassmorphism)

**URL**: `http://localhost:3000/{poolSlug}`

**What to verify**:
- ✅ Hero section displays with background image/video
- ✅ Glass card is visible with blur effect
- ✅ Brand logo displays correctly
- ✅ Status badge shows "Activa" (green) or "Finalizada" (red)
- ✅ Stats grid shows participants, prizes, competition
- ✅ CTAs change based on state:
  - Not logged in → "Únete ahora"
  - Logged in + registered → "Hacer pronósticos" + "Ver tabla"
  - Expired → "Ver tabla final"
- ✅ "How It Works" section with 3 glass cards
- ✅ Prizes section displays correctly
- ✅ Text is readable over background (contrast)

**Test dark mode**:
- Toggle theme and verify glass effect adjusts

---

### 3. Test Predictions Module

#### 3A. Access Control Tests

**Test 1: Unauthenticated Access**
```
URL: /pool/{poolSlug}/predict
Expected: Redirect to /{poolSlug}?error=auth_required
```

**Test 2: Not Registered**
```
1. Sign in as user
2. Navigate to /pool/{poolSlug}/predict (without registering)
Expected: Redirect to /{poolSlug}?error=REGISTRATION_REQUIRED
```

**Test 3: PUBLIC Pool - Registered**
```
1. Sign in
2. Register for PUBLIC pool
3. Navigate to /pool/{poolSlug}/predict
Expected: Predictions page loads with fixtures
```

**Test 4: CODE Pool - Without Code**
```
1. Sign in
2. Register for CODE pool WITHOUT redeeming code
3. Navigate to /pool/{poolSlug}/predict
Expected: Redirect to /{poolSlug}?error=CODE_REQUIRED
```

**Test 5: CODE Pool - With Valid Code**
```
1. Sign in
2. Register for CODE pool WITH valid code
3. Navigate to /pool/{poolSlug}/predict
Expected: Predictions page loads
```

**Test 6: EMAIL_INVITE Pool - Invitation Not Accepted**
```
1. Sign in with invited email
2. Registration exists but invitation status = PENDING
3. Navigate to /pool/{poolSlug}/predict
Expected: Redirect to /{poolSlug}?error=INVITATION_NOT_ACCEPTED
```

**Test 7: EMAIL_INVITE Pool - Invitation Accepted**
```
1. Sign in with invited email
2. Accept invitation (status = ACCEPTED)
3. Navigate to /pool/{poolSlug}/predict
Expected: Predictions page loads
```

#### 3B. Predictions UI Tests

**Test 8: Display Fixtures**
```
Expected:
- ✅ Matches grouped/sorted by date
- ✅ Team logos display
- ✅ Team names display
- ✅ Kickoff time shows
- ✅ Status badges (Programado/Bloqueado/Finalizado)
- ✅ Countdown timer for upcoming matches
```

**Test 9: Filters**
```
Click each filter tab:
- "Pendientes" → Shows only unlocked, scheduled matches
- "Hoy" → Shows matches today
- "Todos" → Shows all matches
- "Finalizados" → Shows finished matches
```

**Test 10: Input Predictions**
```
1. Find an unlocked match
2. Enter home score (e.g., 2)
3. Enter away score (e.g., 1)
Expected:
- ✅ Match row highlights (ring-2 ring-primary)
- ✅ "Guardar todo" button shows count (1)
- ✅ Inputs accept only integers ≥ 0
```

**Test 11: Save Single Prediction**
```
1. Enter prediction
2. Click "Guardar todo"
Expected:
- ✅ Toast: "1 pronósticos guardados"
- ✅ Highlight removed
- ✅ Button disabled (no dirty changes)
```

**Test 12: Bulk Save**
```
1. Enter predictions for 5 matches
2. Click "Guardar todo (5)"
Expected:
- ✅ Loading state shows
- ✅ Toast: "5 pronósticos guardados"
- ✅ All highlights removed
```

**Test 13: Lock Enforcement (UI)**
```
1. Find a match with kickoff in past
Expected:
- ✅ Inputs are disabled
- ✅ Badge shows "Bloqueado" (red)
- ✅ Lock icon visible
```

**Test 14: Lock Enforcement (Server)**
```
1. Manually set match kickoffTime to past in DB
2. Try to save prediction via API
Expected:
- ✅ Error: "MATCH_LOCKED"
- ✅ Toast shows error message
```

**Test 15: Countdown Timer**
```
1. Find match with kickoff in 2 hours
Expected:
- ✅ Badge shows "2h 0m"
- ✅ Updates every minute
- ✅ When countdown reaches 0, input locks
```

**Test 16: Optimistic UI**
```
1. Disconnect network (DevTools → Offline)
2. Enter prediction
3. Click save
Expected:
- ✅ UI updates immediately
- ✅ Error toast appears
- ✅ Changes revert (rollback)
```

---

### 4. Test Participants Page

**URL**: `/pool/{poolSlug}/participants`

**Test 17: Display Participants**
```
Expected:
- ✅ Summary cards show stats
- ✅ Table displays all participants
- ✅ Rank column shows position
- ✅ Top 3 have colored badges (gold/silver/bronze)
- ✅ Points column is bold and primary color
```

**Test 18: Search**
```
1. Type participant name in search
Expected:
- ✅ Table filters in real-time
- ✅ Results update
```

**Test 19: Sorting**
```
Click column headers:
- "Puntos" → Sort by points (desc by default)
- "Exactos" → Sort by exact count
- "Signos" → Sort by sign count
- "Pronósticos" → Sort by predictions count
- "Nombre" → Sort alphabetically
Expected:
- ✅ Arrow icon shows sort direction
- ✅ Click again to toggle asc/desc
```

**Test 20: Pagination**
```
If > 20 participants:
Expected:
- ✅ "Página 1 de X" shows
- ✅ "Siguiente" button enabled
- ✅ Click "Siguiente" → Page 2 loads
- ✅ "Anterior" button enabled on page 2
```

**Test 21: Metrics Accuracy**
```
Verify for one participant:
- ✅ Points = sum of awardedPoints
- ✅ Exactos = count of exact score predictions
- ✅ Signos = count of correct 1X2 predictions
- ✅ Fallas = count of incorrect predictions
- ✅ Empates = count of correctly predicted draws
- ✅ A tiempo % = (on-time / total) * 100
```

**Test 22: Finalized Pool Badge**
```
1. Set pool endDate to past
2. Reload page
Expected:
- ✅ "Finalizada" badge shows
```

---

## Manual API Testing (via tRPC Panel or DevTools)

### Test predictions.getByPool
```typescript
// Should succeed if registered
await trpc.predictions.getByPool.query({ poolId: "pool_123" });

// Should fail if not registered
// Expected: FORBIDDEN
```

### Test predictions.save
```typescript
// Should succeed if match not locked
await trpc.predictions.save.mutate({
  poolId: "pool_123",
  matchId: "match_123",
  homeScore: 2,
  awayScore: 1
});

// Should fail if match locked
// Expected: FORBIDDEN with message "MATCH_LOCKED"
```

### Test predictions.bulkSave
```typescript
await trpc.predictions.bulkSave.mutate({
  poolId: "pool_123",
  predictions: [
    { matchId: "match_1", homeScore: 2, awayScore: 1 },
    { matchId: "match_2", homeScore: 0, awayScore: 0 }
  ]
});

// Returns: { saved: 2, errors: [], predictions: [...] }
```

### Test participants.metrics
```typescript
await trpc.participants.metrics.query({
  poolId: "pool_123",
  search: "john",
  sortBy: "points",
  sortOrder: "desc",
  page: 1,
  pageSize: 20
});

// Returns: { participants: [...], total: X, summary: {...} }
```

---

## Unit Tests

```bash
# Run middleware tests
pnpm test packages/api/src/middleware/require-registration.test.ts

# Expected: All tests pass
# ✓ PUBLIC pool with valid registration
# ✓ No registration → FORBIDDEN
# ✓ CODE policy without code → FORBIDDEN
# ✓ CODE policy with valid code → OK
# ✓ EMAIL_INVITE without accepted invitation → FORBIDDEN
# ✓ EMAIL_INVITE with accepted invitation → OK
```

---

## E2E Tests (Playwright - Recommended)

```typescript
// Example E2E test
test('Complete prediction flow', async ({ page }) => {
  // 1. Sign in
  await page.goto('/auth/signin');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  
  // 2. Register for pool
  await page.goto('/register?pool=mundial-2026');
  await page.click('text=Registrarse');
  
  // 3. Navigate to predictions
  await page.goto('/pool/mundial-2026/predict');
  
  // 4. Enter prediction
  await page.fill('[aria-label*="Marcador local"]', '2');
  await page.fill('[aria-label*="Marcador visitante"]', '1');
  
  // 5. Save
  await page.click('text=Guardar todo');
  
  // 6. Verify toast
  await expect(page.locator('text=pronósticos guardados')).toBeVisible();
});
```

---

## Performance Testing

### Load Test Participants Page
```bash
# Use Apache Bench or similar
ab -n 1000 -c 10 http://localhost:3000/pool/mundial-2026/participants

# Monitor:
# - Response time < 500ms
# - No memory leaks
# - Database query count
```

### Monitor Countdown Performance
```
1. Open DevTools → Performance
2. Navigate to predictions page
3. Record for 2 minutes
Expected:
- ✅ No excessive re-renders
- ✅ Countdown updates every 60s (not every second)
- ✅ CPU usage stays low
```

---

## Accessibility Testing

### Keyboard Navigation
```
1. Tab through predictions page
Expected:
- ✅ All inputs focusable
- ✅ Focus visible (ring)
- ✅ Can navigate entire form
- ✅ Can save with Enter key
```

### Screen Reader
```
1. Enable screen reader (NVDA/JAWS)
2. Navigate predictions page
Expected:
- ✅ Inputs have clear labels
- ✅ Status badges announced
- ✅ Table headers announced
```

### Color Contrast
```
1. Use DevTools → Lighthouse → Accessibility
Expected:
- ✅ All text meets WCAG AA (4.5:1)
- ✅ White text on dark overlay readable
```

---

## Common Issues & Solutions

### Issue: Glass card not visible
**Solution**: Check if background image/video is loading. Verify `hasHeroMedia` is true.

### Issue: Predictions not saving
**Solution**: Check browser console for errors. Verify registration exists and match not locked.

### Issue: Countdown not updating
**Solution**: Check if `useCountdown` hook is running. Verify interval is set correctly (60s).

### Issue: Participants table empty
**Solution**: Verify predictions exist in database. Check tenant scoping in query.

### Issue: Access denied on /predict
**Solution**: Check registration status and access policy. Verify code/invitation if required.

---

## Checklist Before Production

- [ ] All unit tests pass
- [ ] E2E tests cover critical flows
- [ ] Accessibility audit passes (Lighthouse)
- [ ] Performance audit passes (< 500ms load)
- [ ] Dark mode works correctly
- [ ] Mobile responsive (test on 320px width)
- [ ] Error states display correctly
- [ ] Toast messages are clear and translated
- [ ] Lock enforcement works (UI + server)
- [ ] Tenant scoping verified
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Lint passes

---

**Last Updated**: 2025-01-14  
**Status**: Ready for Testing
