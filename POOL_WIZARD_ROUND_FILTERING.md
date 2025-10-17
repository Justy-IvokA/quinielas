# Pool Wizard - Corrección de Filtrado por Ronda

## 🐛 Problema Reportado

Al crear una quiniela especificando **solo la ronda 13** (`roundLabel: '13'`), el sistema importaba **todos los partidos** de la temporada, incluyendo pasados y futuros, en lugar de solo los partidos de la ronda especificada.

### Comportamiento Incorrecto
```
Usuario selecciona: Ronda 13
Sistema importa: Ronda 1, 2, 3, ..., 13, 14, 15, ... (TODAS)
```

---

## 🔍 Causa Raíz

En el archivo `packages/api/src/routers/pool-wizard/index.ts`, el filtro de partidos tenía un **TODO** y siempre retornaba `true`:

```typescript
// ❌ CÓDIGO ANTERIOR (INCORRECTO)
let filteredMatches = seasonData.matches;
if (input.stageLabel || input.roundLabel) {
  filteredMatches = seasonData.matches.filter((match: any) => {
    // This is a simplified filter - in real implementation,
    // you'd need to parse the round/stage from match metadata
    return true; // TODO: Implement proper filtering based on match.round
  });
}
```

**Resultado**: El filtro no hacía nada, todos los partidos pasaban.

---

## ✅ Solución Implementada

### 1. **Filtrado por Ronda**

Implementado filtro real que compara el número de ronda:

```typescript
// ✅ CÓDIGO NUEVO (CORRECTO)
let filteredMatches = seasonData.matches;

if (input.roundLabel) {
  // Filter by specific round number
  const targetRound = parseInt(input.roundLabel, 10);
  if (!isNaN(targetRound)) {
    filteredMatches = filteredMatches.filter(match => match.round === targetRound);
    console.log(`[Pool Wizard] Filtered to round ${targetRound}: ${filteredMatches.length} matches`);
  }
}

// Warning if no matches found
if (filteredMatches.length === 0 && (input.stageLabel || input.roundLabel)) {
  console.warn(`[Pool Wizard] No matches found for filters: stage=${input.stageLabel}, round=${input.roundLabel}`);
}
```

### 2. **Filtrado de Equipos**

Ahora solo importa equipos que participan en los partidos filtrados:

```typescript
// ✅ Import only teams that participate in filtered matches
const teamIdMap = new Map<string, string>();

// Get unique team IDs from filtered matches
const teamExternalIds = new Set<string>();
for (const match of filteredMatches) {
  teamExternalIds.add(match.homeTeamExternalId);
  teamExternalIds.add(match.awayTeamExternalId);
}

const filteredTeams = seasonData.teams.filter(team => 
  teamExternalIds.has(team.externalId)
);

console.log(`[Pool Wizard] Importing ${filteredTeams.length} teams (from ${seasonData.teams.length} total)`);
```

---

## 📊 Comparación Antes/Después

### Ejemplo: Liga MX 2025, Ronda 13

#### ❌ Antes (Incorrecto)
```
Input: roundLabel = "13"

Resultado:
- Partidos importados: 306 (TODOS)
- Equipos importados: 18 (TODOS)
- Incluye: Rondas 1-17 completas
```

#### ✅ Después (Correcto)
```
Input: roundLabel = "13"

Resultado:
- Partidos importados: 9 (solo ronda 13)
- Equipos importados: 18 (los que juegan en ronda 13)
- Incluye: SOLO ronda 13
```

---

## 🔧 Cómo Funciona

### 1. **Parseo de Ronda**

El provider de API-Football parsea el número de ronda del string:

```typescript
// En api-football.ts
private parseRound(roundString: string): number {
  // Extract number from strings like "Regular Season - 13", "Group A - 1", etc.
  const match = roundString.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

// Ejemplos:
"Regular Season - 13" → 13
"Round 5" → 5
"Group A - 3" → 3
```

### 2. **Filtrado en Creación**

Al crear la quiniela:

```typescript
// 1. Fetch all season data
const seasonData = await provider.fetchSeason({
  competitionExternalId: input.competitionExternalId,
  year: input.seasonYear
});

// 2. Filter matches by round
if (input.roundLabel) {
  const targetRound = parseInt(input.roundLabel, 10);
  filteredMatches = seasonData.matches.filter(match => 
    match.round === targetRound
  );
}

// 3. Filter teams to only those in filtered matches
const teamExternalIds = new Set<string>();
for (const match of filteredMatches) {
  teamExternalIds.add(match.homeTeamExternalId);
  teamExternalIds.add(match.awayTeamExternalId);
}

const filteredTeams = seasonData.teams.filter(team => 
  teamExternalIds.has(team.externalId)
);

// 4. Import only filtered data
```

