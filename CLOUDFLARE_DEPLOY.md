# Deploy en Cloudflare - Guía Completa

## 🎯 Arquitectura de Deploy

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📱 Web App (Pages)                                      │
│  └─ quinielas.tudominio.com                             │
│     ├─ Next.js 15 (App Router)                          │
│     └─ Edge Runtime                                      │
│                                                          │
│  🔧 Admin App (Pages)                                    │
│  └─ admin.tudominio.com                                 │
│     ├─ Next.js 15 (App Router)                          │
│     └─ Node.js Runtime                                   │
│                                                          │
│  ⚙️ Worker (Cloudflare Workers)                         │
│  └─ workers.tudominio.com                               │
│     ├─ Background Jobs                                   │
│     ├─ Fixtures Sync                                     │
│     └─ Email Batches                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ↓
              ┌──────────────────────┐
              │  PostgreSQL Database  │
              │  (Neon/Supabase)     │
              └──────────────────────┘
```

## 📋 Prerequisitos

### 1. Cuenta de Cloudflare
- Crea una cuenta en https://dash.cloudflare.com
- Agrega tu dominio a Cloudflare
- Configura los nameservers

### 2. Base de Datos PostgreSQL
Opciones recomendadas:

**Opción A: Neon (Recomendado)**
- ✅ Serverless PostgreSQL
- ✅ Free tier generoso
- ✅ Branching para dev/staging
- 🔗 https://neon.tech

**Opción B: Supabase**
- ✅ PostgreSQL + Auth + Storage
- ✅ Free tier disponible
- 🔗 https://supabase.com

**Opción C: Railway**
- ✅ PostgreSQL + Redis
- ✅ $5/mes
- 🔗 https://railway.app

### 3. Servicio de Email
Opciones:

**Opción A: Resend (Recomendado)**
- ✅ 3,000 emails/mes gratis
- ✅ Excelente DX
- 🔗 https://resend.com

**Opción B: SendGrid**
- ✅ 100 emails/día gratis
- 🔗 https://sendgrid.com

## 🚀 Paso 1: Configurar Base de Datos

### 1.1 Crear Base de Datos en Neon

```bash
# 1. Ve a https://console.neon.tech
# 2. Crea un nuevo proyecto "quinielas-prod"
# 3. Copia la connection string:
#    postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb
```

### 1.2 Aplicar Migraciones

```bash
# En tu .env local, temporalmente usa la DB de producción
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb"

# Aplica el schema
pnpm db:push

# Genera el cliente
pnpm db:generate

# Ejecuta el seed (opcional)
pnpm seed
```

## 🔐 Paso 2: Variables de Entorno

### 2.1 Web App (apps/web)

Crea estas variables en Cloudflare Pages:

```bash
# Database
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb

# Auth.js
AUTH_URL=https://quinielas.tudominio.com
AUTH_SECRET=tu-secret-de-32-caracteres-minimo

# Email Provider
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@tudominio.com

# App URLs
NEXT_PUBLIC_WEBAPP_URL=https://quinielas.tudominio.com
NEXT_PUBLIC_ADMIN_URL=https://admin.tudominio.com
NEXT_PUBLIC_APP_NAME=Quinielas

# Sports API
SPORTS_API_KEY=tu-api-key-de-api-football

# Node Environment
NODE_ENV=production
```

### 2.2 Admin App (apps/admin)

```bash
# Database
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb

# Auth.js
AUTH_URL=https://admin.tudominio.com
AUTH_SECRET=tu-secret-de-32-caracteres-minimo

# Email Provider
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=re_xxxxxxxxxxxxx
EMAIL_FROM=admin@tudominio.com

# App URLs
NEXT_PUBLIC_WEBAPP_URL=https://quinielas.tudominio.com
NEXT_PUBLIC_ADMIN_URL=https://admin.tudominio.com
NEXT_PUBLIC_APP_NAME=Quinielas Admin

# Sports API
SPORTS_API_KEY=tu-api-key-de-api-football

# Node Environment
NODE_ENV=production
```

## 📦 Paso 3: Configurar Build

### 3.1 Instalar Wrangler (CLI de Cloudflare)

```bash
pnpm add -D wrangler
```

### 3.2 Crear Configuración de Cloudflare Pages

Crea `apps/web/wrangler.toml`:

```toml
name = "quinielas-web"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[build]
command = "pnpm build"

[build.upload]
format = "service-worker"

[[build.upload.rules]]
type = "ESModule"
globs = ["**/*.js"]
```

Crea `apps/admin/wrangler.toml`:

```toml
name = "quinielas-admin"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[build]
command = "pnpm build"

[build.upload]
format = "service-worker"

[[build.upload.rules]]
type = "ESModule"
globs = ["**/*.js"]
```

### 3.3 Actualizar package.json

Agrega scripts de deploy:

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "deploy:web": "pnpm --filter @qp/web run deploy",
    "deploy:admin": "pnpm --filter @qp/admin run deploy",
    "deploy:all": "pnpm deploy:web && pnpm deploy:admin"
  }
}
```

## 🌐 Paso 4: Deploy en Cloudflare Pages

### Opción A: Deploy desde GitHub (Recomendado)

#### 4.1 Conectar Repositorio

1. Ve a https://dash.cloudflare.com
2. Pages → Create a project
3. Connect to Git → Selecciona tu repo
4. Configura el build:

**Para Web App:**
```
Project name: quinielas-web
Production branch: main
Build command: cd apps/web && pnpm build
Build output directory: apps/web/.next
Root directory: /
Node version: 20
```

**Para Admin App:**
```
Project name: quinielas-admin
Production branch: main
Build command: cd apps/admin && pnpm build
Build output directory: apps/admin/.next
Root directory: /
Node version: 20
```

