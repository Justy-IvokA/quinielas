# Configuración de Dominios para Brands

**Fecha:** 2025-01-20  
**Estado:** ✅ Implementado  

## 📋 Resumen

Sistema completo para configurar dominios personalizados (custom domains) para cada brand en el sistema multi-tenant.

## 🎯 Características

### Backend API

**Nuevos Endpoints** (`trpc.superadmin.brands.*`):
- `get` - Obtener detalles de un brand con dominios
- `updateDomains` - Reemplazar todos los dominios
- `addDomain` - Agregar un dominio individual
- `removeDomain` - Eliminar un dominio individual

**Validaciones:**
- ✅ Formato de dominio válido (regex)
- ✅ Soporte para localhost en desarrollo
- ✅ Prevención de duplicados entre brands
- ✅ Audit logs para todas las operaciones

### Frontend UI

**Nueva Página:** `/superadmin/tenants/[id]/brands/[brandId]/domains`

**Funcionalidades:**
- 📋 Lista de dominios configurados
- ➕ Agregar nuevos dominios
- 🗑️ Eliminar dominios existentes
- 📋 Copiar URLs al portapapeles
- 🔗 Abrir dominios en nueva pestaña
- 📖 Instrucciones de configuración DNS

**Acceso:**
- Desde la página de detalle del tenant
- Botón "Configurar Dominios" en cada brand

## 🚀 Uso

### 1. Acceder a Configuración

1. Ve a `/superadmin/tenants`
2. Selecciona un tenant
3. En la sección "Marcas", haz clic en "Configurar Dominios"

### 2. Agregar Dominio

1. Clic en "Agregar Dominio"
2. Ingresa el dominio completo:
   - Producción: `quinielas.miempresa.com`
   - Desarrollo: `miempresa.localhost`
3. Clic en "Agregar Dominio"

### 3. Configurar DNS

**Para Producción:**
```
Tipo: CNAME
Nombre: quinielas (o tu subdominio)
Valor: tu-servidor.com (o IP con registro A)
TTL: 3600
```

**Para Desarrollo Local:**
```
Archivo: C:\Windows\System32\drivers\etc\hosts
Agregar: 127.0.0.1    miempresa.localhost
```

### 4. Verificar

- El dominio aparecerá en la lista
- Usa el botón de "Abrir" para verificar que resuelve
- El sistema usará el primer dominio como principal

## 🔧 Comportamiento del Sistema

### Sin Dominios Configurados
```typescript
// El sistema usa subdomain resolution automática
// URL: {tenant-slug}.tudominio.com
// Ejemplo: cemex.quinielas.mx
```

### Con Dominios Configurados
```typescript
// El sistema usa el primer dominio de la lista
brand.domains = ["quinielas.cemex.com", "pools.cemex.com"]
// URL principal: quinielas.cemex.com
```

### Resolución Multi-Estrategia

El sistema resuelve brands en este orden:

1. **Custom Domain** - Búsqueda exacta en `Brand.domains[]`
2. **Subdomain** - Extracción de `{tenant}.domain.com`
3. **Path-based** - Fallback para `/tenant/brand/...`
4. **Development** - Soporte para `*.localhost`

## 📁 Archivos Creados/Modificados

### Backend
- `packages/api/src/routers/superadmin/brands.ts` - Nuevo router
- `packages/api/src/routers/superadmin/schemas.ts` - Schemas para dominios
- `packages/api/src/routers/superadmin/index.ts` - Registro del router

### Frontend
- `apps/admin/app/[locale]/(authenticated)/superadmin/tenants/[id]/brands/[brandId]/domains/page.tsx` - Página de configuración
- `apps/admin/app/[locale]/(authenticated)/superadmin/tenants/[id]/page.tsx` - Botón de acceso

## 🔒 Seguridad

- ✅ Solo SUPERADMIN puede configurar dominios
- ✅ Validación de formato de dominio
- ✅ Prevención de duplicados
- ✅ Audit logs de todas las operaciones
- ✅ Verificación de existencia de brand

## 📊 Casos de Uso

### Caso 1: Cliente con Dominio Propio
```
Cliente: CEMEX
Brand: Quinielas CEMEX
Dominio: quinielas.cemex.com

Configuración:
1. Agregar dominio en UI
2. CEMEX configura CNAME en su DNS
3. Sistema resuelve automáticamente
```

### Caso 2: Múltiples Dominios
```
Cliente: Coca-Cola
Brand: Mundial 2026
Dominios:
  - mundial.cocacola.com (principal)
  - worldcup.cocacola.com (alternativo)
  - quinielas.cocacola.com (alternativo)

Todos resuelven al mismo brand
```

