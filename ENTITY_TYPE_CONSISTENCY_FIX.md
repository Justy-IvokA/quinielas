# ✅ Corrección de Consistencia: entityType en Mayúsculas

## Fecha
19 de Octubre, 2025 - 8:00 PM

## Problema Detectado

Se encontraron **inconsistencias** en el uso de `entityType` en la tabla `ExternalMap`:

- ❌ Algunos lugares usaban minúsculas: `"competition"`, `"team"`, `"match"`
- ✅ Otros lugares usaban mayúsculas: `"COMPETITION"`, `"TEAM"`, `"MATCH"`

Esto causaba que las búsquedas fallaran porque:
```typescript
// Script creaba con mayúsculas
entityType: "COMPETITION"

// Pero el código buscaba con minúsculas
entityType: "competition"  // ❌ No encontraba el registro
```

---

## Archivos Corregidos

### 1. `packages/api/src/routers/pool-wizard/index.ts`

**Cambios:**
- Línea 267: `"competition"` → `"COMPETITION"`
- Líneas 321, 327: `"team"` → `"TEAM"`
- Líneas 402, 408: `"match"` → `"MATCH"`

**Contexto:** Al crear una quiniela con el wizard, se crean mapeos externos para:
- La competición
- Los equipos
- Los partidos

### 2. `packages/api/src/routers/fixtures/index.ts`

**Cambios:**
- Línea 169: `"competition"` → `"COMPETITION"`
- Líneas 237, 243: `"team"` → `"TEAM"`
- Líneas 319, 325: `"match"` → `"MATCH"`

**Contexto:** Al sincronizar fixtures desde API externa.

### 3. `packages/api/src/routers/sync/index.ts`

**Cambios:**
- Línea 44: `"match"` → `"MATCH"`
- Línea 183: `"competition"` → `"COMPETITION"`
- Línea 247: `"competition"` → `"COMPETITION"`

**Contexto:** En las funciones de sincronización y estadísticas.

### 4. `scripts/link-competition-to-api-sports.ts`

**Estado:** ✅ Ya usaba mayúsculas correctamente
- Línea 93: `entityType: "COMPETITION"`
- Línea 117: `entityType: "COMPETITION"`

### 5. `apps/web/.../FixturesView.tsx`

**Estado:** ✅ Ya usaba mayúsculas correctamente
- Línea 59: `entityType: "COMPETITION"`

---

## Convención Establecida

**De ahora en adelante, SIEMPRE usar mayúsculas:**

```typescript
// ✅ CORRECTO
entityType: "COMPETITION"
entityType: "TEAM"
entityType: "MATCH"
entityType: "SEASON"
entityType: "SPORT"

// ❌ INCORRECTO
entityType: "competition"
entityType: "team"
entityType: "match"
```

---

## Tipos de Entidades Soportadas

| Entity Type | Descripción | Ejemplo External ID |
|-------------|-------------|---------------------|
| `COMPETITION` | Ligas/Competiciones | `"39"` (Premier League) |
| `TEAM` | Equipos | `"50"` (Manchester City) |
| `MATCH` | Partidos | `"12345"` (Match ID) |
| `SEASON` | Temporadas | `"2025"` |
| `SPORT` | Deportes | `"1"` (Football) |

---

## Impacto en Base de Datos Existente

### Registros Antiguos con Minúsculas

Si ya tienes registros en la base de datos con minúsculas, tienes dos opciones:

#### Opción 1: Migración de Datos (Recomendado)

Ejecutar un script de migración para actualizar los registros existentes:

```sql
-- Actualizar entityType a mayúsculas
UPDATE "ExternalMap" 
SET "entityType" = UPPER("entityType")
WHERE "entityType" IN ('competition', 'team', 'match', 'season', 'sport');
```

O con Prisma:

```typescript
// scripts/migrate-entity-types.ts
import { PrismaClient } from "@qp/db";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE "ExternalMap" 
    SET "entityType" = UPPER("entityType")
    WHERE "entityType" IN ('competition', 'team', 'match', 'season', 'sport')
  `;
  
  console.log(`✅ Updated ${result} records`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

#### Opción 2: Recrear Registros

Si tienes pocos registros, puedes:
1. Eliminar los registros con minúsculas
2. Volver a crear las quinielas o ejecutar el script de vinculación

---

## Verificación

Para verificar que todo está correcto:

```sql
-- Ver todos los entityType únicos
SELECT DISTINCT "entityType", COUNT(*) 
FROM "ExternalMap" 
GROUP BY "entityType";

-- Resultado esperado:
-- COMPETITION | 5
-- TEAM        | 100
-- MATCH       | 500
```

Si ves valores en minúsculas, ejecuta la migración.

---

## Prevención Futura

### 1. TypeScript Type

Crear un tipo para asegurar consistencia:

```typescript
// packages/db/src/types.ts
export const ENTITY_TYPES = {
  COMPETITION: "COMPETITION",
  TEAM: "TEAM",
  MATCH: "MATCH",
  SEASON: "SEASON",
  SPORT: "SPORT",
} as const;

export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES];
```

Uso:
```typescript
import { ENTITY_TYPES } from "@qp/db/types";

await prisma.externalMap.create({
  data: {
    entityType: ENTITY_TYPES.COMPETITION,  // ✅ Type-safe
    // ...
  }
});
```

### 2. Prisma Schema Enum (Opcional)

Agregar un enum en el schema:

```prisma
enum EntityType {
  COMPETITION
  TEAM
  MATCH
  SEASON
  SPORT
}

model ExternalMap {
  // ...
  entityType  EntityType  // En lugar de String
  // ...
}
```

**Nota:** Esto requiere una migración de base de datos.

---

## Testing

Agregar tests para verificar consistencia:

```typescript
describe("ExternalMap entityType", () => {
  it("should always use uppercase entity types", async () => {
    const maps = await prisma.externalMap.findMany();
    
    maps.forEach((map) => {
      expect(map.entityType).toBe(map.entityType.toUpperCase());
      expect(["COMPETITION", "TEAM", "MATCH", "SEASON", "SPORT"]).toContain(map.entityType);
    });
  });
});
```

---

## Checklist de Implementación

- [x] Corregir `pool-wizard/index.ts`
- [x] Corregir `fixtures/index.ts`
- [x] Corregir `sync/index.ts`
- [x] Verificar `link-competition-to-api-sports.ts`
- [x] Verificar `FixturesView.tsx`
- [x] Documentar convención
- [ ] Migrar datos existentes (si aplica)
- [ ] Crear TypeScript type para EntityType
- [ ] Agregar tests
- [ ] Considerar Prisma enum (opcional)

---

## Resultado

✅ **Todos los archivos ahora usan mayúsculas consistentemente**

Esto asegura que:
- Las búsquedas de `ExternalMap` funcionen correctamente
- No haya duplicados por diferencias de case
- El código sea más mantenible y predecible

---

**Implementado por:** Cascade AI  
**Fecha:** 19 de Octubre, 2025  
**Status:** ✅ **COMPLETADO**
