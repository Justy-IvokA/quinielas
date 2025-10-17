# 🔒 Admin Panel: Protección por Roles

## Problema Identificado

El admin panel estaba compartiendo la sesión con la aplicación web (puerto 3000), permitiendo que **cualquier usuario autenticado** (incluyendo jugadores) pudiera acceder al panel de administración.

**Esto es un problema de seguridad crítico.**

---

## Solución Implementada

### 1. Verificación de Roles en Middleware

**Archivo:** `apps/admin/middleware.ts`

El middleware ahora verifica que el usuario tenga uno de los siguientes roles:

```typescript
const ADMIN_ROLES: TenantRole[] = [
  "SUPERADMIN",      // Acceso total a todos los tenants
  "TENANT_ADMIN",    // Administrador de un tenant específico
  "TENANT_EDITOR"    // Editor de un tenant específico
];
```

**Flujo de verificación:**

```
1. Usuario accede al admin panel
   ↓
2. Middleware verifica sesión
   ↓
3. Decodifica JWT para obtener highestRole
   ↓
4. Verifica si highestRole está en ADMIN_ROLES
   ↓
5a. SI es admin → Permite acceso ✅
5b. NO es admin → Redirige a /auth/unauthorized ❌
```

---

## 🎯 Roles y Permisos

### SUPERADMIN
- **Acceso:** Todo el sistema
- **Puede:**
  - Crear y gestionar tenants
  - Acceder a cualquier tenant
  - Gestionar usuarios de cualquier tenant
  - Ver métricas globales

### TENANT_ADMIN
- **Acceso:** Admin panel de su tenant
- **Puede:**
  - Crear y gestionar pools
  - Gestionar brands de su tenant
  - Invitar usuarios
  - Ver analytics de su tenant
  - Gestionar configuración del tenant

### TENANT_EDITOR
- **Acceso:** Admin panel de su tenant (limitado)
- **Puede:**
  - Editar pools existentes
  - Gestionar invitaciones
  - Ver analytics básicos
- **NO puede:**
  - Crear nuevos pools
  - Modificar configuración del tenant
  - Gestionar brands

### PLAYER
- **Acceso:** Solo aplicación web (puerto 3000)
- **Puede:**
  - Registrarse en pools
  - Hacer predicciones
  - Ver leaderboards
- **NO puede:**
  - Acceder al admin panel ❌

---

## 🔐 Implementación Técnica

### Middleware Check

```typescript
export default async function middleware(req: NextRequest) {
  // ... auth check ...
  
  if (!isPublicRoute && sessionToken) {
    // Decode JWT
    const token = await getToken({ 
      req, 
      secret: process.env.AUTH_SECRET 
    });
    
    const userRole = token?.highestRole as TenantRole | null;
    const isAdmin = userRole && ADMIN_ROLES.includes(userRole);
    
    if (!isAdmin) {
      console.log(`[admin-middleware] Access denied for role: ${userRole}`);
      return NextResponse.redirect('/auth/unauthorized');
    }
    
    console.log(`[admin-middleware] Access granted for role: ${userRole}`);
  }
  
  return intlMiddleware(req);
}
```

### JWT Structure

El JWT contiene la información de roles:

```typescript
interface JWT {
  userId: string;
  email: string;
  highestRole: TenantRole | null;  // ← Usado para verificación
  tenantRoles: Record<string, TenantRole>;  // { tenantId: role }
}
```

**Ejemplo:**

```json
{
  "userId": "clx123...",
  "email": "admin@cocacola.com",
  "highestRole": "TENANT_ADMIN",
  "tenantRoles": {
    "tenant-cocacola-id": "TENANT_ADMIN",
    "tenant-pepsi-id": "PLAYER"
  }
}
```

---

## 🚫 Página de Acceso Denegado

**Archivo:** `apps/admin/app/[locale]/auth/unauthorized/page.tsx`

Cuando un usuario sin permisos intenta acceder:

