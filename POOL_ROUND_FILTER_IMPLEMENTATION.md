# ✅ Implementación: Filtro de Jornadas por Pool usando ruleSet

## 🎯 Problema Resuelto

Múltiples pools de la misma Competition/Season mostraban **todos los matches** en lugar de filtrar por jornada específica.

### Antes
```
Pool "LigaMXJ14" → Season "Liga MX 2025" → Matches (J14 + J15) ❌
Pool "Jornada-15" → Season "Liga MX 2025" → Matches (J14 + J15) ❌
```

### Después
```
Pool "LigaMXJ14" → ruleSet.rounds: {start: 14, end: 14} → Matches (solo J14) ✅
Pool "Jornada-15" → ruleSet.rounds: {start: 15, end: 15} → Matches (solo J15) ✅
```

---

## ✅ Solución Implementada

### Opción Elegida: Usar `ruleSet` (JSON)

En lugar de agregar campos nuevos al schema, usamos el campo `ruleSet` existente:

```typescript
// Pool.ruleSet
{
  "scoring": {
    "exact": 5,
    "sign": 3,
    "diff": 1
  },
  "rounds": {
    "start": 14,    // Jornada inicial
    "end": 14       // Jornada final
  }
}
```

**Ventajas:**
- ✅ No requiere migración de schema
- ✅ Más flexible para futuras reglas
- ✅ Cambios mínimos en el código
- ✅ Consistente con otras configuraciones del pool

---

## 📝 Cambios Implementados

### 1. Script de Actualización de Pools

**Archivo:** `scripts/update-pools-with-rounds.ts`

```typescript
// Detecta jornada del slug/nombre y actualiza ruleSet
const newRuleSet = {
  ...currentRuleSet,
  rounds: {
    start: 14,  // Detectado automáticamente
    end: 14
  }
};
```

**Ejecución:**
```bash
pnpm tsx scripts/update-pools-with-rounds.ts
```

**Resultado:**
- Pool "LigaMXJ14" → `rounds: {start: 14, end: 14}`
- Pool "Jornada-15" → `rounds: {start: 15, end: 15}`

---

### 2. Nuevo Endpoint en Fixtures Router

**Archivo:** `packages/api/src/routers/fixtures/index.ts`

```typescript
// Nuevo endpoint: getByPoolId
getByPoolId: publicProcedure
  .input(z.object({ 
    poolId: z.string().cuid(),
    includeFinished: z.boolean().optional().default(false)
  }))
  .query(async ({ input }) => {
    // 1. Obtener pool con ruleSet
    const pool = await prisma.pool.findUnique({
      where: { id: input.poolId },
      select: { seasonId: true, ruleSet: true }
    });

    // 2. Extraer rounds del ruleSet
    const ruleSet = pool.ruleSet as any;
    const roundStart = ruleSet?.rounds?.start;
    const roundEnd = ruleSet?.rounds?.end;

    // 3. Aplicar filtro de rounds
    const whereClause = {
      seasonId: pool.seasonId,
      ...(roundStart && roundEnd ? {
        round: { gte: roundStart, lte: roundEnd }
      } : {})
    };

    // 4. Retornar matches filtrados
    return prisma.match.findMany({ where: whereClause, ... });
  })
```

**Características:**
- ✅ Filtra por `poolId` en lugar de `seasonId`
- ✅ Lee `ruleSet.rounds` del pool
- ✅ Aplica filtro `round >= start AND round <= end`
- ✅ Si `rounds` no está definido, retorna todos los matches

---

### 3. Actualización del Frontend

**Archivo:** `apps/web/app/[locale]/(player)/pools/[slug]/fixtures/_components/FixturesView.tsx`

```typescript
// ANTES
const { data: matches } = trpc.fixtures.listBySeason.useQuery({
  seasonId: pool.seasonId
});

// DESPUÉS
const { data: matches } = trpc.fixtures.getByPoolId.useQuery({
  poolId: pool.id,
  includeFinished: true
});
```

**Archivo:** `apps/web/app/[locale]/(player)/pools/[slug]/fixtures/_components/prizes/PoolStatsCards.tsx`

```typescript
// ANTES
const { data: pool } = trpc.pools.getById.useQuery({ id: poolId });
const { data: matches } = trpc.fixtures.listBySeason.useQuery(
  { seasonId: pool?.seasonId || "" },
  { enabled: !!pool?.seasonId }
);

// DESPUÉS
const { data: matches } = trpc.fixtures.getByPoolId.useQuery(
  { poolId, includeFinished: true }
);
```

---

## 🧪 Testing

### Verificar Pools Actualizados

```bash
pnpm tsx scripts/check-pools-matches.ts
```

**Resultado esperado:**
```
Pool: Liga MX (jornada-15)
  Jornadas disponibles: 14, 15
  ruleSet.rounds: {start: 15, end: 15}
  Matches mostrados: Solo J15 ✅

Pool: LigaMXJ14 (ligamxj14)
  Jornadas disponibles: 14, 15
  ruleSet.rounds: {start: 14, end: 14}
  Matches mostrados: Solo J14 ✅
```

