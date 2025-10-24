# Implementación de Páginas Legales - Quinielas WL

## Resumen Ejecutivo

Se han implementado tres páginas legales profesionales con branding del tenant, diseño responsive y soporte multiidioma (es-MX y en-US). Todas las páginas utilizan un componente reutilizable `LegalLayout` que garantiza consistencia visual y funcional.

---

## Estructura de Archivos Creados

### 1. Componente Base: LegalLayout
**Ubicación:** `apps/web/app/[locale]/legal/_components/legal-layout.tsx`

```
Características:
✓ Componente reutilizable para todas las páginas legales
✓ Header sticky con logo del cliente (parte superior izquierda)
✓ Botón de retroceso (BackButton) sin fallbackHref
✓ Diálogo centrado: 90% ancho en móviles, 75% en md+
✓ Gradientes animados de fondo
✓ Integración con BrandThemeInjector
✓ Tipografía profesional con secciones bien organizadas
```

### 2. Páginas Legales

#### a) Términos y Condiciones
**Ubicación:** `apps/web/app/[locale]/legal/terms/page.tsx`

**Secciones:**
1. Introducción
2. Definiciones
3. Elegibilidad del Usuario
4. Registro de Cuenta
5. Conducta del Usuario
6. Predicciones y Puntuación
7. Propiedad Intelectual
8. Limitación de Responsabilidad
9. Indemnización
10. Terminación
11. Modificaciones de los Términos
12. Ley Aplicable
13. Contacto

#### b) Política de Privacidad
**Ubicación:** `apps/web/app/[locale]/legal/privacy/page.tsx`

**Secciones:**
1. Introducción
2. Información que Recopilamos
3. Cómo Utilizamos Su Información
4. Compartición de Datos
5. Seguridad de Datos
6. Retención de Datos
7. Sus Derechos
8. Cookies y Rastreo
9. Enlaces a Terceros
10. Privacidad de Menores
11. Cumplimiento GDPR
12. Contacto

#### c) Política de Cookies
**Ubicación:** `apps/web/app/[locale]/legal/cookies/page.tsx`

**Secciones:**
1. Introducción
2. ¿Qué son las Cookies?
3. Tipos de Cookies que Utilizamos
4. Cookies Específicas (tabla con detalles)
5. Gestión de Cookies
6. Cookies de Terceros
7. Do Not Track
8. Cambios en esta Política
9. Contacto

---

## Características de Diseño

### Responsive Layout
```
Móviles (< md):
- Ancho: 90% del viewport
- Padding: 1.5rem (6px)
- Altura mínima: 100vh

Tablets/Desktop (md+):
- Ancho: 75% del viewport
- Padding: 2.5rem (10px)
- Máximo ancho: 512px (2xl)
```

### Header Sticky
```
- Logo del cliente en la parte superior izquierda
- Botón de retroceso alineado a la derecha
- Borde inferior sutil
- Fondo semi-transparente con backdrop blur
```

### Contenedor de Diálogo
```
- Fondo: white/60 (light) | white/5 (dark)
- Bordes: border-white/10
- Sombra: shadow-2xl
- Radio: rounded-2xl
- Overflow: hidden
```

### Tipografía
```
- Títulos: text-2xl md:text-3xl font-bold
- Subtítulos: text-xl font-semibold
- Cuerpo: text-sm md:text-base
- Acentos: text-foreground/90 | text-foreground/75
```

---

## Traducciones Implementadas

### Español (es-MX)
**Archivo:** `apps/web/messages/es-MX.json`

Agregadas 3 secciones principales:
- `legal.terms` - 13 subsecciones
- `legal.privacy` - 12 subsecciones
- `legal.cookies` - 9 subsecciones

**Total de claves:** 34 claves principales + contenido anidado

### Inglés (en-US)
**Archivo:** `apps/web/messages/en-US.json`

Agregadas 3 secciones principales con traducción profesional:
- `legal.terms` - 13 subsecciones
- `legal.privacy` - 12 subsecciones
- `legal.cookies` - 9 subsecciones

**Total de claves:** 34 claves principales + contenido anidado

---

## Integración con Branding

### BrandThemeInjector
Cada página legal inyecta automáticamente el tema del tenant:
```typescript
{brand?.theme && <BrandThemeInjector brandTheme={brand.theme} />}
```

### Logo del Cliente
Se muestra en la parte superior izquierda del header:
```typescript
{logoUrl ? (
  <Image src={logoUrl} alt={brandName} fill className="object-contain" />
) : (
  <div className="bg-gradient-to-br from-primary to-accent">
    {brandName?.charAt(0)}
  </div>
)}
```

### Colores del Tenant
- Gradientes de fondo utilizan variables CSS: `--primary` y `--accent`
- Tipografía utiliza `text-foreground` (respeta tema oscuro/claro)
- Bordes utilizan `border-border/40`

---

## Actualización de LegalNotice

**Ubicación:** `apps/web/app/[locale]/auth/register/[poolSlug]/_components/legal-notice.tsx`

