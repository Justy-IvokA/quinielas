# 📧 Admin Panel: Invitaciones con Subdominios

## Resumen

El panel de administración ahora genera invitaciones que **preservan el subdominio del tenant**, asegurando que los usuarios invitados lleguen al brand correcto con el tema y contexto apropiados.

---

## 🔄 Flujo Completo de Invitación

### Escenario: Admin de Coca-Cola invita usuarios

```
1. Admin accede a: http://cocacola.localhost:4000/admin/pools/mundial-2026/access
   ↓
2. Crea invitación por email para: user@example.com
   ↓
3. Router access.createEmailInvitation:
   - Recibe brandId de Coca-Cola
   - Obtiene brand de DB: { slug: "cocacola", domains: ["cocacola.localhost"] }
   - Construye URL: buildInvitationUrl(brand, "mundial-2026", token)
   - Resultado: "http://cocacola.localhost:3000/es-MX/pools/mundial-2026/join?token=abc123"
   ↓
4. Email enviado con URL correcta
   ↓
5. Usuario hace clic en el link
   ↓
6. Llega a: http://cocacola.localhost:3000/es-MX/pools/mundial-2026/join?token=abc123
   ↓
7. Middleware detecta subdomain "cocacola"
   ↓
8. Layout aplica tema de Coca-Cola
   ↓
9. Usuario ve página con branding correcto ✅
```

---

## 🎯 Componentes Involucrados

### 1. Admin Auth Route Handler

**Archivo:** `apps/admin/app/api/auth/[...nextauth]/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const headersList = await headers();
  const host = headersList.get('host');
  
  // CRITICAL FIX: Set AUTH_URL dynamically based on host header
  if (host) {
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const authUrl = `${protocol}://${host}`;
    process.env.AUTH_URL = authUrl;
  }
  
  const { handlers } = NextAuth(authConfig);
  return handlers.POST(request);
}
```

**Propósito:** 
- Asegura que los magic links del admin también preserven el subdominio
- Permite que admins se autentiquen en el subdominio correcto

---

### 2. Access Router (tRPC)

**Archivo:** `packages/api/src/routers/access/index.ts`

Los endpoints de invitaciones ya están preparados para usar subdominios:

#### `createEmailInvitation`
```typescript
createEmailInvitation: publicProcedure
  .input(createEmailInvitationSchema)
  .mutation(async ({ input }) => {
    const { poolId, accessPolicyId, tenantId, brandId, email, expiresAt } = input;
    
    // Get brand and pool info
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { tenant: true }
    });
    
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      select: { slug: true }
    });
    
    // Build invitation URL with correct subdomain
    const invitationUrl = buildInvitationUrl(brand, pool.slug, token);
    
    // TODO: Send email with invitationUrl
    console.log(`[access] Invitation URL for ${email}: ${invitationUrl}`);
    
    return invitation;
  });
```

#### `sendInvitations`
```typescript
sendInvitations: publicProcedure
  .input(sendInvitationsSchema)
  .mutation(async ({ input }) => {
    const { poolId, tenantId, brandId, invitationIds } = input;
    
    // Get brand info
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { tenant: true }
    });
    
    // Build invitation URLs for each invitation
    const invitationsWithUrls = invitations.map((inv) => ({
      ...inv,
      url: buildInvitationUrl(brand, pool.slug, inv.token)
    }));
    
    // Send emails with correct subdomain URLs
    invitationsWithUrls.forEach((inv) => {
      console.log(`[access] Sending invitation to ${inv.email}: ${inv.url}`);
    });
    
    return { sent: invitations.length };
  });
```

---

### 3. URL Builder Functions

**Archivo:** `packages/api/src/lib/host-tenant.ts`

```typescript
export function buildInvitationUrl(
  brand: Brand & { tenant: Tenant },
  poolSlug: string,
  token: string,
  locale: string = 'es-MX'
): string {
  const baseUrl = getBrandCanonicalUrl(brand);
  return `${baseUrl}/${locale}/pools/${poolSlug}/join?token=${token}`;
}

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
  
  return `${protocol}://${brand.slug}.${baseDomain}`;
}
```

---

## 🔧 Configuración Requerida en Admin Panel

Para que las invitaciones incluyan el subdominio correcto, el admin panel debe:

### 1. Pasar `brandId` al crear invitaciones

**Ejemplo en componente de admin:**

```typescript
// apps/admin/app/[locale]/(authenticated)/pools/[poolId]/access/page.tsx

const createInvitationMutation = trpc.access.createEmailInvitation.useMutation({
  onSuccess: () => {
    toast.success("Invitation created!");
  }
});

