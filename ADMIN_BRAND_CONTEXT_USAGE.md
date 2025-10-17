# 🎨 Admin Panel: Brand Context - Guía de Uso

## Resumen

El admin panel ahora tiene un **Context Provider** que proporciona acceso al `brand` y `tenant` actual en todos los componentes autenticados. Esto permite que las invitaciones y otros features incluyan el subdominio correcto del tenant.

---

## 📦 Componentes Creados

### 1. BrandProvider

**Archivo:** `apps/admin/app/providers/brand-context.tsx`

```typescript
<BrandProvider brand={brand} tenant={tenant}>
  {children}
</BrandProvider>
```

**Ubicación:** Envuelve todo el contenido en `(authenticated)/layout.tsx`

---

## 🎯 Hooks Disponibles

### `useBrand()`

Retorna el objeto completo de brand y tenant.

```typescript
import { useBrand } from "@admin/providers/brand-context";

function MyComponent() {
  const { brand, tenant } = useBrand();
  
  console.log(brand?.name); // "Coca-Cola"
  console.log(tenant?.slug); // "ivoka"
  
  return <div>{brand?.name}</div>;
}
```

### `useBrandId()`

Retorna solo el ID del brand (o `null` si no está disponible).

```typescript
import { useBrandId } from "@admin/providers/brand-context";

function MyComponent() {
  const brandId = useBrandId();
  
  // brandId: string | null
  console.log(brandId); // "clx123abc..."
  
  return <div>Brand ID: {brandId}</div>;
}
```

### `useTenantId()`

Retorna solo el ID del tenant (o `null` si no está disponible).

```typescript
import { useTenantId } from "@admin/providers/brand-context";

function MyComponent() {
  const tenantId = useTenantId();
  
  // tenantId: string | null
  console.log(tenantId); // "clx456def..."
  
  return <div>Tenant ID: {tenantId}</div>;
}
```

---

## 💡 Casos de Uso

### 1. Crear Invitaciones con Subdominio Correcto

**Archivo:** `access/components/email-invitation-manager.tsx`

```typescript
import { useBrandId, useTenantId } from "@admin/providers/brand-context";

export function EmailInvitationManager({ accessPolicyId }: Props) {
  const brandId = useBrandId();
  const tenantId = useTenantId();
  
  const createInvitationMutation = trpc.access.createEmailInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation created!");
    }
  });
  
  const handleCreateInvitation = (email: string) => {
    // Validate context
    if (!brandId || !tenantId) {
      toast.error("Brand or tenant not found");
      return;
    }
    
    createInvitationMutation.mutate({
      poolId: currentPool.id,
      accessPolicyId,
      tenantId,
      brandId, // ← CRÍTICO: Incluir brandId
      email
    });
  };
  
  return (
    // ... UI
  );
}
```

**Resultado:** La invitación se genera con la URL correcta:
```
http://cocacola.localhost:3000/es-MX/pools/mundial-2026/join?token=...
```

---

### 2. Reenviar Invitaciones

```typescript
import { useBrandId } from "@admin/providers/brand-context";

export function InvitationRow({ invitation }: Props) {
  const brandId = useBrandId();
  
  const resendMutation = trpc.access.resendEmailInvitation.useMutation();
  
  const handleResend = () => {
    if (!brandId) {
      toast.error("Brand not found");
      return;
    }
    
    resendMutation.mutate({
      id: invitation.id,
      brandId // ← Necesario para construir URL correcta
    });
  };
  
  return (
    <Button onClick={handleResend}>
      Resend
    </Button>
  );
}
```

---

### 3. Enviar Lote de Invitaciones

```typescript
import { useBrandId, useTenantId } from "@admin/providers/brand-context";

export function BulkInvitationUploader({ poolId, accessPolicyId }: Props) {
  const brandId = useBrandId();
  const tenantId = useTenantId();
  
  const uploadMutation = trpc.access.uploadInvitationsCsv.useMutation();
  
  const handleUpload = (emails: string[]) => {
    if (!brandId || !tenantId) {
      toast.error("Context not available");
      return;
    }
    
    uploadMutation.mutate({
      poolId,
      accessPolicyId,
      tenantId,
      brandId, // ← Todas las invitaciones usarán este brand
      emails
    });
  };
  
  return (
    // ... CSV uploader UI
  );
}
```

---

### 4. Mostrar Información del Brand

```typescript
import { useBrand } from "@admin/providers/brand-context";

export function BrandInfo() {
  const { brand, tenant } = useBrand();
  
  if (!brand || !tenant) {
    return <div>Loading brand info...</div>;
  }
  
  return (
    <div>
      <h2>{brand.name}</h2>
      <p>Tenant: {tenant.name}</p>
      <p>Slug: {brand.slug}</p>
      {brand.logoUrl && <img src={brand.logoUrl} alt={brand.name} />}
    </div>
  );
}
```

---

### 5. Generar Enlaces de Preview

