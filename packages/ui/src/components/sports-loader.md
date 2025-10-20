# Sports Loader Component

Componente de loader animado con tema deportivo (balón de fútbol) para usar en toda la aplicación.

## Componentes Disponibles

### 1. SportsLoader
Loader básico con balón de fútbol animado.

```tsx
import { SportsLoader } from "@qp/ui";

<SportsLoader 
  size="md"           // "sm" | "md" | "lg" | "xl"
  text="Cargando"     // Texto opcional
  className="my-4"    // Clases adicionales
/>
```

### 2. FullPageLoader
Loader de pantalla completa con overlay.

```tsx
import { FullPageLoader } from "@qp/ui";

<FullPageLoader 
  text="Cargando datos" 
  size="lg" 
/>
```

### 3. InlineLoader
Loader pequeño para usar inline (ej: dentro de botones).

```tsx
import { InlineLoader } from "@qp/ui";

<Button disabled>
  <InlineLoader className="mr-2" />
  Guardando...
</Button>
```

## Ejemplos de Uso

### En una Página con Estado de Carga

```tsx
"use client";

import { SportsLoader } from "@qp/ui";

export default function MyPage() {
  const { data, isLoading } = useQuery();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <SportsLoader size="lg" text="Cargando datos" />
      </div>
    );
  }

  return <div>{/* contenido */}</div>;
}
```

### En un Modal/Dialog

```tsx
import { Dialog, DialogContent, SportsLoader } from "@qp/ui";

<Dialog open={isProcessing}>
  <DialogContent>
    <SportsLoader size="md" text="Procesando..." />
  </DialogContent>
</Dialog>
```

### En un Botón

```tsx
import { Button, InlineLoader } from "@qp/ui";

<Button disabled={isSubmitting}>
  {isSubmitting && <InlineLoader className="mr-2" />}
  {isSubmitting ? "Guardando..." : "Guardar"}
</Button>
```

### Pantalla Completa

```tsx
import { FullPageLoader } from "@qp/ui";

// En un loading.tsx de Next.js
export default function Loading() {
  return <FullPageLoader text="Cargando página" size="xl" />;
}
```

### Con Suspense

```tsx
import { Suspense } from "react";
import { SportsLoader } from "@qp/ui";

<Suspense fallback={<SportsLoader size="lg" text="Cargando componente" />}>
  <MyAsyncComponent />
</Suspense>
```

## Tamaños

| Size | Dimensiones | Uso Recomendado |
|------|-------------|-----------------|
| `sm` | 48px | Inline, cards pequeñas |
| `md` | 64px | Cards, modales pequeños |
| `lg` | 96px | Páginas, secciones principales |
| `xl` | 128px | Pantalla completa, splash screens |

## Características

- ✅ Animación de balón de fútbol rebotando
- ✅ Líneas de campo rotando
- ✅ Partículas orbitando
- ✅ Efecto de brillo en el balón
- ✅ Texto con puntos animados
- ✅ Totalmente responsive
- ✅ Soporta tema claro/oscuro
- ✅ Colores dinámicos del theme

## Animaciones Incluidas

1. **Bounce**: Balón rebotando verticalmente
2. **Spin**: Líneas de campo rotando
3. **Orbit**: Partículas orbitando alrededor
4. **Pulse**: Efecto de brillo pulsante
5. **Dots**: Puntos del texto animados

## Personalización

Puedes personalizar los colores usando las variables CSS del theme:

- `primary`: Color de las partículas principales
- `accent`: Color de las partículas secundarias
- `secondary`: Color de las partículas terciarias
- `foreground`: Color del texto y líneas

## Reemplazar Loaders Antiguos

### Antes (Loader2 de Lucide)
```tsx
import { Loader2 } from "lucide-react";

<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
```

### Después (SportsLoader)
```tsx
import { SportsLoader } from "@qp/ui";

<SportsLoader size="md" text="Cargando" />
```

## Performance

- Usa CSS animations (GPU accelerated)
- No requiere JavaScript para animar
- Lightweight (~2KB gzipped)
- No dependencies externas
