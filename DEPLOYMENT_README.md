# 🚀 Deployment en Cloudflare - Quick Start

Esta guía rápida te ayudará a desplegar tu aplicación en **menos de 30 minutos** con **costo $0**.

## 📦 ¿Qué se va a desplegar?

- **Web App** (Next.js 15) → Cloudflare Pages
- **Admin App** (Next.js 15) → Cloudflare Pages  
- **Worker** (Background Jobs) → Cloudflare Workers
- **Database** → Neon PostgreSQL (Free)
- **Email** → Resend (Free)

**Costo total: $0/mes** usando free tiers.

---

## ⚡ Quick Start (30 minutos)

### 1️⃣ Instalar Dependencias (2 min)

```powershell
# Ya está hecho - wrangler y @cloudflare/next-on-pages instalados
pnpm install
```

### 2️⃣ Crear Servicios Externos (5 min)

#### ✅ Base de Datos (Ya configurada)
Tu base de datos PostgreSQL ya está lista:
```
postgresql://admin:Pas...@216.238.75.97:5432/quinielas?schema=public
```
**Nota**: Usa tus credenciales reales al configurar.

#### Email (Resend)
1. Ve a https://resend.com
2. Crea API key
3. Copia tu API key (empieza con `re_`)

#### Sports API
1. Ve a https://rapidapi.com/api-sports/api/api-football
2. Suscríbete al plan Free
3. Copia tu API key

### 3️⃣ Configurar Base de Datos (3 min)

```powershell
# Configura DATABASE_URL (tu base de datos ya está lista)
$env:DATABASE_URL="postgresql://admin:TU_PASSWORD@216.238.75.97:5432/quinielas?schema=public"

# Aplica migraciones
pnpm db:push

# Genera cliente
pnpm db:generate

# (Opcional) Seed de datos de prueba
pnpm seed
```

**Nota**: Tu base de datos PostgreSQL ya está configurada y lista para usar.

### 4️⃣ Autenticar Cloudflare (1 min)

```powershell
npx wrangler login
```

### 5️⃣ Deploy Web App (5 min)

```powershell
cd apps/web

# Build
pnpm build
pnpm pages:build

# Deploy
pnpm pages:deploy
# Sigue las instrucciones: nombre del proyecto = quinielas-web
```

Luego configura las variables de entorno en Cloudflare Dashboard:
- Ve a: https://dash.cloudflare.com → Pages → quinielas-web → Settings → Environment variables
- Copia las variables de `apps/web/env.cloudflare.example`

### 6️⃣ Deploy Admin App (5 min)

```powershell
cd apps/admin

# Build
pnpm build
pnpm pages:build

# Deploy
pnpm pages:deploy
# Nombre del proyecto = quinielas-admin
```

Configura las variables de entorno igual que web app.

### 7️⃣ Deploy Worker (4 min)

```powershell
cd apps/worker

# Configura secrets
npx wrangler secret put DATABASE_URL
npx wrangler secret put SPORTS_API_KEY
npx wrangler secret put EMAIL_SERVER_PASSWORD

# Deploy
pnpm deploy
```

### 8️⃣ Verificar (2 min)

Abre en tu navegador:
- Web: `https://quinielas-web.pages.dev`
- Admin: `https://quinielas-admin.pages.dev`

✅ **¡Listo!** Tu app está en producción.

---

## 🛠️ Comandos Útiles

### Build Local

```powershell
# Web app
pnpm --filter @qp/web run build
pnpm --filter @qp/web run pages:build

# Admin app
pnpm --filter @qp/admin run build
pnpm --filter @qp/admin run pages:build

# Worker
pnpm --filter @qp/worker run build
```

### Deploy

```powershell
# Deploy todo con script
.\scripts\deploy-cloudflare.ps1

# Deploy solo web
.\scripts\deploy-cloudflare.ps1 -Target web

# Deploy a producción
.\scripts\deploy-cloudflare.ps1 -Production
```

### Ver Logs

```powershell
# Web app
npx wrangler pages deployment tail --project-name=quinielas-web

# Admin app
npx wrangler pages deployment tail --project-name=quinielas-admin

# Worker
npx wrangler tail quinielas-worker-prod
```

### Testing Local con Cloudflare

```powershell
# Web app
cd apps/web
pnpm pages:dev

# Worker
cd apps/worker
pnpm dev
```

---

## 📚 Documentación Completa

Para guía detallada paso a paso, consulta:

- **[CLOUDFLARE_DEPLOYMENT_GUIDE.md](./CLOUDFLARE_DEPLOYMENT_GUIDE.md)** - Guía completa con todos los detalles
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Checklist de verificación
- **[apps/web/env.cloudflare.example](./apps/web/env.cloudflare.example)** - Variables de entorno para web
- **[apps/admin/env.cloudflare.example](./apps/admin/env.cloudflare.example)** - Variables de entorno para admin

---

## 🐛 Troubleshooting Rápido

### Error: "Module not found"
```powershell
rm -rf node_modules
pnpm install
pnpm db:generate
```

### Error: "Database connection failed"
- Verifica que `DATABASE_URL` esté configurada
- En Neon: Settings → IP Allow → "Allow all"

### Error: "Auth not working"
- Verifica que `AUTH_URL` coincida con tu dominio
- Verifica que `AUTH_SECRET` tenga 32+ caracteres
- Limpia cookies del navegador

### Error: "Email not sending"
- Verifica que tu dominio esté verificado en Resend
- O usa el dominio de prueba de Resend

---

## 💰 Costos y Límites

| Servicio | Plan | Límites |
|----------|------|---------|
| Cloudflare Pages | ✅ Gratis | 500 builds/mes, requests ilimitados |
| Cloudflare Workers | ✅ Gratis | 100,000 requests/día |
| PostgreSQL | ✅ Ya configurado | Tu servidor dedicado |
| Resend | ✅ Gratis | 3,000 emails/mes |
| API-Football | ✅ Gratis | 100 requests/día |

**Total: $0/mes** para Cloudflare + Email + API

Cuando crezcas, puedes escalar a planes pagos:
- Cloudflare Workers: $5/mes (10M requests)
- Neon: $19/mes (3 GB storage)
- Resend: $20/mes (50,000 emails)

---

## 🔄 CI/CD Automático (Opcional)

Para deployment automático en cada push:

1. Conecta tu repo a Cloudflare Pages (en el dashboard)
2. Cloudflare detectará automáticamente los cambios
3. Build y deploy automático en cada push a `main`

O usa GitHub Actions (ver `CLOUDFLARE_DEPLOYMENT_GUIDE.md` para el workflow completo).

---

## 📞 ¿Necesitas Ayuda?

1. **Revisa la documentación completa**: `CLOUDFLARE_DEPLOYMENT_GUIDE.md`
2. **Usa el checklist**: `DEPLOYMENT_CHECKLIST.md`
3. **Revisa los logs**: `npx wrangler pages deployment tail`
4. **Consulta recursos**:
   - [Cloudflare Docs](https://developers.cloudflare.com/pages/)
   - [Neon Docs](https://neon.tech/docs)
   - [Resend Docs](https://resend.com/docs)

---

## ✅ Próximos Pasos

Después del deployment:

1. ✅ Configura dominio personalizado
2. ✅ Habilita Cloudflare Analytics
3. ✅ Configura alertas de deployment
4. ✅ Crea staging environment
5. ✅ Implementa CI/CD automático
6. ✅ Agrega monitoring (Sentry, LogTail)

---

**¡Felicidades! 🎉 Tu app está en producción con $0 de costo.**