const handleCreateInvitation = (email: string) => {
  createInvitationMutation.mutate({
    poolId: currentPool.id,
    accessPolicyId: policy.id,
    tenantId: currentTenant.id,
    brandId: currentBrand.id, // ← CRÍTICO: Incluir brandId
    email: email
  });
};
```

### 2. Obtener Brand del Contexto

El admin debe tener acceso al `brandId` actual. Opciones:

#### Opción A: Desde middleware (recomendado)
```typescript
// apps/admin/middleware.ts
export async function middleware(request: NextRequest) {
  const { tenant, brand } = await resolveTenantAndBrand(request);
  
  // Agregar a headers para acceso en componentes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenant?.id || '');
  requestHeaders.set('x-brand-id', brand?.id || '');
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
```

#### Opción B: Context Provider
```typescript
// apps/admin/app/providers/brand-context.tsx
export const BrandProvider = ({ children, brand }) => {
  return (
    <BrandContext.Provider value={brand}>
      {children}
    </BrandContext.Provider>
  );
};

// Uso en componentes
const brand = useBrand();
const brandId = brand?.id;
```

---

## 📊 Verificación

### Logs Esperados en Admin

Cuando un admin crea una invitación desde `http://cocacola.localhost:4000`:

```bash
[admin-auth-route] POST Request
[admin-auth-route] Host header: cocacola.localhost:4000
[admin-auth-route] Setting AUTH_URL to: http://cocacola.localhost:4000

[access] Invitation URL for user@example.com: http://cocacola.localhost:3000/es-MX/pools/mundial-2026/join?token=abc123
```

### Email Recibido

El usuario recibe un email con:

```html
<a href="http://cocacola.localhost:3000/es-MX/pools/mundial-2026/join?token=abc123">
  Join Coca-Cola Pool
</a>
```

✅ La URL incluye el subdominio de Coca-Cola

---

## 🌐 Desarrollo vs Producción

### Desarrollo

**Admin Panel:**
```
http://cocacola.localhost:4000/admin
```

**Invitación Generada:**
```
http://cocacola.localhost:3000/es-MX/pools/mundial-2026/join?token=...
```

### Producción

**Admin Panel:**
```
https://admin.cocacola.quinielas.mx
```

**Invitación Generada:**
```
https://cocacola.quinielas.mx/es-MX/pools/mundial-2026/join?token=...
```

**Nota:** El admin puede estar en un subdominio diferente (`admin.cocacola`) pero las invitaciones apuntan al subdominio del player (`cocacola`).

---

## ⚠️ Consideraciones Importantes

### 1. Brand Context en Admin

El admin **DEBE** tener acceso al `brandId` actual para generar invitaciones correctas. Sin esto, las invitaciones no incluirán el subdominio.

### 2. Múltiples Brands por Tenant

Si un tenant tiene múltiples brands:
- El admin debe seleccionar el brand específico al crear invitaciones
- Cada brand genera invitaciones con su propio subdominio

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
    inviteUrl: invitationUrl, // ← URL con subdominio correcto
    expiresAt: invitation.expiresAt,
    brandName: brand.name
  })
});
```

---

## 🧪 Testing

### Test 1: Crear invitación desde admin de Coca-Cola

```bash
# 1. Acceder al admin
http://cocacola.localhost:4000/admin/pools/mundial-2026/access

# 2. Crear invitación para: test@example.com

# 3. Verificar logs:
[access] Invitation URL for test@example.com: http://cocacola.localhost:3000/es-MX/pools/mundial-2026/join?token=...

# 4. Verificar que la URL incluye "cocacola.localhost"
```

### Test 2: Crear invitación desde admin de Pepsi

```bash
# 1. Acceder al admin
http://pepsi.localhost:4000/admin/pools/verano-2026/access

# 2. Crear invitación para: test@example.com

# 3. Verificar logs:
[access] Invitation URL for test@example.com: http://pepsi.localhost:3000/es-MX/pools/verano-2026/join?token=...

# 4. Verificar que la URL incluye "pepsi.localhost"
```

---

## ✅ Checklist de Implementación

- [x] Fix de Auth.js aplicado a `apps/admin`
- [x] Routers de access preparados para recibir `brandId`
- [x] Funciones de construcción de URLs listas
- [ ] Admin panel pasa `brandId` al crear invitaciones
- [ ] Context provider o middleware para obtener brand actual
- [ ] Integración con EmailAdapter para envío real
- [ ] Tests E2E del flujo completo

---

## 📚 Referencias

- **Auth Fix:** `AUTH_SUBDOMAIN_FIX_COMPLETE.md`
- **Email Integration:** `EMAIL_SUBDOMAIN_INTEGRATION.md`
- **Access Router:** `packages/api/src/routers/access/index.ts`
- **URL Builders:** `packages/api/src/lib/host-tenant.ts`

---

**Fecha:** 2025-01-16  
**Status:** ✅ Auth fix aplicado | ⚠️ Pendiente: pasar brandId en admin UI
