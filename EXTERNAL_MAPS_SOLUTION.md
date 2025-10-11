# Solución: ExternalMaps sin Foreign Key Constraints

**Fecha:** 2025-10-09  
**Problema:** Foreign key constraint violation en ExternalMap  
**Estado:** ✅ Resuelto

---

## Problema Original

Al intentar crear ExternalMaps con diferentes `entityType` (competition, season, team, etc.), Prisma intentaba validar un foreign key constraint hacia `Competition`, causando errores cuando `entityType` era diferente de "competition".

### Error

```
Foreign key constraint violated on the (not available)
```

**Causa:** La relación `competition Competition?` en `ExternalMap` creaba un foreign key constraint físico en la base de datos que siempre intentaba validar `entityId` contra `Competition.id`, incluso cuando `entityType` era "season", "team", etc.

---

## Solución Implementada

### ❌ Enfoque Inicial (Incorrecto)

```prisma
model Competition {
  externalMaps ExternalMap[] @relation("CompetitionMaps")
}

model ExternalMap {
  competition Competition? @relation("CompetitionMaps", fields: [entityId], references: [id])
  // ❌ Esto crea un FK constraint físico que siempre valida entityId
}
```

**Problema:** El foreign key se valida SIEMPRE, sin importar el valor de `entityType`.

---

### ✅ Solución Final (Correcta)

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

  sport   Sport   @relation(fields: [sportId], references: [id], onDelete: Cascade)
  seasons Season[]
  // ✅ NO hay relación externalMaps aquí

  @@unique([sportId, slug])
}

model ExternalMap {
  id          String         @id @default(cuid())
  sourceId    String
  entityType  String  // "competition", "season", "team", "match"
  entityId    String  // ID de la entidad (puede apuntar a cualquier tabla)
  externalId  String  // ID en la API externa
  metadata    Json?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  source ExternalSource @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  // ✅ NO hay relación competition aquí

  @@unique([sourceId, entityType, externalId])
  @@index([entityType, entityId])
}
```

**Ventajas:**
- ✅ Sin foreign key constraints físicos
- ✅ `entityId` puede apuntar a cualquier tabla según `entityType`
- ✅ Flexibilidad total para el patrón polimórfico
- ✅ No hay errores de constraint violation

---

## Cambios en el Código

### syncRouter - Queries Manuales

En lugar de usar relaciones de Prisma, hacemos queries manuales:

#### Antes (Con Relación)

```typescript
const seasons = await prisma.season.findMany({
  include: {
    competition: {
      include: {
        externalMaps: {  // ❌ Esta relación ya no existe
          include: { source: true }
        }
      }
    }
  }
});

const competitionMap = season.competition.externalMaps.find(
  map => map.entityType === "competition"
);
```

#### Después (Query Manual)

```typescript
// 1. Obtener seasons con competition
const seasons = await prisma.season.findMany({
  include: {
    competition: {
      include: { sport: true }
    }
  }
});

// 2. Obtener ExternalMaps manualmente
const competitionIds = seasons.map(s => s.competition.id);
const externalMaps = await prisma.externalMap.findMany({
  where: {
    entityType: "competition",
    entityId: { in: competitionIds }
  },
  include: { source: true }
});

// 3. Crear mapa para acceso rápido
const mapsById = new Map(
  externalMaps.map(map => [map.entityId, map])
);

// 4. Usar el mapa
const competitionMap = mapsById.get(season.competition.id);
```

---

## Patrón de Uso Recomendado

### Crear ExternalMap

```typescript
// Para Competition
await prisma.externalMap.create({
  data: {
    sourceId: apiFootballSource.id,
    entityType: "competition",
    entityId: competition.id,  // ✅ Apunta a Competition.id
    externalId: "1",
    metadata: { name: "FIFA World Cup" }
  }
});

// Para Season
await prisma.externalMap.create({
  data: {
    sourceId: apiFootballSource.id,
    entityType: "season",
    entityId: season.id,  // ✅ Apunta a Season.id
    externalId: "2026",
    metadata: { year: 2026 }
  }
});

// Para Team
await prisma.externalMap.create({
  data: {
    sourceId: apiFootballSource.id,
    entityType: "team",
    entityId: team.id,  // ✅ Apunta a Team.id
    externalId: "16",
    metadata: { name: "Mexico" }
  }
});
```

### Buscar ExternalMap

```typescript
// Por entidad específica
const competitionMap = await prisma.externalMap.findFirst({
  where: {
    entityType: "competition",
    entityId: competitionId
  },
  include: { source: true }
});

