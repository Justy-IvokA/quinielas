# Fix: Dominios Localhost en Brand.domains[]

## 🐛 Problema Raíz

Después de aplicar los fixes de `DEBUG_TENANT_RESOLUTION.md` y `FIX_HOSTNAME_PORT.md`, los componentes `branding-form.tsx` y `dashboard-analytics.tsx` dejaron de mostrar la información correcta para `http://ivoka.localhost:3001/es-MX`.

### Causa

Hay **Brands en la base de datos con dominios localhost** (ej: `domains = ["ivoka.localhost"]`), lo cual es **incorrecto** para desarrollo local.

Cuando el sistema resuelve el tenant:
1. ✅ **Strategy 1 (Custom Domain)**: Encuentra `Brand.domains = ["ivoka.localhost"]` 
2. ❌ **Nunca llega a Strategy 2 (Subdomain)**: Que es la correcta para desarrollo

Esto causa que:
- El Brand encontrado puede ser de otro tenant
- Los datos mostrados no corresponden al subdomain actual
- Los logs muestran: `[resolveTenantAndBrandFromHost] Found via custom domain: ivoka`

### Problema Secundario

Los logs excesivos de debugging estaban interfiriendo con las respuestas JSON de tRPC, causando:
```
SyntaxError: Unexpected non-whitespace character after JSON at position 1003
```

## ✅ Solución Aplicada

### 1. Limpieza de Logs

Se removieron los logs excesivos de:
- ✅ `packages/api/src/context.ts`
- ✅ `packages/api/src/lib/host-tenant.ts` (extractTenantFromSubdomain)
- ✅ `packages/api/src/lib/host-tenant.ts` (resolveTenantAndBrandFromHost)

Solo se mantienen logs de errores críticos.

### 2. Script SQL para Limpiar Dominios

Creado: `scripts/fix-localhost-domains.sql`

Este script:
1. Muestra qué Brands tienen dominios con `localhost`
2. Elimina esos dominios (los pone en `NULL`)
3. Verifica la limpieza

## 🚀 Pasos para Resolver

### Paso 1: Ejecutar el Script SQL

```bash
# Opción A: Usando psql
psql -U postgres -d quinielas_dev -f scripts/fix-localhost-domains.sql

# Opción B: Copiar y pegar en tu cliente SQL favorito
# (TablePlus, pgAdmin, DBeaver, etc.)
```

O ejecuta manualmente:

```sql
-- Ver Brands con dominios localhost
SELECT 
  t.slug as tenant_slug,
  b.slug as brand_slug,
  b.name as brand_name,
  b.domains
FROM "Brand" b
JOIN "Tenant" t ON b."tenantId" = t.id
WHERE b.domains IS NOT NULL 
  AND array_length(b.domains, 1) > 0
  AND b.domains::text LIKE '%localhost%';

-- Limpiar dominios localhost
UPDATE "Brand"
SET domains = NULL
WHERE domains::text LIKE '%localhost%';

-- Verificar
SELECT 
  t.slug as tenant_slug,
  b.slug as brand_slug,
  b.name as brand_name,
  b.domains
FROM "Brand" b
JOIN "Tenant" t ON b."tenantId" = t.id
WHERE b.domains IS NOT NULL 
  AND array_length(b.domains, 1) > 0;
```

### Paso 2: Reiniciar el Servidor

```bash
# Detener el servidor actual (Ctrl+C)
pnpm dev
```

### Paso 3: Verificar la Resolución

Accede a: `http://ivoka.localhost:3001/es-MX`

**Deberías ver:**
- ✅ Branding correcto de "Ivoka"
- ✅ Quinielas activas del tenant Ivoka
- ✅ Jugadores totales del tenant Ivoka
- ✅ Premios configurados del tenant Ivoka

**En los logs (mucho más limpios ahora):**
```
[admin-middleware] Access granted for user with role: TENANT_ADMIN
GET /es-MX 200 in XXms
```

**NO deberías ver:**
- ❌ `[resolveTenantAndBrandFromHost] Found via custom domain: ivoka`
- ❌ Logs excesivos de debugging
- ❌ Errores de JSON parse
- ❌ Datos de otro tenant

## 📋 Reglas para Brand.domains[]

### ✅ Correcto (Producción)

```json
{
  "domains": ["quinielas.cemex.com", "pools.cemex.mx"]
}
```

### ❌ Incorrecto (Desarrollo)

```json
{
  "domains": ["ivoka.localhost", "ivoka.localhost:3001"]
}
```

### 💡 Regla General

**NUNCA configures dominios localhost en `Brand.domains[]`**

- Los subdominios de desarrollo (`*.localhost`) se resuelven **automáticamente** por la estrategia de subdomain extraction
- Solo configura custom domains para **producción**
- Los dominios **NO deben incluir puerto**

## 🎯 Cómo Funciona la Resolución (Post-Fix)

### Para `http://ivoka.localhost:3001/es-MX`

1. **Limpieza de puerto**: `ivoka.localhost:3001` → `ivoka.localhost`
2. **Strategy 1 (Custom Domain)**: Busca `Brand.domains = ["ivoka.localhost"]` → ❌ No encuentra (correcto)
3. **Strategy 2 (Subdomain)**: Extrae `ivoka` del hostname → ✅ Encuentra `Tenant.slug = "ivoka"`
4. **Busca Brand default**: Encuentra `Brand.slug = "default"` del tenant Ivoka
5. **Retorna**: `{ tenant: ivoka, brand: default, source: "subdomain" }`

### Para `http://localhost:3001/es-MX`

1. **Strategy 1**: No encuentra custom domain
2. **Strategy 2**: `localhost` no tiene subdomain → Skip
3. **Strategy 4 (Fallback)**: Busca Brand con `domains = NULL` → Encuentra tenant "innotecnia" (agency)
4. **Retorna**: `{ tenant: innotecnia, brand: default, source: "fallback" }`

## 🧪 Testing

### Test 1: Subdomain Resolution

```bash
# URL: http://ivoka.localhost:3001/es-MX
# Esperado: Datos del tenant "ivoka"
```

### Test 2: Agency Fallback

```bash
# URL: http://localhost:3001/es-MX
# Esperado: Datos del tenant "innotecnia" (o tu tenant agency)
```

### Test 3: Branding Form

```bash
# URL: http://ivoka.localhost:3001/es-MX/branding
# Esperado: Tema del tenant "ivoka"
```

### Test 4: Dashboard Analytics

```bash
# URL: http://ivoka.localhost:3001/es-MX
# Esperado: Pools/Jugadores/Premios del tenant "ivoka"
```

## 📊 Archivos Modificados

- ✅ `packages/api/src/context.ts` - Logs removidos
- ✅ `packages/api/src/lib/host-tenant.ts` - Logs removidos
- ✅ `scripts/fix-localhost-domains.sql` - Script de limpieza creado

## 🔄 Próximos Pasos

1. **Ejecutar el script SQL** para limpiar dominios localhost
2. **Reiniciar el servidor** para aplicar cambios
3. **Verificar** que cada subdomain muestre sus datos correctos
4. **Eliminar** este documento y los de debugging una vez confirmado el fix

---

**Última actualización:** 2025-01-17  
**Estado:** ✅ Fix aplicado, pendiente ejecución de SQL
