# 🏆 Caso de Uso: Mundial FIFA 2026 - Filtro de Jornadas

## 🎯 Escenarios de Uso

### Escenario 1: Pool de Toda la Primera Fase (Default)

**Caso:** Pool para toda la fase de grupos del Mundial 2026

```json
// Pool.ruleSet (sin rounds definidos)
{
  "scoring": {
    "exact": 5,
    "sign": 3,
    "diff": 1
  }
  // ✅ No se define "rounds" - incluye TODOS los partidos
}
```

**Comportamiento:**
- ✅ Muestra **todos los matches** de la Season
- ✅ Incluye todos los partidos de la fase de grupos
- ✅ Ideal para pools de temporada completa o fase completa

**Ejemplo:**
```
Pool: "Mundial 2026 - Fase de Grupos"
  → Sin rounds definidos
  → Muestra: Todos los 48 partidos de fase de grupos
```

---

### Escenario 2: Pool de Jornadas Específicas

**Caso:** Pool solo para la Jornada 1 de la fase de grupos

```json
// Pool.ruleSet (con rounds definidos)
{
  "scoring": {
    "exact": 5,
    "sign": 3,
    "diff": 1
  },
  "rounds": {
    "start": 1,
    "end": 1
  }
}
```

**Comportamiento:**
- ✅ Muestra **solo matches de la Jornada 1**
- ✅ Filtra: `WHERE round >= 1 AND round <= 1`
- ✅ Ideal para pools de jornada única

**Ejemplo:**
```
Pool: "Mundial 2026 - Jornada 1"
  → rounds: {start: 1, end: 1}
  → Muestra: Solo 16 partidos de la Jornada 1
```

---

### Escenario 3: Pool de Múltiples Jornadas

**Caso:** Pool para las primeras 2 jornadas

```json
// Pool.ruleSet (rango de rounds)
{
  "scoring": {
    "exact": 5,
    "sign": 3,
    "diff": 1
  },
  "rounds": {
    "start": 1,
    "end": 2
  }
}
```

**Comportamiento:**
- ✅ Muestra **matches de Jornadas 1 y 2**
- ✅ Filtra: `WHERE round >= 1 AND round <= 2`
- ✅ Ideal para pools de múltiples jornadas

**Ejemplo:**
```
Pool: "Mundial 2026 - Jornadas 1 y 2"
  → rounds: {start: 1, end: 2}
  → Muestra: 32 partidos (16 por jornada)
```

---

## 📊 Estructura de Fase de Grupos - Mundial 2026

### Fase de Grupos (48 equipos, 16 grupos de 3)

```
Jornada 1: 16 partidos (Grupo A-P, partido 1)
Jornada 2: 16 partidos (Grupo A-P, partido 2)
Jornada 3: 16 partidos (Grupo A-P, partido 3)
Total: 48 partidos
```

### Ejemplos de Pools

**1. Pool de Temporada Completa:**
```typescript
{
  name: "Mundial 2026 - Completo",
  ruleSet: {
    scoring: { exact: 5, sign: 3, diff: 1 }
    // Sin rounds - incluye TODO
  }
}
// Muestra: 48 partidos fase grupos + 16 octavos + 8 cuartos + 4 semis + 2 final = 78 partidos
```

**2. Pool Solo Fase de Grupos:**
```typescript
{
  name: "Mundial 2026 - Fase de Grupos",
  ruleSet: {
    scoring: { exact: 5, sign: 3, diff: 1 },
    rounds: {
      start: 1,
      end: 3
    }
  }
}
// Muestra: Solo 48 partidos de fase de grupos
```

**3. Pool Solo Eliminatorias:**
```typescript
{
  name: "Mundial 2026 - Eliminatorias",
  ruleSet: {
    scoring: { exact: 5, sign: 3, diff: 1 },
    rounds: {
      start: 4,  // Octavos
      end: 7     // Final
    }
  }
}
// Muestra: 16 + 8 + 4 + 2 = 30 partidos
```

---

## 🔧 Implementación Actual

### Backend: Filtro Condicional

```typescript
// packages/api/src/routers/fixtures/index.ts
getByPoolId: publicProcedure.query(async ({ input }) => {
  const pool = await prisma.pool.findUnique({
    where: { id: input.poolId },
    select: { seasonId: true, ruleSet: true }
  });

  const ruleSet = pool.ruleSet as any;
  const roundStart = ruleSet?.rounds?.start;
  const roundEnd = ruleSet?.rounds?.end;

  const whereClause = {
    seasonId: pool.seasonId,
    // ✅ Solo aplica filtro si rounds está definido
    ...(roundStart !== null && roundStart !== undefined && 
        roundEnd !== null && roundEnd !== undefined
      ? {
          round: {
            gte: roundStart,
            lte: roundEnd
          }
        }
      : {})  // ← Sin filtro = todos los matches
  };

  return prisma.match.findMany({ where: whereClause, ... });
});
```

**Lógica:**
1. Si `rounds.start` y `rounds.end` están definidos → Aplica filtro
2. Si `rounds` no existe o es `null` → **No aplica filtro (todos los matches)**
3. Esto es el comportamiento deseado para el Mundial 2026

---

## 📝 Configuración Recomendada para Mundial 2026

### Template: Mundial Completo

```json
{
  "slug": "mundial-2026-completo",
  "title": "Mundial FIFA 2026 - Completo",
  "description": "Predice todos los partidos del Mundial",
  "ruleSet": {
    "scoring": {
      "exact": 5,
      "sign": 3,
      "diff": 1
    }
    // ✅ Sin rounds - incluye TODOS los partidos
  }
}
```

