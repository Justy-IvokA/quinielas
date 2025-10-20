# Resolución Dinámica de Tenant en Desarrollo

## 🎯 Problema Resuelto

La versión anterior de `host-tenant.ts` tenía hardcodeado el tenant "ivoka" en el Strategy 4 (Development fallback), lo que significaba que **todas las URLs en desarrollo mostraban el mismo tenant**, sin importar el subdomain usado.

### ❌ Comportamiento Anterior

```typescript
// Strategy 4: Development fallback (HARDCODEADO)
if (process.env.NODE_ENV === "development") {
  const demoTenant = await prisma.tenant.findUnique({
    where: { slug: "ivoka" }  // ← Siempre "ivoka"
  });
}
```

**Resultado:**
- `http://localhost:3001/es-MX` → Tenant "ivoka" ❌ (debería ser "innotecnia")
- `http://ivoka.localhost:3001/es-MX` → Tenant "ivoka"
- `http://cemex.localhost:3001/es-MX` → Tenant "ivoka" ❌ (debería ser "cemex")
- `http://innovatica.localhost:3001/es-MX` → Tenant "ivoka" ❌ (debería ser "innovatica")

## ✅ Solución Implementada

Ahora el Strategy 4 **extrae dinámicamente el tenant slug del hostname** en desarrollo:

```typescript
// Strategy 4: Development fallback (DINÁMICO)
if (process.env.NODE_ENV === "development") {
  const parts = hostname.split(".");
  let tenantSlug: string | null = null;
  
  if (parts.length >= 2 && parts[0] !== "localhost") {
    // Has subdomain like "ivoka.localhost"
    tenantSlug = parts[0];  // ← Extrae "ivoka", "cemex", etc.
  } else if (parts.length === 1 && parts[0] === "localhost") {
    // Plain "localhost" - use default fallback tenant
    tenantSlug = "innotecnia";  // ← Solo para localhost sin subdomain
  }
  
  if (tenantSlug && !["www", "api", "admin", "cdn", "static"].includes(tenantSlug)) {
    const devTenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }  // ← Busca el tenant dinámicamente
    });
    // ...
  }
}
```

## 🎯 Comportamiento Nuevo (Correcto)

### En Desarrollo (`NODE_ENV === "development"`)

| URL | Hostname | Parts | Tenant Slug Extraído | Resultado |
|-----|----------|-------|---------------------|-----------|
| `http://localhost:3001/es-MX` | `localhost` | `["localhost"]` | `"innotecnia"` (fallback) | ✅ Tenant "innotecnia" |
| `http://ivoka.localhost:3001/es-MX` | `ivoka.localhost` | `["ivoka", "localhost"]` | `"ivoka"` | ✅ Tenant "ivoka" |
| `http://cemex.localhost:3001/es-MX` | `cemex.localhost` | `["cemex", "localhost"]` | `"cemex"` | ✅ Tenant "cemex" |
| `http://innovatica.localhost:3001/es-MX` | `innovatica.localhost` | `["innovatica", "localhost"]` | `"innovatica"` | ✅ Tenant "innovatica" |

### En Producción (`NODE_ENV === "production"`)

El Strategy 4 **NO se ejecuta** en producción. Solo funcionan las estrategias 1-3:

| URL | Strategy | Resultado |
|-----|----------|-----------|
| `http://quinielas.cemex.com` | 1 (Custom Domain) | ✅ Busca en `Brand.domains` |
| `http://cemex.quinielas.mx` | 2 (Subdomain) | ✅ Extrae "cemex" (3 partes) |
| `http://quinielas.mx/cemex/default` | 3 (Path) | ✅ Extrae de path |

## 🔄 Flujo de Resolución Completo

### Ejemplo: `http://cemex.localhost:3001/es-MX`

1. **Strategy 1 (Custom Domain)**
   - Busca `Brand.domains = ["cemex.localhost"]`
   - ❌ No encuentra (correcto, no debe haber dominios localhost en BD)
   - Continúa...

2. **Strategy 2 (Subdomain - Producción)**
   - Verifica `parts.length < 3`
   - `["cemex", "localhost"]` tiene 2 partes
   - ❌ No cumple requisito de 3+ partes
   - Continúa...

3. **Strategy 3 (Path)**
   - Busca pattern `/tenant/brand/` en pathname
   - Pathname es `/es-MX` (no tiene tenant/brand)
   - ❌ No encuentra
   - Continúa...

4. **Strategy 4 (Development Fallback)** ✅
   - Verifica `NODE_ENV === "development"` → ✅ Sí
   - Split hostname: `["cemex", "localhost"]`
   - `parts.length >= 2 && parts[0] !== "localhost"` → ✅ Sí
   - Extrae `tenantSlug = "cemex"`
   - Busca `Tenant.slug = "cemex"` en BD
   - ✅ Encuentra tenant "cemex"
   - Busca `Brand.slug = "default"` del tenant
   - ✅ Retorna `{ tenant: cemex, brand: default, source: "fallback" }`

