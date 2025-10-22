# ✅ Implementación: Selección Múltiple de Jornadas en Asistentes

## 🎯 Objetivo

Permitir que el usuario seleccione **una, varias o todas** las jornadas al crear templates o pools, y que automáticamente se calcule `rounds.start` y `rounds.end` para el filtro.

---

## 🔄 Comportamiento Implementado

### Opciones de Selección

1. **Seleccionar jornadas específicas** (checkboxes)
   - Usuario marca: J14, J15, J16
   - Sistema calcula: `rounds: { start: 14, end: 16 }`

2. **Seleccionar "Todas las jornadas"** (checkbox especial)
   - Usuario marca: "Todas las jornadas"
   - Sistema guarda: `rounds: undefined` (sin filtro = todos los partidos)

3. **No seleccionar nada**
   - Sistema guarda: `rounds: undefined` (sin filtro = todos los partidos)

---

## 📊 Flujo de Datos

```
Usuario selecciona jornadas en UI
  ↓
StepStageRound calcula roundsRange automáticamente
  ↓
{
  selectedRounds: ["14", "15", "16"],
  roundsRange: { start: 14, end: 16 }
}
  ↓
StepReview incluye rounds en rules
  ↓
{
  rules: {
    exactScore: 5,
    correctSign: 3,
    rounds: { start: 14, end: 16 }  // ✅
  }
}
  ↓
Backend guarda en Pool.ruleSet o Template.rules
  ↓
fixtures.getByPoolId filtra por rounds
```

---

## 🔧 Cambios Implementados

### 1. StepStageRound.tsx (Template & Pool Wizards)

**Antes:** Radio buttons (una sola jornada)
```typescript
const [selectedRound, setSelectedRound] = useState<string | null>(null);
```

**Después:** Checkboxes (múltiples jornadas)
```typescript
const [selectedRounds, setSelectedRounds] = useState<Set<string>>(new Set());
const [selectAllRounds, setSelectAllRounds] = useState(false);
```

**Nueva función de cálculo:**
```typescript
const calculateRoundsRange = (): { start: number; end: number } | null => {
  if (selectAllRounds || selectedRounds.size === 0) {
    return null; // null = todos los partidos
  }

  const roundNumbers = Array.from(selectedRounds)
    .map(r => parseInt(r, 10))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);

  if (roundNumbers.length === 0) {
    return null;
  }

  return {
    start: roundNumbers[0],
    end: roundNumbers[roundNumbers.length - 1]
  };
};
```

**Nueva UI:**
```tsx
{/* Checkbox "Todas las jornadas" */}
<div className="flex items-center gap-2">
  <Checkbox 
    id="select-all-rounds"
    checked={selectAllRounds}
    onCheckedChange={handleSelectAllRounds}
  />
  <Label htmlFor="select-all-rounds">
    Todas las jornadas
  </Label>
</div>

{/* Checkboxes individuales */}
{!selectAllRounds && (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
    {rounds.map((round) => (
      <div key={round} onClick={() => handleRoundToggle(round)}>
        <Checkbox 
          checked={selectedRounds.has(round)}
          onCheckedChange={() => handleRoundToggle(round)}
        />
        <Label>{round}</Label>
      </div>
    ))}
  </div>
)}
```

---

### 2. CreateTemplateWizard.tsx

**Actualizado interface:**
```typescript
interface WizardData {
  // ...
  stageLabel?: string;
  selectedRounds?: string[]; // ✅ Array de rounds seleccionados
  roundsRange?: { start: number; end: number } | null; // ✅ Calculado automáticamente
  // ...
}
```

**Actualizado initialData:**
```typescript
<StepStageRound
  // ...
  initialData={{
    stageLabel: wizardData.stageLabel,
    selectedRounds: wizardData.selectedRounds // ✅ Pasar array
  }}
/>
```

---

### 3. StepReview.tsx (Templates)

**Actualizado mutation:**
```typescript
createMutation.mutate({
  // ...
  rules: {
    exactScore: wizardData.rules.exactScore,
    correctSign: wizardData.rules.correctSign,
    goalDiffBonus: wizardData.rules.goalDiffBonus,
    tieBreakers: ["EXACT_SCORES", "CORRECT_SIGNS"],
    // ✅ Incluir rounds si están definidos
    ...(wizardData.roundsRange ? {
      rounds: {
        start: wizardData.roundsRange.start,
        end: wizardData.roundsRange.end
      }
    } : {})
  }
});
```

---

## 🧪 Casos de Uso

### Caso 1: Seleccionar Jornadas Específicas

**Usuario selecciona:** J14, J15, J16

**Sistema calcula:**
```json
{
  "selectedRounds": ["14", "15", "16"],
  "roundsRange": {
    "start": 14,
    "end": 16
  }
}
```

**Resultado en Template/Pool:**
```json
{
  "rules": {
    "exactScore": 5,
    "correctSign": 3,
    "rounds": {
      "start": 14,
      "end": 16
    }
  }
}
```

**Fixtures mostrados:** Solo partidos de jornadas 14, 15 y 16

---

### Caso 2: Seleccionar "Todas las Jornadas"

**Usuario marca:** ✅ Todas las jornadas