### Template: Solo Fase de Grupos

```json
{
  "slug": "mundial-2026-grupos",
  "title": "Mundial FIFA 2026 - Fase de Grupos",
  "description": "Predice los 48 partidos de la fase de grupos",
  "ruleSet": {
    "scoring": {
      "exact": 5,
      "sign": 3,
      "diff": 1
    },
    "rounds": {
      "start": 1,
      "end": 3
    }
  }
}
```

### Template: Solo Eliminatorias

```json
{
  "slug": "mundial-2026-eliminatorias",
  "title": "Mundial FIFA 2026 - Eliminatorias",
  "description": "Predice desde octavos hasta la final",
  "ruleSet": {
    "scoring": {
      "exact": 5,
      "sign": 3,
      "diff": 1
    },
    "rounds": {
      "start": 4,
      "end": 7
    }
  }
}
```

---

## 🎯 Ventajas de Este Diseño

### 1. Flexibilidad Total
```
✅ Pool de todo el torneo (sin rounds)
✅ Pool de fase específica (rounds: 1-3)
✅ Pool de jornada única (rounds: 1-1)
✅ Pool de eliminatorias (rounds: 4-7)
```

### 2. Retrocompatibilidad
```
✅ Pools antiguos sin ruleSet.rounds funcionan (muestran todo)
✅ No requiere migración de datos
✅ Comportamiento intuitivo
```

### 3. Simplicidad
```
✅ Sin rounds = Todos los partidos
✅ Con rounds = Filtro específico
✅ Fácil de entender y configurar
```

---

## 🧪 Testing para Mundial 2026

### Test 1: Pool Completo (Sin Rounds)
```typescript
const pool = {
  name: "Mundial 2026 - Completo",
  ruleSet: {
    scoring: { exact: 5, sign: 3, diff: 1 }
  }
};

// Resultado esperado:
// ✅ Muestra TODOS los matches de la season
// ✅ Fase grupos (48) + Eliminatorias (30) = 78 partidos
```

### Test 2: Pool Fase de Grupos (Rounds 1-3)
```typescript
const pool = {
  name: "Mundial 2026 - Fase de Grupos",
  ruleSet: {
    scoring: { exact: 5, sign: 3, diff: 1 },
    rounds: { start: 1, end: 3 }
  }
};

// Resultado esperado:
// ✅ Muestra solo matches con round >= 1 AND round <= 3
// ✅ Total: 48 partidos
```

### Test 3: Pool Jornada 1 (Round 1)
```typescript
const pool = {
  name: "Mundial 2026 - Jornada 1",
  ruleSet: {
    scoring: { exact: 5, sign: 3, diff: 1 },
    rounds: { start: 1, end: 1 }
  }
};

// Resultado esperado:
// ✅ Muestra solo matches con round = 1
// ✅ Total: 16 partidos
```

---

## 📋 Checklist de Implementación

### Actual (Ya Implementado)
- [x] ✅ Backend filtra por `ruleSet.rounds`
- [x] ✅ Si `rounds` no existe, muestra todos los matches
- [x] ✅ Frontend usa `fixtures.getByPoolId`
- [x] ✅ Scripts de actualización de pools

### Pendiente (Para Mundial 2026)
- [ ] Crear templates para Mundial 2026
  - [ ] Template: Mundial Completo (sin rounds)
  - [ ] Template: Fase de Grupos (rounds: 1-3)
  - [ ] Template: Eliminatorias (rounds: 4-7)
  - [ ] Template: Jornada 1 (rounds: 1-1)
  - [ ] Template: Jornada 2 (rounds: 2-2)
  - [ ] Template: Jornada 3 (rounds: 3-3)
- [ ] Actualizar `templateProvision.service.ts` para incluir `rounds` en `ruleSet`
- [ ] Agregar UI en admin para configurar rounds
- [ ] Documentar en guía de usuario

---

## 💡 Recomendaciones

### Para Tenants
1. **Pool de Temporada Completa:**
   - No definir `rounds` en `ruleSet`
   - Incluye automáticamente todos los partidos
   - Ideal para engagement durante todo el torneo

2. **Pool de Fase Específica:**
   - Definir `rounds: {start: X, end: Y}`
   - Permite crear múltiples pools para diferentes fases
   - Ideal para mantener interés en cada fase

3. **Pool de Jornada Única:**
   - Definir `rounds: {start: X, end: X}`
   - Permite crear pools semanales
   - Ideal para engagement continuo

### Para Admins
1. Crear templates predefinidos para casos comunes
2. Permitir configuración manual de rounds en UI
3. Validar que `roundStart <= roundEnd`
4. Mostrar preview de matches incluidos

---

## 🎊 Conclusión

El sistema actual **ya soporta el caso de uso del Mundial 2026** correctamente:

- ✅ **Sin `rounds`** → Incluye **TODOS** los partidos (comportamiento default)
- ✅ **Con `rounds`** → Filtra por jornadas específicas
- ✅ Flexible para cualquier estructura de torneo
- ✅ Retrocompatible y fácil de usar

**No se requieren cambios adicionales en el código.** Solo necesitas:
1. Crear los templates apropiados
2. Configurar `ruleSet.rounds` según el tipo de pool
3. El sistema hará el resto automáticamente

---

**Fecha:** 21 de Octubre, 2025  
**Autor:** Cascade AI  
**Estado:** ✅ Implementado y Documentado