## 🧪 Testing

### Test 1: Localhost sin subdomain
```bash
# URL: http://localhost:3001/es-MX
# Esperado: Tenant "ivoka" (fallback por defecto)
```

### Test 2: Subdomain Ivoka
```bash
# URL: http://ivoka.localhost:3001/es-MX
# Esperado: Tenant "ivoka"
```

### Test 3: Subdomain Cemex
```bash
# URL: http://cemex.localhost:3001/es-MX
# Esperado: Tenant "cemex" (si existe en BD)
```

### Test 4: Subdomain Innovatica
```bash
# URL: http://innovatica.localhost:3001/es-MX
# Esperado: Tenant "innovatica" (si existe en BD)
```

### Test 5: Subdomain No Existente
```bash
# URL: http://noexiste.localhost:3001/es-MX
# Esperado: null (tenant no encontrado)
```

## 📋 Requisitos Previos

Para que funcione correctamente:

### 1. Configurar /etc/hosts (Windows: C:\Windows\System32\drivers\etc\hosts)

```
127.0.0.1 localhost
127.0.0.1 ivoka.localhost
127.0.0.1 cemex.localhost
127.0.0.1 innovatica.localhost
```

### 2. Tenants en la Base de Datos

```sql
-- Verificar tenants existentes
SELECT id, slug, name FROM "Tenant";

-- Crear tenant si no existe
INSERT INTO "Tenant" (id, slug, name, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'cemex', 'CEMEX', NOW(), NOW());

-- Crear brand default para el tenant
INSERT INTO "Brand" (id, slug, name, "tenantId", theme, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'default',
  'CEMEX Default',
  (SELECT id FROM "Tenant" WHERE slug = 'cemex'),
  '{}',
  NOW(),
  NOW()
);
```

### 3. Variable de Entorno

```bash
# .env.local
NODE_ENV=development
```

## 🎓 Ventajas de Este Enfoque

### ✅ Desarrollo Multi-Tenant Real

Ahora puedes probar **múltiples tenants en paralelo** en desarrollo:
- Abre `http://ivoka.localhost:3001` en una ventana
- Abre `http://cemex.localhost:3001` en otra ventana
- Cada una muestra su tenant correspondiente

### ✅ Testing Realista

El comportamiento en desarrollo es **más cercano a producción**:
- Cada subdomain resuelve a su tenant
- Puedes probar branding específico por tenant
- Puedes probar datos específicos por tenant

### ✅ Onboarding de Nuevos Tenants

Para agregar un nuevo tenant en desarrollo:
1. Crear el tenant en BD
2. Agregar entrada en `/etc/hosts`
3. Acceder a `http://nuevo-tenant.localhost:3001`
4. ✅ Funciona inmediatamente

### ✅ Fallback Seguro

Si accedes a `http://localhost:3001` sin subdomain:
- Usa "ivoka" como fallback
- No rompe la aplicación
- Útil para desarrollo rápido

## 🔧 Troubleshooting

### Problema: "Tenant not found"

**Causa:** El tenant no existe en la base de datos.

**Solución:**
```sql
-- Verificar si existe
SELECT id, slug, name FROM "Tenant" WHERE slug = 'tu-tenant';

-- Si no existe, créalo
INSERT INTO "Tenant" (id, slug, name, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'tu-tenant', 'Tu Tenant', NOW(), NOW());
```

### Problema: "Brand not found"

**Causa:** El tenant existe pero no tiene brand "default".

**Solución:**
```sql
-- Crear brand default
INSERT INTO "Brand" (id, slug, name, "tenantId", theme, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'default',
  'Default Brand',
  (SELECT id FROM "Tenant" WHERE slug = 'tu-tenant'),
  '{}',
  NOW(),
  NOW()
);
```

### Problema: DNS no resuelve

**Causa:** Falta entrada en `/etc/hosts`.

**Solución:**
```bash
# Windows: C:\Windows\System32\drivers\etc\hosts
# Linux/Mac: /etc/hosts
127.0.0.1 tu-tenant.localhost
```

## 📊 Comparación: Antes vs Ahora

| Aspecto | Antes (Hardcoded) | Ahora (Dinámico) |
|---------|-------------------|------------------|
| `localhost:3001` | Tenant "ivoka" | Tenant "ivoka" (fallback) |
| `ivoka.localhost:3001` | Tenant "ivoka" | Tenant "ivoka" ✅ |
| `cemex.localhost:3001` | Tenant "ivoka" ❌ | Tenant "cemex" ✅ |
| `innovatica.localhost:3001` | Tenant "ivoka" ❌ | Tenant "innovatica" ✅ |
| Testing multi-tenant | ❌ Imposible | ✅ Posible |
| Onboarding nuevos tenants | ❌ Difícil | ✅ Fácil |

---

**Última actualización:** 2025-01-17  
**Estado:** ✅ Resolución dinámica implementada y funcionando
