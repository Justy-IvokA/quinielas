# 📋 Guía: Implementación de ruleSet.rounds

## 🎯 Módulo Responsable

El módulo **principal** responsable de asignar `ruleSet.rounds` es:

**`packages/api/src/services/templateProvision.service.ts`**

---

## 📊 Flujo de Datos

```
PoolTemplate.rules (JSON)
    ↓
templateProvision.service.ts
    ↓
Pool.ruleSet (JSON)
    ↓
fixtures.getByPoolId (filtra por rounds)
    ↓
Frontend (muestra matches filtrados)
```

---

## 🔧 Implementación Actual

### 1. PoolTemplate Schema

**Archivo:** `packages/db/prisma/schema.prisma`

```prisma
model PoolTemplate {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String?
  
  // ✅ Campo que contiene la configuración de rounds
  rules       Json?     // Default scoring rules and tie-breakers
  
  // Otros campos...
}
```

**Estructura de `rules` (JSON):**
```json
{
  "exactScore": 5,
  "correctSign": 3,
  "goalDiffBonus": 1,
  "tieBreakers": ["EXACT_SCORES", "CORRECT_SIGNS"],
  "rounds": {
    "start": 1,
    "end": 3
  }
}
```

---

### 2. Template Provision Service

**Archivo:** `packages/api/src/services/templateProvision.service.ts` (líneas 358-378)

```typescript
// Parse rules from template (with defaults)
const rules = template.rules as any || {
  exactScore: 5,
  correctSign: 3,
  goalDiffBonus: 1,
  tieBreakers: ["EXACT_SCORES", "CORRECT_SIGNS"]
};

// ⚠️ PROBLEMA: No incluye rounds por defecto

// Create Pool
const pool = await prisma.pool.create({
  data: {
    tenantId,
    brandId: brandId || null,
    seasonId: season.id,
    name: template.title,
    slug: poolSlug,
    description: template.description,
    isActive: true,
    isPublic: false,
    ruleSet: rules  // ← Se asigna aquí
  }
});
```

**Estado Actual:**
- ✅ Asigna `template.rules` a `pool.ruleSet`
- ⚠️ Si `template.rules` no incluye `rounds`, el pool no tendrá filtro
- ⚠️ Los defaults no incluyen `rounds`

---

## ✅ Solución: Actualizar Template Provision

### Opción 1: Incluir `rounds` en Templates (RECOMENDADA)

**Actualizar los templates CSV/JSON para incluir `rounds` en el campo `rules`:**

```json
// Template: Liga MX - Jornada 14
{
  "slug": "liga-mx-j14",
  "title": "Liga MX - Jornada 14",
  "rules": {
    "exactScore": 5,
    "correctSign": 3,
    "goalDiffBonus": 1,
    "tieBreakers": ["EXACT_SCORES", "CORRECT_SIGNS"],
    "rounds": {
      "start": 14,
      "end": 14
    }
  }
}
```

```json
// Template: Mundial 2026 - Completo
{
  "slug": "mundial-2026-completo",
  "title": "Mundial FIFA 2026 - Completo",
  "rules": {
    "exactScore": 5,
    "correctSign": 3,
    "goalDiffBonus": 1,
    "tieBreakers": ["EXACT_SCORES", "CORRECT_SIGNS"]
    // ✅ Sin rounds - incluye todos los partidos
  }
}
```

**Ventajas:**
- ✅ No requiere cambios en código
- ✅ Configuración explícita en templates
- ✅ Fácil de mantener

**Desventajas:**
- ❌ Requiere actualizar todos los templates

---

### Opción 2: Detectar Rounds Automáticamente

**Modificar `templateProvision.service.ts` para detectar rounds del template:**

```typescript
// Parse rules from template (with defaults)
const rules = template.rules as any || {
  exactScore: 5,
  correctSign: 3,
  goalDiffBonus: 1,
  tieBreakers: ["EXACT_SCORES", "CORRECT_SIGNS"]
};

// ✅ NUEVO: Detectar rounds del template si existen
if (template.roundLabel) {
  // Extraer número de jornada del roundLabel
  const roundMatch = template.roundLabel.match(/\d+/);
  if (roundMatch) {
    const round = parseInt(roundMatch[0]);
    rules.rounds = {
      start: round,
      end: round
    };
  }
}

// Si template.rules ya tiene rounds, no sobrescribir
if (template.rules && (template.rules as any).rounds) {
  rules.rounds = (template.rules as any).rounds;
}

// Create Pool con rules actualizados
const pool = await prisma.pool.create({
  data: {
    // ...
    ruleSet: rules
  }
});
```

**Ventajas:**
- ✅ Detecta automáticamente de `roundLabel`
- ✅ Respeta `rounds` si ya existe en `template.rules`
- ✅ Retrocompatible

**Desventajas:**
- ❌ Lógica adicional en el servicio
- ❌ Puede no funcionar para todos los casos

---

### Opción 3: Agregar Parámetro en Provision

**Permitir especificar `rounds` al provisionar:**

```typescript
// En el router de superadmin/templates.ts
provisionToTenant: publicProcedure
  .input(z.object({
    templateId: z.string().cuid(),
    tenantId: z.string().cuid(),
    brandId: z.string().cuid().optional(),
    poolSlug: z.string().optional(),
    // ✅ NUEVO: Permitir override de rounds
    rounds: z.object({
      start: z.number().int().positive(),
      end: z.number().int().positive()
    }).optional()
  }))
  .mutation(async ({ input }) => {
    // ...
    const rules = template.rules as any || { /* defaults */ };
    
    // ✅ Override rounds si se proporciona
    if (input.rounds) {
      rules.rounds = input.rounds;
    }
    
    // Create pool con rules
    // ...
  });
```

