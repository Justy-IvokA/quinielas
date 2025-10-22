# 🚀 Deploy a Vercel - Guía Rápida para MVP

Esta guía te ayudará a desplegar tu MVP en Vercel en menos de 30 minutos.

## 📋 Checklist Pre-Deploy

- [ ] Código en GitHub/GitLab/Bitbucket
- [ ] Base de datos PostgreSQL lista (Neon recomendado)
- [ ] Variables de entorno preparadas
- [ ] Build local exitoso (`pnpm build`)

## 🗄️ Paso 1: Configurar Base de Datos (5 min)

### Opción A: Neon (Recomendado - Gratis)

1. Ve a https://neon.tech
2. Crea cuenta (GitHub OAuth)
3. **New Project**:
   - Name: `quinielas-mvp`
   - Region: US East (más cercano)
   - PostgreSQL: 16
4. Copia el **Connection String**:
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Opción B: Supabase (Gratis)

1. Ve a https://supabase.com
2. **New Project**:
   - Name: `quinielas-mvp`
   - Database Password: (genera uno seguro)
   - Region: US East
3. Ve a **Settings → Database**
4. Copia **Connection String** (modo Pooling)

### Opción C: Vercel Postgres (Integrado)

1. En tu proyecto de Vercel
2. **Storage → Create Database → Postgres**
3. Automáticamente se conecta

## 🌐 Paso 2: Deploy Web App (10 min)

### 2.1 Conectar Repositorio

1. Ve a https://vercel.com
2. **Add New → Project**
3. **Import Git Repository**
4. Selecciona tu repo `quinielas`

### 2.2 Configurar Proyecto

**Framework Preset:** Next.js
**Root Directory:** `apps/web`
**Build Command:** `cd ../.. && pnpm build --filter=@qp/web`
**Output Directory:** `.next`
**Install Command:** `pnpm install`

### 2.3 Variables de Entorno

Agrega estas variables en **Environment Variables**:

```env
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Auth
NEXTAUTH_URL=https://tu-proyecto.vercel.app
NEXTAUTH_SECRET=genera-uno-con-openssl-rand-base64-32

# Sports API
NEXT_PUBLIC_SPORTS_API_KEY=tu-rapidapi-key

# Storage (Cloudinary recomendado para MVP)
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

# Email (opcional para MVP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=Quinielas <noreply@tu-dominio.com>
```

### 2.4 Deploy

1. Click **Deploy**
2. Espera 2-3 minutos
3. ¡Listo! Tu app está en `https://tu-proyecto.vercel.app`

## 🔧 Paso 3: Deploy Admin App (5 min)

### 3.1 Nuevo Proyecto

1. En Vercel: **Add New → Project**
2. Selecciona el mismo repo
3. **Root Directory:** `apps/admin`

### 3.2 Configuración

**Framework Preset:** Next.js
**Root Directory:** `apps/admin`
**Build Command:** `cd ../.. && pnpm build --filter=@qp/admin`
**Output Directory:** `.next`
**Install Command:** `pnpm install`

### 3.3 Variables de Entorno

Usa las **mismas variables** que en web app, pero cambia:

```env
NEXTAUTH_URL=https://admin-tu-proyecto.vercel.app
```

### 3.4 Deploy

Click **Deploy** y espera 2-3 minutos.

## 🔄 Paso 4: Migraciones de Base de Datos

### Desde tu Local

```bash
# Configura DATABASE_URL en .env
DATABASE_URL="postgresql://..."

# Aplica migraciones
pnpm --filter @qp/db prisma migrate deploy

# Seed de datos iniciales (opcional)
pnpm --filter @qp/db prisma db seed
```

### O desde Vercel CLI

```bash
# Instala Vercel CLI
npm i -g vercel

# Login
vercel login

# Link proyecto
vercel link

# Ejecuta comando
vercel env pull .env.production.local
pnpm --filter @qp/db prisma migrate deploy
```

## 🎨 Paso 5: Configurar Dominios (Opcional)

### Dominio Personalizado

1. En tu proyecto de Vercel
2. **Settings → Domains**
3. **Add Domain**: `quinielas.tudominio.com`
4. Sigue las instrucciones de DNS

### Subdominios

```
quinielas.tudominio.com  → Web App
admin.tudominio.com      → Admin App
```

## 🔐 Paso 6: Configurar Auth

### Generar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Configurar Providers (Opcional)

Si quieres OAuth (Google, GitHub, etc.):

