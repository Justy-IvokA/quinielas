# Arquitectura de Autenticación y Roles - Quinielas WL

**Fecha:** 2025-10-09  
**Audiencia:** Victor Mancera (Agencia)  
**Propósito:** Explicar cómo funciona la autenticación y autorización para SUPERADMIN y TENANT_ADMIN

---

## 1. Modelo de Roles (Actual en Schema)

### Enum TenantRole

```prisma
enum TenantRole {
  SUPERADMIN      // Agencia (Victor) - Gestiona todo el sistema
  TENANT_ADMIN    // Cliente/Empresa - Gestiona su tenant
  TENANT_EDITOR   // Editor del cliente - Permisos limitados
  PLAYER          // Jugador - Solo predicciones
}
```

### Modelo TenantMember

```prisma
model TenantMember {
  id        String     @id @default(cuid())
  tenantId  String
  userId    String
  role      TenantRole
  createdAt DateTime   @default(now())

  tenant Tenant @relation(...)
  user   User   @relation(...)

  @@unique([tenantId, userId])  // Un usuario puede tener UN rol por tenant
}
```

**Clave:** Un usuario puede tener **diferentes roles en diferentes tenants**.

---

## 2. Jerarquía de Permisos

### SUPERADMIN (Agencia - Victor)

**Alcance:** Global (todos los tenants)

**Puede:**
- ✅ Crear/editar/eliminar **Tenants**
- ✅ Crear/editar/eliminar **Brands** de cualquier tenant
- ✅ Ver/gestionar **todos los Pools** de todos los tenants
- ✅ Asignar roles (TENANT_ADMIN, TENANT_EDITOR) a usuarios
- ✅ Ver analytics globales del sistema
- ✅ Configurar **ExternalSources** (API-Football, SportMonks)
- ✅ Ejecutar sincronizaciones manuales de fixtures
- ✅ Acceder al panel de administración global

**Casos de uso:**
1. Onboarding de nuevo cliente (crear tenant + brand + admin)
2. Soporte técnico (ver/editar pools de clientes)
3. Configuración de integraciones (APIs deportivas)
4. Monitoreo del sistema

---

### TENANT_ADMIN (Cliente/Empresa)

**Alcance:** Solo su tenant (row-level security)

**Puede:**
- ✅ Crear/editar/eliminar **Brands** de su tenant
- ✅ Crear/editar/eliminar **Pools** de su tenant
- ✅ Configurar **AccessPolicies** (PUBLIC, CODE, EMAIL_INVITE)
- ✅ Generar **CodeBatches** e **InviteCodes**
- ✅ Enviar **Invitations** por email
- ✅ Ver **Registrations** de sus pools
- ✅ Configurar **Prizes** para sus pools
- ✅ Ver **Leaderboards** y analytics de sus pools
- ✅ Asignar rol TENANT_EDITOR a otros usuarios de su tenant
- ❌ **NO puede** crear tenants
- ❌ **NO puede** ver/editar otros tenants
- ❌ **NO puede** configurar ExternalSources globales

**Casos de uso:**
1. Crear quiniela para Mundial 2026
2. Configurar acceso por código de invitación
3. Enviar invitaciones masivas por email
4. Ver quién se ha registrado
5. Configurar premios (1er lugar: Jersey, 2do: Balón, etc.)

---

### TENANT_EDITOR (Editor del Cliente)

**Alcance:** Solo su tenant (permisos limitados)

**Puede:**
- ✅ Editar **Pools** existentes (no crear/eliminar)
- ✅ Generar **InviteCodes** de batches existentes
- ✅ Ver **Registrations** y **Leaderboards**
- ❌ **NO puede** crear/eliminar pools
- ❌ **NO puede** configurar AccessPolicies
- ❌ **NO puede** asignar roles

**Casos de uso:**
1. Soporte al cliente (generar códigos adicionales)
2. Monitoreo de registraciones

---

### PLAYER (Jugador)

**Alcance:** Solo sus registraciones y predicciones

**Puede:**
- ✅ Registrarse en pools (según AccessPolicy)
- ✅ Crear/editar **Predictions** (antes del kickoff)
- ✅ Ver **Leaderboards** de pools donde está registrado
- ❌ **NO puede** acceder al panel de administración

