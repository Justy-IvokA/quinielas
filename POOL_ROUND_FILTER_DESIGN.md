# 🏆 Diseño: Filtro de Jornadas por Pool

## 🐛 Problema Identificado

Actualmente, múltiples Pools pueden compartir la misma Season/Competition, pero **no hay forma de filtrar qué jornadas (rounds) pertenecen a cada Pool**.

### Situación Actual
```
Pool "LigaMXJ14" → Season "Liga MX 2025" → Matches (J14 + J15) ❌
Pool "Jornada-15" → Season "Liga MX 2025" → Matches (J14 + J15) ❌
```

**Resultado:** Ambos pools muestran las mismas jornadas.

---

## ✅ Soluciones Propuestas

### Opción 1: Campos `roundStart` y `roundEnd` en Pool ⭐ RECOMENDADA

Agregar campos al modelo `Pool` para especificar el rango de jornadas:

```prisma
model Pool {
  // ... campos existentes ...
  
  roundStart Int?  // Jornada inicial (ej: 14)
  roundEnd   Int?  // Jornada final (ej: 14)
  
  // Si roundStart y roundEnd son null, incluye TODAS las jornadas
  // Si roundStart = roundEnd, es una sola jornada
  // Si roundStart < roundEnd, es un rango de jornadas
}
```

**Ventajas:**
- ✅ Simple y directo
- ✅ Soporta pools de una jornada o múltiples jornadas
- ✅ Fácil de filtrar en queries
- ✅ No requiere tabla adicional

**Desventajas:**
- ❌ No soporta jornadas no consecutivas (ej: J1, J3, J5)

**Uso:**
```typescript
// Pool de una sola jornada
{ roundStart: 14, roundEnd: 14 }

// Pool de múltiples jornadas consecutivas
{ roundStart: 14, roundEnd: 17 }

// Pool de toda la temporada
{ roundStart: null, roundEnd: null }
```

---

### Opción 2: Array de Rounds en Pool

```prisma
model Pool {
  // ... campos existentes ...
  
  rounds Int[]  // [14] o [14, 15, 16] o []
  
  // Si rounds está vacío, incluye TODAS las jornadas
}
```

**Ventajas:**
- ✅ Soporta jornadas no consecutivas
- ✅ Flexible

**Desventajas:**
- ❌ Más complejo de filtrar en queries
- ❌ Puede crecer mucho para temporadas completas

---

### Opción 3: Tabla Intermedia `PoolRound`

```prisma
model Pool {
  // ... campos existentes ...
  poolRounds PoolRound[]
}

model PoolRound {
  id       String @id @default(cuid())
  poolId   String
  round    Int
  
  pool Pool @relation(fields: [poolId], references: [id], onDelete: Cascade)
  
  @@unique([poolId, round])
}
```

**Ventajas:**
- ✅ Máxima flexibilidad
- ✅ Soporta cualquier combinación de jornadas
- ✅ Escalable

**Desventajas:**
- ❌ Más complejo
- ❌ Requiere joins adicionales
- ❌ Over-engineering para el caso de uso actual

---

## 🎯 Decisión: Opción 1 (roundStart/roundEnd)

Para el MVP y caso de uso actual (Mundial 2026), la **Opción 1** es suficiente:

- La mayoría de pools serán de **una sola jornada** o **jornadas consecutivas**
- Simple de implementar y mantener
- Fácil de entender para los usuarios

Si en el futuro se necesita más flexibilidad, se puede migrar a la Opción 2 o 3.

---

## 📝 Migración Propuesta

### 1. Schema Change

```prisma
model Pool {
  id            String        @id @default(cuid())
  tenantId      String
  brandId       String?
  seasonId      String
  name          String
  slug          String
  description   String?
  prizeSummary  String?
  ruleSet       Json?
  isActive      Boolean       @default(true)
  isPublic      Boolean       @default(false)
  startDate     DateTime?
  endDate       DateTime?
  
  // ✅ NUEVOS CAMPOS
  roundStart    Int?          // Jornada inicial (null = todas)
  roundEnd      Int?          // Jornada final (null = todas)
  
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // ... relaciones ...
}
```

### 2. Migración SQL

