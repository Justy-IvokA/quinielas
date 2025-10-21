# 🎯 Próximos Pasos - Deployment Cloudflare

## ✅ Lo que ya está configurado

- ✅ **Wrangler CLI** instalado
- ✅ **@cloudflare/next-on-pages** instalado
- ✅ **Archivos wrangler.toml** creados para web, admin y worker
- ✅ **Scripts de build y deploy** configurados
- ✅ **Ejemplos de variables de entorno** creados
- ✅ **Script de deployment automatizado** (PowerShell)
- ✅ **Documentación completa** disponible

## 🚀 Pasos para Desplegar (En Orden)

### 1. Crear Servicios Externos (5 minutos)

#### A. ✅ Base de Datos PostgreSQL (Ya Configurada)
```
Tu base de datos ya está lista:
postgresql://admin:TU_PASSWORD@216.238.75.97:5432/quinielas?schema=public

✅ No necesitas crear una nueva base de datos
✅ Usa tu contraseña real al configurar
```

#### B. Email - Resend
```
1. Ve a: https://resend.com
2. Crea cuenta (gratis)
3. Crea API Key
4. Copia la key (empieza con "re_")
5. Agrega tu dominio (o usa el de prueba)
```

#### C. Sports API - API-Football
```
1. Ve a: https://rapidapi.com/api-sports/api/api-football
2. Crea cuenta
3. Suscríbete al plan Free (100 requests/día)
4. Copia tu API Key de RapidAPI
```

### 2. Configurar Base de Datos (5 minutos)

```powershell
# En tu terminal (PowerShell)

# 1. Configura DATABASE_URL (tu base de datos ya está lista)
$env:DATABASE_URL="postgresql://admin:TU_PASSWORD@216.238.75.97:5432/quinielas?schema=public"

# 2. Genera el cliente de Prisma
pnpm db:generate

# 3. Aplica el schema
pnpm db:push

# 4. (Opcional) Ejecuta el seed
pnpm seed

# 5. Verifica con Prisma Studio
pnpm --filter @qp/db exec prisma studio
```

**Nota**: Tu base de datos PostgreSQL ya está configurada en tu servidor (216.238.75.97).

### 3. Autenticar Cloudflare (1 minuto)

```powershell
# Login en Cloudflare
npx wrangler login

# Esto abrirá tu navegador para autenticarte
```

### 4. Generar AUTH_SECRET (1 minuto)

```powershell
# Genera un secret seguro (32+ caracteres)
# Opción 1: PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Opción 2: Online
# Ve a: https://generate-secret.vercel.app/32

# Guarda este valor, lo necesitarás para AUTH_SECRET
```

### 5. Deploy Web App (5 minutos)

```powershell
# Navega a la app web
cd apps/web

# Build para Next.js
pnpm build

# Build para Cloudflare Pages
pnpm pages:build

# Deploy (primera vez)
pnpm pages:deploy

# Sigue las instrucciones:
# - Nombre del proyecto: quinielas-web
# - Production branch: main
```

**Después del deploy:**

1. Ve a: https://dash.cloudflare.com
2. Pages → quinielas-web → Settings → Environment variables
3. Agrega todas las variables de `apps/web/env.cloudflare.example`
4. Click "Save"
5. Redeploy el proyecto

### 6. Deploy Admin App (5 minutos)

```powershell
# Navega a la app admin
cd apps/admin

# Build
pnpm build
pnpm pages:build

# Deploy
pnpm pages:deploy

# Nombre del proyecto: quinielas-admin
```

**Configurar variables de entorno** igual que web app (usa `apps/admin/env.cloudflare.example`).

### 7. Deploy Worker (5 minutos)

```powershell
# Navega al worker
cd apps/worker

# Configura secrets (uno por uno)
npx wrangler secret put DATABASE_URL
# Pega tu DATABASE_URL cuando te lo pida

npx wrangler secret put SPORTS_API_KEY
# Pega tu API key

npx wrangler secret put EMAIL_SERVER_PASSWORD
# Pega tu Resend API key

# Deploy
pnpm deploy
```

### 8. Verificar Deployment (5 minutos)

```powershell
# Abre en tu navegador:
# Web: https://quinielas-web.pages.dev
# Admin: https://quinielas-admin.pages.dev

# Verifica logs:
npx wrangler pages deployment tail --project-name=quinielas-web
npx wrangler tail quinielas-worker-prod
```

**Checklist de verificación:**
- [ ] Web app carga correctamente
- [ ] Admin app carga correctamente
- [ ] Login con magic link funciona
- [ ] Email se envía correctamente
- [ ] Base de datos conecta
- [ ] SSL/TLS activo (candado verde)

---

## 📚 Documentación Disponible

| Archivo | Descripción |
|---------|-------------|
| **DEPLOYMENT_README.md** | Quick start de 30 minutos |
| **CLOUDFLARE_DEPLOYMENT_GUIDE.md** | Guía completa paso a paso |
| **DEPLOYMENT_CHECKLIST.md** | Checklist de verificación |
| **apps/web/env.cloudflare.example** | Variables de entorno para web |
| **apps/admin/env.cloudflare.example** | Variables de entorno para admin |
| **scripts/deploy-cloudflare.ps1** | Script automatizado de deployment |

