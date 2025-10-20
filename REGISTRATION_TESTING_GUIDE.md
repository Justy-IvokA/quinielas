# Registration Flows Testing Guide

## Quick Start

### Prerequisites

1. **Database seeded** with test data
2. **Auth configured** (email or OAuth)
3. **Environment variables** set:
   ```env
   NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_key  # Optional for CAPTCHA testing
   ```

### Test Accounts

Create test users via signin flow or seed script.

## Testing Scenarios

### Scenario 1: Public Registration Flow

**Setup**:
1. Create a pool with PUBLIC access policy
2. Set optional constraints:
   - `maxRegistrations`: 10
   - `registrationStartDate`: future date (for countdown test)
   - `registrationEndDate`: future date
   - `requireCaptcha`: true (for CAPTCHA test)

**Test Steps**:

1. **Navigate to pool landing page**:
   ```
   http://ivoka.localhost:3000/liga-mx-13
   ```

2. **Click "Únete ahora" button**
   - Should redirect to signin if not logged in
   - Should redirect to registration if logged in

3. **Complete registration form**:
   - Display Name: "Test User"
   - Email: "test@example.com"
   - Phone: "+525512345678" (optional)
   - Accept Terms: ✓
   - Complete CAPTCHA (if enabled)

4. **Submit form**
   - Should show success modal
   - Should redirect to `/pool/[slug]/predict`

5. **Verify in database**:
   ```sql
   SELECT * FROM "Registration" WHERE "userId" = 'your_user_id';
   ```

**Expected Results**:
- ✓ Registration created
- ✓ Audit log entry created
- ✓ User redirected to predictions page
- ✓ Attempting to register again shows "already registered"

**Edge Cases to Test**:
- [ ] Registration before start date → shows countdown
- [ ] Registration after end date → shows error
- [ ] Pool at capacity → shows "full" error
- [ ] Missing CAPTCHA → shows error
- [ ] Terms not accepted → shows validation error

---

### Scenario 2: Code Registration Flow

**Setup**:
1. Create a pool with CODE access policy
2. Create a code batch with invite codes:
   ```sql
   -- Via admin panel or seed script
   INSERT INTO "InviteCode" (code, usesPerCode, usedCount, status, ...)
   VALUES ('ABCD1234', 5, 0, 'UNUSED', ...);
   ```

**Test Steps**:

1. **Navigate with code parameter** (optional):
   ```
   http://ivoka.localhost:3000/auth/register/liga-mx-13?code=ABCD1234
   ```

2. **Or navigate without code**:
   ```
   http://ivoka.localhost:3000/auth/register/liga-mx-13
   ```

3. **Enter invite code**:
   - Type: "ABCD1234"
   - Click "Validar"
   - Should show green checkmark and remaining uses

4. **Complete registration form** (appears after validation):
   - Display Name: "Code User"
   - Email: "codeuser@example.com"
   - Phone: "+525512345678" (optional)
   - Accept Terms: ✓

5. **Submit form**
   - Should show success modal
   - Should redirect to predictions page

6. **Verify in database**:
   ```sql
   SELECT * FROM "Registration" WHERE "inviteCodeId" IS NOT NULL;
   SELECT "usedCount", "status" FROM "InviteCode" WHERE "code" = 'ABCD1234';
   ```

**Expected Results**:
- ✓ Registration created with `inviteCodeId`
- ✓ Code `usedCount` incremented
- ✓ Code status updated to `PARTIALLY_USED` or `USED`
- ✓ Audit log entry created

**Edge Cases to Test**:
- [ ] Invalid code format → validation error
- [ ] Non-existent code → "Invalid invite code"
- [ ] Expired code → "Code has expired"
- [ ] Maxed out code → "Usage limit reached"
- [ ] Paused code → "Code is paused"
- [ ] Submit without validating → "Validate code first"

---

### Scenario 3: Email Invite Registration Flow

**Setup**:
1. Create a pool with EMAIL_INVITE access policy
2. Create an email invitation:
   ```sql
   -- Via admin panel or seed script
   INSERT INTO "Invitation" (email, token, status, expiresAt, ...)
   VALUES ('invited@example.com', 'a1b2c3...', 'PENDING', NOW() + INTERVAL '7 days', ...);
   ```

**Test Steps**:

1. **Navigate with token parameter**:
   ```
   http://ivoka.localhost:3000/auth/register/liga-mx-13?token=a1b2c3d4e5f6...
   ```

2. **Wait for token validation**
   - Should show loading spinner
   - Should auto-fill email (read-only)

3. **Complete registration form**:
   - Email: "invited@example.com" (locked)
   - Display Name: "Invited User"
   - Phone: "+525512345678" (optional)
   - Accept Terms: ✓

4. **Submit form**
   - Should show success modal
   - Should redirect to predictions page

5. **Verify in database**:
   ```sql
   SELECT * FROM "Registration" WHERE "invitationId" IS NOT NULL;
   SELECT "status", "acceptedAt" FROM "Invitation" WHERE "token" = 'a1b2c3...';
   ```

**Expected Results**:
- ✓ Registration created with `invitationId`
- ✓ Invitation status changed to `ACCEPTED`
- ✓ Invitation `acceptedAt` timestamp set
- ✓ Audit log entry created

**Edge Cases to Test**:
- [ ] Missing token parameter → "Token required"
- [ ] Invalid token format → validation error
- [ ] Non-existent token → "Invalid invitation"
- [ ] Expired token → "Invitation expired" + resend option
- [ ] Already accepted token → "Already used"
- [ ] Email mismatch → should not be possible (email locked)

