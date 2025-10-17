# 📧 Integración de Subdominios en Correos Electrónicos

## Resumen de Cambios

Se ha actualizado el sistema de envío de correos electrónicos para que **todas las URLs incluyan el subdominio correcto** del brand al que pertenece el usuario. Esto garantiza que los magic links de autenticación y las invitaciones a pools dirijan a los usuarios al subdominio apropiado.

---

## 🎯 Objetivos Cumplidos

1. ✅ **Magic Links de Auth.js** ahora preservan el subdominio desde el cual se solicitó el login
2. ✅ **Invitaciones por email** incluyen URLs con el subdominio del brand
3. ✅ **Templates de email** actualizados para recibir información del brand
4. ✅ **Funciones de construcción de URLs** manejan localhost y producción correctamente

---

## 📁 Archivos Modificados

### 1. `packages/utils/src/email/index.ts`
**Cambios:**
- Templates `invitation` y `inviteCode` ahora aceptan `brandName` opcional
- Subject lines incluyen el nombre del brand cuando está disponible

**Ejemplo de uso:**
```typescript
emailTemplates.invitation({
  poolName: "Mundial 2026",
  inviteUrl: "http://cocacola.localhost:3000/es-MX/pools/mundial-2026/join?token=abc123",
  expiresAt: new Date(),
  brandName: "Coca-Cola" // Opcional
});
```

---

### 2. `packages/api/src/lib/host-tenant.ts`
**Nuevas funciones:**

#### `getBrandCanonicalUrl(brand)`
Construye la URL base del brand considerando:
- Custom domains configurados en `brand.domains[]`
- Subdominios basados en `brand.slug`
- Protocolo correcto (http para localhost, https para producción)

```typescript
const url = getBrandCanonicalUrl(brand);
// Desarrollo: "http://cocacola.localhost:3000"
// Producción: "https://cocacola.quinielas.mx"
```

#### `buildPoolUrl(brand, poolSlug, locale?)`
Construye URL completa a un pool específico:
```typescript
const url = buildPoolUrl(brand, "mundial-2026", "es-MX");
// "http://cocacola.localhost:3000/es-MX/pools/mundial-2026"
```

#### `buildInvitationUrl(brand, poolSlug, token, locale?)`
Construye URL de invitación con token:
```typescript
const url = buildInvitationUrl(brand, "mundial-2026", "abc123token");
// "http://cocacola.localhost:3000/es-MX/pools/mundial-2026/join?token=abc123token"
```

#### `buildAuthCallbackUrl(brand, locale?)`
Construye URL de callback para Auth.js:
```typescript
const url = buildAuthCallbackUrl(brand);
// "http://cocacola.localhost:3000/es-MX/auth/callback"
```

---

### 3. `packages/auth/src/config.ts`
**Cambios:**

#### `trustHost: true` (CRÍTICO)
```typescript
return {
  trustHost: true, // ← ESENCIAL para subdominios
  // ...
}
```
**Sin esta configuración, Auth.js usará `localhost` en lugar del subdominio.**

#### Custom `sendVerificationRequest`
- Preserva el hostname (incluyendo subdominio) en el magic link
- Template HTML personalizado para emails de login
- Detecta automáticamente protocolo (http/https) basado en hostname
- Incluye logging para debugging

#### Cookies multi-subdomain (producción)
```typescript
cookies: {
  sessionToken: {
    domain: `.quinielas.mx` // Permite compartir sesión entre subdominios
  }
}
```

**Flujo:**
1. Usuario solicita login desde `http://cocacola.localhost:3000`
2. Auth.js genera magic link con el mismo hostname
3. Usuario recibe email con link a `http://cocacola.localhost:3000/es-MX/auth/callback?token=...`
4. Al hacer clic, regresa al mismo subdominio

---

### 4. `packages/api/src/routers/access/schema.ts`
**Cambios:**
- Agregado `brandId` a schemas de invitaciones:
  - `createEmailInvitationSchema`
  - `uploadInvitationsCsvSchema`
  - `sendInvitationsSchema`
  - `resendEmailInvitation` input

**Razón:** Necesario para obtener información del brand y construir URLs correctas.

---

### 5. `packages/api/src/routers/access/index.ts`
**Cambios en endpoints:**

