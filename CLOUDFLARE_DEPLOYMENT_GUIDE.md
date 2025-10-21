# 🚀 Guía de Deployment en Cloudflare - Paso a Paso

Esta guía te llevará de la mano para desplegar tu aplicación Quinielas WL en Cloudflare con **costo $0** usando los free tiers.

## 📊 Resumen de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    CLOUDFLARE                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📱 Web App (Cloudflare Pages)                          │
│  └─ quinielas.tudominio.com                             │
│     ├─ Next.js 15.5.4 (App Router)                      │
│     └─ @cloudflare/next-on-pages                        │
│                                                          │
│  🔧 Admin App (Cloudflare Pages)                        │
│  └─ admin.tudominio.com                                 │
│     ├─ Next.js 15.5.4 (App Router)                      │
│     └─ @cloudflare/next-on-pages                        │
│                                                          │
│  ⚙️ Worker (Cloudflare Workers)                         │
│  └─ Background Jobs (Cron)                              │
│     ├─ Fixtures Sync (cada 6 horas)                     │
│     ├─ Prediction Lock (cada 15 min)                    │
│     └─ Scoring (diario)                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ↓
              ┌──────────────────────┐
              │  PostgreSQL Database │
              │  (Tu servidor)       │
              │  216.238.75.97:5432  │
              └──────────────────────┘
```

## Costos Estimados (FREE TIER)

| Servicio | Plan | Límites | Costo |
|----------|------|---------|-------|
| **Cloudflare Pages** | Free | 500 builds/mes, Unlimited requests | **$0** |
| **Cloudflare Workers** | Free | 100,000 requests/día | **$0** |
| **Cloudflare Workers (Free Tier)** | | 10ms CPU time/request | **$0** |
| **PostgreSQL Database** | | Tu servidor dedicado (216.238.75.97) | **$0** |
| **Resend (Email)** | Free | 3,000 emails/mes | **$0** |
| **API-Football** | Free | 100 requests/día | **$0** |
| **TOTAL** | | | **$0/mes** |

---

## PASO 1: Preparar Servicios Externos
## 🎯 PASO 1: Preparar Servicios Externos

### 1.1 ✅ Base de Datos PostgreSQL (Ya Configurada)

**Tu base de datos ya está lista para usar:**

```
Host: 216.238.75.97
Port: 5432
Database: quinielas
User: admin
Password: ********** (usa tu contraseña real)

Connection String:
postgresql://admin:TU_PASSWORD@216.238.75.97:5432/quinielas?schema=public
```

**✅ No necesitas crear una nueva base de datos.** Puedes pasar directamente a configurar el servicio de email.

### 1.2 Configurar Resend para Emails

1. Ve a **https://resend.com**
2. Crea una cuenta (gratis)
3. Ve a **API Keys** → **Create API Key**
4. Configura:
   - **Name**: `quinielas-production`
   - **Permission**: Full Access
5. **Copia tu API key** (empieza con `re_`)
6. Ve a **Domains** → **Add Domain**
7. Agrega tu dominio y verifica los registros DNS

**💡 Tip**: Mientras verificas tu dominio, puedes usar el dominio de prueba de Resend.

### 1.3 Obtener API Key de API-Football

1. Ve a **https://rapidapi.com/api-sports/api/api-football**
2. Crea una cuenta o inicia sesión
3. Suscríbete al plan **Free** (100 requests/día)
4. **Copia tu API Key** de RapidAPI
5. Guárdala para usarla después

---

## 🎯 PASO 2: Configurar Base de Datos

### 2.1 Aplicar Migraciones

Desde tu terminal local:

```powershell
# 1. Configura la DATABASE_URL de producción
$env:DATABASE_URL="postgresql://admin:TU_PASSWORD@216.238.75.97:5432/quinielas?schema=public"

# 2. Genera el cliente de Prisma
pnpm db:generate

# 3. Aplica las migraciones
pnpm db:push

# 4. (Opcional) Ejecuta el seed para datos de prueba
pnpm seed
```

**⚠️ Importante**: Después de esto, restaura tu `DATABASE_URL` local si usas una diferente para desarrollo.

### 2.2 Verificar Conexión

```powershell
# Verifica que las tablas se crearon correctamente
pnpm --filter @qp/db exec prisma studio
```

Esto abrirá Prisma Studio para ver tu base de datos de producción.

---

## 🎯 PASO 3: Configurar Cloudflare

### 3.1 Crear Cuenta en Cloudflare

1. Ve a **https://dash.cloudflare.com**
2. Crea una cuenta (gratis)
3. Agrega tu dominio (si tienes uno)
4. Actualiza los nameservers en tu registrador de dominios

**💡 Tip**: Si no tienes dominio, Cloudflare te dará subdominios gratuitos como:
- `quinielas-web.pages.dev`
- `quinielas-admin.pages.dev`

### 3.2 Autenticar Wrangler CLI

```powershell
# Login en Cloudflare
npx wrangler login
```

Esto abrirá tu navegador para autenticarte.

---

## 🎯 PASO 4: Desplegar Web App

### 4.1 Build Local (Prueba)

```powershell
# Navega a la app web
cd apps/web