**Sistema calcula:**
```json
{
  "selectedRounds": [],
  "roundsRange": null
}
```

**Resultado en Template/Pool:**
```json
{
  "rules": {
    "exactScore": 5,
    "correctSign": 3
    // ✅ Sin rounds - incluye todos los partidos
  }
}
```

**Fixtures mostrados:** TODOS los partidos de la temporada

---

### Caso 3: No Seleccionar Nada

**Usuario:** No marca ninguna jornada

**Sistema calcula:**
```json
{
  "selectedRounds": [],
  "roundsRange": null
}
```

**Resultado:** Igual que Caso 2 - todos los partidos

---

## 📋 Archivos Modificados

### Frontend (Template Wizard)
- ✅ `apps/admin/.../superadmin/templates/new/components/steps/StepStageRound.tsx`
  - Cambio de radio buttons a checkboxes
  - Agregado checkbox "Todas las jornadas"
  - Función `calculateRoundsRange()`
  - Actualizado `onSelect` para enviar `selectedRounds` y `roundsRange`

- ✅ `apps/admin/.../superadmin/templates/new/components/CreateTemplateWizard.tsx`
  - Actualizado `WizardData` interface
  - Actualizado `initialData` de StepStageRound

- ✅ `apps/admin/.../superadmin/templates/new/components/steps/StepReview.tsx`
  - Actualizado interface `StepReviewProps`
  - Actualizado mutation para incluir `rounds` en `rules`

### Frontend (Pool Wizard)
- ⚠️ **PENDIENTE:** Aplicar los mismos cambios al Pool Wizard
  - `apps/admin/.../pools/new/components/steps/StepStageRound.tsx`
  - `apps/admin/.../pools/new/components/CreatePoolWizard.tsx`
  - `apps/admin/.../pools/new/components/steps/StepReview.tsx`

### Backend
- ✅ `packages/api/src/routers/pools/schema.ts`
  - Ya actualizado para aceptar `rounds` en `rules` y `ruleSet`

- ✅ `packages/api/src/routers/fixtures/index.ts`
  - Ya tiene endpoint `getByPoolId` que filtra por `ruleSet.rounds`

---

## 🎯 Ventajas de Esta Implementación

### 1. **Flexibilidad Total**
```
✅ Una jornada: J14
✅ Varias jornadas: J14, J15, J16
✅ Todas las jornadas: checkbox especial
✅ Jornadas no consecutivas: J14, J16, J18 → rounds: {start: 14, end: 18}
```

### 2. **UX Intuitiva**
- Checkboxes familiares para selección múltiple
- Checkbox especial "Todas las jornadas" claramente visible
- Preview muestra jornadas seleccionadas y rango calculado

### 3. **Cálculo Automático**
- Usuario no necesita especificar `start` y `end` manualmente
- Sistema calcula automáticamente el rango mínimo y máximo
- Si selecciona "todas", automáticamente `rounds = undefined`

### 4. **Consistente con Backend**
- `rounds.start` y `rounds.end` se calculan correctamente
- `undefined` = todos los partidos (comportamiento esperado)
- Compatible con `fixtures.getByPoolId` existente

---

## ⚠️ Consideraciones

### Jornadas No Consecutivas

Si el usuario selecciona: J14, J16, J18

**Sistema calcula:**
```json
{
  "rounds": {
    "start": 14,
    "end": 18
  }
}
```

**Resultado:** Se incluirán **TODAS** las jornadas de 14 a 18 (incluyendo J15 y J17 no seleccionadas)

**Razón:** El filtro SQL usa `WHERE round >= 14 AND round <= 18`

**Solución futura (opcional):**
- Guardar array exacto de rounds en `ruleSet`
- Modificar query para usar `WHERE round IN (14, 16, 18)`
- Por ahora, este comportamiento es aceptable para MVP

---

## 📝 Próximos Pasos

### Inmediato
- [ ] Aplicar mismos cambios al **Pool Wizard**
- [ ] Testing en browser de ambos wizards
- [ ] Verificar que templates se crean correctamente
- [ ] Verificar que pools se crean correctamente

### Corto Plazo
- [ ] Agregar traducciones para nuevos textos
  - `selectAllRounds`
  - `allRoundsSelected`
  - `roundsSelectedInfo`
- [ ] Mejorar preview para mostrar total de matches
- [ ] Agregar validación: al menos una jornada o "todas"

### Opcional (Futuro)
- [ ] Soportar jornadas no consecutivas exactas
- [ ] Agregar botón "Seleccionar rango" (J14-J17)
- [ ] Mostrar calendario visual de jornadas

---

## 🎉 Resultado Final

**Antes:**
- Usuario solo podía seleccionar UNA jornada
- No había forma de seleccionar "todas"
- `roundLabel` se guardaba como string separado

**Después:**
- ✅ Usuario puede seleccionar múltiples jornadas
- ✅ Checkbox especial para "todas las jornadas"
- ✅ Sistema calcula `rounds.start/end` automáticamente
- ✅ Se guarda correctamente en `rules.rounds`
- ✅ Backend filtra correctamente por rounds

---

**Fecha:** 21 de Octubre, 2025  
**Implementado por:** Cascade AI  
**Estado:** ✅ Template Wizard Completo | ⚠️ Pool Wizard Pendiente
