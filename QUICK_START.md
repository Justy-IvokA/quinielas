# 🚀 Quick Start Guide - Quinielas WL

## Instalación Rápida

```bash
# 1. Instalar dependencias
pnpm install

# 2. Generar Prisma client
pnpm db:generate

# 3. Iniciar desarrollo
pnpm dev
```

Visita:
- **Web App:** http://localhost:3000
- **Admin Panel:** http://localhost:3001

---

## 🎨 Usar Componentes UI

### Importar

```tsx
import {
  Button,
  Card,
  Input,
  Badge,
  Avatar,
  Dialog,
  Select,
  Alert,
  toastSuccess
} from "@qp/ui";
```

### Ejemplos Rápidos

**Button:**
```tsx
<Button StartIcon={Plus}>Crear</Button>
<Button variant="secondary" loading>Guardando...</Button>
<Button variant="destructive">Eliminar</Button>
```

**Card:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>Contenido</CardContent>
  <CardFooter>
    <Button>Acción</Button>
  </CardFooter>
</Card>
```

**Toast:**
```tsx
toastSuccess("¡Éxito!");
toastError("Error al guardar");
toastPromise(apiCall(), {
  loading: "Guardando...",
  success: "¡Guardado!",
  error: "Error"
});
```

---

## 🎭 Theming

### Toggle de Tema

```tsx
import { ThemeToggle } from "@qp/ui";

<ThemeToggle />
```

### Usar Hook

```tsx
import { useTheme } from "@qp/ui";

const { theme, setTheme } = useTheme();

setTheme("dark");  // "light" | "dark" | "system"
```

---

## 📝 Comandos Útiles

### Desarrollo

```bash
pnpm dev              # Iniciar todos los apps
pnpm build            # Build producción
pnpm lint             # Linter
pnpm typecheck        # Type checking
pnpm test             # Tests
```

### Database

```bash
pnpm db:generate      # Generar Prisma client
pnpm db:push          # Push schema a DB
pnpm db:migrate       # Crear migración
pnpm seed             # Seed data
```

### Por Workspace

```bash
pnpm --filter @qp/web dev
pnpm --filter @qp/admin build
pnpm --filter @qp/ui test
```

---

## 📁 Estructura

```
quinielas/
├── apps/
│   ├── web/          # App pública
│   ├── admin/        # Panel admin
│   └── worker/       # Background jobs
├── packages/
│   ├── ui/           # 17 componentes UI
│   ├── branding/     # Theming system
│   ├── db/           # Prisma + models
│   ├── api/          # tRPC routers
│   ├── auth/         # Auth.js
│   └── config/       # Shared config
└── docs/
    ├── THEMING_AND_TOAST.md
    ├── UI_COMPONENTS.md
    ├── LAYOUT_ENHANCEMENTS.md
    └── IMPLEMENTATION_SUMMARY.md
```

---

## 🎯 Componentes Disponibles

| Componente | Import | Uso |
|------------|--------|-----|
| Button | `import { Button } from "@qp/ui"` | Botones con variantes |
| Badge | `import { Badge } from "@qp/ui"` | Etiquetas de estado |
| Avatar | `import { Avatar } from "@qp/ui"` | Avatares de usuario |
| Card | `import { Card, ... } from "@qp/ui"` | Contenedores |
| Input | `import { Input } from "@qp/ui"` | Campos de texto |
| Select | `import { Select, ... } from "@qp/ui"` | Dropdowns |
| Dialog | `import { Dialog, ... } from "@qp/ui"` | Modales |
| Alert | `import { Alert, ... } from "@qp/ui"` | Alertas |
| Table | `import { Table, ... } from "@qp/ui"` | Tablas |
| EmptyState | `import { EmptyState } from "@qp/ui"` | Estados vacíos |

[Ver todos los componentes →](./UI_COMPONENTS.md)

---

## 🔧 Configuración

### Tailwind

Ya configurado en `packages/ui/src/tailwind/preset.ts`:
- Dark mode: class
- CSS variables
- Animaciones
- Tokens de diseño

### TypeScript

Strict mode activado:
- Type checking completo
- Path aliases (`@qp/*`)
- Monorepo support

### ESLint & Prettier

Configuración compartida en `packages/config`:
- ESLint rules
- Prettier config
- Import sorting

---

## 🎨 Tokens de Diseño

### Colores

```css
--background
--foreground
--primary
--secondary
--accent
--muted
--destructive
--border
--ring
```

### Uso en Tailwind

```tsx
<div className="bg-background text-foreground">
  <h1 className="text-primary">Título</h1>
  <p className="text-muted-foreground">Descripción</p>
</div>
```

---

## 📱 Responsive

Breakpoints de Tailwind:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</div>
```

---

## 🌙 Dark Mode

Automático en todos los componentes:

```tsx
// Light mode
<div className="bg-white text-black">

// Dark mode (automático)
<div className="dark:bg-gray-900 dark:text-white">
```

---

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Específico
pnpm --filter @qp/ui test
pnpm --filter @qp/branding test

# Watch mode
pnpm test --watch
```

---

## 📚 Documentación

- **[THEMING_AND_TOAST.md](./THEMING_AND_TOAST.md)** - Sistema de temas y toasts
- **[UI_COMPONENTS.md](./UI_COMPONENTS.md)** - Guía de componentes
- **[LAYOUT_ENHANCEMENTS.md](./LAYOUT_ENHANCEMENTS.md)** - Mejoras de layout
- **[MIGRATION_STEPS.md](./MIGRATION_STEPS.md)** - Pasos de migración
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Resumen completo

---

## 🆘 Troubleshooting

### Error: Module not found

```bash
pnpm install
pnpm build
```

### Error: Prisma client

```bash
pnpm db:generate
```

### Error: Type errors

```bash
pnpm typecheck
```

### Error: Dark mode no funciona

Verificar:
1. `suppressHydrationWarning` en `<html>`
2. `ThemeProvider` en layout
3. `darkMode: "class"` en Tailwind config

---

## 🎉 ¡Listo!

Ya tienes todo configurado. Comienza a desarrollar:

```tsx
// apps/web/app/page.tsx
import { Button, Card, Badge } from "@qp/ui";

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Primera Quiniela</CardTitle>
        <Badge variant="success">Activo</Badge>
      </CardHeader>
      <CardContent>
        <Button>Unirse Ahora</Button>
      </CardContent>
    </Card>
  );
}
```

**Happy coding! 🚀**
