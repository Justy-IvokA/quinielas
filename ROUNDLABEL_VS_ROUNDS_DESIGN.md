# 🎯 Diseño: roundLabel vs rounds - Import vs Filter

## 🔍 Problema Identificado

Existen **DOS conceptos diferentes** que inicialmente se confundían:

1. **`roundLabel`** → Campo usado por la **API externa** para importar matches
2. **`rounds.start/end`** → Campo usado por el **frontend** para filtrar matches

---

## ⚠️ Limitación de la API Externa

La API de deportes (API-Football, SportMonks) **NO soporta rangos de jornadas**.

### Lo que SÍ soporta:
```typescript
// Importar UNA jornada específica
fetchSeasonRound({
  competitionExternalId: "262",
  year: 2025,
  roundLabel: "14"  // ✅ Una sola jornada
})
// Resultado: Solo matches de Jornada 14
```

### Lo que NO soporta:
```typescript
// ❌ NO existe esta funcionalidad en la API
fetchSeasonRound({
  competitionExternalId: "262",
  year: 2025,
  roundLabel: "14-16"  // ❌ Rango no soportado
})
```

---

## 🎯 Decisión de Diseño

### Opción Elegida: Import All + Filter Frontend

**Estrategia:**
1. **Import:** Importar TODA la temporada (sin `roundLabel`)
2. **Filter:** Filtrar en frontend con `rounds.start/end`

### Flujo Completo

```
1. Usuario selecciona: J14, J15, J16
   ↓
2. Template Provision:
   - roundLabel: undefined
   - rules.rounds: { start: 14, end: 16 }
   ↓
3. API Import:
   - fetchSeason() → Importa TODOS los matches de la temporada
   ↓
4. Base de Datos:
   - Match (round: 1)
   - Match (round: 2)
   - ...
   - Match (round: 14) ✅
   - Match (round: 15) ✅
   - Match (round: 16) ✅
   - ...
   - Match (round: 17)
   ↓
5. Frontend Query:
   - fixtures.getByPoolId({ poolId })
   - WHERE round >= 14 AND round <= 16
   ↓
6. Usuario ve: Solo J14, J15, J16 ✅
```

---

## ✅ Ventajas de Esta Aproximación

### 1. **Flexibilidad Total**
```typescript
// Pool 1: Jornada 14
{ rounds: { start: 14, end: 14 } }

// Pool 2: Jornadas 14-16
{ rounds: { start: 14, end: 16 } }

// Pool 3: Toda la temporada
{ rounds: undefined }

// ✅ Todos comparten los mismos matches en DB
// ✅ Solo cambia el filtro en frontend
```

### 2. **Reutilización de Datos**
- Una sola importación de la API
- Múltiples pools pueden usar los mismos matches
- Ahorro de llamadas a la API externa
- Ahorro de espacio en DB (no duplicar matches)

### 3. **Independencia de la API**
- No dependemos de limitaciones de la API externa
- Podemos filtrar como queramos en frontend
- Fácil cambiar de proveedor de API

### 4. **Performance**
- Import una sola vez
- Filtro SQL rápido en queries
- No necesita re-importar para cada pool

---

## 🔧 Implementación

### Template/Pool Creation

```typescript
// StepReview.tsx
const handleCreate = () => {
  createMutation.mutate({
    // ...
    stageLabel: wizardData.stageLabel,
    roundLabel: undefined, // ✅ NO filtrar en import
    rules: {
      exactScore: 5,
      correctSign: 3,
      // ✅ Filtrar en frontend
      ...(wizardData.roundsRange ? {
        rounds: {
          start: wizardData.roundsRange.start,
          end: wizardData.roundsRange.end
        }
      } : {})
    }
  });
};
```

### Template Provision

```typescript
// templateProvision.service.ts
if (template.stageLabel || template.roundLabel) {
  // Importar con filtro de stage/round
  seasonData = await provider.fetchSeasonRound({
    competitionExternalId: template.competitionExternalId,
    year: template.seasonYear,
    stageLabel: template.stageLabel,
    roundLabel: template.roundLabel // Puede ser undefined
  });
} else {
  // Importar temporada completa
  seasonData = await provider.fetchSeason({
    competitionExternalId: template.competitionExternalId,
    year: template.seasonYear
  });
}
```

### Frontend Query

