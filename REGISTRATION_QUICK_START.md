# Registration Flows - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Verify Database Setup
```bash
pnpm tsx scripts/verify-registration-flows.ts
```

Expected output: All checks should pass ✓

### Step 2: Set Environment Variables (Optional)
```bash
# For CAPTCHA support (optional)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001  # Test key
```

### Step 3: Start Development Server
```bash
pnpm dev
```

### Step 4: Test Each Flow

#### A. Public Registration
1. Navigate to: `http://ivoka.localhost:3000/liga-mx-13`
2. Click "Únete ahora"
3. Sign in if needed
4. Fill form and submit

#### B. Code Registration
1. Create a test code in database:
   ```sql
   INSERT INTO "InviteCode" (id, code, "usesPerCode", "usedCount", status, "batchId", "createdAt", "updatedAt")
   VALUES (gen_random_uuid(), 'TEST1234', 5, 0, 'UNUSED', 'batch-id', NOW(), NOW());
   ```
2. Navigate to: `http://ivoka.localhost:3000/auth/register/liga-mx-13?code=TEST1234`
3. Code validates automatically
4. Fill form and submit

#### C. Email Invite Registration
1. Create a test invitation:
   ```sql
   INSERT INTO "Invitation" (id, email, token, status, "accessPolicyId", "expiresAt", "createdAt", "updatedAt")
   VALUES (gen_random_uuid(), 'test@example.com', 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234', 'PENDING', 'policy-id', NOW() + INTERVAL '7 days', NOW(), NOW());
   ```
2. Navigate to: `http://ivoka.localhost:3000/auth/register/liga-mx-13?token=a1b2c3d4e5f6789012345678901234567890123456789012345678901234`
3. Email auto-fills
4. Fill form and submit

---

## 📋 URLs Reference

### Registration Entry Points
```
# Auto-detects access policy type
/auth/register/[poolSlug]

# With invite code prefill
/auth/register/[poolSlug]?code=ABCD1234

# With email invitation token
/auth/register/[poolSlug]?token=64-char-hex-token
```

### Pool Landing Pages
```
# Branded subdomain
https://brand.domain.com/pool-slug

# Local development
http://ivoka.localhost:3000/pool-slug
```

---

## 🔧 Quick Database Queries

### Check Pool Access Policy
```sql
SELECT p.slug, p.name, ap."accessType", ap."maxRegistrations", ap."requireCaptcha"
FROM "Pool" p
LEFT JOIN "AccessPolicy" ap ON ap."poolId" = p.id
WHERE p.slug = 'your-pool-slug';
```

### Create Test Pool with PUBLIC Access
```sql
-- Insert pool
INSERT INTO "Pool" (id, name, slug, "tenantId", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Test Pool', 'test-pool', 'your-tenant-id', true, NOW(), NOW())
RETURNING id;

-- Insert access policy (use pool id from above)
INSERT INTO "AccessPolicy" (id, "poolId", "tenantId", "accessType", "requireCaptcha", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'pool-id-from-above', 'your-tenant-id', 'PUBLIC', false, NOW(), NOW());
```

### Check Registrations
```sql
SELECT 
  r."displayName",
  r.email,
  r."joinedAt",
  CASE 
    WHEN r."inviteCodeId" IS NOT NULL THEN 'CODE'
    WHEN r."invitationId" IS NOT NULL THEN 'EMAIL_INVITE'
    ELSE 'PUBLIC'
  END as registration_type
FROM "Registration" r
WHERE r."poolId" = 'your-pool-id'
ORDER BY r."joinedAt" DESC;
```

---

## 🎯 Testing Checklist

### Minimal Testing (5 minutes)
- [ ] Public registration works
- [ ] Code registration validates and registers
- [ ] Email invite registration works
- [ ] Success modal appears
- [ ] Redirects to predictions page

### Full Testing (30 minutes)
- [ ] All edge cases from `REGISTRATION_TESTING_GUIDE.md`
- [ ] CAPTCHA integration
- [ ] Branding on different subdomains
- [ ] Mobile responsiveness
- [ ] Error handling

---

## 🐛 Quick Fixes

### Reset Test Registration
```sql
DELETE FROM "Registration" 
WHERE "userId" = 'your-test-user-id' 
AND "poolId" = 'your-test-pool-id';
```

### Reset Invite Code
```sql
UPDATE "InviteCode" 
SET "usedCount" = 0, status = 'UNUSED'
WHERE code = 'TEST1234';
```

### Reset Invitation
```sql
UPDATE "Invitation"
SET status = 'PENDING', "acceptedAt" = NULL
WHERE token = 'your-token';
```

---

## 📚 Documentation Links

- **Full Implementation**: `REGISTRATION_FLOWS_IMPLEMENTATION.md`
- **Testing Guide**: `REGISTRATION_TESTING_GUIDE.md`
- **Summary**: `REGISTRATION_FLOWS_SUMMARY.md`

---

## ✅ You're Ready!

If verification script passes and you can complete one registration flow, you're good to go! 🎉

For detailed testing and production deployment, refer to the full documentation.