---

## 3. Arquitectura de Autenticación

### Método: Auth.js con Magic Links (Passwordless)

```
┌─────────────────────────────────────────────────────────┐
│                    FLUJO DE LOGIN                        │
└─────────────────────────────────────────────────────────┘

1. Usuario ingresa email en /login
   ↓
2. Sistema envía magic link por email
   ↓
3. Usuario hace click en link
   ↓
4. Auth.js valida token y crea sesión
   ↓
5. Sistema verifica roles del usuario (TenantMember)
   ↓
6. Redirige según rol:
   - SUPERADMIN → /admin/global
   - TENANT_ADMIN → /admin/[tenant]/dashboard
   - PLAYER → /[brand]/[pool]/dashboard
```

### Ventajas del Magic Link

- ✅ **Sin contraseñas:** No hay hashes que filtrar
- ✅ **UX simple:** 1 click para login
- ✅ **Seguro:** Tokens temporales (15 min)
- ✅ **Multi-dispositivo:** Login desde cualquier lugar

---

## 4. Implementación Actual (Estado del Código)

### ✅ Ya Implementado

1. **Schema de Roles**
   - `TenantRole` enum con 4 roles
   - `TenantMember` modelo con relación User ↔ Tenant

2. **Utilidades de Tenant**
   - `getTenantMemberRole()` - Obtener rol de usuario
   - `requireTenantRole()` - Validar permisos
   - `scopeByTenant()` - Filtrar queries por tenant

3. **Context de tRPC**
   - Resolución de tenant/brand por dominio o path
   - Placeholder para sesión de Auth.js

### ❌ Pendiente de Implementar

1. **Router de Tenants** (para SUPERADMIN)
2. **Router de Auth** (login, logout, session)
3. **Middleware de autorización** (tRPC procedures)
4. **Integración completa de Auth.js**
5. **UI del panel de admin**

---

## 5. Implementación Propuesta

### 5.1 Router de Tenants (SUPERADMIN)

```typescript
// packages/api/src/routers/tenants/index.ts
import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const tenantsRouter = router({
  // Listar todos los tenants (solo SUPERADMIN)
  list: protectedProcedure
    .use(requireRole(["SUPERADMIN"]))
    .query(async ({ ctx }) => {
      return await ctx.prisma.tenant.findMany({
        include: {
          _count: {
            select: {
              brands: true,
              pools: true,
              members: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    }),

  // Crear tenant (solo SUPERADMIN)
  create: protectedProcedure
    .use(requireRole(["SUPERADMIN"]))
    .input(
      z.object({
        slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
        name: z.string().min(3).max(100),
        description: z.string().optional(),
        adminEmail: z.string().email(), // Email del TENANT_ADMIN
        adminName: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Crear tenant
      const tenant = await ctx.prisma.tenant.create({
        data: {
          slug: input.slug,
          name: input.name,
          description: input.description
        }
      });

      // 2. Crear o buscar usuario admin
      let adminUser = await ctx.prisma.user.findUnique({
        where: { email: input.adminEmail }
      });

      if (!adminUser) {
        adminUser = await ctx.prisma.user.create({
          data: {
            email: input.adminEmail,
            name: input.adminName
          }
        });
      }

      // 3. Asignar rol TENANT_ADMIN
      await ctx.prisma.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId: adminUser.id,
          role: "TENANT_ADMIN"
        }
      });

      // 4. Crear brand por defecto
      const brand = await ctx.prisma.brand.create({
        data: {
          tenantId: tenant.id,
          slug: "default",
          name: tenant.name,
          description: `Brand principal de ${tenant.name}`
        }
      });

      // 5. Enviar email de bienvenida al admin
      // TODO: Implementar con email provider

      return {
        tenant,
        admin: adminUser,
        brand
      };
    }),

  // Ver detalles de tenant (SUPERADMIN o TENANT_ADMIN del tenant)
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: input.id },
        include: {
          brands: true,
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              pools: true,
              registrations: true
            }
          }
        }
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant not found"
        });
      }

      // Verificar permisos
      const userRole = await getTenantMemberRole(
        ctx.prisma,
        tenant.id,
        ctx.session.user.id
      );

      const isSuperAdmin = await isSuperAdminGlobal(ctx.prisma, ctx.session.user.id);

      if (!isSuperAdmin && userRole !== "TENANT_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient permissions"
        });
      }

      return tenant;
    })
});
```

