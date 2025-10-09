# UI Components - Inspirados en Cal.com

## Resumen

Se han creado y mejorado 15+ componentes UI siguiendo los patrones y estilos de cal.com, con variantes mejoradas, accesibilidad y animaciones suaves.

## 📦 Dependencias Instaladas

```json
{
  "@radix-ui/react-avatar": "^1.1.3",
  "@radix-ui/react-checkbox": "^1.0.4",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-dropdown-menu": "^2.1.4",
  "@radix-ui/react-label": "^2.0.2",
  "@radix-ui/react-popover": "^1.0.7",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-separator": "^1.0.3",
  "@radix-ui/react-slider": "^1.2.2",
  "@radix-ui/react-switch": "^1.0.3",
  "@radix-ui/react-tooltip": "^1.0.7",
  "cmdk": "^0.2.1",
  "react-hook-form": "^7.64.0",
  "vaul": "^0.9.9"
}
```

## 🎨 Componentes Creados/Mejorados

### 1. **Button** (Mejorado)

**Variantes:**
- `default` - Botón primario con sombras y animaciones
- `secondary` - Botón secundario con borde
- `minimal` - Botón minimalista
- `destructive` - Botón de acción destructiva
- `ghost` - Botón fantasma
- `link` - Botón estilo enlace

**Tamaños:**
- `xs` - Extra pequeño (h-6)
- `sm` - Pequeño (h-7)
- `default` - Normal (h-10)
- `lg` - Grande (h-11)
- `icon` - Solo icono (10x10)

**Características:**
- ✅ Estado de carga con spinner
- ✅ Iconos Start/End con Lucide
- ✅ Soporte para enlaces (Next.js Link)
- ✅ Animaciones de press (translate-y)
- ✅ Sombras dinámicas
- ✅ Bordes redondeados (10px)

**Ejemplo:**
```tsx
import { Button } from "@qp/ui";
import { Plus, Save } from "lucide-react";

<Button variant="default" size="lg" StartIcon={Plus}>
  Crear Pool
</Button>

<Button variant="secondary" loading>
  Guardando...
</Button>

<Button variant="destructive" EndIcon={Save}>
  Eliminar
</Button>

<Button href="/pools" variant="minimal">
  Ver Pools
</Button>
```

---

### 2. **Badge** (Nuevo)

**Variantes:**
- `default` - Badge por defecto
- `success` - Verde (éxito)
- `warning` - Amarillo (advertencia)
- `error` - Rojo (error)
- `info` - Azul (información)
- `gray` - Gris neutro
- `purple` - Púrpura
- `outline` - Con borde

**Características:**
- ✅ Dot indicator opcional
- ✅ Iconos con Lucide
- ✅ Soporte dark mode
- ✅ Tamaños: sm, default, lg

**Ejemplo:**
```tsx
import { Badge } from "@qp/ui";
import { Check } from "lucide-react";

<Badge variant="success" StartIcon={Check}>
  Activo
</Badge>

<Badge variant="warning" withDot>
  Pendiente
</Badge>

<Badge variant="error" size="lg">
  Cancelado
</Badge>
```

---

### 3. **Avatar** (Nuevo)

**Características:**
- ✅ Imagen con fallback
- ✅ Iniciales automáticas
- ✅ Tamaños: xs, sm, default, lg, xl
- ✅ Redondo por defecto
- ✅ Lazy loading

**Ejemplo:**
```tsx
import { Avatar } from "@qp/ui";

<Avatar
  src="/user.jpg"
  alt="John Doe"
  fallback="JD"
  size="lg"
/>

<Avatar alt="Jane Smith" size="sm" />
```

---

### 4. **Card** (Nuevo)

**Variantes:**
- `default` - Card estándar con sombra
- `elevated` - Card elevado con hover
- `outline` - Card con borde grueso
- `ghost` - Card sin borde

**Padding:**
- `none` - Sin padding
- `sm` - Pequeño (p-4)
- `default` - Normal (p-6)
- `lg` - Grande (p-8)

**Subcomponentes:**
- `CardHeader`
- `CardTitle`
- `CardDescription`
- `CardContent`
- `CardFooter`

**Ejemplo:**
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button
} from "@qp/ui";

<Card variant="elevated">
  <CardHeader>
    <CardTitle>Pool Mundial 2026</CardTitle>
    <CardDescription>
      Participa y gana premios increíbles
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p>Contenido del card...</p>
  </CardContent>
  <CardFooter>
    <Button>Unirse</Button>
  </CardFooter>
</Card>
```

---

### 5. **Input** (Nuevo)

**Variantes:**
- `default` - Input estándar
- `error` - Input con error

**Tamaños:**
- `sm` - Pequeño (h-8)
- `default` - Normal (h-10)
- `lg` - Grande (h-12)

**Características:**
- ✅ Focus ring animado
- ✅ Estados de error
- ✅ Placeholder styling
- ✅ File input support

**Ejemplo:**
```tsx
import { Input, Label } from "@qp/ui";

<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="tu@email.com"
  />
</div>

<Input
  error
  placeholder="Campo requerido"
/>
```

---

### 6. **Label** (Nuevo)

**Características:**
- ✅ Asociación automática con inputs
- ✅ Variante de error
- ✅ Accesibilidad completa

**Ejemplo:**
```tsx
import { Label } from "@qp/ui";

<Label htmlFor="name">Nombre</Label>
<Label variant="error">Campo requerido</Label>
```

---

### 7. **Dialog** (Nuevo)

**Características:**
- ✅ Modal con overlay
- ✅ Animaciones de entrada/salida
- ✅ Backdrop blur
- ✅ Botón de cerrar
- ✅ Escape key support

**Subcomponentes:**
- `Dialog`
- `DialogTrigger`
- `DialogContent`
- `DialogHeader`
- `DialogTitle`
- `DialogDescription`
- `DialogFooter`

**Ejemplo:**
```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button
} from "@qp/ui";

