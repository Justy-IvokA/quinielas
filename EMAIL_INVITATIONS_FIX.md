# 🔧 Corrección de Templates de Email y Subdominios en Invitaciones

**Fecha:** 19 de Octubre, 2025  
**Autor:** Victor Mancera (Agencia)  
**Status:** ✅ **Completado**

---

## 📋 Problemas Identificados

### Problema 1: No se usaban los nuevos templates de email con branding

**Descripción:**  
Los endpoints de invitaciones en `packages/api/src/routers/access/index.ts` estaban usando los templates antiguos y básicos de `packages/api/src/lib/email-templates.ts` en lugar de los nuevos templates modernos con branding completo de `@qp/utils/email`.

**Impacto:**
- Los emails enviados NO reflejaban los colores del brand
- NO se mostraba el logo del tenant
- NO se aplicaba el diseño moderno y responsive
- Se perdía toda la inversión en los nuevos templates

**Endpoints afectados:**
- `resendEmailInvitation` (líneas 244-366)
- `sendInvitations` (líneas 456-580)

---

### Problema 2: URLs sin subdominio del tenant

**Descripción:**  
La función `getBrandCanonicalUrl()` en `packages/api/src/lib/host-tenant.ts` estaba usando `brand.slug` como subdomain en lugar de `tenant.slug` cuando no había dominios personalizados configurados.

**Impacto:**
- Los enlaces en los emails NO incluían el subdominio correcto del tenant
- Ejemplo incorrecto: `http://localhost/es-MX/auth/register/liga-mx-14?token=...`
- Ejemplo correcto: `http://ivoka.localhost/es-MX/auth/register/liga-mx-14?token=...`

---

## ✅ Correcciones Implementadas

### 1. Actualización de Imports en Access Router

**Archivo:** `packages/api/src/routers/access/index.ts`

**Antes:**
```typescript
import { 
  getInvitationEmailSubject, 
  getInvitationEmailHtml, 
  getInvitationEmailText 
} from "../../lib/email-templates";
```

**Después:**
```typescript
import { 
  emailTemplates,
  createEmailBrandInfo,
  parseEmailLocale
} from "@qp/utils/email";
```

---

### 2. Actualización del endpoint `resendEmailInvitation`

**Cambios principales:**

1. **Obtener brand con theme completo:**
```typescript
const brand = await prisma.brand.findUnique({
  where: { id: input.brandId },
  include: { tenant: true }
});
```

2. **Parsear locale correctamente:**
```typescript
const locale = parseEmailLocale(
  typeof tenantSettings?.value === "string" ? tenantSettings.value : "es-MX"
);
```

3. **Crear brandInfo con colores del theme:**
```typescript
const brandInfo = createEmailBrandInfo({
  name: brand.name,
  logoUrl: brand.logoUrl,
  colors: {
    primary: (brand.theme as any)?.colors?.primary || "#0ea5e9",
    primaryForeground: (brand.theme as any)?.colors?.primaryForeground || "#ffffff",
    background: (brand.theme as any)?.colors?.background || "#ffffff",
    foreground: (brand.theme as any)?.colors?.foreground || "#0f172a",
    muted: (brand.theme as any)?.colors?.muted || "#f1f5f9",
    border: (brand.theme as any)?.colors?.border || "#e2e8f0"
  }
});
```

4. **Usar nuevo template con branding:**
```typescript
const email = emailTemplates.invitation({
  brand: brandInfo,
  locale,
  poolName: invitation.pool.name,
  inviteUrl: invitationUrl,
  expiresAt: invitation.expiresAt || new Date(Date.now() + 72 * 60 * 60 * 1000)
});

await transport.sendMail({
  to: invitation.email,
  from: emailFrom,
  subject: email.subject,
  text: email.text,
  html: email.html
});
```

---

### 3. Actualización del endpoint `sendInvitations`

**Cambios idénticos al endpoint anterior:**
- Parsear locale con `parseEmailLocale()`
- Crear `brandInfo` con colores completos del theme
- Usar `emailTemplates.invitation()` con todos los parámetros de branding

---

### 4. Corrección de `getBrandCanonicalUrl()`

**Archivo:** `packages/api/src/lib/host-tenant.ts`