---

### 5.2 Middleware de Autorización (tRPC)

```typescript
// packages/api/src/trpc.ts
import { TRPCError, initTRPC } from "@trpc/server";
import type { AppContext } from "./context";
import { getTenantMemberRole } from "./lib/tenant-utils";

const t = initTRPC.context<AppContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Procedure que requiere autenticación
export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;

  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in"
    });
  }

  return opts.next({
    ctx: {
      ...ctx,
      session: ctx.session // Ahora TypeScript sabe que session no es null
    }
  });
});

// Middleware para requerir rol específico en tenant
export const requireRole = (allowedRoles: string[]) => {
  return t.middleware(async (opts) => {
    const { ctx } = opts;

    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in"
      });
    }

    if (!ctx.tenant) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tenant context is required"
      });
    }

    const role = await getTenantMemberRole(
      ctx.prisma,
      ctx.tenant.id,
      ctx.session.user.id
    );

    if (!role || !allowedRoles.includes(role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient permissions for this operation"
      });
    }

    return opts.next({
      ctx: {
        ...ctx,
        userRole: role
      }
    });
  });
};

// Middleware para SUPERADMIN global
export const requireSuperAdmin = t.middleware(async (opts) => {
  const { ctx } = opts;

  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in"
    });
  }

  // Verificar si tiene rol SUPERADMIN en CUALQUIER tenant
  const superAdminMembership = await ctx.prisma.tenantMember.findFirst({
    where: {
      userId: ctx.session.user.id,
      role: "SUPERADMIN"
    }
  });

  if (!superAdminMembership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Superadmin access required"
    });
  }

  return opts.next({
    ctx: {
      ...ctx,
      isSuperAdmin: true
    }
  });
});

// Procedure para SUPERADMIN
export const superAdminProcedure = protectedProcedure.use(requireSuperAdmin);

// Procedure para TENANT_ADMIN o superior
export const tenantAdminProcedure = protectedProcedure.use(
  requireRole(["SUPERADMIN", "TENANT_ADMIN"])
);
```

---

### 5.3 Helper para Verificar SUPERADMIN Global

```typescript
// packages/api/src/lib/tenant-utils.ts

/**
 * Check if user is SUPERADMIN in ANY tenant
 */
export async function isSuperAdminGlobal(
  prisma: PrismaClient,
  userId: string
): Promise<boolean> {
  const superAdminMembership = await prisma.tenantMember.findFirst({
    where: {
      userId,
      role: "SUPERADMIN"
    }
  });

  return !!superAdminMembership;
}

/**
 * Get all tenants where user has a specific role
 */
export async function getUserTenantsByRole(
  prisma: PrismaClient,
  userId: string,
  role?: string
): Promise<Array<{ tenant: Tenant; role: string }>> {
  const memberships = await prisma.tenantMember.findMany({
    where: {
      userId,
      ...(role ? { role } : {})
    },
    include: {
      tenant: true
    }
  });

  return memberships.map(m => ({
    tenant: m.tenant,
    role: m.role
  }));
}
```

---

### 5.4 Integración con Auth.js

```typescript
// packages/auth/src/config.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@qp/db";
import type { NextAuthConfig } from "next-auth";
import EmailProvider from "next-auth/providers/email";

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      from: process.env.SMTP_FROM
    })
  ],
  callbacks: {
    async session({ session, user }) {
      // Agregar ID de usuario a la sesión
      if (session.user) {
        session.user.id = user.id;

        // Obtener roles del usuario
        const memberships = await prisma.tenantMember.findMany({
          where: { userId: user.id },
          include: {
            tenant: {
              select: {
                id: true,
                slug: true,
                name: true
              }
            }
          }
        });

        // Agregar info de roles a la sesión
        session.user.tenants = memberships.map(m => ({
          tenantId: m.tenant.id,
          tenantSlug: m.tenant.slug,
          tenantName: m.tenant.name,
          role: m.role
        }));

        // Flag si es superadmin
        session.user.isSuperAdmin = memberships.some(
          m => m.role === "SUPERADMIN"
        );
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirigir según rol después del login
      // TODO: Implementar lógica de redirección
      return baseUrl;
    }
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-email",
    error: "/error"
  }
};
```

