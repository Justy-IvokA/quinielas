# Guía de Migración - Alineación Schema Prisma ↔ tRPC

**Fecha:** 2025-10-09  
**Objetivo:** Aplicar cambios de alineación entre Prisma y tRPC  
**Impacto:** 10 cambios en schema, 4 routers actualizados

---

## 📋 Cambios Aplicados

### Schema Prisma (`packages/db/prisma/schema.prisma`)

#### 1. Enum `MatchStatus`
```diff
enum MatchStatus {
  SCHEDULED
- IN_PROGRESS
- COMPLETED
+ LIVE
+ FINISHED
  POSTPONED
  CANCELLED
}
```

#### 2. Model `Competition`
```diff
model Competition {
  id        String   @id @default(cuid())
  sportId   String
  slug      String
  name      String
+ logoUrl   String?
  metadata  Json?
  ...
}
```

#### 3. Model `Team`
```diff
model Team {
  id          String       @id @default(cuid())
  sportId     String
  slug        String
  name        String
  shortName   String?
+ logoUrl     String?
  countryCode String?
  ...
}
```

#### 4. Model `Match`
```diff
model Match {
  id           String      @id @default(cuid())
  seasonId     String
+ round        Int?
  matchday     Int?
  status       MatchStatus @default(SCHEDULED)
- kickoffAt    DateTime
+ kickoffTime  DateTime
  homeTeamId   String
  awayTeamId   String
  homeScore    Int?
  awayScore    Int?
  venue        String?
  locked       Boolean     @default(false)
+ finishedAt   DateTime?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  season   Season @relation(...)
  homeTeam Team   @relation("HomeTeam", ...)
  awayTeam Team   @relation("AwayTeam", ...)
  predictions Prediction[]

+ @@unique([seasonId, round, homeTeamId, awayTeamId])
- @@index([seasonId, kickoffAt])
+ @@index([seasonId, kickoffTime])
+ @@index([status])
}
```

#### 5. Model `Prize`
```diff
model Prize {
  id          String   @id @default(cuid())
  poolId      String
  tenantId    String
- name        String
- rank        Int
+ position    Int
+ title       String
  description String?
+ value       String?
+ imageUrl    String?
  createdAt   DateTime @default(now())

  tenant Tenant @relation(...)
  pool   Pool   @relation(...)
  awards PrizeAward[]

- @@unique([poolId, rank])
+ @@unique([poolId, position])
  @@index([tenantId, poolId])
}
```

#### 6. Model `CodeBatch`
```diff
model CodeBatch {
  id              String           @id @default(cuid())
  accessPolicyId  String
  tenantId        String
- name            String
+ name            String?
  status          CodeBatchStatus  @default(UNUSED)
  ...
}
```

### Routers tRPC Actualizados

#### 1. `packages/api/src/routers/access/schema.ts`
- ✅ Agregado `tenantId` en createAccessPolicySchema
- ✅ Renombrado `allowedDomains` → `domainAllowList`
- ✅ Agregados `userCap`, `windowStart`, `windowEnd`
- ✅ Agregado `tenantId`, `name`, `description` en CodeBatch
- ✅ Agregado `poolId`, `tenantId` en Invitation

#### 2. `packages/api/src/routers/access/index.ts`
- ✅ Actualizado createCodeBatch con nuevos campos
- ✅ Actualizado createEmailInvitation con nuevos campos

#### 3. `packages/api/src/routers/registration/index.ts`
- ✅ Agregado `tenantId` en 3 flujos de registro

#### 4. `packages/api/src/routers/fixtures/schema.ts`
- ✅ Agregado `finishedAt` en updateMatchResultSchema
- ✅ Enum alineado a LIVE/FINISHED

#### 5. `packages/api/src/routers/fixtures/index.ts`
- ✅ Corregidas relaciones homeTeam/awayTeam (directas, no anidadas)
- ✅ Agregado `logoUrl`, `countryCode` en selects

---

## 🚀 Pasos de Ejecución

