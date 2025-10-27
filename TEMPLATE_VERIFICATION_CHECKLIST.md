# ✅ Checklist de Verificación: Creación de Plantilla

## 🎯 Objetivo

Verificar que el flujo completo de creación de plantilla y asignación a tenant funciona correctamente después del reset de BD.

## 📋 Pasos de Verificación

### Paso 1: Crear Plantilla
**Acción:** Ir a Admin → Superadmin → Templates → New

```
Llenar formulario:
- Sport: Football
- Competition: Liga MX 2025 (externalId: 39)
- Season: 2025
- Jornadas: 14-16
- Title: "Liga MX Jornada 14-16"
- Slug: "liga-mx-j14-16"
- Status: DRAFT
- Rules: exactScore=5, correctSign=3, goalDiffBonus=1
- Access: PUBLIC
```

**Verificar en BD:**
```sql
-- Template creada
SELECT id, slug, title, competitionExternalId, seasonYear, roundLabel
FROM PoolTemplate
WHERE slug = 'liga-mx-j14-16';

-- Resultado esperado:
-- id: template-xxx
-- slug: liga-mx-j14-16
-- title: Liga MX Jornada 14-16
-- competitionExternalId: 39
-- seasonYear: 2025
-- roundLabel: NULL  ← ✅ CRÍTICO
```

### Paso 2: Publicar Plantilla
**Acción:** Edit template → Publish

**Verificar en BD:**
```sql
SELECT status FROM PoolTemplate WHERE slug = 'liga-mx-j14-16';
-- Resultado: PUBLISHED
```

### Paso 3: Asignar a Tenant
**Acción:** Edit template → Assign to Tenant

```
Seleccionar:
- Tenant: [tu tenant]
- Brand: [tu brand]
```

**Verificar en BD:**
```sql
-- Assignment creada
SELECT id, templateId, tenantId, status
FROM PoolTemplateAssignment
WHERE templateId = 'template-xxx' AND tenantId = 'tenant-yyy';

-- Resultado esperado:
-- status: PENDING (o PROVISIONING)
```

### Paso 4: Provisionar (Sincronización)
**Acción:** Click en "Provision" o esperar a que se complete automáticamente

**Verificar Logs:**
```
[TemplateProvision] Template config: competitionExternalId=39, seasonYear=2025
[TemplateProvision] Fetching FULL season (roundLabel is undefined - import all matches)
[TemplateProvision] Fetched 18 teams and 380 matches
[TemplateProvision] ✅ Found Competition via ExternalMap: comp-xxx (Liga MX 2025)
[TemplateProvision] ✅ Reusing existing Season: season-xxx (Liga MX Jornada 14-16)
[TemplateProvision] Starting match import: 380 matches to process
[TemplateProvision] ✅ Pool created: pool-xxx (liga-mx-j14-16) with 380 matches
```

### Paso 5: Verificar ExternalMap
**Verificar en BD:**

#### 5.1: ExternalMap para Competencia
```sql
SELECT id, entityType, externalId, entityId
FROM ExternalMap
WHERE entityType = 'COMPETITION' AND externalId = '39';

-- Resultado esperado:
-- entityType: COMPETITION
-- externalId: 39
-- entityId: comp-xxx (ID de la competencia en BD)
```

#### 5.2: ExternalMap para Equipos
```sql
SELECT COUNT(*) as team_count
FROM ExternalMap
WHERE entityType = 'TEAM' AND sourceId = (
  SELECT id FROM ExternalSource WHERE slug = 'api-football'
);

-- Resultado esperado: 18 (o más si hay más equipos)
```

#### 5.3: ExternalMap para Partidos
```sql
SELECT COUNT(*) as match_count
FROM ExternalMap
WHERE entityType = 'MATCH' AND sourceId = (
  SELECT id FROM ExternalSource WHERE slug = 'api-football'
);

-- Resultado esperado: 380 (o más si hay más partidos)
```