```sql
-- Agregar columnas
ALTER TABLE "Pool" ADD COLUMN "roundStart" INTEGER;
ALTER TABLE "Pool" ADD COLUMN "roundEnd" INTEGER;

-- Actualizar pools existentes basándose en el nombre
-- Pool "LigaMXJ14" → roundStart=14, roundEnd=14
UPDATE "Pool" 
SET "roundStart" = 14, "roundEnd" = 14 
WHERE slug = 'ligamxj14';

-- Pool "jornada-15" → roundStart=15, roundEnd=15
UPDATE "Pool" 
SET "roundStart" = 15, "roundEnd" = 15 
WHERE slug = 'jornada-15';
```

### 3. Actualizar Queries

**Fixtures Query:**
```typescript
// ANTES
const matches = await prisma.match.findMany({
  where: {
    seasonId: pool.seasonId
  }
});

// DESPUÉS
const matches = await prisma.match.findMany({
  where: {
    seasonId: pool.seasonId,
    ...(pool.roundStart !== null && pool.roundEnd !== null
      ? {
          round: {
            gte: pool.roundStart,
            lte: pool.roundEnd
          }
        }
      : {})
  }
});
```

**Predictions Query:**
```typescript
// Similar - agregar filtro de round basado en pool.roundStart/roundEnd
```

### 4. Actualizar Template Provision

```typescript
// En templateProvision.service.ts
async function provisionTemplateToTenant(params) {
  // ... código existente ...
  
  // Crear pool con rounds
  const pool = await prisma.pool.create({
    data: {
      // ... datos existentes ...
      roundStart: template.roundStart,  // Del template
      roundEnd: template.roundEnd,      // Del template
    }
  });
  
  // ... resto del código ...
}
```

### 5. Actualizar PoolTemplate

```prisma
model PoolTemplate {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String?
  
  // ✅ NUEVOS CAMPOS
  roundStart  Int?     // Jornada inicial del template
  roundEnd    Int?     // Jornada final del template
  
  // ... resto de campos ...
}
```

---

## 🧪 Testing

### Escenario 1: Pool de Una Jornada
```typescript
const pool = {
  name: "Liga MX - Jornada 14",
  roundStart: 14,
  roundEnd: 14
};

// Debe mostrar solo matches de la jornada 14
```

### Escenario 2: Pool de Múltiples Jornadas
```typescript
const pool = {
  name: "Liga MX - Jornadas 14-17",
  roundStart: 14,
  roundEnd: 17
};

// Debe mostrar matches de jornadas 14, 15, 16, 17
```

### Escenario 3: Pool de Temporada Completa
```typescript
const pool = {
  name: "Liga MX - Temporada Completa",
  roundStart: null,
  roundEnd: null
};

// Debe mostrar TODOS los matches de la season
```

---

## 📋 Checklist de Implementación

- [ ] Crear migración de Prisma para agregar `roundStart` y `roundEnd`
- [ ] Actualizar modelo `Pool` en schema.prisma
- [ ] Actualizar modelo `PoolTemplate` en schema.prisma
- [ ] Ejecutar migración en base de datos
- [ ] Actualizar pools existentes con valores correctos
- [ ] Actualizar query de fixtures para filtrar por round
- [ ] Actualizar query de predictions para filtrar por round
- [ ] Actualizar templateProvision.service.ts
- [ ] Actualizar formulario de creación de pools en admin
- [ ] Actualizar templates en CSV con roundStart/roundEnd
- [ ] Testing de los 3 escenarios
- [ ] Documentar en README

---

## 🚀 Implementación Inmediata

Para solucionar el problema actual **sin migración**, podemos:

1. **Actualizar manualmente los pools existentes:**
   ```sql
   UPDATE "Pool" SET "roundStart" = 14, "roundEnd" = 14 WHERE slug = 'ligamxj14';
   UPDATE "Pool" SET "roundStart" = 15, "roundEnd" = 15 WHERE slug = 'jornada-15';
   ```

2. **Crear la migración de Prisma**

3. **Actualizar los routers para usar el filtro**

---

## 📚 Referencias

- **Schema:** `packages/db/prisma/schema.prisma`
- **Template Provision:** `packages/api/src/services/templateProvision.service.ts`
- **Fixtures Router:** `packages/api/src/routers/fixtures/index.ts`
- **Predictions Router:** `packages/api/src/routers/predictions/index.ts`

---

**Fecha:** 21 de Octubre, 2025  
**Autor:** Cascade AI  
**Estado:** Propuesta - Pendiente de Aprobación