### Opción A: Ambiente Nuevo (Sin Datos)

```bash
# 1. Ir al directorio de db
cd packages/db

# 2. Crear migración
pnpm prisma migrate dev --name align_schema_with_trpc

# 3. Generar cliente Prisma
pnpm prisma generate

# 4. Regresar a root y ejecutar tests
cd ../..
pnpm turbo test --filter=@qp/api

# 5. Build para verificar tipos
pnpm turbo build
```

### Opción B: Con Datos Existentes (Producción/Staging)

⚠️ **IMPORTANTE: Crear backup antes de continuar**

```bash
# 1. Backup de base de datos
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Crear SQL de migración manual
cd packages/db
```

**Crear archivo:** `prisma/migrations/YYYYMMDDHHMMSS_align_schema_with_trpc/migration.sql`

```sql
-- 1. Agregar nuevas columnas (sin romper datos existentes)
ALTER TABLE "Team" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "Competition" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "Match" ADD COLUMN "round" INTEGER;
ALTER TABLE "Match" ADD COLUMN "finishedAt" TIMESTAMP(3);
ALTER TABLE "Prize" ADD COLUMN "position" INTEGER;
ALTER TABLE "Prize" ADD COLUMN "title" TEXT;
ALTER TABLE "Prize" ADD COLUMN "value" TEXT;
ALTER TABLE "Prize" ADD COLUMN "imageUrl" TEXT;

-- 2. Renombrar columnas
ALTER TABLE "Match" RENAME COLUMN "kickoffAt" TO "kickoffTime";

-- 3. Migrar datos de Prize
UPDATE "Prize" SET "title" = "name", "position" = "rank";

-- 4. Actualizar enum MatchStatus (si existe data)
ALTER TYPE "MatchStatus" RENAME VALUE 'IN_PROGRESS' TO 'LIVE';
ALTER TYPE "MatchStatus" RENAME VALUE 'COMPLETED' TO 'FINISHED';

-- 5. Crear índices nuevos
CREATE UNIQUE INDEX "Match_seasonId_round_homeTeamId_awayTeamId_key" 
ON "Match"("seasonId", "round", "homeTeamId", "awayTeamId");

CREATE INDEX "Match_status_idx" ON "Match"("status");

DROP INDEX "Match_seasonId_kickoffAt_idx";
CREATE INDEX "Match_seasonId_kickoffTime_idx" 
ON "Match"("seasonId", "kickoffTime");

-- 6. Actualizar constraints de Prize
ALTER TABLE "Prize" DROP CONSTRAINT "Prize_poolId_rank_key";
ALTER TABLE "Prize" ADD CONSTRAINT "Prize_poolId_position_key" 
UNIQUE ("poolId", "position");

-- 7. Eliminar columnas viejas de Prize
ALTER TABLE "Prize" DROP COLUMN "name";
ALTER TABLE "Prize" DROP COLUMN "rank";

-- 8. Hacer name nullable en CodeBatch
ALTER TABLE "CodeBatch" ALTER COLUMN "name" DROP NOT NULL;
```

```bash
# 3. Aplicar migración
pnpm prisma migrate deploy

# 4. Generar cliente
pnpm prisma generate

# 5. Verificar
cd ../..
pnpm tsx scripts/validate-schema.ts
```

---

## ✅ Checklist de Validación

### Pre-Migración
- [ ] Backup de base de datos creado
- [ ] Variables de entorno verificadas (`DATABASE_URL`)
- [ ] Permisos de usuario DB confirmados
- [ ] Ventana de mantenimiento programada (si aplica)

### Post-Migración
- [ ] `pnpm prisma generate` ejecutado sin errores
- [ ] `pnpm tsx scripts/validate-schema.ts` pasa todas las validaciones
- [ ] Tests de integración pasando:
  ```bash
  pnpm turbo test --filter=@qp/api
  ```
- [ ] Build sin errores de tipos:
  ```bash
  pnpm turbo build
  ```
