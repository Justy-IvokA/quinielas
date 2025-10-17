# 📧 Refactorización de Templates de Email

## Resumen

Se han refactorizado completamente los templates de correo electrónico con un **diseño moderno y corporativo** que utiliza los **colores del branding del tenant** y soporta **internacionalización (i18n)** en español e inglés.

---

## ✨ Características Principales

### 1. **Diseño Moderno y Responsivo**
- Diseño corporativo profesional con gradientes y sombras
- Totalmente responsivo (mobile-first)
- Compatible con todos los clientes de email (Gmail, Outlook, Apple Mail, etc.)
- Usa fuente Inter de Google Fonts con fallback a system fonts

### 2. **Branding Personalizado por Tenant**
- Colores primarios, secundarios y de fondo del tenant
- Logo del brand (opcional)
- Nombre del brand en header y footer
- Botones y elementos con los colores corporativos

### 3. **Internacionalización (i18n)**
- Soporte para español (es-MX) e inglés (en-US)
- Traducciones completas de todos los textos
- Formato de fechas según el locale
- Fácil de extender a más idiomas

### 4. **Tres Templates Disponibles**
- **Invitation Email**: Invitación a unirse a un pool
- **Invite Code Email**: Código de invitación para un pool
- **Magic Link Email**: Enlace de autenticación (sign-in)

---

## 📁 Archivos Creados

### Nuevos Archivos

```
packages/utils/src/email/
├── types.ts                  # Tipos TypeScript para los templates
├── translations.ts           # Traducciones es-MX y en-US
├── templates.ts              # Templates HTML modernos
└── branding-helpers.ts       # Utilidades para convertir branding
```

### Archivos Modificados

```
packages/utils/src/email/
└── index.ts                  # Exportaciones actualizadas
```

---

## 🎨 Estructura de Colores

Los templates usan los siguientes colores del branding:

```typescript
interface EmailBrandColors {
  primary: string;              // Color principal del brand
  primaryForeground: string;    // Color de texto sobre primary
  background: string;           // Color de fondo
  foreground: string;           // Color de texto principal
  muted: string;                // Color de fondo secundario
  border: string;               // Color de bordes
}
```

**Ejemplo de uso con Coca-Cola:**
- `primary`: `#FF0000` (rojo Coca-Cola)
- `primaryForeground`: `#FFFFFF` (blanco)
- `background`: `#FFFFFF` (blanco)
- `foreground`: `#000000` (negro)
- `muted`: `#F5F5F5` (gris claro)
- `border`: `#E0E0E0` (gris)

---

## 🚀 Uso Básico

### 1. Invitación a Pool

```typescript
import { emailTemplates, createEmailBrandInfo, parseEmailLocale } from "@qp/utils/email";

// Preparar información del brand
const brandInfo = createEmailBrandInfo({
  name: "Coca-Cola",
  logoUrl: "https://cdn.example.com/logos/coca-cola.png",
  colors: {
    primary: "#FF0000",
    primaryForeground: "#FFFFFF",
    background: "#FFFFFF",
    foreground: "#000000",
    muted: "#F5F5F5",
    border: "#E0E0E0",
  }
});

// Crear email de invitación
const email = emailTemplates.invitation({
  brand: brandInfo,
  locale: "es-MX", // o "en-US"
  poolName: "Mundial FIFA 2026",
  inviteUrl: "https://cocacola.quinielas.mx/es-MX/pools/mundial-2026/join?token=abc123",
  expiresAt: new Date("2026-06-01")
});

// Enviar email
await emailAdapter.send({
  to: "usuario@example.com",
  subject: email.subject,
  html: email.html,
  text: email.text
});
```

### 2. Código de Invitación

```typescript
const email = emailTemplates.inviteCode({
  brand: brandInfo,
  locale: "es-MX",
  poolName: "Mundial FIFA 2026",
  code: "COCA2026",
  poolUrl: "https://cocacola.quinielas.mx/es-MX/pools/mundial-2026"
});

await emailAdapter.send({
  to: "usuario@example.com",
  ...email
});
```

### 3. Magic Link (Autenticación)

```typescript
const email = emailTemplates.magicLink({
  brand: brandInfo,
  locale: "en-US",
  email: "user@example.com",
  url: "https://cocacola.quinielas.mx/api/auth/callback/email?token=xyz789"
});

await emailAdapter.send({
  to: "user@example.com",
  ...email
});
```

---

## 🔧 Integración con Base de Datos

### Desde un Brand Entity

