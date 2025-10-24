# Referencia Rápida - Páginas Legales

## Acceso Rápido

### URLs de Prueba
```bash
# Español
http://localhost:3000/es-MX/legal/terms
http://localhost:3000/es-MX/legal/privacy
http://localhost:3000/es-MX/legal/cookies

# Inglés
http://localhost:3000/en-US/legal/terms
http://localhost:3000/en-US/legal/privacy
http://localhost:3000/en-US/legal/cookies
```

---

## Archivos Principales

### Componente Base
```
apps/web/app/[locale]/legal/_components/legal-layout.tsx
├─ Props: title, children, brandLogo, brandName
├─ Features: Logo, BackButton, Responsive, Branding
└─ Reutilizable en todas las páginas legales
```

### Páginas
```
apps/web/app/[locale]/legal/terms/page.tsx
apps/web/app/[locale]/legal/privacy/page.tsx
apps/web/app/[locale]/legal/cookies/page.tsx
```

### Traducciones
```
apps/web/messages/es-MX.json → legal.terms, legal.privacy, legal.cookies
apps/web/messages/en-US.json → legal.terms, legal.privacy, legal.cookies
```

---

## Uso del Componente LegalLayout

### Importar
```typescript
import { LegalLayout } from "../_components/legal-layout";
```

### Usar
```typescript
<LegalLayout
  title={t("title")}
  brandLogo={brandLogo}
  brandName={brandName}
>
  {/* Contenido aquí */}
</LegalLayout>
```

### Props
```typescript
interface LegalLayoutProps {
  title: string;           // Título de la página
  children: ReactNode;     // Contenido
  brandLogo?: any;         // Logo del cliente
  brandName?: string;      // Nombre del brand
}
```

---

## Estructura de Traducciones

### Acceso en Componentes
```typescript
const t = await getTranslations("legal.terms");

// Usar
t("title")                    // "Términos y Condiciones de Servicio"
t("section1.title")          // "1. Introducción"
t("section1.content")        // Contenido completo
t("lastUpdated", { date: new Date().toLocaleDateString() })
```

### Estructura JSON
```json
{
  "legal": {
    "terms": {
      "title": "...",
      "section1": {
        "title": "...",
        "content": "..."
      },
      "section2": {
        "title": "...",
        "item1": "...",
        "item2": "..."
      },
      "lastUpdated": "Última actualización: {date}"
    }
  }
}
```

---

## Personalización

### Cambiar Contenido
1. Editar las páginas en `apps/web/app/[locale]/legal/*/page.tsx`
2. Actualizar traducciones en `apps/web/messages/es-MX.json` y `en-US.json`
3. Mantener la estructura de secciones

### Cambiar Estilos
1. Editar `LegalLayout` en `apps/web/app/[locale]/legal/_components/legal-layout.tsx`
2. Modificar clases Tailwind según sea necesario
3. Probar en móvil y desktop

### Agregar Nuevo Idioma
1. Crear nueva sección en `apps/web/messages/[locale].json`
2. Copiar estructura de es-MX.json
3. Traducir contenido
4. Las páginas funcionarán automáticamente

---

## Características Clave

### ✓ Responsive
- Móviles: 90% ancho
- Desktop: 75% ancho (máx 512px)
- Padding adaptativo

### ✓ Branding
- Logo del cliente automático
- Colores del tenant aplicados
- Nombre del brand en header

### ✓ Navegación
- Botón de retroceso sin fallbackHref
- Usa window.history.length
- Fallback a "/" si no hay historial

### ✓ Multiidioma
- Soporte es-MX y en-US
- Fácil de extender
- Traducciones profesionales

### ✓ Accesibilidad
- Semántica HTML correcta
- Contraste adecuado
- Navegación por teclado

---

## Troubleshooting

### Logo no se muestra
```typescript
// Verificar que brandLogo tenga estructura correcta
const brandLogo = brand?.theme?.logo;
// Debe tener: { url: "..." }
```

### Traducciones no cargan
```typescript
// Verificar que la clave existe en el JSON
const t = await getTranslations("legal.terms");
// Debe existir: messages/es-MX.json → legal.terms
```

### Botón de retroceso no funciona
```typescript
// El BackButton usa window.history.length
// Verificar que no se está usando fallbackHref
<BackButton /> // ✓ Correcto
<BackButton fallbackHref="/" /> // ✗ No usar
```

### Estilos no se aplican
```typescript
// Verificar que BrandThemeInjector está presente
{brand?.theme && <BrandThemeInjector brandTheme={brand.theme} />}
```

---

## Checklist de Implementación

- [x] Componente LegalLayout creado
- [x] Página Terms creada
- [x] Página Privacy creada
- [x] Página Cookies creada
- [x] Traducciones es-MX agregadas
- [x] Traducciones en-US agregadas
- [x] LegalNotice actualizado
- [x] Rutas funcionando
- [x] Branding aplicado
- [x] Responsive verificado

---

## Comandos Útiles

### Verificar estructura
```bash
# Listar archivos creados
find apps/web/app/[locale]/legal -type f

# Verificar traducciones
grep -n "legal" apps/web/messages/es-MX.json
grep -n "legal" apps/web/messages/en-US.json
```

### Desarrollo
```bash
# Iniciar servidor
pnpm dev

# Compilar
pnpm build

# Linting
pnpm lint
```

---

## Notas Importantes

1. **Contenido Legal:** Revisar con abogado antes de producción
2. **Traducciones:** Verificar con hablante nativo si es necesario
3. **Branding:** Asegurar que logo se ve bien en ambos temas (light/dark)
4. **Performance:** Las páginas son server-side, no requieren JavaScript
5. **SEO:** Considerar agregar metadata si es necesario

---

## Extensiones Futuras

### Posibles Mejoras
- [ ] Agregar más idiomas (fr, de, pt)
- [ ] Versión PDF descargable
- [ ] Historial de cambios
- [ ] Aceptación de términos (checkbox)
- [ ] Búsqueda dentro de documentos
- [ ] Tabla de contenidos
- [ ] Anclas a secciones específicas
- [ ] Notificaciones de cambios

### Ejemplo: Agregar Tabla de Contenidos
```typescript
// En el componente LegalLayout
const sections = [
  { id: "intro", title: "1. Introducción" },
  { id: "definitions", title: "2. Definiciones" },
  // ...
];

return (
  <>
    <nav className="mb-6">
      {sections.map(s => (
        <a href={`#${s.id}`} key={s.id}>{s.title}</a>
      ))}
    </nav>
    {/* Contenido con id="intro", id="definitions", etc */}
  </>
);
```

---

## Soporte

### Preguntas Frecuentes

**P: ¿Cómo cambio el contenido de los términos?**
R: Edita `apps/web/app/[locale]/legal/terms/page.tsx` y actualiza las traducciones en `messages/es-MX.json` y `en-US.json`

**P: ¿Cómo agrego un nuevo idioma?**
R: Crea `messages/[locale].json` con la estructura de `es-MX.json` y traduce el contenido

**P: ¿Cómo personalizo los estilos?**
R: Modifica `LegalLayout` en `apps/web/app/[locale]/legal/_components/legal-layout.tsx`

**P: ¿Las páginas requieren autenticación?**
R: No, son públicas. Si necesitas protegerlas, agrega middleware de autenticación

**P: ¿Cómo agrego anclas a secciones?**
R: Agrega `id` a los elementos y usa `<a href="#section-id">Link</a>`

---

## Recursos

- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**Última actualización:** 23 de octubre de 2025
**Versión:** 1.0
**Estado:** ✓ Completado