### Paso 6: Verificar Pool Creado
**Verificar en BD:**

```sql
SELECT id, slug, name, seasonId, isActive
FROM Pool
WHERE slug = 'liga-mx-j14-16';

-- Resultado esperado:
-- id: pool-xxx
-- slug: liga-mx-j14-16
-- name: Liga MX Jornada 14-16
-- isActive: true
```

### Paso 7: Verificar Partidos Importados
**Verificar en BD:**

```sql
SELECT COUNT(*) as total_matches,
       COUNT(CASE WHEN round >= 14 AND round <= 16 THEN 1 END) as filtered_matches
FROM Match
WHERE seasonId = (
  SELECT seasonId FROM Pool WHERE slug = 'liga-mx-j14-16'
);

-- Resultado esperado:
-- total_matches: 380 (todos los partidos de la temporada)
-- filtered_matches: ~114 (partidos en jornadas 14-16)
```

### Paso 8: Verificar AccessPolicy
**Verificar en BD:**

```sql
SELECT accessType, requireCaptcha, requireEmailVerification
FROM AccessPolicy
WHERE poolId = (
  SELECT id FROM Pool WHERE slug = 'liga-mx-j14-16'
);

-- Resultado esperado:
-- accessType: PUBLIC
-- requireCaptcha: false
-- requireEmailVerification: false
```

### Paso 9: Verificar Audit Log
**Verificar en BD:**

```sql
SELECT action, resourceType, resourceId, metadata
FROM AuditLog
WHERE action = 'TEMPLATE_PROVISION' AND resourceType = 'POOL'
ORDER BY createdAt DESC
LIMIT 1;

-- Resultado esperado:
-- action: TEMPLATE_PROVISION
-- resourceType: POOL
-- metadata: { templateId: 'template-xxx', imported: { teams: 18, matches: 380 } }
```

### Paso 10: Asignar a Otro Tenant (Reutilización)
**Acción:** Assign template a otro tenant

**Verificar Logs:**
```
[TemplateProvision] ✅ Found Competition via ExternalMap: comp-xxx (Liga MX 2025)
[TemplateProvision] ✅ Reusing existing Season: season-xxx
[TemplateProvision] ✅ Pool created: pool-yyy (liga-mx-j14-16-1) with 380 matches
```

**Verificar en BD:**
```sql
-- Dos pools creados, ambos con los mismos partidos
SELECT slug, tenantId, COUNT(*) as match_count
FROM Pool
JOIN Match ON Match.seasonId = Pool.seasonId
WHERE slug LIKE 'liga-mx-j14-16%'
GROUP BY Pool.id, Pool.slug, Pool.tenantId;

-- Resultado esperado:
-- liga-mx-j14-16 | tenant-1 | 380
-- liga-mx-j14-16-1 | tenant-2 | 380

-- Pero ExternalMap es compartido:
SELECT COUNT(DISTINCT entityId) as unique_matches
FROM ExternalMap
WHERE entityType = 'MATCH';

-- Resultado esperado: 380 (no 760, porque reutiliza)
```

## 🔍 Verificaciones Críticas

### ✅ Validación 1: ExternalMap es la Fuente de Verdad

```sql
-- Verificar que ExternalMap existe para TODOS los datos
SELECT 
  'COMPETITION' as type, COUNT(*) as count
FROM ExternalMap
WHERE entityType = 'COMPETITION' AND externalId = '39'
UNION ALL
SELECT 
  'TEAM' as type, COUNT(*) as count
FROM ExternalMap
WHERE entityType = 'TEAM'
UNION ALL
SELECT 
  'MATCH' as type, COUNT(*) as count
FROM ExternalMap
WHERE entityType = 'MATCH';

-- Resultado esperado:
-- COMPETITION: 1
-- TEAM: 18
-- MATCH: 380
```

### ✅ Validación 2: Reutilización Funciona

