# 🔧 Solución: Enlaces sin Subdominio del Tenant

**Fecha:** 20 de Octubre, 2025  
**Problema:** Los enlaces en los emails de invitación no incluyen el subdominio del tenant

---

## 🔍 Diagnóstico del Problema

### Síntoma
Los emails muestran enlaces como:
```
http://localhost/es-MX/auth/register/liga-mx-14?token=...
```

En lugar de:
```
http://ivoka.localhost/es-MX/auth/register/liga-mx-14?token=...
```

### Causa Raíz Identificada

Después de revisar los archivos CSV de la base de datos, se identificaron **dos problemas**:

#### 1. **Campo `domains` con formato incorrecto**

En `Brand.csv`, el brand "ivoka" tiene:
```csv
"domains","{}","2025-10-15 21:08:25.529"
```

El valor `{}` es un **objeto vacío**, pero Prisma espera un **array de strings** (`String[]`).

**Schema esperado:**
```prisma
model Brand {
  domains String[] @default([])
}
```

**Valor correcto:** `[]` (array vacío)  
**Valor incorrecto:** `{}` (objeto vacío)

#### 2. **Posible falta de relación `tenant` en la query**

Si el brand no incluye la relación `tenant` al hacer la query, la función `getBrandCanonicalUrl()` no puede acceder a `brand.tenant.slug` y devuelve la URL sin subdominio.

---

## ✅ Soluciones Implementadas

### 1. **Logs de Debug Agregados**

Se agregaron logs detallados en dos lugares:

**a) En `packages/api/src/routers/access/index.ts`:**
```typescript
// Debug: Log brand and tenant info
console.log("[access] Brand info:", {
  brandId: brand.id,
  brandSlug: brand.slug,
  brandName: brand.name,
  tenantId: brand.tenantId,
  tenantSlug: brand.tenant?.slug,
  domains: brand.domains
});

// Build invitation URL
const invitationUrl = buildInvitationUrl(brand as any, invitation.pool.slug, invitation.token, locale);

console.log("[access] Generated invitation URL:", invitationUrl);
```

**b) En `packages/api/src/lib/host-tenant.ts`:**
```typescript
export function getBrandCanonicalUrl(brand: Brand & { tenant: Tenant }): string {
  // Debug logging
  console.log("[host-tenant] getBrandCanonicalUrl called with:", {
    brandId: brand.id,
    brandSlug: brand.slug,
    domains: brand.domains,
    domainsType: typeof brand.domains,
    domainsIsArray: Array.isArray(brand.domains),
    tenantSlug: brand.tenant?.slug,
    tenantExists: !!brand.tenant
  });

  // ... resto del código
}
```

### 2. **Validación Mejorada en `getBrandCanonicalUrl()`**

Se agregó validación para detectar cuando el tenant no existe:

```typescript
// Validate tenant exists
if (!brand.tenant || !brand.tenant.slug) {
  console.error("[host-tenant] ERROR: Brand has no tenant or tenant.slug!", {
    brandId: brand.id,
    tenant: brand.tenant
  });
  // Fallback to localhost without subdomain
  return `${protocol}://${baseDomain}`;
}
```

### 3. **Script de Corrección de Datos**

Se creó el script `scripts/fix-brand-domains.ts` para corregir el campo `domains` en todos los brands:

```bash
pnpm tsx scripts/fix-brand-domains.ts
```

Este script:
- ✅ Lee todos los brands de la base de datos
- ✅ Verifica si `domains` es un array
- ✅ Convierte objetos vacíos `{}` a arrays vacíos `[]`
- ✅ Muestra información detallada de cada brand

---

## 🚀 Pasos para Resolver

### Paso 1: Ejecutar el Script de Corrección

```bash
cd c:\Users\victo\Documents\reactNextJS\quinielas
pnpm tsx scripts/fix-brand-domains.ts
```

**Salida esperada:**
```
🔧 Fixing Brand.domains field...

Found 5 brands

📦 Brand: Ivoka (ivoka)
   Tenant: Ivoka (ivoka)
   Current domains: {}
   Type: object
   Is Array: false
   ⚠️  domains is not an array! Fixing...
   ✅ Fixed! Set to empty array []

📦 Brand: Coca-Cola (cocacola)
   Tenant: Ivoka (ivoka)
   Current domains: ["cocacola.localhost"]
   Type: object
   Is Array: true
   ✅ domains has 1 entries: ["cocacola.localhost"]

✅ Done! All brands checked and fixed.
```

### Paso 2: Verificar los Logs en Consola

Después de ejecutar el script, intenta enviar una invitación nuevamente y revisa los logs en la consola del servidor:

```bash
# En la terminal donde corre tu servidor (admin o worker)
# Deberías ver logs como:

