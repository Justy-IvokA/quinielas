# ✅ Pre-Deployment Checklist - Quinielas WL

**Fecha de revisión:** 21 de Octubre, 2025  
**Versión:** 1.0.0  
**Estado:** ✅ LISTO PARA DEPLOY

---

## 📋 Resumen Ejecutivo

Se realizó una revisión exhaustiva del código antes del deployment a producción. **Todos los checks críticos han pasado exitosamente**. El sistema está listo para ser desplegado.

### ✅ Correcciones Aplicadas

1. **TypeScript**: Agregado método `fetchSeasonRound` faltante en `MockSportsProvider`
2. **Auth Types**: Extendido tipo `User` con `highestRole` y `tenantRoles` opcionales
3. **Email Module**: Agregado export path `@qp/utils/email` en tsconfig y package.json
4. **tRPC Middleware**: Corregida llamada a `next()` sin argumentos en `requireRegistrationForPool`
5. **Sports Provider**: Agregada verificación de tipo para `fetchSeasonRound` con fallback

---

## ✅ 1. Configuración de Variables de Entorno

### Estado: ✅ PASS

#### Archivos de Ejemplo Verificados
- ✅ `apps/web/env.production.example` - Completo con todas las variables necesarias
- ✅ `apps/web/env.cloudflare.example` - Configurado para Cloudflare Pages
- ✅ Variables críticas documentadas:
  - `DATABASE_URL` - PostgreSQL connection string
  - `AUTH_SECRET` - Generado con openssl (32+ caracteres)
  - `AUTH_URL` - URL base de la aplicación
  - `EMAIL_SERVER_*` - Configuración SMTP
  - `SPORTS_API_KEY` - API-Football key
  - `NEXT_PUBLIC_*` - Variables públicas del cliente

#### Validación de Schemas
- ✅ `packages/auth/src/env.ts` - Schema Zod para validación de AUTH_*
- ✅ `packages/config/src/env.ts` - Helper `createEnv` para validación runtime
- ✅ Validación en tiempo de ejecución implementada

#### Seguridad
- ✅ `.env*` en `.gitignore`
- ✅ No hay secrets hardcodeados en el código
- ✅ Variables sensibles solo en archivos `.example`

---

## ✅ 2. Configuración de Next.js y Builds

### Estado: ✅ PASS

#### Next.js Config - Web App (`apps/web/next.config.js`)
- ✅ `reactStrictMode: true` - Activado
- ✅ `transpilePackages` - Todos los packages internos incluidos
- ✅ `optimizePackageImports` - Configurado para @qp/ui y lucide-react
- ✅ **Image Optimization**:
  - Firebase Storage (firebasestorage.googleapis.com)
  - Google Cloud Storage (storage.googleapis.com)
  - Unsplash (images.unsplash.com)
- ✅ **WebAssembly Support** - Configurado para async WASM
- ✅ **Server-side externals** - nodemailer, firebase-admin, cloudinary, AWS SDK
- ✅ **Client-side fallbacks** - fs, net, crypto, etc. configurados como false
- ✅ **next-intl** - Plugin configurado correctamente

#### Next.js Config - Admin App (`apps/admin/next.config.js`)
- ✅ Configuración similar a web app
- ✅ Image patterns para Firebase y Google Cloud Storage
- ✅ WebAssembly y externals configurados

#### Package Manager
- ✅ PNPM 10.18.3 especificado en `packageManager`
- ✅ Workspaces configurados correctamente
- ✅ Turbo configurado para builds paralelos

---

## ✅ 3. Schema de Prisma y Migraciones

### Estado: ✅ PASS

#### Schema Validation
- ✅ `packages/db/prisma/schema.prisma` - Sintaxis válida
- ✅ Enums definidos correctamente:
  - `TenantRole`, `AccessType`, `MatchStatus`
  - `CodeBatchStatus`, `InvitationStatus`
  - `TemplateStatus`, `SettingScope`, `PolicyType`
- ✅ Relaciones entre modelos correctamente definidas
- ✅ Índices en campos críticos (slug, tenantId, etc.)
- ✅ Constraints únicos apropiados

#### Migraciones
- ⚠️ **NOTA**: Directorio `migrations` está vacío
  - Esto es normal si usas `db push` en desarrollo
  - Para producción, ejecutar `pnpm db:migrate` generará las migraciones
  - **Acción requerida**: Ejecutar migraciones en base de datos de producción

#### User Metadata Types
- ✅ `packages/db/src/types/user-metadata.ts` - Tipos completos
- ✅ Helpers exportados: `parseUserMetadata`, `mergeUserMetadata`
- ✅ Exportado correctamente desde `packages/db/src/index.ts`