```typescript
import { useBrand } from "@admin/providers/brand-context";

export function PoolPreviewLink({ poolSlug }: Props) {
  const { brand } = useBrand();
  
  if (!brand) return null;
  
  // Construir URL de preview
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost:3000";
  const protocol = baseDomain.includes('localhost') ? 'http' : 'https';
  const previewUrl = `${protocol}://${brand.slug}.${baseDomain}/es-MX/pools/${poolSlug}`;
  
  return (
    <a href={previewUrl} target="_blank" rel="noopener noreferrer">
      Preview Pool
    </a>
  );
}
```

---

## ⚠️ Consideraciones Importantes

### 1. Solo Disponible en Rutas Autenticadas

El `BrandProvider` solo está disponible dentro de `(authenticated)/layout.tsx`.

**✅ Funciona:**
```typescript
// apps/admin/app/[locale]/(authenticated)/pools/page.tsx
import { useBrandId } from "@admin/providers/brand-context";

export default function PoolsPage() {
  const brandId = useBrandId(); // ✅ Funciona
  return <div>{brandId}</div>;
}
```

**❌ No funciona:**
```typescript
// apps/admin/app/[locale]/auth/signin/page.tsx
import { useBrandId } from "@admin/providers/brand-context";

export default function SignInPage() {
  const brandId = useBrandId(); // ❌ Error: fuera del provider
  return <div>{brandId}</div>;
}
```

---

### 2. Validar Antes de Usar

Siempre valida que `brandId` y `tenantId` existan antes de usarlos:

```typescript
const brandId = useBrandId();
const tenantId = useTenantId();

if (!brandId || !tenantId) {
  // Manejar caso de error
  toast.error("Brand or tenant not found");
  return;
}

// Usar brandId y tenantId de forma segura
```

---

### 3. Server Components vs Client Components

El context **solo funciona en Client Components** (con `"use client"`).

**Para Server Components**, obtén el brand directamente:

```typescript
// Server Component
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";
import { headers } from "next/headers";

export default async function MyServerPage() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const { brand, tenant } = await resolveTenantAndBrandFromHost(host);
  
  return <div>{brand?.name}</div>;
}
```

---

## 🧪 Testing

### Test 1: Verificar Context en Componente

```typescript
// apps/admin/app/[locale]/(authenticated)/test-brand/page.tsx
"use client";

import { useBrand, useBrandId, useTenantId } from "@admin/providers/brand-context";

export default function TestBrandPage() {
  const { brand, tenant } = useBrand();
  const brandId = useBrandId();
  const tenantId = useTenantId();
  
  return (
    <div className="p-8">
      <h1>Brand Context Test</h1>
      <pre>{JSON.stringify({ brand, tenant, brandId, tenantId }, null, 2)}</pre>
    </div>
  );
}
```

**Acceder a:**
```
http://cocacola.localhost:4000/es-MX/test-brand
```

**Resultado esperado:**
```json
{
  "brand": {
    "id": "clx123...",
    "slug": "cocacola",
    "name": "Coca-Cola",
    "tenantId": "clx456..."
  },
  "tenant": {
    "id": "clx456...",
    "slug": "ivoka",
    "name": "Ivoka"
  },
  "brandId": "clx123...",
  "tenantId": "clx456..."
}
```

---

### Test 2: Crear Invitación

1. Acceder a: `http://cocacola.localhost:4000/admin/pools/mundial-2026/access`
2. Crear invitación para: `test@example.com`
3. Verificar logs del servidor:

```bash
[access] Invitation URL for test@example.com: http://cocacola.localhost:3000/es-MX/pools/mundial-2026/join?token=...
```

4. ✅ La URL debe incluir `cocacola.localhost`

---

## 📋 Checklist de Implementación

### Archivos Creados
- [x] `apps/admin/app/providers/brand-context.tsx` - Context provider
- [x] `apps/admin/app/[locale]/(authenticated)/layout.tsx` - Provider wrapper

### Componentes Actualizados
- [x] `access/components/email-invitation-manager.tsx` - Usa `useBrandId` y `useTenantId`

### Pendientes
- [ ] Actualizar otros componentes que creen invitaciones
- [ ] Agregar `poolId` desde route params en lugar de hardcoded
- [ ] Integrar EmailAdapter para envío real de correos
- [ ] Tests E2E del flujo completo

---

## 🔄 Flujo Completo

```
1. Admin accede a: http://cocacola.localhost:4000/admin
   ↓
2. Middleware NO modifica nada (solo auth check)
   ↓
3. AuthenticatedLayout:
   - Obtiene brand y tenant desde host
   - Envuelve children con BrandProvider
   ↓
4. Componente EmailInvitationManager:
   - Usa useBrandId() y useTenantId()
   - Pasa brandId al crear invitación
   ↓
5. Router access.createEmailInvitation:
   - Recibe brandId
   - Construye URL: buildInvitationUrl(brand, poolSlug, token)
   - Resultado: http://cocacola.localhost:3000/pools/mundial-2026/join?token=...
   ↓
6. Email enviado con URL correcta ✅
```

---

## 📚 Referencias

- **Auth Fix:** `AUTH_SUBDOMAIN_FIX_COMPLETE.md`
- **Admin Invitations:** `ADMIN_INVITATIONS_SUBDOMAIN.md`
- **Brand Context:** `apps/admin/app/providers/brand-context.tsx`
- **Email Integration:** `EMAIL_SUBDOMAIN_INTEGRATION.md`

---

**Fecha:** 2025-01-16  
**Status:** ✅ IMPLEMENTADO  
**Próximos pasos:** Integrar en más componentes del admin