[access] Brand info: {
  brandId: 'cmgshgjef0008uvw4nyv3ej8d',
  brandSlug: 'ivoka',
  brandName: 'Ivoka',
  tenantId: 'cmgyi6fh60006uvdkewm2mjaf',
  tenantSlug: 'ivoka',  // ✅ Debe aparecer aquí
  domains: []           // ✅ Debe ser un array vacío
}

[host-tenant] getBrandCanonicalUrl called with: {
  brandId: 'cmgshgjef0008uvw4nyv3ej8d',
  brandSlug: 'ivoka',
  domains: [],
  domainsType: 'object',
  domainsIsArray: true,  // ✅ Debe ser true
  tenantSlug: 'ivoka',   // ✅ Debe aparecer aquí
  tenantExists: true     // ✅ Debe ser true
}

[host-tenant] Using tenant subdomain: http://ivoka.localhost:3000

[access] Generated invitation URL: http://ivoka.localhost:3000/es-MX/auth/register/liga-mx-14?token=...
```

### Paso 3: Probar el Envío de Invitación

1. Ve al admin: `http://ivoka.localhost:3000/es-MX/pools/[pool-id]/invitations`
2. Haz clic en "Reenviar" en una invitación existente
3. Revisa el email recibido
4. **Verifica que el enlace ahora incluya el subdominio:** `http://ivoka.localhost:3000/es-MX/...`

---

## 🔍 Diagnóstico Adicional

Si después de ejecutar el script el problema persiste, revisa lo siguiente:

### 1. Verificar que el Tenant existe en la query

En `packages/api/src/routers/access/index.ts`, asegúrate de que la query incluya el tenant:

```typescript
const brand = await prisma.brand.findUnique({
  where: { id: input.brandId },
  include: { tenant: true }  // ✅ Debe estar presente
});
```

### 2. Verificar la variable de entorno

Revisa que `NEXT_PUBLIC_BASE_DOMAIN` esté configurada correctamente en tu `.env`:

```bash
# Para desarrollo local
NEXT_PUBLIC_BASE_DOMAIN=localhost:3000

# Para producción
NEXT_PUBLIC_BASE_DOMAIN=quinielas.mx
```

### 3. Verificar los datos en la base de datos

Ejecuta esta query en tu cliente de PostgreSQL:

```sql
SELECT 
  b.id,
  b.slug as brand_slug,
  b.name as brand_name,
  b.domains,
  t.slug as tenant_slug,
  t.name as tenant_name
FROM "Brand" b
JOIN "Tenant" t ON b."tenantId" = t.id
WHERE b.slug = 'ivoka';
```

**Resultado esperado:**
```
| brand_slug | brand_name | domains | tenant_slug | tenant_name |
|------------|------------|---------|-------------|-------------|
| ivoka      | Ivoka      | []      | ivoka       | Ivoka       |
```

---

## 🎯 Resultado Esperado

Después de aplicar las correcciones, los emails deben mostrar:

✅ **URL correcta con subdominio:**
```
http://ivoka.localhost:3000/es-MX/auth/register/liga-mx-14?token=34bc20b038bbca133e79e4174ca8b6cd2c90f445886e2a6acfeb5af66975392f
```

✅ **Logs en consola mostrando:**
- `tenantSlug: 'ivoka'`
- `domainsIsArray: true`
- `tenantExists: true`
- `Generated invitation URL: http://ivoka.localhost:3000/...`

---

## 📝 Archivos Modificados

1. ✅ `packages/api/src/routers/access/index.ts` - Logs de debug agregados
2. ✅ `packages/api/src/lib/host-tenant.ts` - Validación y logs mejorados
3. ✅ `scripts/fix-brand-domains.ts` - Script de corrección creado

---

## 🔄 Próximos Pasos (Opcional)

### Prevenir el problema en el futuro

1. **Agregar validación en el seed:**
   ```typescript
   // En packages/db/src/seed.ts
   domains: [] // Siempre usar array vacío, nunca {}
   ```

2. **Agregar test para verificar el formato:**
   ```typescript
   it("should always have domains as array", async () => {
     const brands = await prisma.brand.findMany();
     brands.forEach(brand => {
       expect(Array.isArray(brand.domains)).toBe(true);
     });
   });
   ```

3. **Agregar validación en el schema de Zod:**
   ```typescript
   domains: z.array(z.string()).default([])
   ```

---

## 📞 Soporte

Si el problema persiste después de seguir estos pasos:

1. Comparte los logs completos de la consola
2. Ejecuta la query SQL y comparte el resultado
3. Verifica que el script de corrección se ejecutó exitosamente

---

**¡El problema debería estar resuelto después de ejecutar el script! 🎉**