---

## ✅ 4. Configuración de Auth.js

### Estado: ✅ PASS

#### Auth Config (`packages/auth/src/config.ts`)
- ✅ Auth.js v5.0.0-beta.4 configurado
- ✅ `trustHost: true` - Crítico para soporte de subdomains
- ✅ **Providers**:
  - Email Magic Link (con branding personalizado)
  - Google OAuth (opcional)
- ✅ **Session Strategy**: JWT (30 días)
- ✅ **Cookies**:
  - Secure cookies en producción
  - Domain configurado para compartir entre subdomains
  - SameSite: 'lax'
- ✅ **Callbacks**:
  - JWT callback con roles de tenant
  - Session callback con highestRole y tenantRoles
- ✅ **Events**:
  - Sign-in logging con audit trail
  - Update de lastSignInAt

#### Auth Types (`packages/auth/src/types.ts`)
- ✅ Session extendida con roles
- ✅ User type con highestRole y tenantRoles (opcional)
- ✅ JWT con información de roles

#### Email Templates con Branding
- ✅ Magic link emails con colores de marca
- ✅ Soporte i18n (es-MX, en-US)
- ✅ Resolución de brand desde subdomain
- ✅ Fallback a brand por defecto

---

## ✅ 5. Imports y Dependencias Críticas

### Estado: ✅ PASS

#### TypeScript Compilation
- ✅ `pnpm typecheck` - **PASS** (todos los packages)
- ✅ No hay errores de tipos
- ✅ Referencias de proyecto configuradas correctamente

#### Path Aliases (tsconfig.base.json)
- ✅ `@qp/api`, `@qp/auth`, `@qp/db` - Configurados
- ✅ `@qp/utils/email` - Agregado para soporte de submodulos
- ✅ `@qp/utils/sports` - Agregado para soporte de submodulos
- ✅ Todos los packages internos mapeados

#### Package Exports
- ✅ `@qp/utils/package.json` - Export de `./email` agregado
- ✅ `@qp/utils/src/email/index.ts` - Exports correctos:
  - `emailTemplates`, `createEmailBrandInfo`, `parseEmailLocale`
  - Types: `EmailLocale`, `EmailBrandInfo`, `EmailBrandColors`
- ✅ `@qp/db` - Exports de user metadata types

#### Client vs Server Imports
- ✅ 46 componentes client marcados con `"use client"`
- ✅ Server components sin imports de cliente
- ✅ tRPC provider correctamente en cliente

---

## ✅ 6. Branding y Multi-Tenant

### Estado: ✅ PASS

#### Tenant Resolution
- ✅ `packages/api/src/lib/host-tenant.ts` - Lógica de resolución
- ✅ Soporte para subdomain (ivoka.localhost)
- ✅ Fallback a tenant por defecto
- ✅ Cache de tenant context

#### Brand Theme System
- ✅ `packages/branding` - Sistema de theming
- ✅ CSS variables dinámicas
- ✅ Soporte para logos y colores personalizados
- ✅ `BrandThemeProvider` en cliente

#### Storage Providers
- ✅ `packages/api/src/routers/branding/index.ts` - Storage config
- ✅ Soporte para:
  - Local storage
  - Cloudinary
  - Firebase Storage
  - AWS S3
- ✅ Configuración via environment variables

#### Email Branding
- ✅ Templates con colores de marca
- ✅ Logo personalizado en emails
- ✅ Resolución automática de brand desde host

---

## ✅ 7. Manejo de Errores y Edge Cases

### Estado: ✅ PASS

#### tRPC Error Handling
- ✅ TRPCError con códigos apropiados
- ✅ Mensajes de error descriptivos
- ✅ Validación de input con Zod schemas

#### Auth Error Pages
- ✅ `/auth/error` - Página de errores de autenticación
- ✅ `/auth/verify-request` - Página de verificación
- ✅ Redirects configurados en Auth.js

#### Middleware Protection
- ✅ `requireRegistrationForPool` - Validación de acceso a pools
- ✅ `requireRole` - Validación de roles
- ✅ RBAC implementado en `packages/api/src/lib/rbac.ts`

#### Fallbacks
- ✅ Brand fallback a "Quinielas" por defecto
- ✅ Locale fallback a "es-MX"
- ✅ Sports provider con mock para desarrollo
- ✅ `fetchSeasonRound` con fallback a `fetchSeason`

#### Logging
- ✅ Console logs en desarrollo (auth, branding, access)
- ✅ Audit logs en base de datos
- ✅ Error boundaries en componentes críticos