```typescript
import { emailTemplates, createEmailBrandInfo, parseEmailLocale } from "@qp/utils/email";
import { db } from "@qp/db";

// Obtener brand de la base de datos
const brand = await db.brand.findUnique({
  where: { id: brandId }
});

// Convertir a EmailBrandInfo
const brandInfo = createEmailBrandInfo({
  name: brand.name,
  logoUrl: brand.logoUrl,
  colors: {
    primary: brand.theme.colors.primary,
    primaryForeground: brand.theme.colors.primaryForeground,
    background: brand.theme.colors.background,
    foreground: brand.theme.colors.foreground,
    muted: brand.theme.colors.muted,
    border: brand.theme.colors.border,
  }
});

// Obtener locale del usuario
const user = await db.user.findUnique({ where: { id: userId } });
const locale = parseEmailLocale(user.locale); // "es-MX" o "en-US"

// Crear y enviar email
const email = emailTemplates.invitation({
  brand: brandInfo,
  locale,
  poolName: pool.name,
  inviteUrl: invitationUrl,
  expiresAt: invitation.expiresAt
});

await emailAdapter.send({
  to: user.email,
  ...email
});
```

---

## 🌐 Traducciones

### Español (es-MX)

```typescript
{
  invitation: {
    subject: "Invitación a {poolName}",
    title: "¡Estás invitado!",
    body: "Has sido invitado a unirte a <strong>{poolName}</strong>...",
    button: "Aceptar Invitación",
    // ...
  }
}
```

### Inglés (en-US)

```typescript
{
  invitation: {
    subject: "Invitation to {poolName}",
    title: "You're Invited!",
    body: "You've been invited to join <strong>{poolName}</strong>...",
    button: "Accept Invitation",
    // ...
  }
}
```

### Agregar Nuevo Idioma

Para agregar un nuevo idioma, edita `packages/utils/src/email/translations.ts`:

```typescript
// 1. Agregar tipo de locale
export type EmailLocale = "es-MX" | "en-US" | "pt-BR"; // Agregar portugués

// 2. Crear traducciones
const ptBR: EmailTranslations = {
  invitation: {
    subject: "Convite para {poolName}",
    title: "Você está convidado!",
    // ...
  }
};

// 3. Agregar al objeto de traducciones
const translations: Record<EmailLocale, EmailTranslations> = {
  "es-MX": esMX,
  "en-US": enUS,
  "pt-BR": ptBR, // Agregar aquí
};
```

---

## 🎯 Actualizar Routers Existentes

### Router de Access (Invitaciones)

**Antes:**
```typescript
// packages/api/src/routers/access/index.ts
emailTemplates.invitation({
  poolName: pool.name,
  inviteUrl: invitationUrl,
  expiresAt: invitation.expiresAt,
  brandName: brand.name // Solo nombre
});
```

**Después:**
```typescript
import { createEmailBrandInfo, parseEmailLocale } from "@qp/utils/email";

// Obtener brand completo
const brand = await ctx.db.brand.findUnique({
  where: { id: input.brandId }
});

// Crear brandInfo con colores
const brandInfo = createEmailBrandInfo({
  name: brand.name,
  logoUrl: brand.logoUrl,
  colors: {
    primary: brand.theme.colors.primary,
    primaryForeground: brand.theme.colors.primaryForeground,
    background: brand.theme.colors.background,
    foreground: brand.theme.colors.foreground,
    muted: brand.theme.colors.muted,
    border: brand.theme.colors.border,
  }
});

// Obtener locale del usuario
const user = await ctx.db.user.findUnique({
  where: { email: invitation.email }
});
const locale = parseEmailLocale(user?.locale);

// Usar nuevo template
const email = emailTemplates.invitation({
  brand: brandInfo,
  locale,
  poolName: pool.name,
  inviteUrl: invitationUrl,
  expiresAt: invitation.expiresAt
});

await emailAdapter.send({
  to: invitation.email,
  ...email
});
```

### Auth.js (Magic Links)

**Actualizar `packages/auth/src/config.ts`:**

```typescript
import { emailTemplates, getDefaultEmailBrandInfo, parseEmailLocale } from "@qp/utils/email";

async sendVerificationRequest({ identifier: email, url, provider }) {
  // Obtener brand del hostname (si aplica)
  const hostname = new URL(url).hostname;
  const brand = await getBrandFromHostname(hostname);
  
  const brandInfo = brand 
    ? createEmailBrandInfo({
        name: brand.name,
        logoUrl: brand.logoUrl,
        colors: { /* ... */ }
      })
    : getDefaultEmailBrandInfo(); // Fallback
  
  // Obtener locale del usuario
  const user = await db.user.findUnique({ where: { email } });
  const locale = parseEmailLocale(user?.locale);
  
  // Crear email
  const emailContent = emailTemplates.magicLink({
    brand: brandInfo,
    locale,
    email,
    url
  });
  
  // Enviar
  await emailAdapter.send({
    to: email,
    ...emailContent
  });
}
```