---

## 🛠️ Comandos Útiles

### Build Local
```powershell
# Web app
pnpm pages:build:web

# Admin app
pnpm pages:build:admin

# Worker
pnpm --filter @qp/worker run build
```

### Deploy
```powershell
# Deploy todo (usa el script)
.\scripts\deploy-cloudflare.ps1

# Deploy solo web
.\scripts\deploy-cloudflare.ps1 -Target web

# Deploy solo admin
.\scripts\deploy-cloudflare.ps1 -Target admin

# Deploy solo worker
.\scripts\deploy-cloudflare.ps1 -Target worker

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
# Web app (simula Cloudflare Pages)
cd apps/web
pnpm pages:dev

# Worker (simula Cloudflare Workers)
cd apps/worker
pnpm dev
```

---

## 💡 Tips para Ahorrar Dinero

### 1. Usa Free Tiers al Máximo

| Servicio | Free Tier | Cuándo Escalar |
|----------|-----------|----------------|
| **Cloudflare Pages** | Unlimited requests | Nunca (siempre gratis) |
| **Cloudflare Workers** | 100k requests/día | Cuando superes 100k/día |
| **PostgreSQL** | Tu servidor dedicado | Ya configurado |
| **Resend** | 3,000 emails/mes | Cuando superes 3k/mes |
| **API-Football** | 100 requests/día | Cuando necesites más datos |

### 2. Optimiza Requests de API-Football

```typescript
// Cachea fixtures por 6 horas (no por minuto)
// Usa el Worker con cron: "0 */6 * * *"
// Esto = 4 requests/día (muy por debajo del límite)
```

### 3. Optimiza Emails

```typescript
// Agrupa notificaciones en digest diario
// En lugar de 1 email por evento = 1 email por día
// Esto reduce drásticamente el uso
```

### 4. Configura Ambientes Separados

```bash
# Considera usar schemas diferentes en tu PostgreSQL para separar ambientes:
# public = producción
# dev = desarrollo
# staging = staging

# O usa bases de datos separadas en tu servidor si es necesario
```

### 5. Monitorea Uso

```bash
# Cloudflare Dashboard → Analytics
# Neon Console → Monitoring
# Resend Dashboard → Usage

# Revisa semanalmente para evitar sorpresas
```

### PostgreSQL Database Monitoring

Monitorea tu servidor PostgreSQL:
- Storage usage
- Active connections
- Query performance
- Logs de errores
- Considera usar herramientas como pgAdmin o DBeaver para evitar sorpresas

---

## 🔄 Después del Deployment

### Inmediato (Primeras 24 horas)
- [ ] Monitorear logs por errores
- [ ] Probar todos los flujos principales
- [ ] Verificar que emails lleguen
- [ ] Verificar que worker ejecute correctamente

### Primera Semana
- [ ] Configurar dominio personalizado
- [ ] Habilitar Cloudflare Analytics
- [ ] Configurar alertas de deployment
- [ ] Documentar cualquier issue encontrado

### Primer Mes
- [ ] Crear staging environment
- [ ] Implementar CI/CD automático (GitHub Actions)
- [ ] Agregar error tracking (Sentry)
- [ ] Configurar backups de DB
- [ ] Implementar uptime monitoring

---

## 🆘 Si Algo Sale Mal

### 1. Revisa los Logs
```powershell
npx wrangler pages deployment tail --project-name=quinielas-web
npx wrangler tail quinielas-worker-prod
```

### 2. Consulta la Documentación
- `CLOUDFLARE_DEPLOYMENT_GUIDE.md` - Sección Troubleshooting
- `DEPLOYMENT_CHECKLIST.md` - Verifica que no falta nada

### 3. Revisa Variables de Entorno
- Cloudflare Dashboard → Pages → Settings → Environment variables
- Verifica que todas estén configuradas correctamente

### 4. Verifica Conexión a DB
```powershell
# Prueba la conexión desde local
$env:DATABASE_URL="postgresql://admin:TU_PASSWORD@216.238.75.97:5432/quinielas?schema=public"
pnpm --filter @qp/db exec prisma studio

# Verifica que el puerto 5432 esté abierto y accesible desde Cloudflare
```

### 5. Recursos de Ayuda
- [Cloudflare Community](https://community.cloudflare.com/)
- [Neon Discord](https://discord.gg/neon)
- [Next.js Discord](https://discord.gg/nextjs)

---

## 🎉 ¡Estás Listo!

Tienes todo lo necesario para desplegar tu aplicación en Cloudflare con **costo $0**.

**Tiempo estimado total: 30-40 minutos**

Sigue los pasos en orden y consulta la documentación cuando lo necesites.

**¡Mucha suerte con tu deployment! 🚀**
