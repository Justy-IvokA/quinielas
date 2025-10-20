# Solución Error 403 en uploadMedia

## 🔴 Error Reportado

```
POST http://localhost:3001/api/trpc/branding.uploadMedia?batch=1 403 (Forbidden)
```

## 🔍 Causas Posibles

El error 403 (Forbidden) en el endpoint `branding.uploadMedia` puede deberse a:

### 1. **Falta de contexto de Tenant** (MÁS PROBABLE)

El middleware `requireTenantAdmin` requiere que `ctx.tenant` esté definido. En `localhost`, la resolución de tenant puede fallar.

**Verificación:**
```typescript
// En packages/api/src/lib/host-tenant.ts línea 131-149
// Strategy 4: Development fallback
if (process.env.NODE_ENV === "development") {
  const demoTenant = await prisma.tenant.findUnique({
    where: { slug: "ivoka" }  // ← Busca tenant "ivoka"
  });
}
```

**Problema:** Si tu tenant en la base de datos NO se llama "ivoka", el fallback falla y `ctx.tenant` será `null`.

### 2. **Usuario sin rol TENANT_ADMIN**

El usuario autenticado no tiene el rol `TENANT_ADMIN` en el tenant actual.

### 3. **Usuario no es miembro del tenant**

El usuario no tiene ningún `TenantMember` asociado al tenant.

### 4. **Sesión no válida**

La sesión de Auth.js no se está estableciendo correctamente.

## ✅ Soluciones

### Solución 1: Configurar DEV_TENANT_SLUG en desarrollo

**El fallback de desarrollo SOLO se usa en localhost.** En producción, el tenant se resuelve por subdominio.

1. **Verifica qué tenant tienes en tu base de datos:**

```sql
SELECT id, slug, name FROM "Tenant";
```

2. **Agrega la variable de entorno en tu `.env.local`:**

```env
# apps/admin/.env.local
DEV_TENANT_SLUG=tu-tenant-slug
```

**Ejemplo:**
```env
DEV_TENANT_SLUG=ivoka
```

3. **Reinicia el servidor:**

```bash
pnpm dev
```

**Nota:** Si no especificas `DEV_TENANT_SLUG`, el sistema usará el primer tenant disponible en la base de datos. Esto es útil para desarrollo rápido, pero es mejor ser explícito.

### Solución 2: Verificar rol del usuario

1. **Consulta el rol del usuario en el tenant:**

```sql
SELECT 
  u.email,
  tm.role,
  t.slug as tenant_slug
FROM "User" u
JOIN "TenantMember" tm ON u.id = tm."userId"
JOIN "Tenant" t ON tm."tenantId" = t.id
WHERE u.email = 'tu-email@ejemplo.com';
```

2. **Si el rol NO es `TENANT_ADMIN` o `SUPERADMIN`, actualízalo:**

```sql
UPDATE "TenantMember"
SET role = 'TENANT_ADMIN'
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'tu-email@ejemplo.com')
  AND "tenantId" = (SELECT id FROM "Tenant" WHERE slug = 'tu-tenant-slug');
```

### Solución 3: Crear TenantMember si no existe

```sql
-- Verificar si existe
SELECT * FROM "TenantMember"
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'tu-email@ejemplo.com')
  AND "tenantId" = (SELECT id FROM "Tenant" WHERE slug = 'tu-tenant-slug');

-- Si no existe, crear
INSERT INTO "TenantMember" (id, "userId", "tenantId", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  (SELECT id FROM "User" WHERE email = 'tu-email@ejemplo.com'),
  (SELECT id FROM "Tenant" WHERE slug = 'tu-tenant-slug'),
  'TENANT_ADMIN',
  NOW(),
  NOW()
);
```

### Solución 4: Agregar logs de debugging

Agrega logs temporales para diagnosticar:

```typescript
// packages/api/src/middleware/require-tenant-member.ts
export function requireTenantMember(minRole?: TenantRole) {
  return middleware(async ({ ctx, next }) => {
    console.log("[requireTenantMember] Debug:", {
      hasSession: !!ctx.session?.user,
      userEmail: ctx.session?.user?.email,
      hasTenant: !!ctx.tenant,
      tenantSlug: ctx.tenant?.slug,
      tenantId: ctx.tenant?.id,
      isSuperAdmin: isSuperAdmin(ctx.session)
    });

    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required"
      });
    }

    // SUPERADMIN bypasses tenant checks
    if (isSuperAdmin(ctx.session)) {
      console.log("[requireTenantMember] SUPERADMIN bypass");
      return next({ ctx });
    }

    if (!ctx.tenant) {
      console.error("[requireTenantMember] No tenant context!");
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Tenant context required"
      });
    }

    const userRole = getTenantRole(ctx.session, ctx.tenant.id);
    console.log("[requireTenantMember] User role:", userRole);

    if (!userRole) {
      console.error("[requireTenantMember] User not a member of tenant");
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a member of this tenant"
      });
    }

    if (minRole && !hasMinRole(userRole, minRole)) {
      console.error("[requireTenantMember] Insufficient role:", { userRole, minRole });
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Insufficient permissions. Required role: ${minRole} or higher`
      });
    }

    console.log("[requireTenantMember] Access granted");
    return next({
      ctx: {
        ...ctx,
        userRole
      }
    });
  });
}
```

## 🧪 Verificación Paso a Paso

### 1. Verificar sesión

Abre la consola del navegador en `/es-MX/branding` y ejecuta:

```javascript
// Verificar que hay sesión
fetch('/api/auth/session')
  .then(r => r.json())
  .then(console.log);
```

Deberías ver:
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "highestRole": "TENANT_ADMIN",
    "tenantRoles": {
      "tenant-id-123": "TENANT_ADMIN"
    }
  }
}
```

### 2. Verificar contexto de tenant

Agrega un log temporal en el endpoint:

```typescript
// packages/api/src/routers/branding/index.ts
uploadMedia: procedure
  .use(requireTenantAdmin)
  .input(...)
  .mutation(async ({ ctx, input }) => {
    console.log("[uploadMedia] Context:", {
      hasTenant: !!ctx.tenant,
      tenantId: ctx.tenant?.id,
      tenantSlug: ctx.tenant?.slug,
      hasSession: !!ctx.session,
      userEmail: ctx.session?.user?.email
    });
    
    // ... resto del código
  })
```

### 3. Verificar en la base de datos

```sql
-- 1. Ver todos los tenants
SELECT id, slug, name FROM "Tenant";

-- 2. Ver tu usuario
SELECT id, email, "highestRole" FROM "User" WHERE email = 'tu-email@ejemplo.com';

-- 3. Ver membresías del usuario
SELECT 
  t.slug as tenant,
  tm.role,
  tm."createdAt"
FROM "TenantMember" tm
JOIN "Tenant" t ON tm."tenantId" = t.id
WHERE tm."userId" = (SELECT id FROM "User" WHERE email = 'tu-email@ejemplo.com');

-- 4. Ver brands del tenant
SELECT id, slug, name, "tenantId" FROM "Brand" WHERE "tenantId" = 'tu-tenant-id';
```

## 🎯 Solución Rápida (Recomendada)

**Actualiza el fallback de desarrollo para usar el primer tenant:**

```typescript
// packages/api/src/lib/host-tenant.ts
// Reemplaza las líneas 131-149 con:

// Strategy 4: Development fallback
if (process.env.NODE_ENV === "development") {
  console.log("[host-tenant] Using development fallback");
  
  const demoTenant = await prisma.tenant.findFirst({
    orderBy: { createdAt: "asc" }
  });

  if (demoTenant) {
    console.log("[host-tenant] Found tenant:", demoTenant.slug);
    
    const demoBrand = await prisma.brand.findFirst({
      where: { tenantId: demoTenant.id },
      orderBy: { createdAt: "asc" }
    });

    if (demoBrand) {
      console.log("[host-tenant] Found brand:", demoBrand.slug);
    }

    return {
      tenant: demoTenant,
      brand: demoBrand,
      source: "fallback"
    };
  }
  
  console.warn("[host-tenant] No tenant found in database!");
}
```

**Luego reinicia el servidor:**

```bash
# Detén el servidor (Ctrl+C)
# Reinicia
pnpm dev
```

## 📋 Checklist de Verificación

- [ ] Existe al menos un `Tenant` en la base de datos
- [ ] Existe al menos un `Brand` asociado al tenant
- [ ] Tu usuario tiene un `TenantMember` con rol `TENANT_ADMIN`
- [ ] La sesión de Auth.js está activa (verificar en `/api/auth/session`)
- [ ] El fallback de desarrollo encuentra el tenant correctamente
- [ ] Los logs muestran `ctx.tenant` definido

## 🚨 Si Nada Funciona

Ejecuta el seed para crear datos de prueba:

```bash
cd packages/db
pnpm db:seed
```

Esto creará:
- Tenant "ivoka"
- Brand "ivoka"
- Usuario admin con rol TENANT_ADMIN

---

**Última actualización:** 2025-01-17