---

## 🧪 Testing

### Test Manual

Crea un script de prueba en `scripts/test-email-templates.ts`:

```typescript
import { emailTemplates, createEmailBrandInfo } from "@qp/utils/email";
import { writeFileSync } from "fs";

// Crear brandInfo de prueba
const brandInfo = createEmailBrandInfo({
  name: "Coca-Cola",
  logoUrl: "https://via.placeholder.com/180x60/FF0000/FFFFFF?text=Coca-Cola",
  colors: {
    primary: "#FF0000",
    primaryForeground: "#FFFFFF",
    background: "#FFFFFF",
    foreground: "#000000",
    muted: "#F5F5F5",
    border: "#E0E0E0",
  }
});

// Test invitación en español
const invitationES = emailTemplates.invitation({
  brand: brandInfo,
  locale: "es-MX",
  poolName: "Mundial FIFA 2026",
  inviteUrl: "https://cocacola.quinielas.mx/es-MX/pools/mundial-2026/join?token=abc123",
  expiresAt: new Date("2026-06-01")
});

writeFileSync("test-invitation-es.html", invitationES.html);
console.log("✅ Invitation ES:", invitationES.subject);

// Test invitación en inglés
const invitationEN = emailTemplates.invitation({
  brand: brandInfo,
  locale: "en-US",
  poolName: "FIFA World Cup 2026",
  inviteUrl: "https://cocacola.quinielas.mx/en-US/pools/mundial-2026/join?token=abc123",
  expiresAt: new Date("2026-06-01")
});

writeFileSync("test-invitation-en.html", invitationEN.html);
console.log("✅ Invitation EN:", invitationEN.subject);

// Test código de invitación
const inviteCode = emailTemplates.inviteCode({
  brand: brandInfo,
  locale: "es-MX",
  poolName: "Mundial FIFA 2026",
  code: "COCA2026",
  poolUrl: "https://cocacola.quinielas.mx/es-MX/pools/mundial-2026"
});

writeFileSync("test-invite-code.html", inviteCode.html);
console.log("✅ Invite Code:", inviteCode.subject);

// Test magic link
const magicLink = emailTemplates.magicLink({
  brand: brandInfo,
  locale: "en-US",
  email: "user@example.com",
  url: "https://cocacola.quinielas.mx/api/auth/callback/email?token=xyz789"
});

writeFileSync("test-magic-link.html", magicLink.html);
console.log("✅ Magic Link:", magicLink.subject);

console.log("\n📧 Archivos HTML generados. Ábrelos en tu navegador para ver el resultado.");
```

**Ejecutar:**
```bash
pnpm tsx scripts/test-email-templates.ts
```

---

## 📊 Características del Diseño

### Header
- Gradiente con color primario del brand
- Logo del brand (si está disponible)
- Título grande y legible

### Body
- Padding generoso para legibilidad
- Tipografía moderna (Inter)
- Botones con hover effects
- Info boxes con borde de color primario
- Código de invitación con borde punteado

### Footer
- Fondo muted
- Texto pequeño con información del brand
- Nombre del brand destacado

### Responsive
- Breakpoint en 600px
- Padding reducido en móvil
- Fuentes ajustadas para pantallas pequeñas

---

## 🔄 Retrocompatibilidad

Los templates antiguos se mantienen disponibles como `legacyEmailTemplates` para no romper código existente:

```typescript
import { legacyEmailTemplates } from "@qp/utils/email";

// Sigue funcionando
const email = legacyEmailTemplates.invitation({
  poolName: "Mundial 2026",
  inviteUrl: "https://...",
  expiresAt: new Date(),
  brandName: "Coca-Cola"
});
```

**Recomendación:** Migrar gradualmente a los nuevos templates para aprovechar el branding completo.

---

## 📝 TODOs

- [ ] Actualizar routers de access para usar nuevos templates
- [ ] Actualizar Auth.js config para usar template de magic link
- [ ] Agregar tests unitarios para templates
- [ ] Agregar más idiomas (pt-BR, fr-FR, etc.)
- [ ] Implementar preview de emails en admin panel
- [ ] Agregar tracking de emails (open/click)

---

## 🎉 Beneficios

1. **Experiencia de marca consistente**: Todos los emails reflejan el branding del tenant
2. **Mejor UX**: Diseño moderno y profesional aumenta la confianza
3. **Internacionalización**: Usuarios reciben emails en su idioma preferido
4. **Mantenibilidad**: Código organizado y fácil de extender
5. **Compatibilidad**: Funciona en todos los clientes de email

---

**Última actualización:** 2025-01-16  
**Autor:** Victor Mancera (Agencia)