#### 4.2 Configurar Variables de Entorno

En cada proyecto de Pages:
1. Settings → Environment variables
2. Agrega todas las variables listadas en el Paso 2
3. Guarda los cambios

#### 4.3 Configurar Dominios Personalizados

1. Pages → Tu proyecto → Custom domains
2. Agrega tu dominio:
   - Web: `quinielas.tudominio.com`
   - Admin: `admin.tudominio.com`
3. Cloudflare creará automáticamente los registros DNS

### Opción B: Deploy Manual con Wrangler

```bash
# 1. Login en Cloudflare
npx wrangler login

# 2. Deploy Web App
cd apps/web
pnpm build
npx wrangler pages deploy .next --project-name=quinielas-web

# 3. Deploy Admin App
cd ../admin
pnpm build
npx wrangler pages deploy .next --project-name=quinielas-admin
```

## ⚙️ Paso 5: Configurar Worker para Background Jobs

### 5.1 Crear Worker

Crea `apps/worker/wrangler.toml`:

```toml
name = "quinielas-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
name = "quinielas-worker"

# Cron triggers
[triggers]
crons = [
  "*/15 * * * *",  # Lock predictions every 15 minutes
  "0 */6 * * *"    # Sync fixtures every 6 hours
]

# Variables de entorno
[vars]
NODE_ENV = "production"

# Secrets (configura con wrangler secret put)
# DATABASE_URL
# SPORTS_API_KEY
```

### 5.2 Deploy Worker

```bash
cd apps/worker

# Configura secrets
npx wrangler secret put DATABASE_URL
npx wrangler secret put SPORTS_API_KEY

# Deploy
npx wrangler deploy
```

## 🔧 Paso 6: Configuración Post-Deploy

### 6.1 Configurar CORS

En Cloudflare Dashboard:
1. Tu dominio → Rules → Transform Rules
2. Agrega reglas para permitir CORS entre web y admin

### 6.2 Configurar Redirects

Crea `apps/web/public/_redirects`:

```
# Redirect root to default locale
/  /es-MX  302

# Redirect old URLs
/pools/*  /es-MX/pools/:splat  301
```

### 6.3 Configurar Headers de Seguridad

Crea `apps/web/public/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## 🧪 Paso 7: Verificar Deploy

### 7.1 Checklist de Verificación

- [ ] Web app carga correctamente
- [ ] Admin app carga correctamente
- [ ] Login con magic link funciona
- [ ] Base de datos conecta correctamente
- [ ] Emails se envían correctamente
- [ ] Worker ejecuta cron jobs
- [ ] Dominios personalizados funcionan
- [ ] SSL/TLS está activo
- [ ] Redirects funcionan

### 7.2 Comandos de Verificación

```bash
# Verificar Web App
curl -I https://quinielas.tudominio.com

# Verificar Admin App
curl -I https://admin.tudominio.com

# Verificar API Health
curl https://admin.tudominio.com/api/trpc/health

# Ver logs del Worker
npx wrangler tail quinielas-worker
```

## 🐛 Troubleshooting

### Error: "Module not found"

**Solución:**
```bash
# Regenera node_modules
rm -rf node_modules
pnpm install

# Regenera Prisma client
pnpm db:generate
```

### Error: "Database connection failed"

**Solución:**
1. Verifica que `DATABASE_URL` esté configurada
2. Verifica que la IP de Cloudflare esté permitida en tu DB
3. Para Neon, habilita "IP Allow List" → "Allow all"

### Error: "Auth.js session not working"

**Solución:**
1. Verifica que `AUTH_URL` coincida con tu dominio
2. Verifica que `AUTH_SECRET` tenga mínimo 32 caracteres
3. Limpia cookies del navegador

### Error: "Email not sending"

**Solución:**
1. Verifica credenciales de SMTP
2. Para Gmail, usa App Password
3. Para Resend, verifica que el dominio esté verificado

## 📊 Monitoreo

### Cloudflare Analytics

1. Dashboard → Analytics
2. Monitorea:
   - Requests por segundo
   - Bandwidth usage
   - Cache hit ratio
   - Error rates

### Logs en Tiempo Real

```bash
# Web App logs
npx wrangler pages deployment tail --project-name=quinielas-web

# Admin App logs
npx wrangler pages deployment tail --project-name=quinielas-admin

# Worker logs
npx wrangler tail quinielas-worker
```

## 💰 Costos Estimados

### Cloudflare Pages (Free Tier)
- ✅ 500 builds/mes
- ✅ Unlimited requests
- ✅ Unlimited bandwidth
- ✅ 100 custom domains

### Cloudflare Workers (Free Tier)
- ✅ 100,000 requests/día
- ✅ 10ms CPU time/request

### Neon Database (Free Tier)
- ✅ 0.5 GB storage
- ✅ 1 project
- ✅ Unlimited compute

**Total: $0/mes** (con free tiers)

## 🚀 Optimizaciones

### 1. Habilitar Caching

```typescript
// apps/web/next.config.js
export default {
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, must-revalidate',
        },
      ],
    },
  ],
}
```

### 2. Habilitar Image Optimization

Cloudflare Pages soporta Next.js Image Optimization automáticamente.

### 3. Configurar Edge Caching

```typescript
// apps/web/app/api/trpc/[trpc]/route.ts
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
```

## 📚 Recursos Adicionales

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Neon Docs](https://neon.tech/docs/introduction)
- [Resend Docs](https://resend.com/docs)

## 🎉 ¡Listo!

Tu aplicación Quinielas WL ahora está desplegada en Cloudflare con:
- ✅ Alta disponibilidad global
- ✅ SSL/TLS automático
- ✅ CDN integrado
- ✅ Escalabilidad automática
- ✅ Costo $0 (free tier)
