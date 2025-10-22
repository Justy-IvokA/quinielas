# ✅ Checklist: Aplicar Rounds al Pool Wizard

## 📋 Archivos a Modificar

### 1. ✅ CreatePoolWizard.tsx

**Archivo:** `apps/admin/app/[locale]/(authenticated)/pools/new/components/CreatePoolWizard.tsx`

#### Cambio 1: Actualizar WizardData interface (líneas 14-44)

```typescript
// CAMBIAR:
interface WizardData {
  sportId?: string;
  competitionExternalId?: string;
  competitionName?: string;
  seasonYear?: number;
  stageLabel?: string;
  roundLabel?: string;  // ❌ REMOVER
  pool?: { ... };
  // ...
}

// POR:
interface WizardData {
  sportId?: string;
  competitionExternalId?: string;
  competitionName?: string;
  seasonYear?: number;
  stageLabel?: string;
  selectedRounds?: string[];  // ✅ AGREGAR
  roundsRange?: { start: number; end: number } | null;  // ✅ AGREGAR
  pool?: { ... };
  // ...
}
```

#### Cambio 2: Actualizar initialData de StepStageRound (líneas 138-141)

```typescript
// CAMBIAR:
initialData={{
  stageLabel: wizardData.stageLabel,
  roundLabel: wizardData.roundLabel  // ❌ REMOVER
}}

// POR:
initialData={{
  stageLabel: wizardData.stageLabel,
  selectedRounds: wizardData.selectedRounds  // ✅ AGREGAR
}}
```

---

### 2. ✅ StepStageRound.tsx

**Archivo:** `apps/admin/app/[locale]/(authenticated)/pools/new/components/steps/StepStageRound.tsx`

**Acción:** COPIAR el archivo completo desde:
```
FROM: apps/admin/app/[locale]/(authenticated)/superadmin/templates/new/components/steps/StepStageRound.tsx
TO:   apps/admin/app/[locale]/(authenticated)/pools/new/components/steps/StepStageRound.tsx
```

**Nota:** El archivo es idéntico, las traducciones ya están compartidas en la ruta `superadmin.templates.create.wizard.steps.scope`.

---

### 3. ✅ StepDetails.tsx

**Archivo:** `apps/admin/app/[locale]/(authenticated)/pools/new/components/steps/StepDetails.tsx`

#### Cambio 1: Actualizar interface (líneas 20-26)

```typescript
// CAMBIAR:
interface StepDetailsProps {
  competitionName: string;
  seasonYear: number;
  stageLabel?: string;
  roundLabel?: string;  // ❌ REMOVER
  onSubmit: (data: DetailsFormData) => void;
  initialData?: Partial<DetailsFormData>;
}

// POR:
interface StepDetailsProps {
  competitionName: string;
  seasonYear: number;
  stageLabel?: string;
  selectedRounds?: string[];  // ✅ AGREGAR
  roundsRange?: { start: number; end: number } | null;  // ✅ AGREGAR
  onSubmit: (data: DetailsFormData) => void;
  initialData?: Partial<DetailsFormData>;
}
```

#### Cambio 2: Actualizar destructuring (líneas 29-35)

```typescript
// CAMBIAR:
export function StepDetails({
  competitionName,
  seasonYear,
  stageLabel,
  roundLabel,  // ❌ REMOVER
  onSubmit,
  initialData
}: StepDetailsProps) {

// POR:
export function StepDetails({
  competitionName,
  seasonYear,
  stageLabel,
  selectedRounds,  // ✅ AGREGAR
  roundsRange,     // ✅ AGREGAR
  onSubmit,
  initialData
}: StepDetailsProps) {
```

#### Cambio 3: Actualizar generatePoolTitle/Slug (líneas 46-48 y 64-66)