### Testing en Browser

1. **Pool "LigaMXJ14":**
   - Ir a: `ivoka.localhost:3000/es-MX/pools/ligamxj14/fixtures`
   - ✅ Debe mostrar solo partidos de Jornada 14

2. **Pool "Jornada-15":**
   - Ir a: `ivoka.localhost:3000/es-MX/pools/jornada-15/fixtures`
   - ✅ Debe mostrar solo partidos de Jornada 15

---

## 📊 Estructura de ruleSet

### Formato Completo

```typescript
interface PoolRuleSet {
  scoring?: {
    exact?: number;      // Puntos por resultado exacto
    sign?: number;       // Puntos por signo correcto (1X2)
    diff?: number;       // Puntos bonus por diferencia de goles
  };
  rounds?: {
    start: number | null;  // Jornada inicial (null = todas)
    end: number | null;    // Jornada final (null = todas)
  };
  // Futuras reglas...
}
```

### Casos de Uso

**1. Pool de una sola jornada:**
```json
{
  "rounds": {
    "start": 14,
    "end": 14
  }
}
```

**2. Pool de múltiples jornadas consecutivas:**
```json
{
  "rounds": {
    "start": 14,
    "end": 17
  }
}
```

**3. Pool de toda la temporada:**
```json
{
  "rounds": {
    "start": null,
    "end": null
  }
}
```
O simplemente omitir el campo `rounds`.

---

## 🔄 Flujo de Datos

```
1. Usuario accede a /pools/jornada-15/fixtures
2. Frontend llama: fixtures.getByPoolId({ poolId })
3. Backend:
   a. Busca Pool por ID
   b. Lee pool.ruleSet.rounds
   c. Filtra matches: WHERE round >= 15 AND round <= 15
   d. Retorna solo matches de J15
4. Frontend muestra solo partidos de J15
```

---

## 📚 Archivos Modificados

### Backend
- ✅ `packages/api/src/routers/fixtures/index.ts`
  - Agregado endpoint `getByPoolId`

### Frontend
- ✅ `apps/web/app/[locale]/(player)/pools/[slug]/fixtures/_components/FixturesView.tsx`
  - Cambiado de `listBySeason` a `getByPoolId`
- ✅ `apps/web/app/[locale]/(player)/pools/[slug]/fixtures/_components/prizes/PoolStatsCards.tsx`
  - Cambiado de `listBySeason` a `getByPoolId`

### Scripts
- ✅ `scripts/update-pools-with-rounds.ts` (nuevo)
  - Actualiza pools existentes con `ruleSet.rounds`
- ✅ `scripts/check-pools-matches.ts` (nuevo)
  - Verifica matches por pool

### Documentación
- ✅ `POOL_ROUND_FILTER_DESIGN.md`
  - Análisis de opciones y diseño
- ✅ `POOL_ROUND_FILTER_IMPLEMENTATION.md` (este archivo)
  - Implementación completa

---

## 🚀 Próximos Pasos

### Inmediato
- [x] Actualizar pools existentes con `ruleSet.rounds`
- [x] Crear endpoint `fixtures.getByPoolId`
- [x] Actualizar frontend para usar nuevo endpoint
- [ ] Testing en browser
- [ ] Verificar que estadísticas funcionan correctamente

### Corto Plazo
- [ ] Actualizar template provision para incluir `rounds` en `ruleSet`
- [ ] Agregar campo `rounds` en formulario de creación de pools (admin)
- [ ] Actualizar templates CSV con información de rounds
- [ ] Documentar en guía de admin

### Largo Plazo
- [ ] Considerar UI para seleccionar jornadas en admin
- [ ] Agregar validación de rounds en backend
- [ ] Tests automatizados para filtro de rounds

---

## 🎯 Ventajas de Esta Solución

1. **Sin migración de schema** - Usa campo existente
2. **Flexible** - Soporta una jornada, múltiples, o todas
3. **Extensible** - Fácil agregar más reglas en el futuro
4. **Retrocompatible** - Pools sin `rounds` muestran todos los matches
5. **Simple** - Lógica clara y fácil de mantener

---

## ⚠️ Consideraciones

### Validación
- El backend NO valida que `roundStart <= roundEnd`
- El backend NO valida que los rounds existan en la season
- Esto permite flexibilidad pero requiere cuidado al configurar

### Performance
- El filtro de rounds se aplica en la query SQL (eficiente)
- No hay impacto significativo en performance

### Migración de Datos
- Pools existentes sin `rounds` en `ruleSet` mostrarán todos los matches
- Esto es intencional para retrocompatibilidad

---

**Fecha:** 21 de Octubre, 2025  
**Implementado por:** Cascade AI  
**Estado:** ✅ Implementado y Listo para Testing
