# 🔧 Guía de Diagnóstico: Template Auto-Provision

## 🎯 Objetivo

Diagnosticar por qué no se sincronizan automáticamente los partidos al asignar un template a un tenant.

## 📋 Pasos de Diagnóstico

### Paso 1: Habilitar Logging Detallado

**Cambios implementados:**
- ✅ Logging al inicio de provisión
- ✅ Logging al obtener template
- ✅ Logging al validar tenant
- ✅ Logging al obtener competencia
- ✅ Logging al importar equipos
- ✅ Logging al importar partidos
- ✅ Logging al crear pool
- ✅ Logging al finalizar (éxito o error)

### Paso 2: Asignar Template a Tenant

**Acción:**
1. Ir a Admin → Superadmin → Tenants → [tu tenant]
2. Sección "Assign Templates"
3. Seleccionar template PUBLISHED
4. Click "Assign"

**Resultado esperado:**
- Status: RUNNING → DONE (o FAILED)
- Resultado: "X teams imported, Y matches imported"

### Paso 3: Revisar Logs del Servidor

**En la terminal donde corre el servidor:**

```
[TemplateProvision] 🚀 Starting provision: template=xxx, tenant=yyy, brand=zzz
[TemplateProvision] Fetching template: xxx
[TemplateProvision] ✅ Template found: liga-mx-j14-16 (Liga MX Jornada 14-16)
[TemplateProvision] Fetching tenant: yyy
[TemplateProvision] ✅ Tenant found: [tenant-name]
[TemplateProvision] Template config: competitionExternalId=39, seasonYear=2025
[TemplateProvision] Fetching FULL season (roundLabel is undefined - import all matches)
[TemplateProvision] Fetched 18 teams and 380 matches
[TemplateProvision] ✅ Found Competition via ExternalMap: comp-xxx (Liga MX 2025)
[TemplateProvision] Starting match import: 380 matches to process
[TemplateProvision] ✅ Pool created: pool-xxx (liga-mx-j14-16) with 380 matches
[TemplateProvision] ✅ Provision completed successfully
[TemplateProvision] Result: poolId=pool-xxx, teams=18, matches=380
```

### Paso 4: Interpretar Logs

#### ✅ Si ves todos los logs hasta "Provision completed successfully"

**Significa:** La provisión funcionó correctamente

**Verificar en BD:**
```sql
-- Pool creado
SELECT id, slug, tenantId FROM Pool WHERE slug = 'liga-mx-j14-16';

-- Partidos importados
SELECT COUNT(*) FROM Match WHERE seasonId = (
  SELECT seasonId FROM Pool WHERE slug = 'liga-mx-j14-16'
);

-- ExternalMap completo
SELECT COUNT(*) FROM ExternalMap WHERE entityType = 'MATCH';
```

#### ❌ Si ves error en los logs

**Buscar línea con `❌`:**

```
[TemplateProvision] ❌ Template not found: xxx
→ Solución: Verificar que templateId es correcto

[TemplateProvision] ❌ Template not published: status=DRAFT
→ Solución: Publicar el template primero

[TemplateProvision] ❌ Tenant not found: yyy
→ Solución: Verificar que tenantId es correcto

[TemplateProvision] ❌ Provision failed for template=xxx, tenant=yyy
[TemplateProvision] Error message: [mensaje de error]
→ Solución: Leer el mensaje de error específico
```

### Paso 5: Errores Comunes y Soluciones

#### Error: "Template not published"

```
[TemplateProvision] ❌ Template not published: status=DRAFT
```

**Solución:**
1. Ir a Admin → Superadmin → Templates
2. Seleccionar template
3. Click "Publish"
4. Intentar asignar de nuevo

#### Error: "Season data not found from provider"

```
[TemplateProvision] Error message: Season data not found from provider
```

**Solución:**
1. Verificar que `competitionExternalId` es correcto
   ```sql
   SELECT competitionExternalId, seasonYear FROM PoolTemplate WHERE slug = 'liga-mx-j14-16';
   ```

2. Verificar que la API-Football tiene datos para esa competencia/temporada
   ```bash
   # Probar API manualmente
   curl "https://api-football-v1.p.rapidapi.com/v3/fixtures/rounds?league=39&season=2025" \
     -H "x-rapidapi-key: YOUR_KEY"
   ```

3. Verificar que `SPORTS_API_KEY` está configurado
   ```bash
   echo $SPORTS_API_KEY
   ```

#### Error: "One or more teams not found"

```
[TemplateProvision] Skipping match: team mapping not found for X vs Y
```

**Solución:**
1. Verificar que los equipos se importaron correctamente
   ```sql
   SELECT COUNT(*) FROM Team WHERE sportId = (SELECT id FROM Sport WHERE slug = 'football');
   ```

2. Verificar ExternalMap para equipos
   ```sql
   SELECT COUNT(*) FROM ExternalMap WHERE entityType = 'TEAM';
   ```

#### Error: "Provision timeout"

```
[TemplateProvision] ❌ Provision failed for template=xxx, tenant=yyy
[TemplateProvision] Error message: Provision timeout
```

**Solución:**
1. La API-Football es lenta o no responde
2. Esperar y reintentar
3. Verificar conexión a internet
4. Verificar que la API key es válida

### Paso 6: Verificación Completa

**Checklist después de asignar template:**

