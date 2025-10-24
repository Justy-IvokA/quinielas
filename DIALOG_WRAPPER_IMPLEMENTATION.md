# Dialog Wrapper Implementation - Páginas Legales

## 📋 Resumen de Cambios

Se han envuelto los contenidos de las 3 páginas legales con el componente **Dialog** de `@qp/ui/components/dialog` para resolver el problema de **overflow** en el texto.

---

## ✅ Cambios Realizados

### 1. **Página Terms** (`apps/web/app/[locale]/legal/terms/page.tsx`)

#### Imports Agregados
```typescript
import {
  Dialog,
  DialogContent,
} from "@qp/ui/components/dialog";
```

#### Cambios en el Contenido
- **Línea 20-22:** Agregada extracción de `heroAssets` del tema del brand
- **Línea 32:** Agregado prop `heroAssets` al componente `LegalLayout`
- **Línea 38-39:** Envuelto contenido con `<Dialog open>` y `<DialogContent>`
- **Línea 39:** Agregadas clases para control de scroll: `max-w-2xl max-h-[80vh] overflow-y-auto`

#### Estructura
```typescript
<Dialog open>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <div className="space-y-8 text-foreground/90">
      {/* Todas las secciones aquí */}
    </div>
  </DialogContent>
</Dialog>
```

---

### 2. **Página Privacy** (`apps/web/app/[locale]/legal/privacy/page.tsx`)

#### Cambios Idénticos a Terms
- ✅ Imports del Dialog agregados
- ✅ Extracción de `heroAssets`
- ✅ Prop `heroAssets` en `LegalLayout`
- ✅ Envolvimiento con Dialog y DialogContent
- ✅ Clases de scroll aplicadas

---

### 3. **Página Cookies** (`apps/web/app/[locale]/legal/cookies/page.tsx`)

#### Cambios Idénticos a Terms y Privacy
- ✅ Imports del Dialog agregados
- ✅ Extracción de `heroAssets`
- ✅ Prop `heroAssets` en `LegalLayout`
- ✅ Envolvimiento con Dialog y DialogContent
- ✅ Clases de scroll aplicadas

---

## 🎨 Características del Dialog

### DialogContent - Clases Aplicadas
```typescript
className="max-w-2xl max-h-[80vh] overflow-y-auto"
```

| Clase | Propósito |
|-------|-----------|
| `max-w-2xl` | Ancho máximo de 672px (2xl en Tailwind) |
| `max-h-[80vh]` | Altura máxima del 80% del viewport |
| `overflow-y-auto` | Scroll vertical automático cuando contenido excede altura |

### Propiedades del Dialog
- **`open`:** Prop booleana que mantiene el dialog siempre abierto
- **Backdrop:** Blur automático con overlay semi-transparente
- **Animaciones:** Fade-in/zoom-in al abrir
- **Close button:** Botón X en esquina superior derecha

---

## 🔧 Componentes Relacionados

### LegalLayout
Se actualizó para aceptar el prop `heroAssets`:

```typescript
interface LegalLayoutProps {
  title: string;
  children: ReactNode;
  brandLogo?: any;
  brandName?: string;
  heroAssets?: any;  // ← Nuevo prop
}
```

### BackButton
Se actualizó para aceptar prop `className` personalizado:

```typescript
interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
  className?: string;  // ← Nuevo prop
}
```

---

## 📐 Dimensiones y Responsive

### Desktop (md+)
- Ancho: 672px (max-w-2xl)
- Altura: 80vh con scroll interno
- Padding: 24px (p-6 del DialogContent)

### Móvil (<md)
- Ancho: 100% - 32px (padding del viewport)
- Altura: 80vh con scroll interno
- Padding: 24px

### Scroll
- **Tipo:** Vertical automático
- **Trigger:** Cuando contenido > 80vh
- **Estilo:** Scrollbar nativa del navegador (personalizable con CSS)

---

## 🎯 Ventajas de esta Implementación