**Ventajas:**
- ✅ Máxima flexibilidad
- ✅ Permite override en tiempo de provision
- ✅ No requiere cambiar templates

**Desventajas:**
- ❌ Más complejo
- ❌ Requiere UI para especificar rounds

---

## 🎯 Recomendación: Opción 1 + Opción 2

**Combinar ambas opciones para máxima flexibilidad:**

1. **Templates incluyen `rounds` en `rules`** (Opción 1)
2. **Servicio detecta automáticamente de `roundLabel` como fallback** (Opción 2)

### Implementación Recomendada

```typescript
// packages/api/src/services/templateProvision.service.ts

// Parse rules from template (with defaults)
let rules = template.rules as any || {
  exactScore: 5,
  correctSign: 3,
  goalDiffBonus: 1,
  tieBreakers: ["EXACT_SCORES", "CORRECT_SIGNS"]
};

// ✅ Si template.rules ya tiene rounds, usarlos
if (rules.rounds) {
  console.log(`[TemplateProvision] Using rounds from template.rules:`, rules.rounds);
}
// ✅ Si no, intentar detectar de roundLabel
else if (template.roundLabel) {
  const roundMatch = template.roundLabel.match(/\d+/);
  if (roundMatch) {
    const round = parseInt(roundMatch[0]);
    rules.rounds = {
      start: round,
      end: round
    };
    console.log(`[TemplateProvision] Detected rounds from roundLabel:`, rules.rounds);
  }
}
// ✅ Si no hay rounds, dejar undefined (incluye todos los partidos)
else {
  console.log(`[TemplateProvision] No rounds specified - pool will include all matches`);
}

// Create Pool
const pool = await prisma.pool.create({
  data: {
    tenantId,
    brandId: brandId || null,
    seasonId: season.id,
    name: template.title,
    slug: poolSlug,
    description: template.description,
    isActive: true,
    isPublic: false,
    ruleSet: rules  // ← Incluye rounds si están definidos
  }
});
```

---

## 📝 Actualización de Templates

### Template CSV Actual

```csv
slug,title,description,rules,accessDefaults,...
liga-mx-j14,"Liga MX J14","Jornada 14","{""exactScore"":5,""correctSign"":3}","{""accessType"":""PUBLIC""}",...
```

### Template CSV Actualizado

```csv
slug,title,description,rules,accessDefaults,...
liga-mx-j14,"Liga MX J14","Jornada 14","{""exactScore"":5,""correctSign"":3,""rounds"":{""start"":14,""end"":14}}","{""accessType"":""PUBLIC""}",...
```

---

## 🧪 Testing

### Test 1: Template con `rounds` en `rules`
```typescript
const template = {
  slug: "liga-mx-j14",
  title: "Liga MX - Jornada 14",
  rules: {
    exactScore: 5,
    correctSign: 3,
    rounds: { start: 14, end: 14 }
  }
};

// Resultado esperado:
// pool.ruleSet.rounds = { start: 14, end: 14 }
```

### Test 2: Template con `roundLabel` (fallback)
```typescript
const template = {
  slug: "liga-mx-j14",
  title: "Liga MX - Jornada 14",
  roundLabel: "Jornada 14",
  rules: {
    exactScore: 5,
    correctSign: 3
  }
};

// Resultado esperado:
// pool.ruleSet.rounds = { start: 14, end: 14 } (detectado de roundLabel)
```

### Test 3: Template sin `rounds` (todos los partidos)
```typescript
const template = {
  slug: "mundial-2026",
  title: "Mundial 2026 - Completo",
  rules: {
    exactScore: 5,
    correctSign: 3
  }
};

// Resultado esperado:
// pool.ruleSet.rounds = undefined (incluye todos los partidos)
```

---

## 📋 Checklist de Implementación

- [ ] Actualizar `templateProvision.service.ts` con lógica de rounds
- [ ] Actualizar templates CSV/JSON para incluir `rounds` en `rules`
- [ ] Crear templates para Mundial 2026
  - [ ] Mundial Completo (sin rounds)
  - [ ] Fase de Grupos (rounds: 1-3)
  - [ ] Eliminatorias (rounds: 4-7)
  - [ ] Jornadas individuales (rounds: X-X)
- [ ] Testing de provisioning con diferentes configuraciones
- [ ] Documentar en guía de admin
- [ ] Actualizar UI de admin para mostrar/editar rounds

---

## 🎯 Resumen

**Módulo Responsable:**
- **Principal:** `templateProvision.service.ts` (línea 377)
- **Temporal:** `scripts/update-pools-with-rounds.ts` (migración one-time)

**Flujo:**
1. Template define `rules.rounds` (JSON)
2. `templateProvision.service.ts` lee `template.rules`
3. Crea Pool con `ruleSet = template.rules`
4. `fixtures.getByPoolId` lee `pool.ruleSet.rounds` y filtra

**Acción Requerida:**
1. Actualizar `templateProvision.service.ts` para manejar rounds
2. Actualizar templates para incluir `rounds` en `rules`

---

**Fecha:** 21 de Octubre, 2025  
**Autor:** Cascade AI  
**Estado:** Guía de Implementación
