# 🍔 Guía del Menú Hamburguesa Dinámico

## Características Principales

El nuevo `SiteHeader` ha sido completamente refactorizado con un diseño moderno y sorprendente que incluye:

### ✨ Características de Diseño

1. **Botón Flotante Animado**
   - Gradiente animado con efecto pulse
   - Efecto de escala en hover y active
   - Transición suave entre iconos (Menu ↔ X)
   - Anillo de pulso cuando está cerrado

2. **Overlay con Backdrop Blur**
   - Fondo oscuro semitransparente
   - Efecto de desenfoque (backdrop-blur)
   - Click fuera del menú para cerrar

3. **Panel Deslizante con Glassmorphism**
   - Animación de deslizamiento suave (500ms)
   - Fondo con efecto de vidrio (glassmorphism)
   - Gradientes decorativos animados
   - Scroll vertical automático

4. **Secciones Organizadas**
   - **Navegación**: Links principales con iconos
   - **Tema**: Selector visual (Light/Dark/System)
   - **Idioma**: Integración con LocaleSwitcher
   - **Footer**: Información de copyright

### 🎨 Efectos Visuales

- **Gradientes dinámicos** usando colores de marca (primary/accent)
- **Animaciones suaves** en todos los elementos interactivos
- **Hover effects** con translate y scale
- **Iconos de Lucide** para mejor UX
- **Separadores decorativos** con gradientes

### 🎯 Posicionamiento Dinámico

El menú puede posicionarse en cualquier esquina de la pantalla:

```tsx
// Top Right (default)
<SiteHeader 
  position="top-right"
  brandName="Mi Marca"
  logoUrl="/logo.png"
/>

// Top Left
<SiteHeader 
  position="top-left"
  brandName="Mi Marca"
  logoUrl="/logo.png"
/>

// Bottom Right
<SiteHeader position="bottom-right" />

// Bottom Left
<SiteHeader position="bottom-left" />
```

### 🎨 Logo de Marca

El menú muestra el logo de la marca en la parte superior:
- Si `logoUrl` está disponible, muestra el logo en un contenedor elegante con hover effects
- Si no hay logo, muestra el nombre de la marca con un icono de Sparkles
- El logo es clickeable y redirige al home
- Usa Next.js Image para optimización automática

### ⌨️ Accesibilidad

- **Escape key**: Cierra el menú
- **Click outside**: Cierra el menú
- **Body scroll lock**: Previene scroll cuando el menú está abierto
- **ARIA labels**: Para lectores de pantalla
- **Keyboard navigation**: Totalmente navegable con teclado

## 📋 Uso en Layout

Para usar el nuevo menú en tu layout:

```tsx
import { SiteHeader } from "../components/site-header";
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";

export default async function Layout({ children }: { children: ReactNode }) {
  // Resolver marca desde el host
  const { headers } = await import("next/headers");
  const headersList = await headers();
  let host = headersList.get("host") || "localhost";
  if (host.includes(":")) {
    host = host.split(":")[0];
  }
  const { brand } = await resolveTenantAndBrandFromHost(host);

  return (
    <html>
      <body>
        {/* Menú hamburguesa flotante con logo de marca */}
        <SiteHeader 
          position="top-right"
          brandName={brand?.name || "Quinielas"}
          logoUrl={brand?.logoUrl}
        />
        
        {/* Contenido principal */}
        <main>{children}</main>
      </body>
    </html>
  );
}
```

## 🎨 Personalización

### Cambiar Posición

Simplemente pasa la prop `position`:

```tsx
<SiteHeader position="bottom-left" />
```

### Agregar Nuevos Links de Navegación

Edita el array `navItems` en el componente:

```tsx
const navItems = [
  { href: "/", label: t("home"), icon: Home },
  { href: "/pools", label: t("pools"), icon: Trophy },
  { href: "/register", label: t("register"), icon: UserPlus },
  // Agrega más aquí
  { href: "/about", label: "Acerca de", icon: Info },
];
```

### Personalizar Colores

El menú usa las variables CSS de tu tema:
- `--primary`: Color principal
- `--accent`: Color de acento
- `--background`: Fondo
- `--foreground`: Texto
- `--border`: Bordes

## 🔧 Dependencias

El componente requiere:

- ✅ `next-themes` - Para el selector de tema
- ✅ `lucide-react` - Para los iconos
- ✅ `next-intl` - Para traducciones
- ✅ `LocaleSwitcher` - Componente de cambio de idioma

## 📱 Responsive

El menú está completamente optimizado para:
- 📱 Mobile (ancho completo en pantallas pequeñas)
- 💻 Tablet (max-width: 28rem)
- 🖥️ Desktop (max-width: 28rem)

## 🎭 Animaciones

Todas las animaciones usan:
- `duration-500` para transiciones principales
- `duration-300` para hover effects
- `ease-out` para suavidad
- `transform` para mejor performance

## 🚀 Performance

- **CSS Transforms**: Uso de translate para animaciones GPU-accelerated
- **Conditional Rendering**: Elementos solo se renderizan cuando son necesarios
- **Lazy Effects**: Efectos visuales se cargan solo cuando el menú está abierto
- **Optimized Re-renders**: useState y useEffect optimizados

## 💡 Tips de Diseño

1. El botón flotante siempre está visible (z-index: 60)
2. El overlay tiene z-index: 50
3. El panel deslizante tiene z-index: 50
4. Los gradientes usan los colores de tu marca automáticamente
5. El tema se sincroniza con el sistema del usuario

## 🎉 Resultado Final

Un menú hamburguesa moderno, elegante y funcional que:
- ✨ Se ve increíble en cualquier tema
- 🎨 Usa los colores de tu marca
- 📱 Funciona perfectamente en móvil
- ⚡ Tiene animaciones suaves y fluidas
- 🎯 Es completamente personalizable
- ♿ Es accesible para todos

¡Disfruta tu nuevo menú hamburguesa! 🍔✨
