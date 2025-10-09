# Correcciones de Tailwind CSS y Modo Claro/Oscuro

## Problemas Identificados

1. **Falta configuración de `darkMode` en `apps/web/tailwind.config.ts`**
   - El archivo no especificaba `darkMode: "class"`, necesario para `next-themes`

2. **Archivos PostCSS duplicados**
   - Existían `postcss.config.js` y `postcss.config.cjs` en `apps/web`

3. **Falta configuración de Next.js**
   - No existía `next.config.js` con `transpilePackages` para los paquetes del monorepo

4. **ThemeProvider sin storageKey**
   - El provider no tenía una clave de almacenamiento específica

5. **Sin componente visible para probar el tema**
   - No había un toggle de tema en la UI para verificar el funcionamiento

## Correcciones Aplicadas

### 1. Actualizado `apps/web/tailwind.config.ts`
```typescript
const config: Config = {
  darkMode: "class", // ✅ Agregado
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  presets: [preset]
};
```

### 2. Eliminado archivo duplicado
- ❌ Eliminado `apps/web/postcss.config.cjs`
- ✅ Mantenido `apps/web/postcss.config.js`

### 3. Creado `apps/web/next.config.js`
```javascript
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@qp/ui", "@qp/api", "@qp/branding", "@qp/utils"],
  experimental: {
    optimizePackageImports: ["@qp/ui", "lucide-react"],
  },
};
```

### 4. Actualizado `packages/ui/src/providers/theme-provider.tsx`
```typescript
<NextThemesProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
  storageKey="qp-theme" // ✅ Agregado
  {...props}
>
```

### 5. Mejorado `apps/web/app/globals.css`
```css
@import "@qp/ui/styles";

/* Ensure proper CSS variable application */
@layer base {
  html {
    @apply antialiased;
  }
}
```

### 6. Creado componente `SiteHeader`
- Nuevo archivo: `apps/web/app/components/site-header.tsx`
- Incluye navegación y `ThemeToggle`
- Agregado al layout principal

## Verificación

Para verificar que todo funciona correctamente:

1. **Reiniciar el servidor de desarrollo:**
   ```bash
   pnpm --filter @qp/web dev
   ```

2. **Verificar en el navegador:**
   - Abrir http://localhost:3000
   - Usar el toggle de tema en el header
   - Verificar que los colores cambien entre modo claro y oscuro
   - Inspeccionar el elemento `<html>` para ver la clase `dark` aplicándose

3. **Verificar variables CSS:**
   - Abrir DevTools → Elements → Computed
   - Buscar variables como `--background`, `--foreground`, etc.
   - Deben cambiar al alternar el tema

## Estructura de Colores

### Modo Claro
- Background: `hsl(0 0% 100%)` - Blanco
- Foreground: `hsl(222.2 84% 4.9%)` - Negro azulado
- Primary: `hsl(262 83% 58%)` - Púrpura vibrante

### Modo Oscuro
- Background: `hsl(240 10% 3.9%)` - Negro profundo
- Foreground: `hsl(0 0% 98%)` - Blanco
- Primary: `hsl(263 70% 60%)` - Púrpura ajustado

## Animaciones

Las animaciones están configuradas en:
- `packages/ui/src/tailwind/preset.ts` - Keyframes y animations
- `packages/ui/src/styles.css` - Custom animations
- Plugin `tailwindcss-animate` instalado

### Animaciones disponibles:
- `accordion-down` / `accordion-up`
- `gradient-shift` (custom)
- Transiciones suaves en componentes

## Troubleshooting

Si los estilos no se aplican:

1. **Limpiar cache:**
   ```bash
   rm -rf apps/web/.next
   rm -rf .turbo
   ```

2. **Verificar que Tailwind esté procesando los archivos:**
   - Los paths en `content` deben coincidir con la estructura
   - El preset debe estar correctamente importado

3. **Verificar que el CSS se importe correctamente:**
   - `app/layout.tsx` debe importar `./globals.css`
   - `globals.css` debe importar `@qp/ui/styles`

4. **Verificar que next-themes funcione:**
   - El `<html>` debe tener `suppressHydrationWarning`
   - El `ThemeProvider` debe envolver toda la app
   - El atributo debe ser `"class"` no `"data-theme"`

## Próximos Pasos

- [ ] Probar todos los componentes en ambos temas
- [ ] Verificar contraste de colores (accesibilidad)
- [ ] Agregar más variantes de color si es necesario
- [ ] Documentar paleta de colores personalizada por tenant