#### `createEmailInvitation`
```typescript
// Ahora requiere brandId
const invitation = await trpc.access.createEmailInvitation.mutate({
  poolId: "...",
  accessPolicyId: "...",
  tenantId: "...",
  brandId: "...", // ← NUEVO
  email: "user@example.com"
});
```
- Obtiene brand y pool de la DB
- Construye `invitationUrl` con subdominio correcto
- Log de la URL generada (para debugging)

#### `uploadInvitationsCsv`
- Mismo cambio: requiere `brandId`
- Genera URLs individuales para cada email en el batch

#### `sendInvitations`
- Requiere `brandId`
- Construye URLs para todas las invitaciones pendientes
- Listo para integración con EmailAdapter

#### `resendEmailInvitation`
- Requiere `brandId` en el input
- Reconstruye la URL de invitación con el subdominio correcto

---

## 🧪 Testing

### Tests Actualizados
`packages/api/src/lib/host-tenant.test.ts`:
- ✅ `getBrandCanonicalUrl` con localhost
- ✅ `buildPoolUrl` con locale
- ✅ `buildInvitationUrl` con token
- ✅ `buildAuthCallbackUrl`

### Ejecutar tests:
```bash
cd packages/api
pnpm test host-tenant
```

---

## 🚀 Uso en Aplicaciones

### En el Admin Panel

Cuando se crea/envía una invitación, **debe incluirse el brandId**:

```typescript
// apps/admin/app/[locale]/(authenticated)/access/components/email-invitation-manager.tsx

const createInvitationMutation = trpc.access.createEmailInvitation.useMutation({
  onSuccess: () => {
    toastSuccess("Invitation sent!");
  }
});

// Al enviar:
createInvitationMutation.mutate({
  poolId: currentPool.id,
  accessPolicyId: policy.id,
  tenantId: currentTenant.id,
  brandId: currentBrand.id, // ← Obtener del contexto
  email: formData.email
});
```

### Obtener Brand del Contexto

En el admin, el brand se puede obtener de:
1. **Headers del middleware** (si está en subdomain)
2. **Query params** o **path params**
3. **Context provider** de React

Ejemplo:
```typescript
import { getCurrentBrand } from "@admin/lib/brandContext";

const brand = await getCurrentBrand();
const brandId = brand?.id;
```

---

## 🔧 Variables de Entorno

### Desarrollo (localhost)
```env
NEXT_PUBLIC_BASE_DOMAIN=localhost:3000
NODE_ENV=development
```

### Producción
```env
NEXT_PUBLIC_BASE_DOMAIN=quinielas.mx
NODE_ENV=production
```

Las funciones detectan automáticamente el entorno y usan el protocolo correcto.

---

## 📊 Flujo Completo de Invitación

```
1. Admin crea invitación desde: http://cocacola.localhost:3000/admin
   ↓
2. Router access.createEmailInvitation:
   - Recibe brandId
   - Obtiene brand de DB: { slug: "cocacola", domains: ["cocacola.localhost"] }
   - Construye URL: buildInvitationUrl(brand, poolSlug, token)
   - Resultado: "http://cocacola.localhost:3000/es-MX/pools/mundial-2026/join?token=abc123"
   ↓
3. Email enviado con URL correcta
   ↓
4. Usuario hace clic en el link
   ↓
5. Llega a: http://cocacola.localhost:3000/es-MX/pools/mundial-2026/join?token=abc123
   ↓
6. Middleware detecta subdomain "cocacola"
   ↓
7. Layout aplica tema de Coca-Cola
   ↓
8. Usuario ve página con branding correcto ✅
```

---

## 🔄 Flujo de Magic Link (Auth.js)

```
1. Usuario solicita login desde: http://pepsi.localhost:3000/es-MX/auth/signin
   ↓
2. Auth.js custom sendVerificationRequest:
   - Extrae hostname: "pepsi.localhost:3000"
   - Genera URL: "http://pepsi.localhost:3000/api/auth/callback/email?token=..."
   ↓
3. Email enviado con URL que preserva subdominio
   ↓
4. Usuario hace clic
   ↓
5. Callback procesa token
   ↓
6. Redirect a: http://pepsi.localhost:3000/es-MX
   ↓
7. Usuario logueado en el subdominio correcto ✅
```

---

## ⚠️ Consideraciones Importantes

### 1. Brand Context en Admin
El admin panel debe tener acceso al `brandId` actual. Opciones:
- Usar headers del middleware
- Context provider de React
- Query param en la URL

