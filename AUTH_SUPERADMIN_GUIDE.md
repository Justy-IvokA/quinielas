# Auth.js & SUPERADMIN Implementation Guide

## Overview

This guide covers the complete implementation of Auth.js authentication with RBAC (Role-Based Access Control) and SUPERADMIN tenant management for the Quinielas WL platform.

## Architecture

### Components

1. **Auth.js Configuration** (`packages/auth/`)
   - Prisma adapter for session/account storage
   - Email magic link provider (dev/prod)
   - OAuth providers (Google, Microsoft - optional)
   - JWT session strategy with role embedding

2. **RBAC Middleware** (`packages/api/src/middleware/`)
   - `requireRole()` - Requires specific global role
   - `requireTenantMember()` - Requires tenant membership with minimum role
   - `withAuth` - Ensures authentication
   - `withTenant` - Ensures tenant context

3. **Tenant Router** (`packages/api/src/routers/tenant.ts`)
   - SUPERADMIN-only CRUD operations
   - List, create, update, delete tenants
   - Member management (add, remove, set role)

4. **Admin UI** (`apps/admin/`)
   - Auth guards (client-side)
   - Tenant management pages
   - Member management interface

## Database Schema

### Auth.js Tables (Added to Prisma)

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  // ... OAuth fields
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}
```

### User Relations (Updated)

```prisma
model User {
  // ... existing fields
  accounts     Account[]
  sessions     Session[]
}
```

## Setup Instructions

### 1. Database Migration

Apply the Auth.js schema changes:

```bash
cd packages/db
pnpm prisma migrate dev --name add-auth-tables
```

### 2. Environment Variables

Add to your `.env` files (apps/admin, apps/web, packages/api):

```env
# Auth.js Core
AUTH_SECRET="your-secret-key-min-32-chars-long-here"
AUTH_URL="http://localhost:3000"  # Base URL for your app

# Email Provider (Magic Link)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-smtp-user"
EMAIL_SERVER_PASSWORD="your-smtp-password"
EMAIL_FROM="noreply@example.com"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Run Seed Script

Create SUPERADMIN user and demo data:

```bash
cd packages/db
pnpm seed
```

This creates:
- SUPERADMIN user: `vemancera@gmail.com`
- Demo tenant with TENANT_ADMIN: `admin@demo.com`
- Demo players

### 4. Install Dependencies

```bash
pnpm install
```

## Usage

### Authentication Flow

1. **Sign In**
   - Navigate to `/auth/signin`
   - Enter email (e.g., `vemancera@gmail.com`)
   - Receive magic link via email
   - Click link to authenticate

2. **Session Management**
   - JWT stored in HTTP-only cookie
   - Session includes:
     - `user.id`
     - `user.email`
     - `user.highestRole` (SUPERADMIN, TENANT_ADMIN, etc.)
     - `user.tenantRoles` (role per tenant)

### RBAC in tRPC

#### Require SUPERADMIN Role

```typescript
import { requireSuperAdmin } from "../middleware/require-role";

export const myRouter = router({
  adminOnly: procedure
    .use(requireSuperAdmin)
    .query(async ({ ctx }) => {
      // Only SUPERADMIN can access
      return { data: "secret" };
    })
});
```

#### Require Tenant Membership

```typescript
import { requireTenantMember } from "../middleware/require-tenant-member";

export const myRouter = router({
  tenantAction: procedure
    .use(requireTenantMember("TENANT_ADMIN"))
    .mutation(async ({ ctx }) => {
      // User must be TENANT_ADMIN or higher in current tenant
      // SUPERADMIN bypasses this check
      return { success: true };
    })
});
```

#### Check Roles Programmatically

```typescript
import { isSuperAdmin, getTenantRole } from "@qp/api/lib/rbac";

// In a procedure
.query(async ({ ctx }) => {
  if (isSuperAdmin(ctx.session)) {
    // SUPERADMIN logic
  }
  
  const userRole = getTenantRole(ctx.session, ctx.tenant.id);
  if (userRole === "TENANT_ADMIN") {
    // Tenant admin logic
  }
})
```

### Admin UI Guards

#### Protect Entire Layout

```typescript
// apps/admin/app/superadmin/layout.tsx
import { SuperAdminGuard } from "@/lib/auth-guard";

export default function SuperAdminLayout({ children }) {
  return <SuperAdminGuard>{children}</SuperAdminGuard>;
}
```

#### Protect Individual Pages

```typescript
import { AuthGuard } from "@/lib/auth-guard";

export default function MyPage() {
  return (
    <AuthGuard requiredRole="TENANT_ADMIN">
      {/* Page content */}
    </AuthGuard>
  );
}
```

#### Client-Side Session Access

```typescript
"use client";
import { useSession } from "next-auth/react";

export function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;
  
  return (
    <div>
      <p>Welcome, {session.user.email}</p>
      <p>Role: {session.user.highestRole}</p>
    </div>
  );
}
```

## Tenant Management

### SUPERADMIN Operations

#### List Tenants

```typescript
const { data } = trpc.tenant.list.useQuery({
  page: 1,
  limit: 20,
  search: "demo"
});
```

#### Create Tenant