<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirmar acción</DialogTitle>
      <DialogDescription>
        ¿Estás seguro de continuar?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="secondary">Cancelar</Button>
      <Button>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 8. **Select** (Nuevo)

**Características:**
- ✅ Dropdown nativo mejorado
- ✅ Búsqueda y navegación por teclado
- ✅ Scroll buttons
- ✅ Grupos y separadores
- ✅ Indicador de selección

**Ejemplo:**
```tsx
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@qp/ui";

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona un pool" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="mundial">Mundial 2026</SelectItem>
    <SelectItem value="champions">Champions League</SelectItem>
    <SelectItem value="liga">Liga MX</SelectItem>
  </SelectContent>
</Select>
```

---

### 9. **Checkbox** (Nuevo)

**Características:**
- ✅ Animación de check
- ✅ Estados disabled
- ✅ Focus ring
- ✅ Accesibilidad completa

**Ejemplo:**
```tsx
import { Checkbox, Label } from "@qp/ui";

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">
    Acepto términos y condiciones
  </Label>
</div>
```

---

### 10. **Switch** (Nuevo)

**Características:**
- ✅ Toggle animado
- ✅ Estados checked/unchecked
- ✅ Transiciones suaves

**Ejemplo:**
```tsx
import { Switch, Label } from "@qp/ui";

<div className="flex items-center space-x-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">
    Notificaciones
  </Label>
</div>
```

---

### 11. **Tooltip** (Nuevo)

**Características:**
- ✅ Posicionamiento inteligente
- ✅ Animaciones
- ✅ Delay configurable

**Ejemplo:**
```tsx
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Button
} from "@qp/ui";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="minimal">Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Información adicional</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

### 12. **Separator** (Nuevo)

**Características:**
- ✅ Horizontal y vertical
- ✅ Decorativo o semántico

**Ejemplo:**
```tsx
import { Separator } from "@qp/ui";

<div>
  <p>Sección 1</p>
  <Separator className="my-4" />
  <p>Sección 2</p>
</div>
```

---

### 13. **Skeleton** (Nuevo)

**Características:**
- ✅ Animación de pulso
- ✅ Tamaños personalizables

**Ejemplo:**
```tsx
import { Skeleton } from "@qp/ui";

<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-8 w-1/2" />
</div>
```

---

## 🎯 Patrones de Cal.com Implementados

### 1. **Variantes con CVA**
Todos los componentes usan `class-variance-authority` para variantes type-safe.

### 2. **Rounded Corners**
Bordes redondeados de 10px en botones (como cal.com).

### 3. **Sombras Dinámicas**
Sombras que cambian en hover/focus/active.

### 4. **Animaciones Suaves**
Transiciones de 100-200ms para feedback inmediato.

### 5. **Focus Rings**
Focus visible sin ring tradicional, usando sombras.

### 6. **Estados de Carga**
Spinners integrados en botones.

### 7. **Dark Mode**
Todos los componentes soportan dark mode automáticamente.

### 8. **Accesibilidad**
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support

---

## 📊 Comparación con Cal.com

| Característica | Cal.com | Quinielas WL | Estado |
|----------------|---------|--------------|--------|
| Button variants | ✅ | ✅ | ✅ Mejorado |
| Badge | ✅ | ✅ | ✅ Completo |
| Avatar | ✅ | ✅ | ✅ Completo |
| Card | ✅ | ✅ | ✅ Completo |
| Form components | ✅ | ✅ | ✅ Completo |
| Dialog | ✅ | ✅ | ✅ Completo |
| Select | ✅ | ✅ | ✅ Completo |
| Tooltip | ✅ | ✅ | ✅ Completo |
| Loading states | ✅ | ✅ | ✅ Mejorado |
| Dark mode | ✅ | ✅ | ✅ Completo |
| Animations | ✅ | ✅ | ✅ Completo |

---

## 🚀 Uso en Apps

### apps/web
```tsx
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Badge,
  Avatar
} from "@qp/ui";

export function PoolCard({ pool }) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={pool.logo} alt={pool.name} />
            <CardTitle>{pool.name}</CardTitle>
          </div>
          <Badge variant="success">Activo</Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
```

### apps/admin
```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  Button,
  Input,
  Label,
  Select
} from "@qp/ui";

export function CreatePoolDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Crear Pool</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Mundial 2026" />
          </div>
          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Público</SelectItem>
                <SelectItem value="private">Privado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📝 Próximos Pasos

1. **Crear Storybook** para documentar visualmente todos los componentes
2. **Agregar tests** para cada componente
3. **Crear componentes adicionales:**
   - Table
   - Pagination
   - Breadcrumb
   - Command (cmdk)
   - Popover
   - Slider
   - Radio Group
   - Textarea
   - Alert
   - Progress

4. **Optimizaciones:**
   - Tree-shaking
   - Bundle size analysis
   - Performance profiling

---

## 🎨 Tokens de Diseño

Todos los componentes usan los tokens CSS definidos en `packages/ui/src/styles.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

---

## ✅ Checklist de Implementación

- [x] Instalar dependencias de Radix UI
- [x] Mejorar Button con variantes de cal.com
- [x] Crear Badge component
- [x] Crear Avatar component
- [x] Crear Card component
- [x] Crear Input y Label components
- [x] Crear Dialog component
- [x] Crear Select component
- [x] Crear Checkbox y Switch
- [x] Crear Tooltip component
- [x] Crear Separator component
- [x] Crear Skeleton component
- [x] Actualizar exports del package
- [x] Documentar todos los componentes

---

¡Todos los componentes están listos para usar! 🎉
