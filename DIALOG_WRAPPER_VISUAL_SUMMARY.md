# Dialog Wrapper - Resumen Visual

## 🎯 Problema Resuelto

### Antes (Overflow)
```
┌─────────────────────────────────────────────────────────┐
│  PÁGINA LEGAL - TÉRMINOS Y CONDICIONES                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Contenido que se extiende más allá del viewport       │
│  y causa problemas de overflow horizontal...           │
│  El texto se corta o se desborda de manera             │
│  desagradable visualmente. El usuario tiene que        │
│  hacer scroll horizontal para ver todo, lo que es      │
│  una mala experiencia de usuario.                      │
│                                                         │
│  Más contenido aquí que sigue extendiéndose...         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Después (Dialog con Scroll)
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  TÉRMINOS Y CONDICIONES                        ✕ │  │
│  ├───────────────────────────────────────────────────┤  │
│  │                                                   │  │
│  │  Contenido dentro del dialog con scroll         │  │
│  │  vertical. El usuario puede navegar dentro      │  │
│  │  del contenedor sin problemas. El texto se      │  │
│  │  ajusta perfectamente al ancho del dialog.      │  │
│  │                                                   │  │
│  │  ↓ Scroll vertical aquí ↓                        │  │
│  │                                                   │  │
│  │  Más contenido que se puede ver con scroll      │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  (Backdrop blur de fondo)                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📐 Estructura del Dialog

```
┌─────────────────────────────────────────────────────────┐
│  LegalLayout (Contenedor Principal)                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Dialog (open)                                    │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  DialogContent                             │  │  │
│  │  │  (max-w-2xl max-h-[80vh] overflow-y-auto)  │  │  │
│  │  │                                             │  │  │
│  │  │  ┌─────────────────────────────────────┐   │  │  │
│  │  │  │  Section 1: Introduction           │   │  │  │
│  │  │  │  Section 2: Definitions            │   │  │  │
│  │  │  │  Section 3: User Eligibility       │   │  │  │
│  │  │  │  ...                               │   │  │  │
│  │  │  │  Section 13: Contact               │   │  │  │
│  │  │  │  Last Updated                      │   │  │  │
│  │  │  │                                     │   │  │  │
│  │  │  │  ↕ Scroll Vertical                 │   │  │  │
│  │  │  │                                     │   │  │  │
│  │  │  └─────────────────────────────────────┘   │  │  │
│  │  │                                             │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Backdrop Blur (background)                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Dimensiones

### Desktop (md+)
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                                                                │
│                 ┌──────────────────────────┐                  │
│                 │   Dialog (672px)         │                  │
│                 │   ┌────────────────────┐ │                  │
│                 │   │ Contenido          │ │                  │
│                 │   │ (80vh max-height)  │ │                  │
│                 │   │                    │ │                  │
│                 │   │ ↕ Scroll           │ │                  │
│                 │   │                    │ │                  │
│                 │   └────────────────────┘ │                  │
│                 └──────────────────────────┘                  │
│                                                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Móvil (<md)
```
┌──────────────────────────┐
│                          │
│  ┌────────────────────┐  │
│  │ Dialog (90% ancho) │  │
│  │ ┌────────────────┐ │  │
│  │ │ Contenido      │ │  │
│  │ │ (80vh height)  │ │  │
│  │ │                │ │  │
│  │ │ ↕ Scroll       │ │  │
│  │ │                │ │  │
│  │ └────────────────┘ │  │
│  └────────────────────┘  │
│                          │
└──────────────────────────┘
```

---

## 🔄 Flujo de Cambios

### Antes
```
TermsContent
├── LegalLayout
│   └── div.space-y-8
│       ├── section (Intro)
│       ├── section (Definitions)
│       ├── section (User Eligibility)
│       └── ... (13 secciones)
│           └── OVERFLOW ❌
```

### Después
```
TermsContent
├── LegalLayout
│   └── Dialog (open)
│       └── DialogContent (max-w-2xl max-h-[80vh] overflow-y-auto)
│           └── div.space-y-8
│               ├── section (Intro)
│               ├── section (Definitions)
│               ├── section (User Eligibility)
│               └── ... (13 secciones)
│                   └── SCROLL VERTICAL ✅
```

---

## 📊 Comparativa de Clases

### DialogContent - Clases Aplicadas

```typescript
className="max-w-2xl max-h-[80vh] overflow-y-auto"
```

| Clase | Valor | Efecto |
|-------|-------|--------|
| `max-w-2xl` | 672px | Limita ancho máximo |
| `max-h-[80vh]` | 80% viewport | Limita altura máxima |
| `overflow-y-auto` | auto | Scroll vertical cuando necesario |

### Resultado
```
┌─────────────────────────────┐
│  max-w-2xl (672px)          │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │  max-h-[80vh]         │  │
│  │  (80% viewport)       │  │
│  │                       │  │
│  │  overflow-y-auto      │  │
│  │  (Scroll aquí)        │  │
│  │                       │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

## 🎯 Características del Dialog

### 1. Backdrop Blur
```
┌─────────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│  ░░  ┌───────────────────────────────────────────┐  ░░░│
│  ░░  │  Dialog Content                        ✕ │  ░░░│
│  ░░  │                                           │  ░░░│
│  ░░  │  Contenido del dialog                     │  ░░░│
│  ░░  │                                           │  ░░░│
│  ░░  └───────────────────────────────────────────┘  ░░░│
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                                                         │
│  (Fondo borroso = Backdrop blur)                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Botón de Cierre
```
┌───────────────────────────────────────────┐
│  Título                                ✕ │  ← Botón X
├───────────────────────────────────────────┤
│                                           │
│  Contenido                                │
│                                           │
└───────────────────────────────────────────┘
```

