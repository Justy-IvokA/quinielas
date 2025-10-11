# Migración: ExternalMaps + SUPERADMIN

**Fecha:** 2025-10-09  
**Estado:** ✅ Listo para ejecutar

---

## Cambios Realizados

### 1. Schema de Prisma

#### ✅ Competition - Agregada relación externalMaps

```prisma
model Competition {
  id        String   @id @default(cuid())
  sportId   String
  slug      String
  name      String
  logoUrl   String?
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sport        Sport         @relation(fields: [sportId], references: [id], onDelete: Cascade)
  seasons      Season[]
  externalMaps ExternalMap[] @relation("CompetitionMaps")  // ✅ NUEVO

  @@unique([sportId, slug])
}
```

#### ✅ ExternalMap - Agregada relación inversa con Competition

```prisma
model ExternalMap {
  id          String         @id @default(cuid())
  sourceId    String
  entityType  String
  entityId    String
  externalId  String
  metadata    Json?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  source      ExternalSource @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  competition Competition?   @relation("CompetitionMaps", fields: [entityId], references: [id], onDelete: Cascade)  // ✅ NUEVO

  @@unique([sourceId, entityType, externalId])
  @@index([entityType, entityId])
}
```

---

### 2. Seed Script Actualizado

#### ✅ Agregado SUPERADMIN

```typescript
// 1. Tenant de la Agencia
const agenciaTenant = await prisma.tenant.create({
  slug: "agencia",
  name: "Agencia Quinielas",
  description: "Tenant de la agencia para gestión global del sistema"
});

// 2. Usuario SUPERADMIN
const superAdminUser = await prisma.user.create({
  email: "victor@agencia.com",
  name: "Victor Mancera"
});

// 3. Asignar rol SUPERADMIN
await prisma.tenantMember.create({
  tenantId: agenciaTenant.id,
  userId: superAdminUser.id,
  role: "SUPERADMIN"
});
```

#### ✅ Agregados ExternalMaps

```typescript
// Mapeo de Competition a API-Football
await prisma.externalMap.create({
  sourceId: externalSource.id,
  entityType: "competition",
  entityId: competition.id,
  externalId: "1", // API-Football World Cup ID
  metadata: {
    name: "FIFA World Cup",
    type: "Cup",
    country: "World"
  }
});

// Mapeo de Season a API-Football
await prisma.externalMap.create({
  sourceId: externalSource.id,
  entityType: "season",
  entityId: season.id,
  externalId: "2026",
  metadata: {
    year: 2026,
    current: false
  }
});
```

---

## Instrucciones de Migración

### Opción 1: Migración Normal (Recomendada)

Si tienes permisos para crear shadow database:

```bash
cd packages/db
pnpm prisma migrate dev --name add_competition_external_maps_relation
pnpm prisma generate
pnpm db:seed
```

---

### Opción 2: Sin Shadow Database (Tu Caso)

Si obtienes el error `P3014` (sin permisos para shadow database):

#### Paso 1: Crear migración sin ejecutar

```bash
cd packages/db
pnpm prisma migrate dev --create-only --name add_competition_external_maps_relation
```

#### Paso 2: Revisar el SQL generado

```bash
# Ver el archivo de migración
cat prisma/migrations/XXXXXX_add_competition_external_maps_relation/migration.sql
```

#### Paso 3: Ejecutar migración manualmente

```bash
# Opción A: Aplicar migración sin shadow database
pnpm prisma migrate deploy

# Opción B: Ejecutar SQL directamente en PostgreSQL
psql -U postgres -d quinielas -f prisma/migrations/XXXXXX_add_competition_external_maps_relation/migration.sql
```

#### Paso 4: Marcar migración como aplicada

```bash
pnpm prisma migrate resolve --applied add_competition_external_maps_relation
```

#### Paso 5: Regenerar cliente y ejecutar seed

```bash
pnpm prisma generate
pnpm db:seed
```

---

### Opción 3: Configurar Shadow Database (Solución Permanente)

#### Método A: Crear shadow database manualmente

```sql
-- Conectarse como superusuario de PostgreSQL
psql -U postgres

-- Crear shadow database
CREATE DATABASE quinielas_shadow;

-- Dar permisos al usuario
GRANT ALL PRIVILEGES ON DATABASE quinielas_shadow TO tu_usuario;
```

Luego actualizar `.env`:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/quinielas"
SHADOW_DATABASE_URL="postgresql://usuario:password@localhost:5432/quinielas_shadow"
```

#### Método B: Dar permisos de CREATEDB al usuario

```sql
-- Conectarse como superusuario
psql -U postgres

-- Dar permiso de crear bases de datos
ALTER USER tu_usuario CREATEDB;
```

Ahora podrás ejecutar migraciones normalmente:

```bash
pnpm prisma migrate dev --name add_competition_external_maps_relation
```

---

## Verificación Post-Migración

### 1. Verificar Schema

```bash
pnpm prisma db pull
pnpm prisma validate
```

### 2. Verificar Datos del Seed

```sql
-- Conectarse a la DB
psql -U postgres -d quinielas

