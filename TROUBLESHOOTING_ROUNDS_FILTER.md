# 🔍 Troubleshooting: Filtro de Jornadas No Funciona

## 🎯 Problema

Creaste una quiniela para jornadas 16 y 17, pero la página de fixtures NO muestra ningún partido.

---

## ✅ Checklist de Verificación

### 1. **Verificar que el ruleSet se guardó correctamente**

**Acción:** Revisa los logs del servidor cuando creas el pool.

**Logs esperados:**
```
[PoolWizard] Creating pool with ruleSet: {
  "exactScore": 5,
  "correctSign": 3,
  "goalDiffBonus": 1,
  "rounds": {
    "start": 16,
    "end": 17
  }
}

[PoolWizard] Pool created with ID: clxxx... ruleSet: {
  "exactScore": 5,
  "correctSign": 3,
  "goalDiffBonus": 1,
  "rounds": {
    "start": 16,
    "end": 17
  }
}
```

**❌ Si NO ves `rounds` en el log:**
- El frontend NO está enviando `roundsRange` correctamente
- Verifica que `wizardData.roundsRange` tenga valores en StepReview

**✅ Si SÍ ves `rounds` en el log:**
- El ruleSet se guardó correctamente
- Continúa al paso 2

---

### 2. **Verificar que el filtro se aplica en getByPoolId**

**Acción:** Revisa los logs cuando cargas la página de fixtures.

**Logs esperados:**
```
[Fixtures] Pool ruleSet: {
  "exactScore": 5,
  "correctSign": 3,
  "goalDiffBonus": 1,
  "rounds": {
    "start": 16,
    "end": 17
  }
}

[Fixtures] Round filter: { roundStart: 16, roundEnd: 17 }

[Fixtures] ✅ Applying round filter: { gte: 16, lte: 17 }
```

**❌ Si ves:**
```
[Fixtures] Pool ruleSet: null
```
- El pool NO tiene ruleSet guardado
- Elimina el pool y créalo de nuevo

**❌ Si ves:**
```
[Fixtures] Pool ruleSet: { "exactScore": 5, ... }
[Fixtures] Round filter: { roundStart: undefined, roundEnd: undefined }
[Fixtures] ⚠️ No round filter applied - showing all matches
```
- El ruleSet NO tiene `rounds`
- El pool se creó ANTES de implementar la funcionalidad
- Elimina el pool y créalo de nuevo

**✅ Si ves el filtro aplicándose:**
- El backend está filtrando correctamente
- Continúa al paso 3

---

### 3. **Verificar que existen matches con round 16 y 17**

**Acción:** Consulta la base de datos directamente.

```sql
-- Ver todos los matches de la temporada
SELECT id, round, homeTeamId, awayTeamId, kickoffTime, status
FROM "Match"
WHERE seasonId = 'TU_SEASON_ID'
ORDER BY round;

-- Ver matches de jornadas 16 y 17
SELECT id, round, homeTeamId, awayTeamId, kickoffTime, status
FROM "Match"
WHERE seasonId = 'TU_SEASON_ID'
  AND round >= 16
  AND round <= 17
ORDER BY round;
```

**❌ Si NO hay matches con round 16-17:**
- Los matches se importaron con `round = NULL` o con otros números
- Problema en la importación desde la API externa
- Verifica los datos de la API

**✅ Si SÍ hay matches:**
- Los datos están correctos
- Continúa al paso 4

---

### 4. **Verificar el tipo de dato de round**

**Problema posible:** El campo `round` en DB es `Int?` (nullable), pero el filtro espera `number`.

**Acción:** Verifica que los matches tengan `round` NO NULL.

```sql
-- Contar matches con round NULL
SELECT COUNT(*)
FROM "Match"
WHERE seasonId = 'TU_SEASON_ID'
  AND round IS NULL;
```

**❌ Si hay matches con round NULL:**
- Esos matches NO aparecerán con el filtro
- Actualiza los matches:
  ```sql
  UPDATE "Match"
  SET round = 16  -- o el número correcto
  WHERE seasonId = 'TU_SEASON_ID'
    AND round IS NULL
    AND kickoffTime BETWEEN '2025-XX-XX' AND '2025-XX-XX';
  ```

