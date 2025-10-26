# 🔍 Templates Assignment - Debugging Guide

**Problema:** Al asignar una plantilla a un tenant, no aparecen/asignan los partidos.

---

## 🐛 Causa Raíz Identificada

El código estaba buscando la Competition por `slug: template.slug` (ej: "liga-mx-j16"), pero debería buscar por `competitionExternalId` o por `name`.

### Escenario problemático:
```
1. Crear template "liga-mx-j16" con competitionExternalId="262"
   ↓
2. Asignar a Tenant A
   - Busca Competition por slug="liga-mx-j16" ❌ NO EXISTE
   - Crea nueva Competition con slug="liga-mx-j16"
   - Importa matches ✅
   ↓
3. Asignar a Tenant B
   - Busca Competition por slug="liga-mx-j16" ✅ ENCUENTRA (la que creó en paso 2)
   - Reutiliza Competition ✅
   - Pero... ¿importa los matches nuevamente? ⚠️
```

**Problema:** Cada template crea su propia Competition en lugar de reutilizar la existente por `competitionExternalId`.

---

## ✅ Solución Implementada

### Cambio 1: Búsqueda inteligente de Competition

**Antes:**
```typescript
const competitionSlug = template.slug; // ❌ "liga-mx-j16"
let competition = await prisma.competition.findFirst({
  where: {
    sportId: sport.id,
    slug: competitionSlug
  }
});
```

**Después:**
```typescript
const competitionSlug = competitionName.toLowerCase().replace(/\s+/g, "-"); // ✅ "liga-mx"

// 1. Search by competitionExternalId (most reliable)
let competition = await prisma.competition.findFirst({
  where: {
    sportId: sport.id,
    externalMaps: {
      some: {
        externalId: template.competitionExternalId, // "262"
        entityType: "COMPETITION"
      }
    }
  }
});

// 2. Fallback: search by name
if (!competition) {
  competition = await prisma.competition.findFirst({
    where: {
      sportId: sport.id,
      name: competitionName // "Liga MX"
    }
  });
}

// 3. Create if not found
if (!competition) {
  competition = await prisma.competition.create({...});
}
```

**Beneficios:**
- ✅ Busca por `competitionExternalId` primero (más confiable)
- ✅ Fallback a búsqueda por `name` si no existe mapping
- ✅ Reutiliza la misma Competition para múltiples templates
- ✅ Logs para troubleshooting

### Cambio 2: Logs detallados

```typescript
console.log(`[TemplateProvision] Creating new Competition: name=${competitionName}, slug=${competitionSlug}`);
console.log(`[TemplateProvision] ✅ Reusing existing Competition: ${competition.id} (${competition.name})`);
console.log(`[TemplateProvision] Creating new Season: year=${template.seasonYear}, competitionId=${competition.id}`);
console.log(`[TemplateProvision] ✅ Reusing existing Season: ${season.id} (${season.name})`);
console.log(`[TemplateProvision] Starting match import: ${seasonData.matches.length} matches to process`);
```

---

## 📊 Flujo Corregido

### Caso 1: Primera asignación (Tenant A)

```
1. Asignar template "liga-mx-j16" a Tenant A
   ↓
2. Buscar Competition por competitionExternalId="262"
   ❌ NO EXISTE (primera vez)
   ↓
3. Buscar Competition por name="Liga MX"
   ❌ NO EXISTE
   ↓
4. Crear Competition
   - name: "Liga MX"
   - slug: "liga-mx"
   ↓
5. Crear ExternalMap
   - externalId: "262"
   - entityId: competition.id
   ↓
6. Crear Season
   - year: 2025
   - competitionId: competition.id
   ↓
7. Importar 18 teams
   ↓
8. Importar 380 matches
   ↓
9. Crear Pool con ruleSet.rounds = {start: 16, end: 16}
   ✅ MATCHES ASIGNADOS
```

### Caso 2: Segunda asignación (Tenant B)

```
1. Asignar template "liga-mx-j16" a Tenant B
   ↓
2. Buscar Competition por competitionExternalId="262"
   ✅ ENCUENTRA (creada en Caso 1)
   ↓
3. Reutilizar Competition
   ↓
4. ExternalMap ya existe (upsert)
   ↓
5. Buscar Season para year=2025
   ✅ ENCUENTRA (creada en Caso 1)
   ↓
6. Reutilizar Season
   ↓
7. Importar 18 teams (upsert - ya existen)
   ↓
8. Importar 380 matches (upsert - ya existen)
   ↓
9. Crear Pool con ruleSet.rounds = {start: 16, end: 16}
   ✅ MATCHES ASIGNADOS (reutilizados de BD)
```

