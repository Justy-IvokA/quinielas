# 🧪 Testing: Selección Múltiple de Jornadas

## 🎯 Problema Reportado

Los checkboxes se renderizan pero **no son clickeables**.

---

## 🔧 Fixes Aplicados

### 1. Remover Conflicto de Event Handlers

**Problema:** Dos handlers compitiendo
```tsx
// ❌ ANTES - Conflicto
<div onClick={() => handleRoundToggle(round)}>
  <Checkbox onCheckedChange={() => handleRoundToggle(round)} />
</div>
```

**Solución:** Un solo handler
```tsx
// ✅ DESPUÉS - Sin conflicto
<div>
  <Checkbox 
    onCheckedChange={(checked) => {
      if (isActive) {
        handleRoundToggle(round);
      }
    }}
  />
</div>
```

### 2. Tipo Correcto para onCheckedChange

**Problema:** Radix UI Checkbox usa `boolean | "indeterminate"`
```tsx
// ❌ ANTES
const handleSelectAllRounds = (checked: boolean) => {
  setSelectAllRounds(checked);
};
```

**Solución:** Manejar tipo correcto
```tsx
// ✅ DESPUÉS
const handleSelectAllRounds = (checked: boolean | "indeterminate") => {
  const isChecked = checked === true;
  setSelectAllRounds(isChecked);
};
```

---

## ✅ Testing Manual

### Test 1: Checkbox "Todas las jornadas"

**Pasos:**
1. Ir a `/superadmin/templates/new`
2. Seleccionar deporte: Fútbol
3. Seleccionar competencia: Liga MX Apertura 2024
4. En "Etapa y Ronda", seleccionar stage: "Apertura"
5. Marcar checkbox "Todas las jornadas"

**Resultado Esperado:**
- ✅ Checkbox se marca
- ✅ Grid de jornadas individuales desaparece
- ✅ Aparece mensaje: "Se incluirán todos los partidos de esta etapa"
- ✅ Preview muestra total de matches

---

### Test 2: Seleccionar Jornadas Individuales

**Pasos:**
1. Continuar desde Test 1
2. Desmarcar "Todas las jornadas"
3. Hacer click en checkbox de Jornada 14
4. Hacer click en checkbox de Jornada 15
5. Hacer click en checkbox de Jornada 16

**Resultado Esperado:**
- ✅ Cada checkbox se marca al hacer click
- ✅ Borde del card cambia a primary cuando está seleccionado
- ✅ Aparece alert mostrando: "Jornadas seleccionadas: 14, 15, 16"
- ✅ Aparece: "Rango: 14 - 16"

---

### Test 3: Desmarcar Jornadas

**Pasos:**
1. Continuar desde Test 2
2. Hacer click en checkbox de Jornada 15 (desmarcarlo)

**Resultado Esperado:**
- ✅ Checkbox se desmarca
- ✅ Alert actualiza: "Jornadas seleccionadas: 14, 16"
- ✅ Rango actualiza: "Rango: 14 - 16" (sigue siendo 14-16)

---

### Test 4: Crear Template con Jornadas

**Pasos:**
1. Continuar desde Test 2 (J14, J15, J16 seleccionadas)
2. Continuar al siguiente paso
3. Llenar detalles del template
4. Continuar hasta Review
5. Crear template

**Resultado Esperado:**
- ✅ Template se crea exitosamente
- ✅ En DB: `template.rules` contiene:
  ```json
  {
    "exactScore": 5,
    "correctSign": 3,
    "rounds": {
      "start": 14,
      "end": 16
    }
  }
  ```

---

### Test 5: Provisionar Template a Tenant

**Pasos:**
1. Ir a `/superadmin/templates`
2. Seleccionar template creado en Test 4
3. Asignar a tenant "Ivoka"
4. Verificar pool creado

**Resultado Esperado:**
- ✅ Pool se crea con `ruleSet.rounds: {start: 14, end: 16}`
- ✅ Matches se importan de la API
- ✅ Frontend filtra solo J14-J16

---

### Test 6: Ver Fixtures en Pool

**Pasos:**
1. Ir a `ivoka.localhost:3000/es-MX/pools/[slug]/fixtures`
2. Verificar jornadas mostradas

**Resultado Esperado:**
- ✅ Solo se muestran matches de Jornadas 14, 15, 16
- ✅ NO se muestran matches de otras jornadas

---

## 🐛 Debugging

### Si los checkboxes NO funcionan:

**1. Verificar imports:**
```tsx
import { Checkbox } from "@qp/ui";
```

**2. Verificar en DevTools:**
```javascript
// En console del browser
document.querySelector('[id^="round-"]').click()
// Debe marcar/desmarcar el checkbox
```

**3. Verificar estado en React DevTools:**
- Buscar componente `StepStageRound`
- Verificar state `selectedRounds` (debe ser un Set)
- Verificar state `selectAllRounds` (debe ser boolean)

**4. Verificar eventos:**
```tsx
// Agregar console.log temporal
const handleRoundToggle = (round: string) => {
  console.log('Toggle round:', round); // ✅ Debe aparecer al hacer click
  // ...
};
```

---

## 🔍 Verificación en Código

### Archivo: StepStageRound.tsx

**Checkboxes individuales (línea ~315-324):**
```tsx
<Checkbox 
  id={`round-${round}`}
  checked={isSelected}
  disabled={!isActive}
  onCheckedChange={(checked) => {
    if (isActive) {
      handleRoundToggle(round);
    }
  }}
/>
```

**Checkbox "Todas" (línea ~277-281):**
```tsx
<Checkbox 
  id="select-all-rounds"
  checked={selectAllRounds}
  onCheckedChange={(checked) => handleSelectAllRounds(checked)}
/>
```

**Handler de toggle (línea ~70-89):**
```tsx
const handleRoundToggle = (round: string) => {
  if (!activeRounds.has(round)) {
    toast.error(t("roundExpiredError"));
    return;
  }

  setSelectedRounds(prev => {
    const newSet = new Set(prev);
    if (newSet.has(round)) {
      newSet.delete(round);
    } else {
      newSet.add(round);
    }
    setSelectAllRounds(false);
    return newSet;
  });
};
```

---

## ✅ Checklist de Verificación

- [ ] Checkboxes individuales son clickeables
- [ ] Checkbox "Todas las jornadas" es clickeable
- [ ] Al marcar checkbox, el borde cambia a primary
- [ ] Al desmarcar checkbox, el borde vuelve a normal
- [ ] Alert muestra jornadas seleccionadas correctamente
- [ ] Rango se calcula correctamente (min-max)
- [ ] Preview actualiza al cambiar selección
- [ ] Template se crea con `rules.rounds` correcto
- [ ] Pool provision usa `rules.rounds` correcto
- [ ] Frontend filtra matches correctamente

---

## 📝 Notas

### Jornadas Inactivas (Expiradas)

Las jornadas que ya pasaron aparecen con:
- Opacidad 40%
- Checkbox disabled
- Marca roja "✕"
- No son clickeables

Esto es **comportamiento esperado** para evitar crear pools de jornadas pasadas.

### Cálculo de Rango

Si usuario selecciona: J14, J16, J18

**Rango calculado:** `{start: 14, end: 18}`

**Matches incluidos:** J14, J15, J16, J17, J18 (TODOS entre min y max)

Esto es **comportamiento esperado** porque el filtro SQL usa:
```sql
WHERE round >= 14 AND round <= 18
```

---

**Fecha:** 21 de Octubre, 2025  
**Estado:** ✅ Fixes Aplicados - Listo para Testing