```sql
-- Crear segundo pool con la misma plantilla
-- Verificar que NO crea duplicados en ExternalMap

SELECT COUNT(*) as external_maps_before
FROM ExternalMap
WHERE entityType = 'MATCH';

-- [Asignar template a otro tenant]

SELECT COUNT(*) as external_maps_after
FROM ExternalMap
WHERE entityType = 'MATCH';

-- Resultado esperado: external_maps_before == external_maps_after
-- (No crea nuevos, solo reutiliza)
```

### ✅ Validación 3: Filtrado de Jornadas Funciona

```sql
-- Verificar que ruleSet.rounds filtra correctamente
SELECT ruleSet
FROM Pool
WHERE slug = 'liga-mx-j14-16';

-- Resultado esperado:
-- {
--   "exactScore": 5,
--   "correctSign": 3,
--   "goalDiffBonus": 1,
--   "tieBreakers": ["EXACT_SCORES", "CORRECT_SIGNS"],
--   "rounds": { "start": 14, "end": 16 }
-- }

-- En la aplicación, filtrar:
SELECT * FROM Match
WHERE seasonId = (SELECT seasonId FROM Pool WHERE slug = 'liga-mx-j14-16')
AND round >= 14 AND round <= 16;

-- Resultado esperado: ~114 partidos (jornadas 14-16)
```

## 🚨 Problemas Comunes

### Problema 1: ExternalMap no se crea
**Síntoma:** ExternalMap vacío después de provisionar
**Causa:** Error en `provisionTemplateToTenant`
**Solución:** Revisar logs de error, verificar que `upsert` funciona

### Problema 2: Partidos duplicados
**Síntoma:** Más de 380 partidos después de segunda asignación
**Causa:** No está reutilizando ExternalMap
**Solución:** Verificar que `upsert` en ExternalMap tiene `update` clause

### Problema 3: Competencia no encontrada
**Síntoma:** Error "Competition not found" al provisionar
**Causa:** ExternalMap no existe o está mal configurado
**Solución:** Verificar que `competitionExternalId` es correcto (39 para Liga MX)

### Problema 4: Jornadas no filtran
**Síntoma:** Pool muestra todos los partidos, no solo 14-16
**Causa:** `ruleSet.rounds` no se guarda correctamente
**Solución:** Verificar que `rules` se pasa como JSON en template creation

## 📊 Queries Útiles

### Ver todo el flujo en una query
```sql
SELECT 
  'Template' as entity,
  pt.slug as name,
  pt.status as status,
  COUNT(DISTINCT ppta.id) as assignments,
  COUNT(DISTINCT p.id) as pools,
  COUNT(DISTINCT m.id) as matches
FROM PoolTemplate pt
LEFT JOIN PoolTemplateAssignment ppta ON ppta.templateId = pt.id
LEFT JOIN Pool p ON p.seasonId = (
  SELECT id FROM Season WHERE year = pt.seasonYear LIMIT 1
)
LEFT JOIN Match m ON m.seasonId = p.seasonId
WHERE pt.slug = 'liga-mx-j14-16'
GROUP BY pt.id, pt.slug, pt.status;
```

### Ver ExternalMap completeness
```sql
SELECT 
  entityType,
  COUNT(*) as total,
  COUNT(CASE WHEN entityId IS NOT NULL THEN 1 END) as mapped
FROM ExternalMap
WHERE sourceId = (SELECT id FROM ExternalSource WHERE slug = 'api-football')
GROUP BY entityType;
```

## ✅ Resultado Esperado Final

```
✅ Template creada y publicada
✅ Asignada a Tenant 1
✅ Pool 1 creado con 380 partidos
✅ ExternalMap completo (1 competition, 18 teams, 380 matches)
✅ Asignada a Tenant 2
✅ Pool 2 creado con 380 partidos
✅ ExternalMap SIN duplicados (reutiliza)
✅ Ambos pools filtran jornadas 14-16 correctamente
✅ Audit logs registran ambas provisiones
```