```
┌─────────────────────────────────────┐
│         🛡️ Acceso Denegado          │
├─────────────────────────────────────┤
│ No tienes permisos para acceder al │
│ panel de administración.            │
│                                     │
│ ¿Por qué veo esto?                  │
│ • Panel restringido a admins        │
│ • Tu cuenta es de jugador           │
│ • Contacta al administrador         │
│                                     │
│ [Ir a App de Jugadores]            │
│ [Iniciar Sesión con Otra Cuenta]   │
└─────────────────────────────────────┘
```

---

## 🧪 Testing

### Test 1: Usuario con rol PLAYER

```bash
# 1. Iniciar sesión en web app (puerto 3000) como jugador
http://ivoka.localhost:3000/es-MX/auth/signin
Email: player@example.com

# 2. Intentar acceder al admin
http://ivoka.localhost:4000/es-MX

# 3. Resultado esperado:
[admin-middleware] Access denied for user with role: PLAYER
→ Redirige a: http://ivoka.localhost:4000/es-MX/auth/unauthorized
```

### Test 2: Usuario con rol TENANT_ADMIN

```bash
# 1. Iniciar sesión como admin
http://ivoka.localhost:4000/es-MX/auth/signin
Email: admin@cocacola.com

# 2. Acceder al admin
http://ivoka.localhost:4000/es-MX

# 3. Resultado esperado:
[admin-middleware] Access granted for user with role: TENANT_ADMIN
→ Acceso permitido ✅
```

### Test 3: Usuario con rol SUPERADMIN

```bash
# 1. Iniciar sesión como superadmin
http://ivoka.localhost:4000/es-MX/auth/signin
Email: victor@ivoka.mx

# 2. Acceder al admin
http://ivoka.localhost:4000/es-MX

# 3. Resultado esperado:
[admin-middleware] Access granted for user with role: SUPERADMIN
→ Acceso permitido ✅
```

---

## 🔄 Flujo Completo de Acceso

### Escenario 1: Jugador intenta acceder al admin

```
1. Player autenticado en web app (puerto 3000)
   Role: PLAYER
   ↓
2. Intenta acceder: http://ivoka.localhost:4000/es-MX
   ↓
3. Middleware verifica sesión: ✅ Autenticado
   ↓
4. Middleware verifica rol: ❌ PLAYER no está en ADMIN_ROLES
   ↓
5. Redirige a: /es-MX/auth/unauthorized
   ↓
6. Usuario ve página de acceso denegado
```

### Escenario 2: Admin accede correctamente

```
1. Admin autenticado
   Role: TENANT_ADMIN
   ↓
2. Accede: http://cocacola.localhost:4000/es-MX
   ↓
3. Middleware verifica sesión: ✅ Autenticado
   ↓
4. Middleware verifica rol: ✅ TENANT_ADMIN está en ADMIN_ROLES
   ↓
5. Permite acceso al dashboard
   ↓
6. Usuario ve panel de administración
```

---

## ⚠️ Consideraciones Importantes

### 1. Sesiones Compartidas

Las apps web y admin **comparten la misma sesión de Auth.js** porque usan el mismo `AUTH_SECRET` y cookies.

**Esto es correcto** porque:
- Permite SSO (Single Sign-On) entre apps
- El usuario no necesita autenticarse dos veces
- La protección se hace a nivel de **roles**, no de sesiones

### 2. Cookies de Sesión

```typescript
// Desarrollo
authjs.session-token

// Producción
__Secure-authjs.session-token
```

Ambas apps leen la misma cookie, pero el **middleware del admin verifica roles**.

### 3. Variables de Entorno

**Crítico:** Ambas apps deben usar el mismo `AUTH_SECRET`:

```env
# apps/web/.env
AUTH_SECRET=tu-secret-compartido-de-32-chars

# apps/admin/.env
AUTH_SECRET=tu-secret-compartido-de-32-chars
```

Si los secrets son diferentes, las sesiones no se compartirán.

---

## 🔧 Cómo Asignar Roles

### Opción 1: Desde Seed Script