- [ ] Queries de prueba funcionando:
  ```typescript
  // Test en una terminal de Node
  const { prisma } = require("@qp/db");
  
  // 1. Test Match con nuevos campos
  await prisma.match.findFirst({
    select: { round: true, kickoffTime: true, finishedAt: true }
  });
  
  // 2. Test Team con logoUrl
  await prisma.team.findFirst({
    select: { logoUrl: true }
  });
  
  // 3. Test Prize con nuevos campos
  await prisma.prize.findFirst({
    select: { position: true, title: true, value: true, imageUrl: true }
  });
  ```

### Verificación en Apps
- [ ] `apps/web` - Build exitoso
- [ ] `apps/admin` - Build exitoso
- [ ] `apps/worker` - Build exitoso
- [ ] Endpoints tRPC respondiendo correctamente
- [ ] Frontend mostrando datos correctamente

---

## 🔄 Rollback Plan

Si algo sale mal:

```bash
# Opción 1: Rollback de migración de Prisma
cd packages/db
pnpm prisma migrate resolve --rolled-back YYYYMMDDHHMMSS_align_schema_with_trpc

# Opción 2: Restaurar desde backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Opción 3: Git revert de cambios en código
git revert HEAD
pnpm install
pnpm prisma generate
```

---

## 📊 Impacto en Queries

### Queries que deben actualizarse en el código existente:

#### 1. Match queries
```typescript
// ANTES
const match = await prisma.match.findFirst({
  where: { kickoffAt: { gte: new Date() } }
});

// DESPUÉS
const match = await prisma.match.findFirst({
  where: { kickoffTime: { gte: new Date() } }
});
```

#### 2. Prize queries
```typescript
// ANTES
const prizes = await prisma.prize.findMany({
  orderBy: { rank: 'asc' }
});

// DESPUÉS
const prizes = await prisma.prize.findMany({
  orderBy: { position: 'asc' }
});
```

#### 3. Match status
```typescript
// ANTES
await prisma.match.update({
  where: { id },
  data: { status: 'IN_PROGRESS' }
});

// DESPUÉS
await prisma.match.update({
  where: { id },
  data: { status: 'LIVE' }
});
```

---

## 🧪 Tests Recomendados Post-Migración

```typescript
// packages/api/src/__tests__/migration-validation.test.ts

import { prisma } from "@qp/db";

describe("Schema Migration Validation", () => {
  it("Match should have new fields", async () => {
    const match = await prisma.match.create({
      data: {
        seasonId: "test-season",
        round: 1,
        kickoffTime: new Date(),
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        status: "SCHEDULED"
      }
    });
    
    expect(match.round).toBe(1);
    expect(match.kickoffTime).toBeDefined();
    expect(match.finishedAt).toBeNull();
  });

  it("Prize should use position instead of rank", async () => {
    const prize = await prisma.prize.create({
      data: {
        poolId: "test-pool",
        tenantId: "test-tenant",
        position: 1,
        title: "Primer Lugar",
        value: "$1000 MXN"
      }
    });
    
    expect(prize.position).toBe(1);
    expect(prize.title).toBe("Primer Lugar");
  });

  it("Team should have logoUrl", async () => {
    const team = await prisma.team.create({
      data: {
        sportId: "test-sport",
        slug: "team-test",
        name: "Test Team",
        logoUrl: "https://example.com/logo.png"
      }
    });
    
    expect(team.logoUrl).toBe("https://example.com/logo.png");
  });
});
```

---

## 📞 Soporte

Si encuentras problemas durante la migración:

1. **Verificar logs:** `packages/db/prisma/migrations/*/migration.sql`
2. **Validar schema:** `pnpm tsx scripts/validate-schema.ts`
3. **Revisar análisis completo:** `DATABASE_ANALYSIS.md`
4. **Consultar documentación Prisma:** https://www.prisma.io/docs/guides/migrate

---

**Última actualización:** 2025-10-09  
**Autor:** Cascade AI  
**Estado:** ✅ Listo para ejecutar