```typescript
// fixtures.getByPoolId
const pool = await prisma.pool.findUnique({
  where: { id: poolId },
  select: { seasonId: true, ruleSet: true }
});

const ruleSet = pool.ruleSet as any;
const roundStart = ruleSet?.rounds?.start;
const roundEnd = ruleSet?.rounds?.end;

const matches = await prisma.match.findMany({
  where: {
    seasonId: pool.seasonId,
    // ✅ Filtro por rounds
    ...(roundStart && roundEnd ? {
      round: { gte: roundStart, lte: roundEnd }
    } : {})
  }
});
```

---

## 📊 Casos de Uso

### Caso 1: Pool de Una Jornada

**Usuario selecciona:** J14

**Template:**
```json
{
  "stageLabel": "Regular Season",
  "roundLabel": undefined,
  "rules": {
    "rounds": { "start": 14, "end": 14 }
  }
}
```

**Import:** Toda la temporada  
**Filter:** `WHERE round >= 14 AND round <= 14`  
**Resultado:** Solo J14 ✅

---

### Caso 2: Pool de Múltiples Jornadas

**Usuario selecciona:** J14, J15, J16

**Template:**
```json
{
  "stageLabel": "Regular Season",
  "roundLabel": undefined,
  "rules": {
    "rounds": { "start": 14, "end": 16 }
  }
}
```

**Import:** Toda la temporada  
**Filter:** `WHERE round >= 14 AND round <= 16`  
**Resultado:** J14, J15, J16 ✅

---

### Caso 3: Pool de Toda la Temporada

**Usuario selecciona:** "Todas las jornadas"

**Template:**
```json
{
  "stageLabel": "Regular Season",
  "roundLabel": undefined,
  "rules": {
    // Sin rounds
  }
}
```

**Import:** Toda la temporada  
**Filter:** Sin filtro  
**Resultado:** Todas las jornadas ✅

---

## 🔄 Alternativa Descartada: Import por Jornada

### Por qué NO usamos esta aproximación:

```typescript
// ❌ Opción descartada
const roundLabelForAPI = wizardData.selectedRounds[0]; // "14"

createMutation.mutate({
  roundLabel: roundLabelForAPI, // Solo importa J14
  rules: {
    rounds: { start: 14, end: 16 } // Espera J14-J16
  }
});
```

**Problemas:**
1. ❌ Solo importa J14, pero frontend espera J14-J16
2. ❌ Faltan matches de J15 y J16
3. ❌ Usuario ve error o matches vacíos
4. ❌ Necesitaría múltiples imports (uno por jornada)
5. ❌ Más llamadas a la API externa
6. ❌ Más complejidad en el código

---

## 🎯 Cuándo Usar roundLabel

`roundLabel` **SÍ se debe usar** en estos casos:

### 1. Preview de Fixtures (Wizard)

```typescript
// poolWizard.previewFixtures
trpc.poolWizard.previewFixtures.useQuery({
  competitionExternalId: "262",
  seasonYear: 2025,
  stageLabel: "Regular Season",
  roundLabel: "14" // ✅ Para preview de UNA jornada
});
```

**Razón:** El usuario quiere ver matches de una jornada específica antes de decidir.

### 2. Templates de Jornada Única (Legacy)

Si en el futuro se necesita crear templates que **solo importen una jornada**:

```typescript
{
  "roundLabel": "14", // Importar solo J14
  "rules": {
    "rounds": { "start": 14, "end": 14 } // Mostrar solo J14
  }
}
```

**Ventaja:** Menos datos en DB  
**Desventaja:** No se pueden crear pools de múltiples jornadas después

---

## 📝 Resumen

| Campo | Propósito | Usado en | Valor |
|-------|-----------|----------|-------|
| **`roundLabel`** | Filtrar import de API | Template Provision | `undefined` (import all) |
| **`stageLabel`** | Filtrar por stage | Template Provision | `"Regular Season"` |
| **`rules.rounds.start`** | Filtrar en frontend | fixtures.getByPoolId | `14` |
| **`rules.rounds.end`** | Filtrar en frontend | fixtures.getByPoolId | `16` |

---

## ✅ Conclusión

**Decisión Final:**
- ✅ `roundLabel = undefined` en template creation
- ✅ Importar toda la temporada
- ✅ Filtrar en frontend con `rules.rounds`
- ✅ Máxima flexibilidad y reutilización

**Beneficios:**
- Una sola importación
- Múltiples pools con diferentes filtros
- Independiente de limitaciones de API
- Mejor performance

---

**Fecha:** 21 de Octubre, 2025  
**Decisión por:** Cascade AI + Victor Mancera  
**Estado:** ✅ Implementado y Documentado