// Por múltiples entidades (más eficiente)
const maps = await prisma.externalMap.findMany({
  where: {
    entityType: "competition",
    entityId: { in: competitionIds }
  },
  include: { source: true }
});

// Por external ID (para sincronización inversa)
const map = await prisma.externalMap.findUnique({
  where: {
    sourceId_entityType_externalId: {
      sourceId: apiFootballSource.id,
      entityType: "competition",
      externalId: "1"
    }
  }
});
```

---

## Ventajas del Patrón Polimórfico Sin FK

### 1. Flexibilidad Total

```typescript
// Puedes mapear CUALQUIER entidad sin cambiar el schema
await prisma.externalMap.create({
  data: {
    sourceId: source.id,
    entityType: "prize",      // ✅ Nueva entidad
    entityId: prize.id,
    externalId: "prize-123",
    metadata: { ... }
  }
});
```

### 2. Sin Migraciones para Nuevas Entidades

No necesitas agregar relaciones cada vez que quieres mapear un nuevo tipo de entidad.

### 3. Queries Eficientes

```typescript
// Obtener todos los mapeos de un provider
const allMaps = await prisma.externalMap.findMany({
  where: { sourceId: apiFootballSource.id },
  include: { source: true }
});

// Agrupar por entityType
const byType = allMaps.reduce((acc, map) => {
  if (!acc[map.entityType]) acc[map.entityType] = [];
  acc[map.entityType].push(map);
  return acc;
}, {} as Record<string, ExternalMap[]>);
```

### 4. Sincronización Bidireccional

```typescript
// De nuestra DB a API externa
const externalId = await getExternalId(competition.id, "competition");

// De API externa a nuestra DB
const localId = await getLocalId(externalId, "competition");

async function getExternalId(entityId: string, entityType: string) {
  const map = await prisma.externalMap.findFirst({
    where: { entityId, entityType }
  });
  return map?.externalId;
}

async function getLocalId(externalId: string, entityType: string) {
  const map = await prisma.externalMap.findFirst({
    where: { externalId, entityType }
  });
  return map?.entityId;
}
```

---

## Migración Aplicada

### Comandos Ejecutados

```bash
# 1. Push del schema sin migración
pnpm db:push

# 2. Regenerar cliente Prisma
pnpm prisma generate

# 3. Ejecutar seed
pnpm seed
```

### Resultado

```
✅ SUPERADMIN created: {
  email: 'vemancera@gmail.com',
  tenant: 'innotecnia',
  role: 'SUPERADMIN'
}
🔗 Creating external source and mappings...
✅ External mappings created: {
  source: 'api-football',
  competition: 'FIFA World Cup → ID 1',
  season: '2026 → ID 2026'
}
```

---

## Verificación

### 1. Schema Correcto

```sql
-- Verificar que NO hay FK constraint hacia Competition
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'ExternalMap' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- Resultado esperado:
-- Solo debe haber FK hacia ExternalSource, NO hacia Competition
```

### 2. Datos Correctos

```sql
SELECT 
  em."entityType",
  em."entityId",
  em."externalId",
  em.metadata,
  es.name as source_name
FROM "ExternalMap" em
JOIN "ExternalSource" es ON em."sourceId" = es.id;

-- Resultado esperado:
-- entityType  | entityId | externalId | source_name
-- ------------|----------|------------|-------------
-- competition | xxx-xxx  | 1          | API-Football
-- season      | yyy-yyy  | 2026       | API-Football
```

---

## Conclusión

✅ **Problema resuelto** removiendo las relaciones de Prisma y usando queries manuales.

✅ **Patrón polimórfico** funciona correctamente sin foreign key constraints.

✅ **syncRouter** actualizado para buscar ExternalMaps manualmente.

✅ **Seed ejecutado** exitosamente con SUPERADMIN y ExternalMaps.

---

## Archivos Modificados

- ✅ `packages/db/prisma/schema.prisma` - Removidas relaciones
- ✅ `packages/api/src/routers/sync/index.ts` - Queries manuales
- ✅ `packages/db/src/seed.ts` - Datos de prueba (Innotecnia)

---

**Autor:** Cascade AI  
**Revisión:** Victor Mancera (Innotecnia)