---

### 5. **Verificar el query SQL generado**

**Acción:** Habilita logs de Prisma.

En `.env`:
```env
DATABASE_URL="..."
DEBUG="prisma:query"
```

**Log esperado:**
```sql
SELECT * FROM "Match"
WHERE "seasonId" = 'clxxx...'
  AND "round" >= 16
  AND "round" <= 17
  AND "status" != 'FINISHED'
ORDER BY "kickoffTime" ASC;
```

**❌ Si NO ves el filtro `AND "round" >= 16`:**
- El whereClause NO se está construyendo correctamente
- Revisa el código en `fixtures/index.ts` línea 122-127

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: ruleSet es null

**Causa:** Pool creado antes de implementar rounds.

**Solución:**
```sql
-- Actualizar ruleSet manualmente
UPDATE "Pool"
SET "ruleSet" = '{"exactScore":5,"correctSign":3,"goalDiffBonus":1,"rounds":{"start":16,"end":17}}'::jsonb
WHERE id = 'TU_POOL_ID';
```

### Problema 2: rounds no está en ruleSet

**Causa:** Frontend no envió roundsRange.

**Solución:**
1. Verifica que `wizardData.roundsRange` tenga valores en CreatePoolWizard
2. Verifica que StepReview incluya `rounds` en el ruleSet
3. Elimina el pool y créalo de nuevo

### Problema 3: Matches tienen round NULL

**Causa:** API externa no devolvió el campo round.

**Solución:**
```sql
-- Actualizar rounds manualmente
UPDATE "Match"
SET round = 16
WHERE seasonId = 'TU_SEASON_ID'
  AND kickoffTime BETWEEN '2025-04-01' AND '2025-04-07';

UPDATE "Match"
SET round = 17
WHERE seasonId = 'TU_SEASON_ID'
  AND kickoffTime BETWEEN '2025-04-08' AND '2025-04-14';
```

### Problema 4: Tipo de dato incompatible

**Causa:** round es string en vez de number.

**Solución:**
```typescript
// En fixtures/index.ts, forzar conversión
whereClause.round = {
  gte: Number(roundStart),
  lte: Number(roundEnd)
};
```

---

## 🔧 Comandos de Debug Útiles

### Ver ruleSet de un pool

```sql
SELECT id, name, slug, "ruleSet"
FROM "Pool"
WHERE slug = 'tu-pool-slug';
```

### Ver matches de una temporada

```sql
SELECT 
  m.id,
  m.round,
  m.kickoffTime,
  m.status,
  ht.name as home_team,
  at.name as away_team
FROM "Match" m
JOIN "Team" ht ON m."homeTeamId" = ht.id
JOIN "Team" at ON m."awayTeamId" = at.id
WHERE m."seasonId" = 'TU_SEASON_ID'
ORDER BY m.round, m.kickoffTime;
```

### Actualizar ruleSet de un pool

```sql
UPDATE "Pool"
SET "ruleSet" = jsonb_set(
  COALESCE("ruleSet", '{}'::jsonb),
  '{rounds}',
  '{"start": 16, "end": 17}'::jsonb
)
WHERE id = 'TU_POOL_ID';
```

---

## ✅ Verificación Final

Después de aplicar las correcciones:

1. ✅ Logs muestran ruleSet con rounds
2. ✅ Logs muestran filtro aplicándose
3. ✅ Query SQL incluye `WHERE round >= X AND round <= Y`
4. ✅ Matches aparecen en la página de fixtures

---

## 📞 Si Nada Funciona

1. **Elimina el pool** y créalo de nuevo desde cero
2. **Verifica que seleccionaste jornadas** en StepStageRound
3. **Revisa los logs** en cada paso del wizard
4. **Consulta la DB** para ver qué se guardó realmente

---

**Fecha:** 21 de Octubre, 2025  
**Estado:** 🔍 Debugging en Progreso