### 2. Cookies Cross-Subdomain (Producción)
En producción, las cookies de Auth.js se configuran con:
```typescript
domain: `.quinielas.mx` // Nota el punto inicial
```
Esto permite compartir sesión entre `cocacola.quinielas.mx` y `pepsi.quinielas.mx`.

### 3. Email Adapter Integration
Los routers actualmente **logean las URLs** pero no envían emails reales.

**Próximo paso:** Integrar con `EmailAdapter`:
```typescript
import { getEmailAdapter, emailTemplates } from "@qp/utils/email";

const emailAdapter = getEmailAdapter({
  provider: "smtp",
  smtp: { /* config */ }
});

await emailAdapter.send({
  to: invitation.email,
  ...emailTemplates.invitation({
    poolName: pool.name,
    inviteUrl: invitationUrl,
    expiresAt: invitation.expiresAt,
    brandName: brand.name
  })
});
```

### 4. Worker Jobs
Si se implementan workers para envío de emails en batch, deben:
- Obtener brand de la DB por cada invitación
- Construir URLs usando `buildInvitationUrl`
- Pasar `brandName` al template

---

## 📝 TODOs Pendientes

- [ ] Integrar EmailAdapter en routers de access
- [ ] Actualizar admin panel para pasar brandId
- [ ] Implementar worker job para envío de emails en batch
- [ ] Agregar tracking de emails (open/click) con subdomain correcto
- [ ] Documentar cómo obtener brandId en diferentes contextos
- [ ] Tests E2E con Playwright para flujo completo

---

## 🐛 Troubleshooting

### Las URLs no incluyen subdominio
**Causa:** `brandId` no se está pasando al router.
**Solución:** Verificar que el componente tenga acceso al brand actual.

### Magic links redirigen a localhost sin subdominio
**Causa 1:** Falta `trustHost: true` en la configuración de Auth.js.
**Solución:** Verificar que `packages/auth/src/config.ts` tenga:
```typescript
return {
  trustHost: true,
  // ...
}
```

**Causa 2:** Auth.js no está usando el custom `sendVerificationRequest`.
**Solución:** Verificar que `EMAIL_SERVER_HOST` esté configurado en `.env`.

**Causa 3:** El header `host` no se está pasando correctamente.
**Solución:** Verificar logs del servidor:
```bash
[auth] sendVerificationRequest called
[auth] Generated URL: http://cocacola.localhost:3000/api/auth/callback/email?...
[auth] Host from URL: cocacola.localhost:3000
```
Si el host es `localhost:3000` en lugar de `cocacola.localhost:3000`, el problema está en el middleware o en la configuración de Next.js.

### Cookies no se comparten entre subdominios
**Causa:** Configuración de cookies solo aplica en producción.
**Solución:** En desarrollo, cada subdominio tiene su propia sesión (esperado).

---

## ✅ Verificación

Para verificar que todo funciona:

1. **Seed de datos:**
   ```bash
   pnpm db:seed
   ```

2. **Configurar hosts:**
   ```bash
   .\scripts\setup-local-hosts.ps1
   ```

3. **Iniciar servidor:**
   ```bash
   pnpm dev
   ```

4. **Probar magic link:**
   - Ir a `http://cocacola.localhost:3000/es-MX/auth/signin`
   - Ingresar email
   - **Verificar en logs del servidor:**
     ```
     [auth] sendVerificationRequest called
     [auth] Email: user@example.com
     [auth] Generated URL: http://cocacola.localhost:3000/api/auth/callback/email?...
     [auth] Host from URL: cocacola.localhost:3000
     ```
   - La URL **DEBE incluir** `cocacola.localhost:3000`
   - Si muestra `localhost:3000`, falta `trustHost: true`

5. **Probar invitación:**
   - Crear invitación desde admin
   - Verificar en logs la URL generada
   - Debe incluir el subdominio del brand

---

## 📚 Referencias

- **Subdomain Setup:** `SUBDOMAIN_SETUP_ES.md`
- **Testing Guide:** `SUBDOMAIN_TESTING_GUIDE.md`
- **Auth Architecture:** `AUTH_ARCHITECTURE.md`
- **Project Rules:** `.windsurfrules`

---

**Última actualización:** 2025-01-16
**Autor:** Victor Mancera (Agencia)