---

## 6. Flujos de Uso

### Flujo 1: SUPERADMIN crea nuevo cliente

```
1. Victor (SUPERADMIN) hace login → /admin/global
2. Va a "Tenants" → "Crear Nuevo"
3. Llena formulario:
   - Slug: "coca-cola"
   - Name: "Coca-Cola México"
   - Admin Email: "marketing@coca-cola.com"
   - Admin Name: "Juan Pérez"
4. Sistema crea:
   ✅ Tenant "coca-cola"
   ✅ User "marketing@coca-cola.com"
   ✅ TenantMember (userId, tenantId, role: TENANT_ADMIN)
   ✅ Brand "default"
5. Sistema envía email a marketing@coca-cola.com:
   "Bienvenido a Quinielas WL. Haz click aquí para acceder."
6. Juan hace click → Login con magic link → /admin/coca-cola/dashboard
```

---

### Flujo 2: TENANT_ADMIN crea quiniela

```
1. Juan (TENANT_ADMIN de Coca-Cola) hace login → /admin/coca-cola/dashboard
2. Va a "Quinielas" → "Crear Nueva"
3. Llena formulario:
   - Nombre: "Quiniela Mundial 2026"
   - Temporada: "World Cup 2026"
   - Tipo de acceso: "Código de invitación"
   - Premios: 1er lugar (Jersey), 2do (Balón), 3er (Gorra)
4. Sistema crea:
   ✅ Pool (tenantId: coca-cola, seasonId: world-cup-2026)
   ✅ AccessPolicy (type: CODE)
   ✅ Prizes (3 premios)
5. Juan genera códigos:
   - "Generar 1000 códigos" → CodeBatch + 1000 InviteCodes
6. Juan descarga CSV con códigos
7. Juan distribuye códigos a empleados de Coca-Cola
```

---

### Flujo 3: Jugador se registra y predice

```
1. Empleado recibe código: "COCA2026-ABC123"
2. Va a: coca-cola.quinielas.com/mundial-2026
3. Ingresa código → Registra email
4. Sistema crea:
   ✅ User (si no existe)
   ✅ Registration (userId, poolId, inviteCodeId)
   ✅ TenantMember (role: PLAYER)
5. Empleado ve fixtures del Mundial
6. Hace predicciones antes del kickoff
7. Sistema crea Predictions (locked: false)
8. Kickoff → Sistema lockea Match y Predictions
9. Partido termina → Worker calcula scores
10. Empleado ve su posición en leaderboard
```

---

## 7. Seguridad Multi-Tenant (Row-Level Security)

### Principio: Aislamiento de Datos

Cada query debe filtrar por `tenantId` para prevenir acceso cruzado:

```typescript
// ❌ MAL - Sin filtro de tenant
const pools = await prisma.pool.findMany();

// ✅ BIEN - Con filtro de tenant
const pools = await prisma.pool.findMany({
  where: { tenantId: ctx.tenant.id }
});

// ✅ MEJOR - Usando helper
const pools = await prisma.pool.findMany({
  where: scopeByTenant(ctx.tenant.id, { isActive: true })
});
```

### Validación en Mutations

```typescript
// Ejemplo: Editar pool
updatePool: tenantAdminProcedure
  .input(z.object({
    poolId: z.string(),
    name: z.string()
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Obtener pool
    const pool = await ctx.prisma.pool.findUnique({
      where: { id: input.poolId }
    });

    if (!pool) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    // 2. Validar que pertenece al tenant del usuario
    if (pool.tenantId !== ctx.tenant.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Pool does not belong to your tenant"
      });
    }

    // 3. Actualizar
    return await ctx.prisma.pool.update({
      where: { id: input.poolId },
      data: { name: input.name }
    });
  })
```

---

## 8. Próximos Pasos de Implementación

### Fase 1: Autenticación Básica (1-2 días)