```sql
-- 1. ¿El assignment se creó?
SELECT id, status, result FROM TenantTemplateAssignment 
WHERE templateId = 'template-xxx' AND tenantId = 'tenant-yyy'
ORDER BY createdAt DESC LIMIT 1;
-- Resultado esperado: status = DONE, result tiene poolId

-- 2. ¿El pool se creó?
SELECT id, slug, tenantId, seasonId FROM Pool 
WHERE id = (SELECT result->>'poolId' FROM TenantTemplateAssignment WHERE templateId = 'template-xxx' LIMIT 1);
-- Resultado esperado: pool existe con tenantId correcto

-- 3. ¿Los partidos se importaron?
SELECT COUNT(*) as total_matches FROM Match 
WHERE seasonId = (SELECT seasonId FROM Pool WHERE slug = 'liga-mx-j14-16');
-- Resultado esperado: 380 (o el número correcto de partidos)

-- 4. ¿ExternalMap está completo?
SELECT entityType, COUNT(*) as count FROM ExternalMap 
WHERE sourceId = (SELECT id FROM ExternalSource WHERE slug = 'api-football')
GROUP BY entityType;
-- Resultado esperado:
-- COMPETITION: 1
-- TEAM: 18
-- MATCH: 380

-- 5. ¿AccessPolicy se creó?
SELECT id, accessType FROM AccessPolicy 
WHERE poolId = (SELECT id FROM Pool WHERE slug = 'liga-mx-j14-16');
-- Resultado esperado: accessType = PUBLIC (o según template)

-- 6. ¿Audit log registra la provisión?
SELECT action, metadata FROM AuditLog 
WHERE action = 'TEMPLATE_ASSIGN' AND resourceId = 'assignment-id'
ORDER BY createdAt DESC LIMIT 1;
-- Resultado esperado: metadata contiene poolId e imported counts
```

## 🚀 Flujo de Diagnóstico Rápido

1. **Asignar template**
   ```
   Admin → Superadmin → Tenants → [tenant] → Assign Templates
   ```

2. **Ver logs**
   ```
   Terminal del servidor → buscar [TemplateProvision]
   ```

3. **Verificar resultado**
   ```sql
   SELECT status, result FROM TenantTemplateAssignment 
   WHERE templateId = 'template-xxx' 
   ORDER BY createdAt DESC LIMIT 1;
   ```

4. **Si status = DONE:**
   - ✅ Provisión exitosa
   - Verificar pool en BD
   - Verificar partidos en BD

5. **Si status = FAILED:**
   - ❌ Error en provisión
   - Revisar logs para mensaje de error
   - Aplicar solución según error

6. **Si status = RUNNING:**
   - ⏳ Aún procesando
   - Esperar 30 segundos
   - Refrescar página
   - Si sigue RUNNING → probablemente error silencioso

## 📊 Logs Esperados por Etapa

### Etapa 1: Validación
```
[TemplateProvision] 🚀 Starting provision: template=xxx, tenant=yyy
[TemplateProvision] Fetching template: xxx
[TemplateProvision] ✅ Template found: liga-mx-j14-16
[TemplateProvision] Fetching tenant: yyy
[TemplateProvision] ✅ Tenant found: [tenant-name]
```

### Etapa 2: Obtener Datos de API
```
[TemplateProvision] Template config: competitionExternalId=39, seasonYear=2025
[TemplateProvision] Fetching FULL season (roundLabel is undefined)
[TemplateProvision] Fetched 18 teams and 380 matches
```

### Etapa 3: Crear/Actualizar Competencia
```
[TemplateProvision] ✅ Found Competition via ExternalMap: comp-xxx
[TemplateProvision] ✅ Reusing existing Season: season-xxx
```

### Etapa 4: Importar Datos
```
[TemplateProvision] Starting match import: 380 matches to process
[TemplateProvision] ✅ Pool created: pool-xxx with 380 matches
```

### Etapa 5: Finalizar
```
[TemplateProvision] ✅ Provision completed successfully
[TemplateProvision] Result: poolId=pool-xxx, teams=18, matches=380
```

## 🔍 Debugging Avanzado

### Ver todas las provisiones recientes
```sql
SELECT 
  ta.id,
  ta.status,
  ta.createdAt,
  pt.slug as template_slug,
  t.name as tenant_name,
  ta.result
FROM TenantTemplateAssignment ta
JOIN PoolTemplate pt ON pt.id = ta.templateId
JOIN Tenant t ON t.id = ta.tenantId
ORDER BY ta.createdAt DESC
LIMIT 10;
```

### Ver errores de provisión
```sql
SELECT 
  ta.id,
  ta.status,
  ta.result,
  pt.slug,
  t.name
FROM TenantTemplateAssignment ta
JOIN PoolTemplate pt ON pt.id = ta.templateId
JOIN Tenant t ON t.id = ta.tenantId
WHERE ta.status = 'FAILED'
ORDER BY ta.createdAt DESC;
```

### Ver pools creados por provisión
```sql
SELECT 
  p.id,
  p.slug,
  p.tenantId,
  COUNT(m.id) as match_count,
  p.createdAt
FROM Pool p
LEFT JOIN Match m ON m.seasonId = p.seasonId
WHERE p.createdAt > NOW() - INTERVAL '1 day'
GROUP BY p.id, p.slug, p.tenantId, p.createdAt
ORDER BY p.createdAt DESC;
```

## ✅ Resultado Esperado Final

Después de asignar un template:

1. ✅ Status: RUNNING → DONE
2. ✅ Result: "18 teams imported, 380 matches imported"
3. ✅ Pool creado con todos los partidos
4. ✅ ExternalMap completo
5. ✅ AccessPolicy configurada
6. ✅ Audit log registra la provisión
7. ✅ Usuario puede ver el pool en la lista de pools

**Si todo está ✅, la auto-provisión funciona correctamente.**

**Si algo está ❌, revisar logs y aplicar solución según el error.**