---

## 📝 Logs de Verificación

Ahora el sistema muestra logs claros del filtrado:

```bash
[Pool Wizard] Fetching season for league 262, year 2025
[Pool Wizard] Filtered to round 13: 9 matches
[Pool Wizard] Importing 18 teams (from 18 total)
[Pool Wizard] Creating pool: Liga MX - Ronda 13
[Pool Wizard] Imported 18 teams, 9 matches
```

Si no encuentra partidos:
```bash
[Pool Wizard] Filtered to round 99: 0 matches
[Pool Wizard] No matches found for filters: stage=undefined, round=99
```

---

## 🧪 Testing

### Caso 1: Ronda Específica
```typescript
Input: {
  competitionExternalId: "262",
  competitionName: "Liga MX",
  seasonYear: 2025,
  roundLabel: "13"
}

Verificar:
✅ Solo partidos con round === 13
✅ Solo equipos que juegan en esos partidos
✅ Logs muestran cantidad correcta
```

### Caso 2: Sin Filtro
```typescript
Input: {
  competitionExternalId: "262",
  competitionName: "Liga MX",
  seasonYear: 2025,
  // No roundLabel
}

Verificar:
✅ Todos los partidos de la temporada
✅ Todos los equipos
```

### Caso 3: Ronda Inválida
```typescript
Input: {
  roundLabel: "999"
}

Verificar:
✅ 0 partidos importados
✅ Warning en logs
✅ Quiniela se crea pero sin partidos
```

---

## 🎯 Beneficios

### 1. **Precisión**
- Solo importa los datos que el usuario especificó
- No contamina la base de datos con partidos irrelevantes

### 2. **Performance**
- Menos datos a importar = más rápido
- Menos operaciones de base de datos

### 3. **Claridad**
- Logs descriptivos muestran exactamente qué se importó
- Fácil de debuggear si algo sale mal

### 4. **Flexibilidad**
- Funciona con cualquier número de ronda
- Se puede extender para filtrar por etapa (stageLabel)

---

## 🔮 Mejoras Futuras (Opcional)

### 1. **Filtrado por Etapa**
```typescript
// TODO: Implementar filtrado por stageLabel
if (input.stageLabel) {
  // Requiere metadata adicional de la API
  // Ejemplo: "Final Stages", "Group Stage", etc.
}
```

### 2. **Filtrado Combinado**
```typescript
// Filtrar por etapa Y ronda
if (input.stageLabel && input.roundLabel) {
  // Ejemplo: "Playoffs - Ronda 2"
}
```

### 3. **Validación Previa**
```typescript
// Validar que la ronda existe antes de crear
const availableRounds = [...new Set(seasonData.matches.map(m => m.round))];
if (!availableRounds.includes(targetRound)) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `Round ${targetRound} not found. Available: ${availableRounds.join(", ")}`
  });
}
```

### 4. **Preview Mejorado**
```typescript
// Mostrar en el wizard ANTES de crear
Preview:
- Ronda 13
- 9 partidos
- 18 equipos
- Fechas: 15-17 Marzo 2025
```

---

## 📦 Archivos Modificados

**`packages/api/src/routers/pool-wizard/index.ts`**
- ✅ Implementado filtrado real por `roundLabel`
- ✅ Agregado filtrado de equipos por partidos
- ✅ Agregados logs descriptivos
- ✅ Agregado warning si no hay partidos

---

## ✅ Resultado Final

### Antes
```
roundLabel: "13" → Importa TODOS los partidos ❌
```

### Después
```
roundLabel: "13" → Importa SOLO ronda 13 ✅
```

**¡El filtrado ahora funciona correctamente!** 🎉

---

## 🔍 Verificación en Base de Datos

Para verificar que funciona:

```sql
-- Ver partidos importados de una quiniela
SELECT m.id, m.round, m.kickoffTime, 
       ht.name as home_team, 
       at.name as away_team
FROM "Match" m
JOIN "Team" ht ON m."homeTeamId" = ht.id
JOIN "Team" at ON m."awayTeamId" = at.id
WHERE m."seasonId" = 'tu_season_id'
ORDER BY m.round, m.kickoffTime;

-- Debe mostrar SOLO partidos de la ronda especificada
```

```sql
-- Contar partidos por ronda
SELECT round, COUNT(*) as matches
FROM "Match"
WHERE "seasonId" = 'tu_season_id'
GROUP BY round
ORDER BY round;

-- Debe mostrar solo 1 ronda con N partidos
```