**Cambios:**
- Rutas actualizadas: `/legal/terms` y `/legal/privacy`
- Agregados atributos: `target="_blank"` y `rel="noopener noreferrer"`
- Permite abrir en nueva pestaña sin perder contexto de registro

---

## Rutas Disponibles

### Español (es-MX)
```
/es-MX/legal/terms
/es-MX/legal/privacy
/es-MX/legal/cookies
```

### Inglés (en-US)
```
/en-US/legal/terms
/en-US/legal/privacy
/en-US/legal/cookies
```

---

## Funcionalidades Implementadas

### ✓ Branding Multi-tenant
- Logo del cliente en cada página
- Colores personalizados del tenant
- Nombre del tenant en el header

### ✓ Navegación
- Botón de retroceso (BackButton) sin fallbackHref
- Usa `window.history.length` para determinar si hay historial
- Fallback a `/` si no hay historial

### ✓ Responsive Design
- 90% ancho en móviles
- 75% ancho en tablets/desktop
- Máximo ancho de 512px (2xl)
- Padding adaptativo

### ✓ Internacionalización
- Soporte para es-MX y en-US
- Fácil de extender a otros idiomas
- Traducciones profesionales

### ✓ Accesibilidad
- Semántica HTML correcta
- Contraste de colores adecuado
- Navegación por teclado funcional

### ✓ Rendimiento
- Componentes server-side (SSR)
- Suspense boundaries para carga
- Optimización de imágenes con Next.js Image

---

## Contenido Legal Profesional

### Redacción Corporativa
Todo el contenido fue redactado desde la perspectiva de un abogado corporativo considerando:
- Contexto del proyecto (plataforma de quinielas deportivas)
- Protección legal del tenant
- Cumplimiento normativo (GDPR, leyes mexicanas)
- Claridad y profesionalismo

### Secciones Clave

**Términos:**
- Definiciones claras de conceptos clave
- Requisitos de elegibilidad
- Prohibiciones de conducta
- Sistema de puntuación
- Limitación de responsabilidad

**Privacidad:**
- Tipos de datos recopilados
- Usos de la información
- Derechos del usuario
- Cumplimiento GDPR
- Política de cookies

**Cookies:**
- Explicación de tipos de cookies
- Tabla de cookies específicas
- Instrucciones de gestión por navegador
- Respeto a "Do Not Track"

---

## Próximos Pasos Opcionales

1. **Agregar más idiomas:** Extender traducciones a otros locales
2. **Versión PDF:** Permitir descarga de documentos legales
3. **Historial de cambios:** Mantener versiones anteriores de políticas
4. **Aceptación de términos:** Registrar cuando usuarios aceptan términos
5. **Validación legal:** Revisar con abogado local antes de producción

---

## Testing

### URLs de Prueba
```
Desarrollo local:
http://localhost:3000/es-MX/legal/terms
http://localhost:3000/es-MX/legal/privacy
http://localhost:3000/es-MX/legal/cookies

http://localhost:3000/en-US/legal/terms
http://localhost:3000/en-US/legal/privacy
http://localhost:3000/en-US/legal/cookies
```

### Verificaciones
- [ ] Logo del cliente se muestra correctamente
- [ ] Botón de retroceso funciona sin fallbackHref
- [ ] Responsive en móviles (90% ancho)
- [ ] Responsive en desktop (75% ancho)
- [ ] Colores del tenant se aplican
- [ ] Traducciones se cargan correctamente
- [ ] Enlaces internos funcionan
- [ ] Navegación por teclado funciona

---

## Notas de Implementación

### Resolución de Tenant
Las páginas utilizan `resolveTenantAndBrandFromHost()` para obtener:
- Información del tenant
- Tema y branding del cliente
- Logo del cliente

### Inyección de Tema
`BrandThemeInjector` inyecta variables CSS que se aplican a:
- Gradientes de fondo
- Colores de texto
- Bordes y acentos

### Componente BackButton
Utiliza `useRouter()` de Next.js para:
1. Intentar retroceder en el historial
2. Si no hay historial, redirigir a `/`
3. No utiliza `fallbackHref` como se solicitó

---

## Archivos Modificados

1. ✓ `apps/web/app/[locale]/legal/_components/legal-layout.tsx` (CREADO)
2. ✓ `apps/web/app/[locale]/legal/terms/page.tsx` (CREADO)
3. ✓ `apps/web/app/[locale]/legal/privacy/page.tsx` (CREADO)
4. ✓ `apps/web/app/[locale]/legal/cookies/page.tsx` (CREADO)
5. ✓ `apps/web/app/[locale]/auth/register/[poolSlug]/_components/legal-notice.tsx` (MODIFICADO)
6. ✓ `apps/web/messages/es-MX.json` (MODIFICADO)
7. ✓ `apps/web/messages/en-US.json` (MODIFICADO)

---

## Conclusión

Se ha implementado un conjunto completo de páginas legales profesionales, responsivas y multi-idioma que se integran perfectamente con el branding del tenant. El componente `LegalLayout` reutilizable garantiza consistencia visual y facilita el mantenimiento futuro.