```typescript
// scripts/seed.ts
await prisma.tenantMember.create({
  data: {
    userId: user.id,
    tenantId: tenant.id,
    role: "TENANT_ADMIN"  // ← Asignar rol de admin
  }
});
```

### Opción 2: Desde Admin Panel (Superadmin)

```typescript
// Router: admin.updateUserRole
updateUserRole: protectedProcedure
  .input(z.object({
    userId: z.string(),
    tenantId: z.string(),
    role: z.enum(["SUPERADMIN", "TENANT_ADMIN", "TENANT_EDITOR", "PLAYER"])
  }))
  .mutation(async ({ input, ctx }) => {
    // Solo SUPERADMIN puede cambiar roles
    if (ctx.session.user.highestRole !== "SUPERADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    
    await ctx.prisma.tenantMember.update({
      where: {
        userId_tenantId: {
          userId: input.userId,
          tenantId: input.tenantId
        }
      },
      data: { role: input.role }
    });
  });
```

### Opción 3: Manualmente en DB

```sql
-- Promover usuario a TENANT_ADMIN
UPDATE "TenantMember"
SET role = 'TENANT_ADMIN'
WHERE "userId" = 'user-id-here'
  AND "tenantId" = 'tenant-id-here';
```

---

## 📊 Logs de Debugging

El middleware genera logs útiles:

```bash
# Acceso denegado
[admin-middleware] Access denied for user with role: PLAYER

# Acceso permitido
[admin-middleware] Access granted for user with role: TENANT_ADMIN

# Error al verificar rol
[admin-middleware] Error checking user role: [error details]
```

---

## ✅ Checklist de Seguridad

- [x] Middleware verifica roles en cada request
- [x] Solo ADMIN_ROLES pueden acceder
- [x] Página de unauthorized para usuarios sin permisos
- [x] Logs de acceso/denegación
- [x] JWT decodificado de forma segura
- [x] Manejo de errores (redirect a signin)
- [ ] Rate limiting en endpoints sensibles (futuro)
- [ ] Audit log de acciones administrativas (futuro)

---

## 🚀 Próximos Pasos

### 1. Protección a Nivel de Router (tRPC)

Además del middleware, agregar verificación en routers:

```typescript
// packages/api/src/routers/admin/pools.ts
export const adminPoolsRouter = router({
  create: protectedProcedure
    .input(createPoolSchema)
    .mutation(async ({ input, ctx }) => {
      // Verificar que el usuario es admin
      const isAdmin = ["SUPERADMIN", "TENANT_ADMIN"].includes(
        ctx.session.user.highestRole
      );
      
      if (!isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      
      // ... crear pool
    })
});
```

### 2. Permisos Granulares

Implementar permisos más específicos:

```typescript
const PERMISSIONS = {
  "pools.create": ["SUPERADMIN", "TENANT_ADMIN"],
  "pools.edit": ["SUPERADMIN", "TENANT_ADMIN", "TENANT_EDITOR"],
  "pools.delete": ["SUPERADMIN", "TENANT_ADMIN"],
  "users.manage": ["SUPERADMIN"],
  // ...
};
```

### 3. Audit Log

Registrar todas las acciones administrativas:

```typescript
await prisma.auditLog.create({
  data: {
    userId: ctx.session.user.id,
    action: "POOL_CREATED",
    resourceType: "Pool",
    resourceId: pool.id,
    metadata: { poolName: pool.name },
    ipAddress: ctx.req.ip
  }
});
```

---

## 📚 Referencias

- **Auth Helpers:** `packages/auth/src/helpers.ts`
- **Middleware:** `apps/admin/middleware.ts`
- **Unauthorized Page:** `apps/admin/app/[locale]/auth/unauthorized/page.tsx`
- **Roles Schema:** `packages/db/prisma/schema.prisma`

---

**Fecha:** 2025-01-16  
**Status:** ✅ IMPLEMENTADO  
**Seguridad:** 🔒 CRÍTICO - Protección activa