✅ **Sin Overflow:** El contenido nunca se corta o desborda
✅ **Scroll Interno:** El usuario puede navegar dentro del dialog
✅ **Responsive:** Se adapta a todos los tamaños de pantalla
✅ **Accesible:** Dialog de Radix UI con soporte ARIA
✅ **Consistente:** Mismo componente en las 3 páginas
✅ **Profesional:** Diseño limpio con backdrop blur
✅ **Performance:** No afecta el rendimiento de la página

---

## 🧪 Testing Checklist

- [ ] Verificar en móvil (iPhone 12, 375px)
- [ ] Verificar en tablet (iPad, 768px)
- [ ] Verificar en desktop (1920px)
- [ ] Probar scroll vertical en cada dispositivo
- [ ] Verificar que el botón X funciona (cierra dialog)
- [ ] Verificar que el backdrop blur se ve bien
- [ ] Probar con diferentes temas de brand
- [ ] Verificar que el logo se muestra correctamente
- [ ] Probar navegación con teclado (Tab, Enter, Escape)
- [ ] Verificar en navegadores: Chrome, Firefox, Safari, Edge

---

## 📝 Notas Importantes

### Dialog Open
El prop `open` mantiene el dialog siempre visible. Si en el futuro necesitas que sea cerrable:

```typescript
// Cambiar de:
<Dialog open>

// A:
const [open, setOpen] = useState(true);
<Dialog open={open} onOpenChange={setOpen}>
```

### Scroll Styling
Si necesitas personalizar el scrollbar, agrega CSS en el componente:

```typescript
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/20">
```

### Hero Assets
El `heroAssets` se extrae pero se usa en `LegalLayout`. Verifica que el componente lo renderice correctamente en el fondo.

---

## 🔄 Cambios Futuros Posibles

### 1. Agregar Tabla de Contenidos
```typescript
<DialogContent>
  <div className="flex gap-4">
    <aside className="w-48 hidden lg:block">
      {/* TOC aquí */}
    </aside>
    <main className="flex-1 overflow-y-auto">
      {/* Contenido */}
    </main>
  </div>
</DialogContent>
```

### 2. Agregar Búsqueda
```typescript
<DialogContent>
  <SearchBar />
  <div className="overflow-y-auto">
    {/* Contenido filtrado */}
  </div>
</DialogContent>
```

### 3. Agregar Botones de Acción
```typescript
<DialogContent>
  <div className="overflow-y-auto flex-1">
    {/* Contenido */}
  </div>
  <DialogFooter>
    <Button onClick={() => setOpen(false)}>Cerrar</Button>
    <Button onClick={handlePrint}>Imprimir</Button>
  </DialogFooter>
</DialogContent>
```

---

## 📊 Comparativa: Antes vs Después

| Aspecto | Antes | Después |
|--------|-------|---------|
| **Overflow** | ❌ Texto se cortaba | ✅ Scroll interno |
| **Contenedor** | `<div>` simple | `<Dialog>` con backdrop |
| **Altura** | Sin límite | 80vh máximo |
| **Scroll** | Página completa | Solo contenido |
| **Diseño** | Plano | Con backdrop blur |
| **Accesibilidad** | Básica | Radix UI (ARIA) |

---

## 🚀 Próximos Pasos

1. **Testing:** Verificar en todos los dispositivos
2. **Feedback:** Recopilar feedback del usuario
3. **Ajustes:** Modificar altura/ancho si es necesario
4. **Documentación:** Actualizar guías de desarrollo
5. **Extensión:** Aplicar patrón a otras páginas si es necesario

---

## 📞 Referencia Rápida

### Archivos Modificados
```
✓ apps/web/app/[locale]/legal/terms/page.tsx
✓ apps/web/app/[locale]/legal/privacy/page.tsx
✓ apps/web/app/[locale]/legal/cookies/page.tsx
```

### Componentes Utilizados
```
Dialog (de @qp/ui/components/dialog)
DialogContent (de @qp/ui/components/dialog)
LegalLayout (existente)
BrandThemeInjector (existente)
```

### Clases Tailwind Clave
```
max-w-2xl          → Ancho máximo
max-h-[80vh]       → Altura máxima
overflow-y-auto    → Scroll vertical
```

---

**Fecha de Implementación:** 23 de octubre de 2025  
**Versión:** 1.0  
**Estado:** ✅ Completado