**Antes:**
```typescript
export function getBrandCanonicalUrl(brand: Brand & { tenant: Tenant }): string {
  // Prefer custom domain
  if (brand.domains && brand.domains.length > 0) {
    const domain = brand.domains[0];
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${domain}`;
  }

  // Fallback to subdomain pattern
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost:3000";
  const protocol = baseDomain.includes('localhost') ? 'http' : 'https';
  
  // Use brand slug as subdomain ❌ INCORRECTO
  return `${protocol}://${brand.slug}.${baseDomain}`;
}
```

**Después:**
```typescript
export function getBrandCanonicalUrl(brand: Brand & { tenant: Tenant }): string {
  // Prefer custom domain
  if (brand.domains && brand.domains.length > 0) {
    const domain = brand.domains[0];
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${domain}`;
  }

  // Fallback to subdomain pattern using tenant slug
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost:3000";
  const protocol = baseDomain.includes('localhost') ? 'http' : 'https';
  
  // Use tenant slug as subdomain ✅ CORRECTO
  return `${protocol}://${brand.tenant.slug}.${baseDomain}`;
}
```

**Razón del cambio:**  
El subdominio debe ser el slug del **tenant**, no del brand. Un tenant puede tener múltiples brands, pero todos comparten el mismo subdominio del tenant.

---

### 5. Actualización de Tests

**Archivo:** `packages/api/src/lib/host-tenant.test.ts`

**Tests actualizados:**

1. **Test de subdomain sin custom domain:**
```typescript
// Antes: esperaba "http://demo-brand.localhost:3000"
// Después: espera "http://demo.localhost:3000"
expect(getBrandCanonicalUrl(brand)).toBe("http://demo.localhost:3000");
```

2. **Test de buildPoolUrl:**
```typescript
// Antes: esperaba "http://demo-brand.localhost:3000/en-US/pools/test-pool"
// Después: espera "http://demo.localhost:3000/en-US/pools/test-pool"
expect(buildPoolUrl(brand, "test-pool", "en-US"))
  .toBe("http://demo.localhost:3000/en-US/pools/test-pool");
```

---

## 🎯 Resultados

### Antes de las correcciones:

❌ **Email sin branding:**
- Colores genéricos (azul #0ea5e9)
- Sin logo del tenant
- Diseño básico y poco atractivo
- Solo en inglés

❌ **URL incorrecta:**
```
http://localhost/es-MX/auth/register/liga-mx-14?token=abc123
```

### Después de las correcciones:

✅ **Email con branding completo:**
- Colores personalizados del tenant (rojo Coca-Cola, azul Pepsi, etc.)
- Logo del tenant en el header
- Diseño moderno, profesional y responsive
- Idioma del usuario (español o inglés)

✅ **URL correcta con subdominio:**
```
http://ivoka.localhost/es-MX/auth/register/liga-mx-14?token=abc123
```

---

## 📝 Archivos Modificados

1. ✅ `packages/api/src/routers/access/index.ts` - Endpoints actualizados
2. ✅ `packages/api/src/lib/host-tenant.ts` - Función getBrandCanonicalUrl corregida
3. ✅ `packages/api/src/lib/host-tenant.test.ts` - Tests actualizados

---

## 🧪 Cómo Probar

### 1. Verificar que el servidor de email esté configurado

En tu archivo `.env`:
```bash
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=tu-email@gmail.com
EMAIL_SERVER_PASSWORD=tu-password
EMAIL_FROM=noreply@quinielas.app
```

### 2. Crear invitaciones desde el admin

1. Ve a `http://ivoka.localhost:3000/es-MX/pools/[pool-id]/invitations`
2. Sube un CSV con emails o crea invitaciones manualmente
3. Haz clic en "Enviar Invitaciones"

### 3. Verificar el email recibido

El email debe tener:
- ✅ Colores del brand del tenant (no genéricos)
- ✅ Logo del tenant en el header (si está configurado)
- ✅ Diseño moderno con gradientes y sombras
- ✅ Texto en el idioma correcto (español o inglés)
- ✅ URL con subdominio del tenant: `http://ivoka.localhost/es-MX/auth/register/...`

### 4. Hacer clic en el enlace

El enlace debe:
- ✅ Redirigir a `http://[tenant-slug].localhost/es-MX/auth/register/[pool-slug]?token=...`
- ✅ Mostrar la página de registro con el branding correcto
- ✅ Validar el token correctamente

---

## 🚀 Próximos Pasos (Opcional)

1. **Configurar SMTP en producción** con un proveedor profesional (SendGrid, AWS SES, Resend)
2. **Agregar tracking de emails** (aperturas, clics) usando webhooks del proveedor
3. **Implementar rate limiting** para prevenir spam
4. **Agregar templates adicionales:**
   - Welcome email después del registro
   - Recordatorio de predicciones pendientes
   - Notificación de resultados y posición en leaderboard

---

## 📚 Referencias

- **Documentación de templates:** `RESUMEN_TEMPLATES_EMAIL.md`
- **Código de templates:** `packages/utils/src/email/templates.ts`
- **Helpers de branding:** `packages/utils/src/email/branding-helpers.ts`
- **Traducciones:** `packages/utils/src/email/translations.ts`

---

## ✅ Checklist de Verificación

- [x] Imports actualizados en access router
- [x] Endpoint `resendEmailInvitation` usa nuevos templates
- [x] Endpoint `sendInvitations` usa nuevos templates
- [x] Función `getBrandCanonicalUrl` usa `tenant.slug`
- [x] Tests actualizados y pasando
- [x] Documentación creada

---

**¡Correcciones completadas exitosamente! 🎉**

Los emails de invitación ahora reflejan perfectamente el branding del tenant y los enlaces incluyen el subdominio correcto.