### Caso 3: Desarrollo Local
```
Desarrollador: Testing
Brand: Test Brand
Dominio: testbrand.localhost

Configuración:
1. Agregar en hosts file
2. Agregar en UI
3. Acceder via http://testbrand.localhost:3000
```

## 🎨 UI Features

### Página de Configuración

**Header:**
- Título con icono de globo
- Nombre del brand y tenant
- Botón "Volver a Tenant"

**Card de Instrucciones:**
- Pasos para configurar DNS
- Ejemplos de registros
- Notas sobre propagación

**Lista de Dominios:**
- Badge "Principal" en el primero
- Botones: Copiar, Abrir, Eliminar
- Estado visual de cada dominio

**Agregar Dominio:**
- Modal con input
- Validación en tiempo real
- Ejemplos de formato

## 🐛 Troubleshooting

### Dominio no resuelve

**Verifica:**
1. DNS configurado correctamente
2. Propagación completada (48h máximo)
3. Dominio agregado en la UI
4. Sin typos en el dominio

**Comando de verificación:**
```bash
nslookup quinielas.miempresa.com
# Debe resolver a la IP de tu servidor
```

### Error "Domain already in use"

**Causa:** Otro brand ya usa ese dominio

**Solución:**
1. Busca qué brand lo usa
2. Elimínalo del otro brand primero
3. Agrégalo al brand correcto

### Localhost no funciona

**Verifica:**
1. Archivo hosts actualizado
2. DNS cache limpiado: `ipconfig /flushdns`
3. Navegador sin cache (Ctrl+Shift+R)
4. Puerto correcto en URL

## 📈 Métricas

**Audit Logs capturados:**
- `ADD_BRAND_DOMAIN` - Dominio agregado
- `REMOVE_BRAND_DOMAIN` - Dominio eliminado
- `UPDATE_BRAND_DOMAINS` - Dominios reemplazados

**Metadata guardada:**
- Dominio afectado
- Actor (usuario que hizo el cambio)
- Timestamp
- Tenant y Brand IDs

## 🔄 Integración con Otros Módulos

### Email Templates
```typescript
// Usa el primer dominio para generar URLs
const inviteUrl = buildInvitationUrl(brand, poolSlug, token);
// → https://quinielas.miempresa.com/es-MX/auth/register/pool-slug?token=xxx
```

### Pool URLs
```typescript
// Copy URL usa el dominio configurado
const poolUrl = buildPoolUrl(brand, poolSlug);
// → https://quinielas.miempresa.com/es-MX/pools/pool-slug
```

### Auth Callbacks
```typescript
// Magic links usan el dominio del brand
const callbackUrl = buildAuthCallbackUrl(brand);
// → https://quinielas.miempresa.com/es-MX/auth/callback
```

## ✅ Testing Checklist

- [ ] SUPERADMIN puede acceder a configuración
- [ ] Agregar dominio válido funciona
- [ ] Agregar dominio inválido muestra error
- [ ] Agregar dominio duplicado muestra error
- [ ] Eliminar dominio funciona
- [ ] Copiar URL funciona
- [ ] Abrir dominio en nueva pestaña funciona
- [ ] Instrucciones DNS se muestran correctamente
- [ ] Audit logs se crean correctamente
- [ ] Sistema resuelve dominios custom correctamente
- [ ] Fallback a subdomain funciona sin dominios

## 🚀 Próximos Pasos (Opcional)

### Mejoras Futuras
- [ ] Verificación automática de DNS
- [ ] SSL/TLS status check
- [ ] Wildcard domains support (`*.miempresa.com`)
- [ ] Domain aliases (redirects)
- [ ] Bulk domain import (CSV)
- [ ] Domain expiration tracking
- [ ] DNS propagation checker

### Integraciones
- [ ] Cloudflare API integration
- [ ] Let's Encrypt auto-SSL
- [ ] CDN configuration
- [ ] Analytics per domain

## 📚 Referencias

- Código de resolución: `packages/api/src/lib/host-tenant.ts`
- Utilidades de dominio: `packages/branding/src/domainResolver.ts`
- Documentación de subdominios: `SUBDOMAIN_SETUP_ES.md`

## 🎉 Conclusión

El sistema de configuración de dominios está completamente implementado y listo para producción. Los SUPERADMIN pueden ahora configurar dominios personalizados para cada brand de forma visual y segura, con validaciones robustas y audit trail completo.