```typescript
// CAMBIAR:
title: generatePoolTitle({ competitionName, seasonYear, stageLabel, roundLabel }),
slug: generatePoolSlug({ competitionName, seasonYear, stageLabel, roundLabel })

// POR:
title: generatePoolTitle({ 
  competitionName, 
  seasonYear, 
  stageLabel, 
  roundLabel: selectedRounds && selectedRounds.length > 0 ? selectedRounds.join('-') : undefined 
}),
slug: generatePoolSlug({ 
  competitionName, 
  seasonYear, 
  stageLabel, 
  roundLabel: selectedRounds && selectedRounds.length > 0 ? selectedRounds.join('-') : undefined 
})
```

#### Cambio 4: Actualizar display de ronda (líneas 145-150)

```typescript
// CAMBIAR:
{roundLabel && (
  <div className="flex justify-between">
    <dt className="text-muted-foreground">Ronda:</dt>
    <dd className="font-medium">{roundLabel}</dd>
  </div>
)}

// POR:
{selectedRounds && selectedRounds.length > 0 && (
  <div className="flex justify-between">
    <dt className="text-muted-foreground">Jornadas:</dt>
    <dd className="font-medium">{selectedRounds.join(', ')}</dd>
  </div>
)}
{roundsRange && (
  <div className="flex justify-between">
    <dt className="text-muted-foreground">Rango:</dt>
    <dd className="font-medium">{roundsRange.start} - {roundsRange.end}</dd>
  </div>
)}
```

---

### 4. ✅ StepReview.tsx

**Archivo:** `apps/admin/app/[locale]/(authenticated)/pools/new/components/steps/StepReview.tsx`

#### Cambio 1: Actualizar interface (líneas 14-20)

```typescript
// CAMBIAR:
interface StepReviewProps {
  wizardData: {
    competitionName: string;
    seasonYear: number;
    stageLabel?: string;
    roundLabel?: string;  // ❌ REMOVER
    pool: { ... };
    // ...
  };
}

// POR:
interface StepReviewProps {
  wizardData: {
    competitionName: string;
    seasonYear: number;
    stageLabel?: string;
    selectedRounds?: string[];  // ✅ AGREGAR
    roundsRange?: { start: number; end: number } | null;  // ✅ AGREGAR
    pool: { ... };
    // ...
  };
}
```

#### Cambio 2: Actualizar mutation (líneas 63-67)

```typescript
// CAMBIAR:
const result = await provisionMutation.mutateAsync({
  competitionName: wizardData.competitionName,
  seasonYear: wizardData.seasonYear,
  stageLabel: wizardData.stageLabel,
  roundLabel: wizardData.roundLabel,  // ❌ REMOVER
  pool: wizardData.pool,
  // ...
});

// POR:
const result = await provisionMutation.mutateAsync({
  competitionName: wizardData.competitionName,
  seasonYear: wizardData.seasonYear,
  stageLabel: wizardData.stageLabel,
  roundLabel: undefined,  // ✅ NO filtrar en import
  pool: {
    ...wizardData.pool,
    // ✅ Agregar rounds a ruleSet
    ruleSet: {
      exactScore: 5,
      correctSign: 3,
      goalDiffBonus: 1,
      ...(wizardData.roundsRange ? {
        rounds: {
          start: wizardData.roundsRange.start,
          end: wizardData.roundsRange.end
        }
      } : {})
    }
  },
  // ...
});
```

#### Cambio 3: Actualizar display de ronda (líneas 185-190)

```typescript
// CAMBIAR:
{wizardData.roundLabel && (
  <div className="flex justify-between">
    <dt className="text-muted-foreground">Ronda:</dt>
    <dd className="font-medium">{wizardData.roundLabel}</dd>
  </div>
)}

// POR:
{wizardData.selectedRounds && wizardData.selectedRounds.length > 0 && (
  <div className="flex justify-between">
    <dt className="text-muted-foreground">Jornadas:</dt>
    <dd className="font-medium">{wizardData.selectedRounds.join(', ')}</dd>
  </div>
)}
{wizardData.roundsRange && (
  <div className="flex justify-between">
    <dt className="text-muted-foreground">Rango:</dt>
    <dd className="font-medium">
      {wizardData.roundsRange.start} - {wizardData.roundsRange.end}
    </dd>
  </div>
)}
```

---

## 🎯 Resumen de Cambios