---

## Cross-Flow Tests

### Authentication Integration

**Test**: Not logged in
1. Navigate to registration URL
2. Should redirect to signin with callback
3. After signin, should return to registration

**Test**: Already registered
1. Register for a pool
2. Try to register again
3. Should redirect to pool dashboard

### Branding Integration

**Test**: Multi-tenant branding
1. Access pool via branded subdomain
2. Verify brand colors, logo applied
3. Verify hero media displays (if configured)

### CAPTCHA Integration

**Test**: CAPTCHA force mode
1. Set `captchaLevel` to "force"
2. CAPTCHA should always appear
3. Submission without token should fail

**Test**: CAPTCHA auto mode
1. Set `captchaLevel` to "auto"
2. CAPTCHA should appear on anomaly
3. Normal users should not see CAPTCHA

**Test**: CAPTCHA off mode
1. Set `captchaLevel` to "off"
2. CAPTCHA should never appear
3. Submission should work without token

### Success Modal

**Test**: Modal interactions
1. Complete registration
2. Modal should appear with pool name
3. Click "Ir a hacer pronósticos" → redirects
4. Click share buttons → opens share dialogs

---

## Database Verification Queries

### Check Registration Types
```sql
SELECT 
  COUNT(*) FILTER (WHERE "inviteCodeId" IS NULL AND "invitationId" IS NULL) as public_count,
  COUNT(*) FILTER (WHERE "inviteCodeId" IS NOT NULL) as code_count,
  COUNT(*) FILTER (WHERE "invitationId" IS NOT NULL) as invite_count
FROM "Registration";
```

### Check Code Usage
```sql
SELECT 
  code,
  "usesPerCode",
  "usedCount",
  status,
  "expiresAt"
FROM "InviteCode"
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Check Invitation Status
```sql
SELECT 
  email,
  status,
  "sentAt",
  "openedAt",
  "clickedAt",
  "acceptedAt",
  "expiresAt"
FROM "Invitation"
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Check Audit Logs
```sql
SELECT 
  action,
  "userId",
  "resourceType",
  "resourceId",
  metadata,
  "createdAt"
FROM "AuditLog"
WHERE action IN ('REGISTRATION_PUBLIC', 'REGISTRATION_CODE', 'REGISTRATION_EMAIL_INVITE')
ORDER BY "createdAt" DESC
LIMIT 20;
```

---

## Automated Testing

### Run Verification Script
```bash
pnpm tsx scripts/verify-registration-flows.ts
```

This checks:
- Database schema
- Pool configurations
- Invite codes validity
- Invitation status
- Registration counts

### Unit Tests (TODO)
```bash
pnpm test apps/web/app/\[locale\]/auth/register
```

### E2E Tests (TODO)
```bash
pnpm test:e2e registration-flows
```

---

## Common Issues & Solutions

### Issue: "Pool not found"
**Solution**: Verify pool exists and belongs to tenant
```sql
SELECT * FROM "Pool" WHERE slug = 'your-slug';
```

### Issue: "Access policy not found"
**Solution**: Create access policy for pool
```sql
INSERT INTO "AccessPolicy" ("poolId", "tenantId", "accessType", ...)
VALUES ('pool_id', 'tenant_id', 'PUBLIC', ...);
```

### Issue: CAPTCHA not loading
**Solution**: Check environment variable and network
```bash
echo $NEXT_PUBLIC_HCAPTCHA_SITE_KEY
```

### Issue: "Already registered"
**Solution**: Delete test registration
```sql
DELETE FROM "Registration" 
WHERE "userId" = 'test_user_id' AND "poolId" = 'test_pool_id';
```

### Issue: Code validation fails
**Solution**: Check code format and status
```sql
SELECT * FROM "InviteCode" WHERE code = 'YOUR_CODE';
```

### Issue: Token validation fails
**Solution**: Check token format and expiration
```sql
SELECT * FROM "Invitation" WHERE token = 'your_token';
```

---

## Performance Testing

### Load Test Registration Endpoint
```bash
# Using Apache Bench
ab -n 100 -c 10 -p registration.json -T application/json \
  http://localhost:3000/api/trpc/registration.registerPublic
```

### Monitor Database Queries
```sql
-- Enable query logging
ALTER DATABASE quinielas SET log_statement = 'all';

-- Check slow queries
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%Registration%'
ORDER BY mean_exec_time DESC;
```

---

## Rollback Procedure

If issues found in production:

1. **Disable new registration routes**:
   - Redirect `/auth/register/*` to old flow
   - Or show maintenance message

2. **Revert database changes** (if schema changed):
   ```bash
   pnpm db:migrate:rollback
   ```

3. **Clear user sessions**:
   ```sql
   DELETE FROM "Session" WHERE "expires" > NOW();
   ```

4. **Notify users** via email/banner

---

## Success Criteria

Registration flows are ready for production when:

- [ ] All three flows (PUBLIC, CODE, EMAIL_INVITE) work end-to-end
- [ ] CAPTCHA integration functional
- [ ] Success modal displays and redirects correctly
- [ ] Database records created correctly
- [ ] Audit logs captured
- [ ] Edge cases handled gracefully
- [ ] i18n messages display correctly
- [ ] Branding applied consistently
- [ ] No console errors
- [ ] Performance acceptable (<2s registration time)
- [ ] Verification script passes 100%
- [ ] Manual testing checklist complete