-- Verificar SUPERADMIN
SELECT u.email, u.name, tm.role, t.slug as tenant
FROM "User" u
JOIN "TenantMember" tm ON u.id = tm."userId"
JOIN "Tenant" t ON tm."tenantId" = t.id
WHERE tm.role = 'SUPERADMIN';

-- Resultado esperado:
-- email                | name            | role       | tenant
-- ---------------------|-----------------|------------|--------
-- victor@agencia.com   | Victor Mancera  | SUPERADMIN | agencia

-- Verificar ExternalMaps
SELECT em."entityType", em."externalId", em.metadata, c.name as competition_name
FROM "ExternalMap" em
LEFT JOIN "Competition" c ON em."entityId" = c.id AND em."entityType" = 'competition'
WHERE em."entityType" IN ('competition', 'season');

-- Resultado esperado:
-- entityType  | externalId | metadata                        | competition_name
-- ------------|------------|----------------------------------|------------------
-- competition | 1          | {"name":"FIFA World Cup",...}   | FIFA World Cup
-- season      | 2026       | {"year":2026,...}               | NULL
```

### 3. Verificar Relación en tRPC

```typescript
// Test en syncRouter
const seasons = await prisma.season.findMany({
  include: {
    competition: {
      include: {
        externalMaps: {  // ✅ Ahora funciona
          include: {
            source: true
          }
        }
      }
    }
  }
});

console.log(seasons[0].competition.externalMaps);
// ✅ Debería retornar array con el mapeo a API-Football
```

---

## Datos de Prueba Creados

### 🔐 SUPERADMIN

- **Email:** `victor@agencia.com`
- **Nombre:** Victor Mancera
- **Tenant:** `agencia`
- **Role:** `SUPERADMIN`
- **Login:** Usar magic link con este email

### 📦 Demo Tenant

- **Tenant:** `demo`
- **Brand:** `default`
- **Pool:** `world-cup-2026`
- **Season:** `fifa-world-cup-2026`

### 👥 Usuarios Demo

| Email | Nombre | Tenant | Role |
|-------|--------|--------|------|
| `victor@agencia.com` | Victor Mancera | agencia | SUPERADMIN |
| `admin@demo.com` | Demo Admin | demo | TENANT_ADMIN |
| `player1@demo.com` | Demo Player 1 | demo | PLAYER |
| `player2@demo.com` | Demo Player 2 | demo | PLAYER |

### 🔗 External Mappings

| Entity Type | Entity | External Source | External ID |
|-------------|--------|-----------------|-------------|
| competition | FIFA World Cup | API-Football | 1 |
| season | World Cup 2026 | API-Football | 2026 |

---

## Troubleshooting

### Error: P3014 (Shadow Database)

```
Error: P3014
Prisma Migrate could not create the shadow database.
```

**Solución:** Usar Opción 2 (Sin Shadow Database) o Opción 3 (Configurar Shadow Database)

---

### Error: Relación no encontrada

```
Error: Unknown field `externalMaps` for select statement on model `Competition`
```

**Causa:** Cliente de Prisma no regenerado después de cambios en schema.

**Solución:**
```bash
pnpm prisma generate
```

---

### Error: Foreign key constraint

```
Error: Foreign key constraint failed on the field: `competition`
```

**Causa:** Intentando crear ExternalMap con `entityId` que no existe en Competition.

**Solución:** Asegúrate de que la Competition existe antes de crear el ExternalMap.

---

## Próximos Pasos

### 1. Ejecutar Migración

Elige una de las 3 opciones según tu configuración de PostgreSQL.

### 2. Verificar SUPERADMIN

```bash
# Probar login con magic link
# Email: victor@agencia.com
```

### 3. Probar syncRouter

```bash
# Verificar que las queries con externalMaps funcionan
pnpm --filter @qp/api test
```

### 4. Implementar Auth.js

Siguiente paso: Configurar Auth.js para login real con magic links.

---

## Resumen de Archivos Modificados

- ✅ `packages/db/prisma/schema.prisma` - Agregadas relaciones
- ✅ `packages/db/src/seed.ts` - Agregado SUPERADMIN y ExternalMaps
- ✅ `DATABASE_ANALYSIS.md` - Actualizado con discrepancia #11
- ✅ `EXTERNAL_MAPS_FIX.md` - Documentación del fix
- ✅ `EXTERNAL_MAPS_ANALYSIS.md` - Análisis completo
- ✅ `AUTH_ARCHITECTURE.md` - Arquitectura de autenticación

---

**¿Listo para ejecutar la migración?**

Recomendación: Usar **Opción 2** (Sin Shadow Database) si no tienes permisos de CREATEDB.

---

**Autor:** Cascade AI  
**Revisión:** Victor Mancera