1. Crea OAuth app en el provider
2. Agrega redirect URL: `https://tu-app.vercel.app/api/auth/callback/google`
3. Agrega variables:
   ```env
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

## 🤖 Paso 7: Worker (Background Jobs)

### Opción A: Railway (Recomendado - $5/mes)

1. Ve a https://railway.app
2. **New Project → Deploy from GitHub**
3. Selecciona tu repo
4. **Root Directory:** `apps/worker`
5. **Start Command:** `pnpm --filter @qp/worker start`
6. Agrega las mismas variables de entorno
7. Deploy

### Opción B: Render (Gratis con limitaciones)

1. Ve a https://render.com
2. **New → Background Worker**
3. Conecta GitHub
4. **Build Command:** `pnpm install && pnpm --filter @qp/worker build`
5. **Start Command:** `pnpm --filter @qp/worker start`

### Opción C: Sin Worker (MVP Mínimo)

Para el MVP inicial, puedes:
- Sincronizar fixtures manualmente
- Ejecutar scoring desde tu local
- Agregar worker después

## ✅ Verificación Post-Deploy

### Health Checks

```bash
# Web App
curl https://tu-proyecto.vercel.app

# Admin App
curl https://admin-tu-proyecto.vercel.app

# API Health
curl https://tu-proyecto.vercel.app/api/health
```

### Logs

1. En Vercel Dashboard
2. **Deployments → [tu deploy] → Logs**
3. Verifica que no haya errores

### Database Connection

1. Abre tu app
2. Intenta registrarte
3. Verifica que se cree el usuario en la DB

## 🐛 Troubleshooting Común

### Error: "Prisma Client not generated"

**Solución:** Agrega en `package.json` de web/admin:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Error: "Module not found @qp/..."

**Solución:** Verifica que el Build Command incluya `cd ../..`:

```bash
cd ../.. && pnpm build --filter=@qp/web
```

### Error: "Database connection failed"

**Solución:**
1. Verifica `DATABASE_URL` en variables de entorno
2. Asegúrate de incluir `?sslmode=require`
3. Verifica que las migraciones estén aplicadas

### Error: "NEXTAUTH_SECRET is not set"

**Solución:**
```bash
# Genera uno nuevo
openssl rand -base64 32

# Agrégalo en Vercel → Settings → Environment Variables
```

### Build Timeout

**Solución:** Vercel tiene límite de 45 min (Hobby). Si excedes:
1. Optimiza el build
2. Usa caché de Turbo
3. Considera plan Pro

## 📊 Monitoreo

### Vercel Analytics (Gratis)

1. En tu proyecto
2. **Analytics → Enable**
3. Ve métricas de performance

### Logs en Tiempo Real

```bash
# Instala Vercel CLI
npm i -g vercel

# Ver logs
vercel logs tu-proyecto.vercel.app
```

## 💰 Costos Estimados para MVP

| Servicio | Plan | Costo |
|----------|------|-------|
| Vercel (Web + Admin) | Hobby | **Gratis** |
| Neon PostgreSQL | Free Tier | **Gratis** |
| Railway (Worker) | Starter | **$5/mes** |
| Cloudinary | Free Tier | **Gratis** |
| **Total** | | **$5/mes** |

### Límites del Plan Gratuito

**Vercel Hobby:**
- ✅ Bandwidth: 100 GB/mes
- ✅ Builds: Ilimitados
- ✅ Deployments: Ilimitados
- ❌ Team members: 1
- ❌ Cron jobs: No

**Neon Free:**
- ✅ Storage: 0.5 GB
- ✅ Compute: 191.9 horas/mes
- ✅ Projects: 1
- ❌ Branches: 1

## 🚀 Mejoras Post-MVP

Cuando tu MVP esté validado:

1. **Vercel Pro** ($20/mes):
   - Cron jobs
   - Team collaboration
   - Más recursos

2. **Neon Scale** ($19/mes):
   - 10 GB storage
   - Autoscaling
   - Branching

3. **CDN para Assets**:
   - Cloudflare R2
   - AWS S3

4. **Monitoring**:
   - Sentry (error tracking)
   - Vercel Analytics Pro
   - Prisma Pulse

## 📝 Checklist Final

- [ ] Web app desplegada y funcionando
- [ ] Admin app desplegada y funcionando
- [ ] Database conectada y migrada
- [ ] Auth funcionando (registro/login)
- [ ] Variables de entorno configuradas
- [ ] Dominios configurados (opcional)
- [ ] Worker desplegado (opcional)
- [ ] Health checks pasando
- [ ] Logs sin errores críticos

## 🎉 ¡Listo!

Tu MVP está en producción. Ahora puedes:

1. Compartir el link con usuarios beta
2. Recolectar feedback
3. Iterar rápidamente
4. Escalar cuando sea necesario

---

**Tiempo total estimado:** 30-45 minutos

**Costo mensual:** $0-5 USD

**¿Preguntas?** Revisa la documentación de Vercel: https://vercel.com/docs