# Build con Next.js
pnpm build

# Build para Cloudflare Pages
pnpm pages:build
```

Si el build es exitoso, verás:
```
✨ Compiled Worker successfully
```

### 4.2 Deploy a Cloudflare Pages

**Opción A: Deploy Manual (Primera vez)**

```powershell
# Desde apps/web
pnpm pages:deploy

# Sigue las instrucciones:
# 1. Selecciona tu cuenta de Cloudflare
# 2. Nombre del proyecto: quinielas-web
# 3. Production branch: main
```

**Opción B: Deploy desde GitHub (Recomendado)**

1. Ve a **Cloudflare Dashboard** → **Pages** → **Create a project**
2. Click **"Connect to Git"**
3. Selecciona tu repositorio
4. Configura:
   - **Project name**: `quinielas-web`
   - **Production branch**: `main`
   - **Framework preset**: `Next.js`
   - **Build command**: `cd apps/web && pnpm install && pnpm build && pnpm pages:build`
   - **Build output directory**: `apps/web/.vercel/output/static`
   - **Root directory**: `/`
   - **Node version**: `20`
5. Click **"Save and Deploy"**

### 4.3 Configurar Variables de Entorno

En Cloudflare Dashboard:

1. **Pages** → **quinielas-web** → **Settings** → **Environment variables**
2. Click **"Add variable"** para cada una:

```bash
# Database (tu servidor PostgreSQL)
DATABASE_URL=postgresql://admin:TU_PASSWORD@216.238.75.97:5432/quinielas?schema=public

# Auth.js (genera con: openssl rand -base64 32)
AUTH_URL=https://quinielas-web.pages.dev
AUTH_SECRET=tu-secret-de-32-caracteres

# Email (Resend)
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@tudominio.com

# App URLs
NEXT_PUBLIC_WEBAPP_URL=https://quinielas-web.pages.dev
NEXT_PUBLIC_ADMIN_URL=https://quinielas-admin.pages.dev
NEXT_PUBLIC_APP_NAME=Quinielas

# Sports API
SPORTS_API_KEY=tu-api-key-de-rapidapi
SPORTS_API_HOST=api-football-v1.p.rapidapi.com

# Environment
NODE_ENV=production
```

3. Click **"Save"**
4. **Redeploy** el proyecto para aplicar las variables

### 4.4 Configurar Dominio Personalizado (Opcional)

1. **Pages** → **quinielas-web** → **Custom domains**
2. Click **"Set up a custom domain"**
3. Ingresa: `quinielas.tudominio.com`
4. Cloudflare configurará automáticamente los registros DNS
5. Espera 5-10 minutos para la propagación

---

## 🎯 PASO 5: Desplegar Admin App

Repite el proceso del Paso 4 pero para la app admin:

```powershell
# Navega a la app admin
cd apps/admin

# Build
pnpm build
pnpm pages:build

# Deploy
pnpm pages:deploy
```

**Configuración en Cloudflare Dashboard:**
- **Project name**: `quinielas-admin`
- **Build command**: `cd apps/admin && pnpm install && pnpm build && pnpm pages:build`
- **Build output directory**: `apps/admin/.vercel/output/static`
- **Custom domain**: `admin.tudominio.com`

**Variables de entorno**: Usa las mismas que web app, pero cambia:
```bash
AUTH_URL=https://quinielas-admin.pages.dev
NEXT_PUBLIC_ADMIN_URL=https://quinielas-admin.pages.dev
EMAIL_FROM=admin@tudominio.com
```

---

## 🎯 PASO 6: Desplegar Worker (Background Jobs)

### 6.1 Configurar Secrets

```powershell
# Navega al worker
cd apps/worker

# Configura los secrets (uno por uno)
npx wrangler secret put DATABASE_URL
# Pega tu connection string cuando te lo pida

npx wrangler secret put SPORTS_API_KEY
# Pega tu API key

npx wrangler secret put EMAIL_SERVER_PASSWORD
# Pega tu Resend API key
```

### 6.2 Deploy Worker

```powershell
# Deploy
pnpm deploy

# Verifica que se desplegó correctamente
npx wrangler tail quinielas-worker-prod
```

### 6.3 Verificar Cron Jobs

En Cloudflare Dashboard:

1. **Workers & Pages** → **quinielas-worker-prod**
2. **Triggers** → **Cron Triggers**
3. Verifica que estén configurados:
   - `*/15 * * * *` - Lock predictions (cada 15 min)
   - `0 */6 * * *` - Sync fixtures (cada 6 horas)
   - `0 2 * * *` - Daily scoring (2 AM UTC)

---

## 🎯 PASO 7: Verificar Deployment

### 7.1 Checklist de Verificación

Abre tu navegador y verifica:

- [ ] **Web app carga**: https://quinielas-web.pages.dev
- [ ] **Admin app carga**: https://quinielas-admin.pages.dev
- [ ] **Login funciona** (magic link)
- [ ] **Emails se envían** correctamente
- [ ] **Base de datos conecta** (crea un tenant de prueba)
- [ ] **SSL/TLS activo** (candado verde en navegador)

### 7.2 Verificar Logs

```powershell
# Ver logs de Web App
npx wrangler pages deployment tail --project-name=quinielas-web

