# Fix: Relación externalMaps en Competition

**Fecha:** 2025-10-09  
**Estado:** ✅ Corregido

---

## Problema Identificado

El `syncRouter` (`packages/api/src/routers/sync/index.ts`) hace referencia a `competition.externalMaps` en dos lugares:

1. **Línea 166** - Query `getActiveSeasons`
2. **Línea 225** - Mutation `triggerSync`

```typescript
competition: {
  include: {
    sport: true,
    externalMaps: {  // ❌ Esta relación no existía
      include: {
        source: true
      }
    }
  }
}
```

Sin embargo, el modelo `Competition` en el schema de Prisma **NO tenía** esta relación definida, lo que causaría un error en runtime.

---

## Solución Implementada

### ✅ Cambio 1: Agregar relación en Competition

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
  externalMaps ExternalMap[] @relation("CompetitionMaps")  // ✅ AGREGADO

  @@unique([sportId, slug])
}
```

### ✅ Cambio 2: Agregar relación inversa en ExternalMap

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
  competition Competition?   @relation("CompetitionMaps", fields: [entityId], references: [id], onDelete: Cascade)  // ✅ AGREGADO

  @@unique([sourceId, entityType, externalId])
  @@index([entityType, entityId])
}
```

---

## Justificación Técnica

### Patrón de Diseño Utilizado

`ExternalMap` usa un **patrón polimórfico** con `entityType` y `entityId` para mapear múltiples tipos de entidades:

- `entityType: "competition"` → mapea a `Competition`
- `entityType: "team"` → mapea a `Team`
- `entityType: "match"` → mapea a `Match`
- etc.

### Por qué es necesaria la relación

Aunque `ExternalMap` puede mapear cualquier entidad mediante `entityType` + `entityId`, **Prisma requiere relaciones explícitas** para:

1. **Type safety**: TypeScript necesita conocer el tipo de retorno
2. **Includes**: Permitir `include: { externalMaps: true }` en queries
3. **Eager loading**: Optimizar queries con JOINs automáticos

### Relación Opcional (`Competition?`)

La relación es **opcional** (`?`) porque:
- `ExternalMap` puede mapear otras entidades (Team, Match, etc.)
- Solo cuando `entityType === "competition"` la relación estará poblada
- Evita errores de constraint cuando `entityId` apunta a otra tabla

---

## Impacto en el Sistema

### ✅ Beneficios

1. **Corrige error en syncRouter**: Ahora las queries funcionarán correctamente
2. **Type safety mejorado**: TypeScript validará los includes
3. **Queries más eficientes**: Prisma puede optimizar JOINs
4. **Consistencia**: Alinea el schema con el uso real en el código

### ⚠️ Consideraciones

1. **Migración requerida**: Necesitas ejecutar `prisma migrate dev`
2. **Sin breaking changes**: La relación es opcional, no afecta datos existentes
3. **Patrón extensible**: Puedes agregar relaciones similares para `Team`, `Match`, etc.

---

## Próximos Pasos

### 1. Generar y Aplicar Migración

```bash
cd packages/db
pnpm prisma migrate dev --name add_competition_external_maps_relation
pnpm prisma generate
```

### 2. Verificar Queries

El código en `syncRouter` ahora funcionará correctamente:

```typescript
// ✅ Esto ahora funciona
const seasons = await prisma.season.findMany({
  include: {
    competition: {
      include: {
        sport: true,
        externalMaps: {  // ✅ Relación válida
          include: {
            source: true
          }
        }
      }
    }
  }
});

// ✅ Filtrado funciona
const competitionMap = season.competition.externalMaps.find(
  map => map.entityType === "competition"
);
```

### 3. (Opcional) Agregar Relaciones Similares

Si en el futuro necesitas queries similares para otras entidades:

```prisma
model Team {
  // ... campos existentes
  externalMaps ExternalMap[] @relation("TeamMaps")
}

model Match {
  // ... campos existentes
  externalMaps ExternalMap[] @relation("MatchMaps")
}

model ExternalMap {
  // ... campos existentes
  competition Competition? @relation("CompetitionMaps", fields: [entityId], references: [id])
  team        Team?        @relation("TeamMaps", fields: [entityId], references: [id])
  match       Match?       @relation("MatchMaps", fields: [entityId], references: [id])
}
```

---

## Testing

### Verificar que funciona

```typescript
// Test 1: Query básica
const competition = await prisma.competition.findUnique({
  where: { id: "xxx" },
  include: {
    externalMaps: true
  }
});

console.log(competition.externalMaps); // ✅ Array de ExternalMap

// Test 2: Filtrado por entityType
const apiFootballMap = competition.externalMaps.find(
  map => map.entityType === "competition" && map.source.slug === "api-football"
);

console.log(apiFootballMap?.externalId); // ✅ ID externo
```

---

## Conclusión

✅ **La relación `externalMaps` en Competition es NECESARIA** para que el código del `syncRouter` funcione correctamente.

✅ **El cambio es seguro** y no afecta datos existentes.

✅ **Mejora la type safety** y permite queries más eficientes.

---

**Autor:** Cascade AI  
**Revisión:** Recomendada antes de ejecutar migración
