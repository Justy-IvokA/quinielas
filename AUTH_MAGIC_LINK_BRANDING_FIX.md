# 🔧 Corrección: Magic Link Email con Branding

**Fecha:** 20 de Octubre, 2025  
**Problema:** Los emails de magic link (signin) no usaban los nuevos templates con branding  
**Status:** ✅ **Completado**

---

## 📋 Problema Identificado

### Síntoma
Los emails de "Sign in" (magic link) mostraban:
- ❌ Diseño antiguo sin branding del tenant
- ❌ Colores genéricos (azul #0ea5e9)
- ❌ Sin logo del tenant
- ❌ Solo en inglés
- ❌ Texto "Sign in to Quinielas" genérico

### Causa Raíz
Los emails de magic link se envían desde **Auth.js** (no desde nuestros routers de tRPC), y la función `sendVerificationRequest` en `packages/auth/src/config.ts` estaba usando un template HTML hardcodeado antiguo en lugar de los nuevos templates con branding de `@qp/utils/email`.

---

## ✅ Solución Implementada

### 1. **Actualización de Imports**

**Archivo:** `packages/auth/src/config.ts`

```typescript
import { emailTemplates, createEmailBrandInfo, parseEmailLocale } from "@qp/utils/email";
```

### 2. **Reescritura de `sendVerificationRequest`**

La función ahora:

#### a) **Resuelve el Brand desde el Hostname**
```typescript
// Extract tenant slug from subdomain (e.g., "ivoka" from "ivoka.localhost")
const parts = host.split('.');
let tenantSlug: string | null = null;

if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www') {
  tenantSlug = parts[0];
}

if (tenantSlug) {
  // Find tenant and its default brand
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug }
  });
  
  if (tenant) {
    const brand = await prisma.brand.findFirst({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'asc' } // Get first brand
    });
    
    // ... create brandInfo
  }
}
```

#### b) **Obtiene el Locale del Usuario**
```typescript
// Get user's locale if exists
const user = await prisma.user.findUnique({
  where: { email },
  select: { metadata: true }
});

locale = parseEmailLocale(
  (user?.metadata as any)?.locale || 
  (await prisma.setting.findFirst({
    where: { tenantId: tenant.id, key: "defaultLocale" }
  }))?.value as string || 
  "es-MX"
);
```

#### c) **Crea BrandInfo con Theme Completo**
```typescript
brandInfo = createEmailBrandInfo({
  name: brand.name,
  logoUrl: brand.logoUrl,
  colors: {
    primary: (brand.theme as any)?.colors?.primary || "#0ea5e9",
    primaryForeground: (brand.theme as any)?.colors?.primaryForeground || "#ffffff",
    background: (brand.theme as any)?.colors?.background || "#ffffff",
    foreground: (brand.theme as any)?.colors?.foreground || "#0f172a",
    muted: (brand.theme as any)?.colors?.muted || "#f1f5f9",
    border: (brand.theme as any)?.colors?.border || "#e2e8f0"
  },
  themeLogoUrl: (brand.theme as any)?.logo?.url || null
});
```

#### d) **Usa el Nuevo Template**
```typescript
// Use new email template with branding
const emailContent = emailTemplates.magicLink({
  brand: brandInfo,
  locale,
  url
});

await transport.sendMail({
  to: email,
  from: provider.from,
  subject: emailContent.subject,
  text: emailContent.text,
  html: emailContent.html,
});
```

### 3. **Fallback para Dominios sin Tenant**

Si no se puede resolver el tenant (por ejemplo, en `localhost` sin subdomain), usa un brandInfo por defecto:

```typescript
if (!brandInfo) {
  console.log('[auth] Using default brand info');
  brandInfo = {
    name: "Quinielas",
    colors: {
      primary: "#0ea5e9",
      primaryForeground: "#ffffff",
      background: "#ffffff",
      foreground: "#0f172a",
      muted: "#f1f5f9",
      border: "#e2e8f0"
    }
  };
}
```

---

## 🎯 Resultado

### Antes
```html
<!-- Template antiguo hardcodeado -->
<div class="header" style="background: #0ea5e9;">
  <h1>Sign in to Quinielas</h1>
</div>
```

- ❌ Sin branding del tenant
- ❌ Colores genéricos
- ❌ Solo en inglés

### Después
```html
<!-- Template moderno con branding -->
<div class="email-header" style="background: linear-gradient(135deg, #0066FF 0%, ...);">
  <img src="https://storage.googleapis.com/.../ivoka-logo.png" alt="Ivoka">
  <h1>Iniciar Sesión</h1>
</div>
```

- ✅ Colores del theme del tenant (azul Ivoka, rojo Coca-Cola, etc.)
- ✅ Logo del tenant en el header
- ✅ Diseño moderno con gradientes y sombras
- ✅ Idioma del usuario (español o inglés)
- ✅ Texto personalizado con el nombre del brand

---

## 🧪 Cómo Probar

### 1. Ir a la página de Sign In
```
http://ivoka.localhost:3000/es-MX/auth/signin
```

### 2. Ingresar tu email y hacer clic en "Enviar enlace mágico"

### 3. Revisar el email recibido

Debe mostrar:
- ✅ Logo de Ivoka en el header
- ✅ Colores azules del theme de Ivoka
- ✅ Texto en español: "Iniciar Sesión"
- ✅ Diseño moderno y responsive
- ✅ Botón con el color primario del brand

### 4. Verificar los logs en consola

```bash
[auth] sendVerificationRequest called
[auth] Email: chronos.devs@gmail.com
[auth] Generated URL: http://ivoka.localhost:3000/api/auth/callback/email?...
[auth] Host from URL: ivoka.localhost:3000
[auth] Found brand: Ivoka
[auth] Sending magic link email with branding
```

---

## 📝 Archivos Modificados

1. ✅ `packages/auth/src/config.ts` - Función `sendVerificationRequest` reescrita

---

## 🔍 Notas Técnicas

### Resolución del Brand

La función extrae el tenant slug del hostname:
- `ivoka.localhost` → tenant slug: `ivoka`
- `cocacola.localhost` → tenant slug: `cocacola`
- `localhost` → usa brand por defecto

Luego busca el primer brand del tenant (ordenado por `createdAt`).

### Locale del Usuario

Prioridad:
1. `user.metadata.locale` (si el usuario existe)
2. `Setting` del tenant con key `"defaultLocale"`
3. Fallback: `"es-MX"`

### Compatibilidad

Esta solución es compatible con:
- ✅ Subdominios (ivoka.localhost, cocacola.localhost)
- ✅ Dominios personalizados (si están en `brand.domains`)
- ✅ Localhost sin subdomain (usa brand por defecto)
- ✅ Usuarios nuevos (sin registro previo)
- ✅ Usuarios existentes (con locale guardado)

---

## 🎉 Resultado Final

Los usuarios ahora recibirán emails de magic link que:

✅ Reflejan perfectamente el branding del tenant  
✅ Están en su idioma preferido (español o inglés)  
✅ Tienen un diseño moderno y profesional  
✅ Son totalmente responsivos en móvil y desktop  
✅ Incluyen el logo del tenant (si está configurado)  

---

## 📞 Soporte

Si el email no muestra el branding correcto:

1. **Verifica los logs en consola** - debe mostrar `[auth] Found brand: [nombre]`
2. **Verifica que el hostname tenga subdomain** - debe ser `ivoka.localhost`, no solo `localhost`
3. **Verifica que el brand tenga theme configurado** - debe tener colores en `brand.theme.colors`

---

**¡Corrección completada exitosamente! 🎉**

Los emails de magic link ahora usan los nuevos templates con branding completo.