# Ver logs de Admin App
npx wrangler pages deployment tail --project-name=quinielas-admin

# Ver logs de Worker
npx wrangler tail quinielas-worker-prod
```

### 7.3 Probar Worker Manualmente

```powershell
# Trigger manual del worker (para testing)
npx wrangler dev apps/worker/src/index.ts
```

---

## 🎯 PASO 8: Optimizaciones Post-Deploy

### 8.1 Configurar Caching

En Cloudflare Dashboard:

1. **Caching** → **Configuration**
2. **Browser Cache TTL**: 4 hours
3. **Always Online**: Enabled

### 8.2 Habilitar Analytics

1. **Analytics & Logs** → **Web Analytics**
2. Click **"Enable"**
3. Agrega el snippet a tu app (opcional)

### 8.3 Configurar Alertas

1. **Notifications** → **Add**
2. Configura alertas para:
   - Deployment failures
   - High error rates
   - Worker failures

---

## 🐛 Troubleshooting

### Error: "Module not found" durante build

**Solución:**
```powershell
# Limpia node_modules y reinstala
rm -rf node_modules
pnpm install

# Regenera Prisma client
pnpm db:generate

# Intenta build de nuevo
pnpm --filter @qp/web run pages:build
```

### Error: "Database connection failed"

**Solución:**
1. Verifica que `DATABASE_URL` esté configurada correctamente
2. Verifica que el firewall de tu servidor PostgreSQL permita conexiones desde Cloudflare
3. Cloudflare usa IPs dinámicas, asegúrate de permitir conexiones externas en tu servidor
4. Verifica que el puerto 5432 esté abierto en tu firewall

### Error: "Auth.js session not working"

**Solución:**
1. Verifica que `AUTH_URL` coincida exactamente con tu dominio
2. Verifica que `AUTH_SECRET` tenga mínimo 32 caracteres
3. Limpia cookies del navegador
4. Verifica que `AUTH_TRUST_HOST=true` en producción

### Error: "Email not sending"

**Solución:**
1. Verifica que tu dominio esté verificado en Resend
2. Verifica las credenciales SMTP
3. Revisa los logs de Resend: https://resend.com/logs

### Error: "Worker timeout"

**Solución:**
1. Optimiza las queries de base de datos
2. Agrega índices en Prisma schema
3. Considera usar batching para operaciones grandes

---

## 📊 Monitoreo y Mantenimiento

### Cloudflare Analytics

Ve a **Dashboard** → **Analytics** para ver:
- Requests por segundo
- Bandwidth usage
- Cache hit ratio
- Error rates
- Geographic distribution

### Neon Database Monitoring

Ve a **Neon Console** → **Monitoring** para ver:
- Storage usage
- Active connections
- Query performance
- Compute time

### Resend Email Monitoring

Ve a **Resend Dashboard** → **Logs** para ver:
- Emails enviados
- Delivery rate
- Bounce rate
- Open rate (si está habilitado)

---

## 🚀 Próximos Pasos

### 1. Configurar CI/CD Automático

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: pnpm install
      - run: pnpm --filter @qp/web run pages:build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy apps/web/.vercel/output/static --project-name=quinielas-web

  deploy-admin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: pnpm install
      - run: pnpm --filter @qp/admin run pages:build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy apps/admin/.vercel/output/static --project-name=quinielas-admin

  deploy-worker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: pnpm install
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy
          workingDirectory: apps/worker
```

### 2. Configurar Staging Environment

Crea un branch `staging` y configura:
- `quinielas-web-staging.pages.dev`
- `quinielas-admin-staging.pages.dev`
- Base de datos separada en Neon (branch feature)

### 3. Implementar Monitoring Avanzado

Considera agregar:
- **Sentry** para error tracking
- **LogTail** para logs centralizados
- **Uptime Robot** para monitoring de uptime

---

## 📚 Recursos Adicionales

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Resend Documentation](https://resend.com/docs)
- [API-Football Docs](https://www.api-football.com/documentation-v3)

---

## ✅ Resumen

Has desplegado exitosamente tu aplicación Quinielas WL en Cloudflare con:

- ✅ **2 Apps Next.js** en Cloudflare Pages (web + admin)
- ✅ **1 Worker** para background jobs con cron triggers
- ✅ **PostgreSQL** en Neon (serverless)
- ✅ **Email** con Resend
- ✅ **SSL/TLS** automático
- ✅ **CDN global** de Cloudflare
- ✅ **Costo total: $0/mes** (free tiers)

**¡Felicidades! 🎉**

Tu aplicación está lista para recibir tráfico en producción.
