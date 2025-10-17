# Pool Wizard - Correcciones Implementadas

## 🐛 Problemas Corregidos

### 1. ❌ Wizard iniciaba en paso 3 en lugar de paso 1

**Causa**: El hook `useWizardState` usa `nuqs` para sincronizar el paso actual con la URL (`?step=3`). Cuando navegabas desde el dashboard, la URL conservaba el parámetro de paso anterior.

**Solución**: 
```typescript
// Clear URL step parameter on mount to always start at step 1
useEffect(() => {
  if (searchParams.get('step')) {
    router.replace('/pools/new');
  }
}, []);
```

**Archivo**: `apps/admin/app/[locale]/(authenticated)/pools/new/components/CreatePoolWizard.tsx`

---

### 2. ❌ No había botón "Siguiente" en los pasos del wizard

**Causa**: Los pasos tenían `customActions: true` pero no implementaban sus propios botones de navegación.

**Solución**: 
- Removido `customActions: true` de los pasos 1, 2 y 3
- Ahora el wizard muestra automáticamente los botones "Atrás" y "Siguiente"
- Los pasos actualizan el estado del wizard pero no navegan automáticamente

**Cambios en `CreatePoolWizard.tsx`**:
```typescript
// ANTES (sin botones)
{
  title: "Deporte",
  content: (setIsPending, nav) => (
    <StepSport onSelect={(sportId) => {
      updateWizardData({ sportId });
      nav.onNext(); // ❌ Navegación automática
    }} />
  ),
  customActions: true // ❌ Sin botones
}

// DESPUÉS (con botones automáticos)
{
  title: "Deporte",
  content: (setIsPending, nav) => (
    <StepSport onSelect={(sportId) => {
      updateWizardData({ sportId }); // ✅ Solo actualiza estado
    }} />
  ),
  isEnabled: !!wizardData.sportId // ✅ Habilita botón cuando hay datos
}
```

---

### 3. 🎨 Estilos no coincidían con el diseño del dashboard

**Problema**: El wizard usaba estilos genéricos que no coincidían con el diseño de las tarjetas del dashboard.

**Solución**: Actualizado el diseño para coincidir con `dashboard-welcome.tsx`:

#### Cambios en `page.tsx`:
```tsx
// Header envuelto en tarjeta estilizada
<div className="rounded-2xl border border-border/70 bg-card/60 p-6 shadow-sm backdrop-blur">
  <h1 className="text-3xl font-semibold">Crear Quiniela</h1>
  <p className="mt-1 text-base text-muted-foreground">
    Asistente guiado para crear una quiniela e importar eventos
  </p>
</div>

// Wizard envuelto en tarjeta similar
<div className="rounded-2xl border border-border/70 bg-card/60 shadow-sm backdrop-blur">
  <CreatePoolWizard />
</div>
```

#### Cambios en `wizard-form.tsx`:
```tsx
// Contenedor principal simplificado
<div className="w-full p-6">
  {/* Step Header */}
  <div className="mb-6">
    <h2 className="text-2xl font-semibold">{currentStepData.title}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{currentStepData.description}</p>
    <Steps ... />
  </div>

  {/* Step Content */}
  <div className="rounded-xl border border-border/50 bg-background/50 p-6">
    {currentStepData.content}
  </div>

  {/* Navigation Buttons */}
  <div className="flex justify-end gap-3 mt-6">
    <Button variant="outline">Atrás</Button>
    <Button>Siguiente</Button>
  </div>
</div>
```

---

### 4. 🔧 Mejoras en componentes de pasos

#### StepSport.tsx
- ✅ Cambiado `setTimeout` por `useEffect` para auto-selección
- ✅ Actualizado mensaje: "Haz clic en 'Siguiente' para continuar"
- ✅ Removida navegación automática

#### StepStageRound.tsx
- ✅ Removido botón "Continuar sin filtrar" (redundante con botón "Siguiente")
- ✅ Agregado `useEffect` para actualizar wizard data cuando cambia la selección
- ✅ Agregado Alert informativo cuando no hay selección
- ✅ Removido import de `Button` (ya no se usa)

---

## ✅ Resultado Final

### Flujo de Navegación

1. **Paso 1 - Deporte**
   - Fútbol se auto-selecciona
   - Botón "Siguiente" habilitado automáticamente
   - Usuario hace clic en "Siguiente"

2. **Paso 2 - Competencia y Temporada**
   - Usuario busca y selecciona competencia
   - Usuario selecciona temporada
   - Botón "Siguiente" se habilita cuando ambos están seleccionados
   - Usuario hace clic en "Siguiente"

3. **Paso 3 - Etapa y Ronda**
   - Usuario puede seleccionar etapa/ronda (opcional)
   - Botón "Siguiente" siempre habilitado
   - Usuario hace clic en "Siguiente"

4. **Pasos 4-7**
   - Continúan con el flujo normal del wizard

### Diseño Visual