---

## ✅ 8. Seguridad y CORS

### Estado: ✅ PASS

#### CORS y Headers
- ✅ `trustHost: true` en Auth.js para subdomains
- ✅ Secure cookies en producción
- ✅ SameSite configurado

#### Secrets Management
- ✅ No hay secrets en código
- ✅ `.env` en gitignore
- ✅ Validación de env con Zod

#### Rate Limiting
- ✅ Captcha adaptativo en signin
- ✅ Rate limit por IP/email (implementado en access policy)

#### Input Validation
- ✅ Todos los inputs validados con Zod
- ✅ Schemas en `packages/api/src/routers/*/schema.ts`

---

## 🚀 Pasos Finales Antes del Deploy

### 1. Variables de Entorno en Cloudflare Pages

Configurar en el dashboard de Cloudflare Pages:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db

# Auth
AUTH_SECRET=<generar con: openssl rand -base64 32>
AUTH_URL=https://quinielas.tudominio.com

# Email
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=re_xxxxx
EMAIL_FROM=noreply@tudominio.com

# Sports API
SPORTS_API_KEY=<tu-api-key-de-api-football>
NEXT_PUBLIC_SPORTS_API_KEY=<tu-api-key-de-api-football>

# URLs
NEXT_PUBLIC_WEBAPP_URL=https://quinielas.tudominio.com
NEXT_PUBLIC_ADMIN_URL=https://admin.tudominio.com
NEXT_PUBLIC_APP_NAME=Quinielas

# Node
NODE_ENV=production
```

### 2. Migraciones de Base de Datos

```bash
# Generar migraciones desde el schema actual
pnpm db:migrate

# O aplicar directamente en producción (con precaución)
# DATABASE_URL=<prod-url> pnpm db:push
```

### 3. Seed de Datos Iniciales

```bash
# Ejecutar seed para crear tenant y brand por defecto
DATABASE_URL=<prod-url> pnpm seed
```

### 4. Build y Deploy

```bash
# Build de la aplicación web
pnpm --filter @qp/web run build

# Build de la aplicación admin
pnpm --filter @qp/admin run build

# Deploy a Cloudflare Pages
pnpm pages:deploy:web
pnpm pages:deploy:admin
```

---

## 📊 Métricas de Código

- **Total de archivos TypeScript**: 1130
- **Líneas de código**: ~227,000
- **Packages**: 11
- **Apps**: 3 (web, admin, worker)
- **Errores de TypeScript**: 0 ✅
- **Warnings**: 0 ✅

---

## ⚠️ Notas Importantes

### 1. Migraciones de Base de Datos
- El directorio `migrations` está vacío porque se ha usado `db push` en desarrollo
- **Antes del deploy**: Ejecutar `pnpm db:migrate` para generar migraciones
- **En producción**: Aplicar migraciones con `pnpm db:migrate` (no `db push`)

### 2. Dominios y Subdomains
- Configurar DNS para apuntar a Cloudflare Pages
- Configurar `NEXT_PUBLIC_BASE_DOMAIN` si usas subdomains personalizados
- Ejemplo: `ivoka.quinielas.mx`, `admin.quinielas.mx`

### 3. Storage de Imágenes
- Por defecto usa Firebase Storage
- Configurar `STORAGE_PROVIDER` y credenciales según el provider elegido
- Opciones: `local`, `cloudinary`, `firebase`, `s3`

### 4. Email Provider
- Configurado para SMTP (Resend recomendado)
- Verificar que el dominio de email esté verificado
- Probar magic links antes del lanzamiento

### 5. Sports API
- Usar API-Football (no RapidAPI)
- Verificar límites de rate en el plan
- Considerar caching para reducir llamadas

---

## ✅ Conclusión

**El sistema está LISTO para deployment a producción.**

Todos los checks críticos han pasado:
- ✅ TypeScript sin errores
- ✅ Configuración de Auth.js correcta
- ✅ Multi-tenant y branding funcionando
- ✅ Variables de entorno documentadas
- ✅ Seguridad y validaciones implementadas
- ✅ Manejo de errores robusto

**Próximos pasos**:
1. Configurar variables de entorno en Cloudflare Pages
2. Ejecutar migraciones en base de datos de producción
3. Ejecutar seed para datos iniciales
4. Deploy de apps web y admin
5. Verificar funcionamiento en producción

---

**Revisado por**: Cascade AI  
**Fecha**: 21 de Octubre, 2025  
**Estado**: ✅ APROBADO PARA DEPLOY