---

## 🔍 Cómo Verificar

### 1. Revisar Logs en Servidor

Busca estos logs cuando asignes un template:

```
[TemplateProvision] Template config: competitionExternalId=262, seasonYear=2025, ...
[TemplateProvision] ✅ Fetching FULL season (roundLabel is undefined - import all matches)
[TemplateProvision] Fetched 18 teams and 380 matches
[TemplateProvision] ✅ Reusing existing Competition: clxxx... (Liga MX)  ← Clave
[TemplateProvision] ✅ Reusing existing Season: clxxx... (Jornada #16)  ← Clave
[TemplateProvision] Starting match import: 380 matches to process
[TemplateProvision] Creating pool with rules: { "rounds": { "start": 16, "end": 16 } }
[TemplateProvision] ✅ Pool will filter matches by rounds: 16-16
[TemplateProvision] ✅ Pool created: clxxx... with 380 matches
```

### 2. Verificar en BD

```sql
-- Verificar que Competition existe
SELECT id, name, slug FROM Competition WHERE name = 'Liga MX';

-- Verificar que ExternalMap existe
SELECT * FROM ExternalMap 
WHERE entityType = 'COMPETITION' 
AND externalId = '262';

-- Verificar que Season existe
SELECT id, name, year FROM Season 
WHERE competitionId = '<competition_id>' 
AND year = 2025;

-- Verificar que Matches existen
SELECT COUNT(*) FROM Match 
WHERE seasonId = '<season_id>';

-- Verificar que Pool existe
SELECT id, name, slug, ruleSet FROM Pool 
WHERE tenantId = '<tenant_id>';
```

### 3. Verificar en Frontend

1. Ir a `/[tenant]/[brand]/[pool]`
2. Verificar que aparecen los fixtures
3. Verificar que se filtran por jornada (si hay ruleSet.rounds)

---

## 🚨 Posibles Problemas Residuales

### Problema 1: Matches no se importan (seasonData vacío)

**Síntomas:**
```
[TemplateProvision] Fetched 0 teams and 0 matches
```

**Causas:**
- API-Football no devuelve datos
- `roundLabel` no es undefined (importa solo una jornada)
- `competitionExternalId` es incorrecto

**Solución:**
- Verificar que `roundLabel = undefined` en template
- Verificar que `competitionExternalId` es correcto
- Verificar logs de API-Football

### Problema 2: Teams no se encuentran (team mapping not found)

**Síntomas:**
```
[TemplateProvision] Skipping match: team mapping not found for ...
```

**Causas:**
- Teams no se importaron correctamente
- `teamDTO.externalId` no coincide con `teamIdMap`

**Solución:**
- Verificar que teams se importaron
- Verificar que `externalId` es correcto

### Problema 3: Pool se crea pero sin matches

**Síntomas:**
- Pool existe en BD
- Pero `Match` count es 0

**Causas:**
- Matches no se importaron
- Season no es la correcta

**Solución:**
- Revisar logs de import
- Verificar que Season tiene matches

---

## 📝 Cambios Realizados

### Archivo: `packages/api/src/services/templateProvision.service.ts`

**Líneas 178-221: Búsqueda inteligente de Competition**
- Busca por `competitionExternalId` primero
- Fallback a búsqueda por `name`
- Crea si no existe
- Logs de creación/reutilización

**Líneas 243-262: Logs de Season**
- Log al crear Season
- Log al reutilizar Season

**Líneas 327-328: Logs de match import**
- Log del total de matches a procesar
- Log detallado si falta team mapping

---

## ✅ Próximos Pasos

1. ✅ Implementación completada
2. ⏳ **Verificar logs** cuando asignes template a tenant
3. ⏳ Confirmar que aparecen "Reusing existing Competition" y "Reusing existing Season"
4. ⏳ Verificar que los matches aparecen en fixtures
5. ⏳ Testing con múltiples templates y tenants

---

**Referencia:** TEMPLATES_SMART_ROUNDS_IMPLEMENTATION.md  
**Autor:** Cascade AI  
**Estado:** ✅ LISTO PARA TESTING