- [ ] Instalar y configurar Auth.js
- [ ] Crear páginas de login (/login, /verify-email)
- [ ] Integrar EmailProvider con SMTP
- [ ] Actualizar context.ts para obtener sesión real
- [ ] Testing de login flow

### Fase 2: Routers de Admin (2-3 días)

- [ ] Crear `tenantsRouter` (CRUD de tenants)
- [ ] Crear `brandsRouter` (CRUD de brands)
- [ ] Actualizar `poolsRouter` con validación de roles
- [ ] Crear helpers de autorización
- [ ] Testing de permisos

### Fase 3: UI del Admin Panel (3-5 días)

- [ ] Layout del admin con navegación por rol
- [ ] Dashboard de SUPERADMIN (lista de tenants)
- [ ] Dashboard de TENANT_ADMIN (sus pools)
- [ ] Formularios de creación (tenant, pool, códigos)
- [ ] Tablas de datos con filtros

### Fase 4: Seed de Datos Demo (1 día)

- [ ] Tenant "demo" con SUPERADMIN
- [ ] Tenant "coca-cola" con TENANT_ADMIN
- [ ] Pool de ejemplo con códigos
- [ ] Usuarios de prueba

---

## 9. Preguntas Frecuentes

### ¿Un usuario puede ser SUPERADMIN y TENANT_ADMIN?

**Sí.** Un usuario puede tener múltiples roles en múltiples tenants:

```
User: victor@agencia.com
├─ TenantMember (tenant: agencia, role: SUPERADMIN)
├─ TenantMember (tenant: coca-cola, role: TENANT_ADMIN)
└─ TenantMember (tenant: pepsi, role: TENANT_ADMIN)
```

### ¿Cómo se asigna el primer SUPERADMIN?

**Opción 1: Seed script**
```typescript
// packages/db/prisma/seed.ts
const superAdmin = await prisma.user.create({
  data: { email: "victor@agencia.com", name: "Victor Mancera" }
});

const agenciaTenant = await prisma.tenant.create({
  data: { slug: "agencia", name: "Agencia" }
});

await prisma.tenantMember.create({
  data: {
    userId: superAdmin.id,
    tenantId: agenciaTenant.id,
    role: "SUPERADMIN"
  }
});
```

**Opción 2: Script manual**
```bash
pnpm db:seed:superadmin --email victor@agencia.com
```

### ¿Qué pasa si un TENANT_ADMIN intenta crear un tenant?

**Error 403 Forbidden.** El middleware `requireSuperAdmin` lo bloquea:

```typescript
create: superAdminProcedure  // Solo SUPERADMIN
  .input(...)
  .mutation(...)
```

### ¿Cómo se manejan los dominios personalizados?

**Resolución automática en context.ts:**

```
coca-cola.quinielas.com → Tenant: coca-cola, Brand: default
pepsi.quinielas.com → Tenant: pepsi, Brand: default
quinielas.com/coca-cola/mundial → Tenant: coca-cola, Brand: default
```

---

## 10. Conclusión

### Arquitectura Actual

✅ **Schema completo** con roles y multi-tenancy  
✅ **Helpers de autorización** implementados  
✅ **Context de tRPC** con resolución de tenant  
⚠️ **Auth.js pendiente** de integrar  
⚠️ **Routers de admin pendientes** de crear  
⚠️ **UI del admin panel pendiente** de implementar

### Modelo de Seguridad

- **SUPERADMIN:** Acceso global (Victor/Agencia)
- **TENANT_ADMIN:** Acceso a su tenant (Clientes)
- **Row-Level Security:** Todas las queries filtradas por `tenantId`
- **Passwordless Auth:** Magic links por email (Auth.js)

### Próximos Pasos Inmediatos

1. Integrar Auth.js con EmailProvider
2. Crear `tenantsRouter` para SUPERADMIN
3. Crear UI del admin panel
4. Seed con datos de prueba

---

**¿Necesitas que implemente alguna de estas partes ahora?**

Opciones:
1. Implementar `tenantsRouter` completo
2. Configurar Auth.js
3. Crear middleware de autorización
4. Crear seed script con SUPERADMIN

---

**Autor:** Cascade AI  
**Revisión:** Victor Mancera