### 3. Animaciones
```
Fade-in (entrada):
  Opacidad: 0 → 1

Zoom-in (entrada):
  Escala: 0.95 → 1

Slide-in (entrada):
  Posición: -50% → 0
```

---

## 🧪 Testing Visual

### Checklist de Verificación

```
Dispositivo: Móvil (375px)
┌──────────────────────────┐
│ ✓ Dialog visible        │
│ ✓ Contenido legible     │
│ ✓ Scroll funciona       │
│ ✓ Botón X visible      │
│ ✓ Backdrop blur OK      │
└──────────────────────────┘

Dispositivo: Tablet (768px)
┌────────────────────────────────────┐
│ ✓ Dialog centrado                 │
│ ✓ Contenido bien espaciado        │
│ ✓ Scroll suave                    │
│ ✓ Botón X accesible              │
│ ✓ Backdrop blur visible           │
└────────────────────────────────────┘

Dispositivo: Desktop (1920px)
┌────────────────────────────────────────────────────────────┐
│ ✓ Dialog bien posicionado                                │
│ ✓ Contenido legible con buen espaciado                   │
│ ✓ Scroll funciona correctamente                          │
│ ✓ Botón X en posición correcta                          │
│ ✓ Backdrop blur profesional                              │
└────────────────────────────────────────────────────────────┘
```

---

## 📱 Responsive Behavior

### Breakpoints

```
xs (0px - 640px)
├─ Dialog: 90% ancho
├─ Altura: 80vh
└─ Padding: 16px

sm (640px - 768px)
├─ Dialog: 90% ancho
├─ Altura: 80vh
└─ Padding: 16px

md (768px - 1024px)
├─ Dialog: max-w-2xl (672px)
├─ Altura: 80vh
└─ Padding: 24px

lg (1024px - 1280px)
├─ Dialog: max-w-2xl (672px)
├─ Altura: 80vh
└─ Padding: 24px

xl (1280px+)
├─ Dialog: max-w-2xl (672px)
├─ Altura: 80vh
└─ Padding: 24px
```

---

## 🎬 Animaciones

### Entrada (Open)
```
Frame 1:        Frame 2:        Frame 3:        Frame 4:
Opacidad: 0%    Opacidad: 50%   Opacidad: 75%   Opacidad: 100%
Escala: 0.95    Escala: 0.97    Escala: 0.99    Escala: 1.0

Duración: 200ms
Easing: ease-out
```

### Salida (Close)
```
Frame 1:        Frame 2:        Frame 3:        Frame 4:
Opacidad: 100%  Opacidad: 75%   Opacidad: 50%   Opacidad: 0%
Escala: 1.0     Escala: 0.99    Escala: 0.97    Escala: 0.95

Duración: 200ms
Easing: ease-in
```

---

## 🔗 Relación entre Componentes

```
┌─────────────────────────────────────────────────────────┐
│  TermsContent (Server Component)                        │
│  ├─ Resuelve tenant y brand                            │
│  ├─ Obtiene traducciones                               │
│  └─ Renderiza LegalLayout                              │
│     └─ LegalLayout (Client Component)                  │
│        ├─ Muestra logo del brand                       │
│        ├─ Renderiza BackButton                         │
│        ├─ Aplica heroAssets (fondo)                    │
│        └─ Renderiza Dialog (children)                  │
│           └─ Dialog (Client Component)                 │
│              ├─ DialogOverlay (backdrop blur)          │
│              ├─ DialogContent (contenedor)             │
│              │  └─ Contenido legal (13 secciones)      │
│              └─ DialogClose (botón X)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Resumen de Cambios por Página

### Terms Page
```diff
+ import { Dialog, DialogContent } from "@qp/ui/components/dialog"
+ const heroAssets = ...
+ heroAssets={heroAssets}
+ <Dialog open>
+   <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      {/* Contenido */}
+   </DialogContent>
+ </Dialog>
```

### Privacy Page
```diff
+ import { Dialog, DialogContent } from "@qp/ui/components/dialog"
+ const heroAssets = ...
+ heroAssets={heroAssets}
+ <Dialog open>
+   <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      {/* Contenido */}
+   </DialogContent>
+ </Dialog>
```

### Cookies Page
```diff
+ import { Dialog, DialogContent } from "@qp/ui/components/dialog"
+ const heroAssets = ...
+ heroAssets={heroAssets}
+ <Dialog open>
+   <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      {/* Contenido */}
+   </DialogContent>
+ </Dialog>
```

---

## ✨ Conclusión

El Dialog wrapper proporciona:
- ✅ Solución elegante al problema de overflow
- ✅ Experiencia de usuario mejorada
- ✅ Diseño profesional y moderno
- ✅ Scroll controlado y suave
- ✅ Responsive en todos los dispositivos
- ✅ Accesibilidad garantizada (Radix UI)

**Estado:** ✅ Implementado y listo para producción