| Archivo | Cambios | Crítico |
|---------|---------|---------|
| **CreatePoolWizard.tsx** | Interface + initialData | ✅ Sí |
| **StepStageRound.tsx** | Copiar archivo completo | ✅ Sí |
| **StepDetails.tsx** | Interface + props + display | ⚠️ Medio |
| **StepReview.tsx** | Interface + mutation + display | ✅ Sí |

---

## ⚠️ Puntos Críticos

### 1. StepReview.tsx - Mutation

**MUY IMPORTANTE:** El mutation debe incluir `rounds` en el `ruleSet` del pool:

```typescript
pool: {
  ...wizardData.pool,
  ruleSet: {
    exactScore: 5,
    correctSign: 3,
    goalDiffBonus: 1,
    // ✅ CRÍTICO: Incluir rounds aquí
    ...(wizardData.roundsRange ? {
      rounds: {
        start: wizardData.roundsRange.start,
        end: wizardData.roundsRange.end
      }
    } : {})
  }
}
```

### 2. roundLabel = undefined

**IMPORTANTE:** Siempre enviar `roundLabel: undefined` para importar toda la temporada:

```typescript
roundLabel: undefined,  // ✅ NO filtrar en import - importar toda la temporada
```

**Razón:** Si usuario selecciona múltiples jornadas (J14, J15, J16), `roundLabel` solo importaría UNA jornada de la API.

---

## 🧪 Testing Después de Aplicar Cambios

### Test 1: Crear Pool con Jornadas Específicas

1. Ir a `/pools/new`
2. Seleccionar deporte y competencia
3. Seleccionar stage: "Apertura"
4. Marcar checkboxes: J14, J15, J16
5. Continuar y crear pool

**Verificar:**
- ✅ Pool se crea exitosamente
- ✅ `pool.ruleSet.rounds = {start: 14, end: 16}`
- ✅ Fixtures muestran solo J14-J16

### Test 2: Crear Pool con "Todas las Jornadas"

1. Ir a `/pools/new`
2. Seleccionar deporte y competencia
3. Seleccionar stage: "Apertura"
4. Marcar checkbox: "Todas las jornadas"
5. Continuar y crear pool

**Verificar:**
- ✅ Pool se crea exitosamente
- ✅ `pool.ruleSet.rounds = undefined`
- ✅ Fixtures muestran TODAS las jornadas

### Test 3: Ver Fixtures en Pool Creado

1. Ir a `/pools/[slug]/fixtures`
2. Verificar jornadas mostradas

**Verificar:**
- ✅ Solo se muestran las jornadas configuradas
- ✅ Filtro funciona correctamente

---

## 📝 Notas Adicionales

### Traducciones

Las traducciones ya están agregadas en:
- `apps/admin/messages/es-MX.json`
- `apps/admin/messages/en-US.json`

En la ruta: `superadmin.templates.create.wizard.steps.scope`

**Claves agregadas:**
- `selectAllRounds`: "Todas las jornadas"
- `allRoundsSelected`: "Se incluirán todos los partidos de esta etapa"
- `roundsSelectedInfo`: "Jornadas seleccionadas: {rounds}"

### Backend

El backend ya está listo:
- ✅ `pools/schema.ts` acepta `rounds` en `rules`
- ✅ `fixtures.getByPoolId` filtra por `ruleSet.rounds`

---

## ✅ Checklist Final

Antes de probar:

- [ ] Actualizar `CreatePoolWizard.tsx` (interface + initialData)
- [ ] Copiar `StepStageRound.tsx` del template wizard
- [ ] Actualizar `StepDetails.tsx` (interface + props + display)
- [ ] Actualizar `StepReview.tsx` (interface + mutation + display)
- [ ] Reiniciar servidor de desarrollo
- [ ] Probar creación de pool con jornadas específicas
- [ ] Probar creación de pool con "todas las jornadas"
- [ ] Verificar fixtures en pool creado

---

**Fecha:** 21 de Octubre, 2025  
**Estado:** 📋 Checklist Completo - Listo para Aplicar
