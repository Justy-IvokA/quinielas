# Guía de Colores del Branding

## Problema Resuelto

Los colores del branding ahora se aplican correctamente tanto en **modo claro** como en **modo oscuro**. El sistema convierte automáticamente colores HEX a formato HSL que requiere Tailwind CSS.

## Estructura del Theme en la Base de Datos

El campo `theme` en la tabla `Brand` debe tener esta estructura JSON:

```json
{
  "colors": {
    "primary": "#0062FF",
    "secondary": "#FE7734",
    "accent": "#FF6B9D",
    "background": "#FFFEF7",
    "foreground": "#1E1F1C"
  },
  "heroAssets": {
    "video": false,
    "assetUrl": "https://...",
    "fallbackImageUrl": "https://..."
  },
  "typography": {
    "fontFamily": "Manrope, ui-sans-serif, system-ui"
  }
}
```

### Colores Soportados

| Color | Descripción | Ejemplo | Uso |
|-------|-------------|---------|-----|
| `primary` | Color principal de la marca | `#0062FF` | Botones principales, títulos, gradientes |
| `secondary` | Color secundario | `#FE7734` | Badges, elementos secundarios |
| `accent` | Color de acento | `#FF6B9D` | Highlights, hover states |
| `background` | Fondo principal | `#FFFEF7` | Fondo de la página (solo modo claro) |
| `foreground` | Color de texto | `#1E1F1C` | Texto principal (solo modo claro) |

**Nota**: Los colores `background` y `foreground` solo se usan en modo claro. En modo oscuro se usan valores predeterminados para mejor legibilidad.

## Cómo Actualizar los Colores de un Tenant

### Opción 1: Usando Prisma Studio

```bash
pnpm db:studio
```

1. Abre la tabla `Brand`
2. Encuentra el brand del tenant
3. Edita el campo `theme` (JSON)
4. Agrega o modifica los colores en formato HEX

### Opción 2: Usando SQL

```sql
UPDATE "Brand"
SET "theme" = jsonb_set(
  COALESCE("theme", '{}'::jsonb),
  '{colors}',
  '{
    "primary": "#0062FF",
    "secondary": "#FE7734",
    "accent": "#FF6B9D",
    "background": "#FFFEF7",
    "foreground": "#1E1F1C"
  }'::jsonb
)
WHERE "slug" = 'ivoka';
```

### Opción 3: Script de migración

Crear un script en `scripts/update-brand-colors.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateBrandColors() {
  await prisma.brand.update({
    where: { slug: "ivoka" },
    data: {
      theme: {
        colors: {
          primary: "#0062FF",
          secondary: "#FE7734",
          accent: "#FF6B9D",
          background: "#FFFEF7",
          foreground: "#1E1F1C"
        },
        heroAssets: {
          video: false,
          assetUrl: "https://...",
          fallbackImageUrl: "https://..."
        },
        typography: {
          fontFamily: "Manrope, ui-sans-serif, system-ui"
        }
      }
    }
  });
  
  console.log("✅ Brand colors updated successfully");
}

updateBrandColors()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Conversión Automática HEX → HSL

El sistema convierte automáticamente:

- `#0062FF` → `217 100% 50%` (Azul brillante)
- `#FE7734` → `20 99% 60%` (Naranja)
- `#FF6B9D` → `340 100% 71%` (Rosa)
- `#FFFEF7` → `53 100% 98%` (Crema claro)
- `#1E1F1C` → `80 5% 12%` (Negro verdoso)

## Clases de Tailwind Disponibles

Una vez configurados los colores, puedes usar estas clases en tus componentes:

### Backgrounds
- `bg-primary` - Fondo con color primario
- `bg-secondary` - Fondo con color secundario
- `bg-accent` - Fondo con color de acento

### Text
- `text-primary` - Texto con color primario
- `text-secondary` - Texto con color secundario
- `text-accent` - Texto con color de acento

### Borders
- `border-primary` - Borde con color primario
- `border-secondary` - Borde con color secundario
- `border-accent` - Borde con color de acento

### Gradients
- `from-primary to-accent` - Gradiente de primario a acento
- `from-secondary to-primary` - Gradiente de secundario a primario

### Opacidad
- `bg-primary/50` - Primario con 50% opacidad
- `text-accent/80` - Acento con 80% opacidad

## Modo Oscuro

Los colores de marca (`primary`, `secondary`, `accent`) se mantienen en modo oscuro para consistencia de marca. Solo `background` y `foreground` cambian automáticamente para mejor legibilidad:

- **Modo claro**: Usa los colores de la BD
- **Modo oscuro**: 
  - `background` → `240 10% 3.9%` (Negro azulado)
  - `foreground` → `0 0% 98%` (Blanco)
  - `primary`, `secondary`, `accent` → Se mantienen

## Verificación

Después de actualizar los colores:

1. **Reinicia el servidor**: `pnpm dev`
2. **Limpia el cache del navegador**: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)
3. **Verifica en DevTools**:
   - Abre la consola del navegador
   - Busca: `✅ Client: Brand theme injected successfully`
   - Busca: `🎨 CSS includes dark mode: true`
4. **Inspecciona el `<head>`**:
   - Debe haber un `<style id="brand-theme-dynamic">` con las variables CSS
5. **Prueba el modo oscuro**:
   - Cambia entre modo claro/oscuro
   - Los colores de marca deben mantenerse

## Troubleshooting

### Los colores no se aplican
- Verifica que el campo `theme.colors` existe en la BD
- Revisa la consola del navegador para errores
- Asegúrate de que el host resuelve correctamente al tenant

### Los colores se ven diferentes en modo oscuro
- Es normal que `background` y `foreground` cambien
- Los colores de marca (`primary`, `secondary`, `accent`) deben mantenerse

### El CSS no se inyecta
- Verifica que `BrandThemeInjector` está en `page.tsx`
- Revisa que `brand?.theme` no sea null
- Checa los logs en la consola del navegador