- ✅ Tarjetas con `rounded-2xl` y `border-border/70`
- ✅ Fondos con transparencia `bg-card/60`
- ✅ Efecto `backdrop-blur`
- ✅ Sombras sutiles `shadow-sm`
- ✅ Tipografía consistente (`text-3xl font-semibold`)
- ✅ Espaciado uniforme (`gap-6`, `p-6`)

---

## 📦 Archivos Modificados

1. **`apps/admin/app/[locale]/(authenticated)/pools/new/page.tsx`**
   - Agregado header en tarjeta estilizada
   - Wizard envuelto en tarjeta con estilos del dashboard

2. **`apps/admin/app/[locale]/(authenticated)/pools/new/components/CreatePoolWizard.tsx`**
   - Agregado `useRouter` y `useSearchParams`
   - Agregado `useEffect` para limpiar parámetro `step` de URL
   - Removido `customActions: true` de pasos 1, 2 y 3
   - Removida navegación automática `nav.onNext()` de callbacks

3. **`packages/ui/src/components/wizard/wizard-form.tsx`**
   - Rediseñado layout completo
   - Actualizado clases CSS para coincidir con diseño del dashboard
   - Mejorado espaciado y tipografía
   - Simplificado estructura HTML

4. **`apps/admin/app/[locale]/(authenticated)/pools/new/components/steps/StepSport.tsx`**
   - Cambiado `setTimeout` por `useEffect`
   - Actualizado mensaje de ayuda
   - Agregado import de `useEffect`

5. **`apps/admin/app/[locale]/(authenticated)/pools/new/components/steps/StepStageRound.tsx`**
   - Removido función `handleSkip`
   - Agregado `useEffect` para actualizar wizard data
   - Reemplazado botón por Alert informativo
   - Removido import de `Button`

---

## 🧪 Testing

### Verificar que funciona:

1. **Navegación desde dashboard**:
   ```
   Dashboard → Click "Crear Quiniela" → Debe iniciar en paso 1 ✅
   ```

2. **Navegación directa**:
   ```
   URL: /pools/new → Debe iniciar en paso 1 ✅
   URL: /pools/new?step=3 → Debe limpiar y mostrar paso 1 ✅
   ```

3. **Botones de navegación**:
   ```
   Paso 1 → Botón "Siguiente" visible y habilitado ✅
   Paso 2 → Botón "Siguiente" habilitado solo cuando hay selección ✅
   Paso 3 → Botón "Siguiente" siempre habilitado ✅
   Paso 2+ → Botón "Atrás" visible ✅
   ```

4. **Estilos**:
   ```
   ✅ Tarjetas con bordes redondeados
   ✅ Transparencias y backdrop-blur
   ✅ Colores consistentes con dashboard
   ✅ Tipografía uniforme
   ```

---

## 🎯 Próximos Pasos (Opcional)

1. **Animaciones de transición** entre pasos
2. **Mejorar indicador de progreso** (Steps component)
3. **Agregar confirmación** antes de salir con datos sin guardar
4. **Optimizar draft persistence** con debounce
5. **Agregar tooltips** en campos complejos
6. **Mejorar mensajes de error** con más contexto

---

## 📝 Notas Técnicas

### useWizardState y nuqs

El hook `useWizardState` usa `nuqs` para sincronizar el estado con la URL:
- **Ventaja**: Permite compartir enlaces a pasos específicos
- **Desventaja**: Puede causar problemas de navegación si no se maneja correctamente

**Solución implementada**: Limpiar el parámetro en el mount del componente para asegurar inicio en paso 1, pero permitir que `nuqs` maneje la navegación entre pasos después.

### customActions vs Botones Automáticos

- `customActions: true` → El paso debe implementar sus propios botones
- `customActions: false` o sin especificar → El wizard muestra botones automáticos
- `isEnabled` → Controla si el botón "Siguiente" está habilitado

**Regla general**: Solo usar `customActions: true` cuando el paso necesita lógica de navegación personalizada (ej: StepReview que no tiene botón "Siguiente" sino "Crear").

### Estilos Consistentes

Clases CSS usadas para coincidir con dashboard:
```css
rounded-2xl          /* Bordes muy redondeados */
border-border/70     /* Borde con 70% opacidad */
bg-card/60          /* Fondo de tarjeta con 60% opacidad */
shadow-sm           /* Sombra sutil */
backdrop-blur       /* Efecto de desenfoque de fondo */
text-3xl font-semibold  /* Tipografía de títulos */
text-muted-foreground   /* Color de texto secundario */
```

---

## ✅ Resumen

Todos los problemas han sido corregidos:

1. ✅ Wizard siempre inicia en paso 1
2. ✅ Botones de navegación visibles en todos los pasos
3. ✅ Diseño consistente con el dashboard
4. ✅ Flujo de navegación intuitivo
5. ✅ Estilos modernos y profesionales

**El wizard está listo para usar!** 🚀