```typescript
const createMutation = trpc.tenant.create.useMutation();

createMutation.mutate({
  name: "New Tenant",
  slug: "new-tenant",
  description: "Description",
  defaultBrand: {
    name: "Default Brand",
    slug: "default"
  }
});
```

#### Update Tenant

```typescript
const updateMutation = trpc.tenant.update.useMutation();

updateMutation.mutate({
  id: "tenant-id",
  name: "Updated Name",
  slug: "updated-slug"
});
```

#### Delete Tenant

```typescript
const deleteMutation = trpc.tenant.delete.useMutation();

// Only works if tenant has no pools, registrations, or predictions
deleteMutation.mutate({ id: "tenant-id" });
```

#### Add Member

```typescript
const addMemberMutation = trpc.tenant.addMember.useMutation();

addMemberMutation.mutate({
  tenantId: "tenant-id",
  userEmail: "newuser@example.com",
  role: "TENANT_ADMIN"
});
```

#### Update Member Role

```typescript
const setRoleMutation = trpc.tenant.setMemberRole.useMutation();

setRoleMutation.mutate({
  tenantId: "tenant-id",
  userId: "user-id",
  role: "TENANT_EDITOR"
});
```

#### Remove Member

```typescript
const removeMutation = trpc.tenant.removeMember.useMutation();

removeMutation.mutate({
  tenantId: "tenant-id",
  userId: "user-id"
});
```

## Testing

### Unit Tests

Run RBAC helper tests:

```bash
cd packages/api
pnpm test src/lib/rbac.test.ts
```

### Integration Tests

Run tenant router tests:

```bash
cd packages/api
pnpm test src/routers/tenant.test.ts
```

### Manual Testing

1. **Sign in as SUPERADMIN**
   ```
   Email: vemancera@gmail.com
   ```

2. **Navigate to Tenant Management**
   ```
   http://localhost:3000/superadmin/tenants
   ```

3. **Test Operations**
   - Create new tenant
   - View tenant details
   - Add/remove members
   - Update member roles
   - Delete empty tenant

4. **Test Authorization**
   - Sign in as `admin@demo.com` (TENANT_ADMIN)
   - Try to access `/superadmin/tenants` → Should redirect with error
   - Sign out and try to access → Should redirect to sign-in

## Role Hierarchy

From highest to lowest privilege:

1. **SUPERADMIN**
   - Global access to all tenants
   - Can manage tenants (CRUD)
   - Can manage all users and memberships
   - Bypasses tenant context requirements

2. **TENANT_ADMIN**
   - Full access within assigned tenant(s)
   - Can manage pools, brands, members
   - Cannot access other tenants
   - Cannot manage global tenant list

3. **TENANT_EDITOR**
   - Can edit content within tenant
   - Cannot manage members or critical settings

4. **PLAYER**
   - Basic user access
   - Can register for pools and make predictions

## Security Considerations

1. **Session Storage**
   - JWT stored in HTTP-only cookies
   - Not accessible via JavaScript
   - Secure flag in production

2. **Role Validation**
   - Server-side validation on every request
   - Client guards are UX only, not security
   - tRPC middleware enforces authorization

3. **Tenant Isolation**
   - Non-SUPERADMIN users cannot access other tenants
   - Database queries filtered by `tenantId`
   - Context resolution validates tenant access

4. **Password-less Auth**
   - Magic links expire after use
   - Time-limited tokens
   - OAuth as alternative

## Troubleshooting

### "UNAUTHORIZED" Error

- Check if user is signed in
- Verify session cookie exists
- Check AUTH_SECRET is set

### "FORBIDDEN" Error

- Verify user has required role
- Check tenant membership
- Confirm SUPERADMIN status if needed

### Magic Link Not Received

- Check email provider configuration
- Verify SMTP credentials
- Check spam folder
- Review server logs for email errors

### Session Not Persisting

- Verify AUTH_SECRET matches across restarts
- Check cookie domain settings
- Ensure HTTPS in production

## Next Steps

1. **Add OAuth Providers**
   - Configure Google OAuth
   - Add Microsoft OAuth
   - Update sign-in page UI

2. **Enhance Member Management**
   - Bulk member import
   - Role templates
   - Invitation system

3. **Audit Logging**
   - Log all SUPERADMIN actions
   - Track tenant changes
   - Member activity logs

4. **Multi-Factor Authentication**
   - TOTP support
   - SMS verification
   - Backup codes

## API Reference

### Auth Helpers

```typescript
import {
  getServerAuthSession,
  requireSession,
  isSuperAdmin,
  getTenantRole
} from "@qp/auth";
```

### RBAC Helpers

```typescript
import {
  compareRole,
  hasRole,
  hasMinRole,
  isSuperAdmin,
  getTenantRole,
  hasTenantRole,
  hasTenantMinRole,
  getHighestRole
} from "@qp/api/lib/rbac";
```

### Middleware

```typescript
import { requireRole, requireSuperAdmin } from "@qp/api/middleware/require-role";
import { requireTenantMember, requireTenantAdmin } from "@qp/api/middleware/require-tenant-member";
import { withAuth, withTenant } from "@qp/api/middleware/with-tenant";
```

## Support

For issues or questions:
- Check this guide first
- Review test files for examples
- Check `.windsurfrules` for project conventions
- Consult Auth.js documentation: https://authjs.dev
