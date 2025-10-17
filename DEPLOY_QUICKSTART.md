# 🚀 Deploy Rápido en Cloudflare - Guía de 10 Minutos

## ✅ Checklist Pre-Deploy

- [ ] Cuenta de Cloudflare creada
- [ ] Dominio agregado a Cloudflare
- [ ] Base de datos PostgreSQL lista (Neon recomendado)
- [ ] Servicio de email configurado (Resend recomendado)
- [ ] Repositorio en GitHub

## 📝 Pasos Rápidos

### 1️⃣ Configurar Base de Datos (5 min)

```bash
# 1. Crea cuenta en https://neon.tech
# 2. Crea proyecto "quinielas-prod"
# 3. Copia la connection string
# 4. Aplica el schema:

DATABASE_URL="tu-connection-string" pnpm db:push
pnpm db:generate
pnpm seed  # Opcional: datos de prueba
```

### 2️⃣ Deploy Web App (2 min)

1. Ve a https://dash.cloudflare.com → Pages
2. **Create a project** → **Connect to Git**
3. Selecciona tu repositorio
4. Configuración:
   ```
   Project name: quinielas-web
   Production branch: main
   Build command: cd apps/web && pnpm install && pnpm build
   Build output: apps/web/.next
   Root directory: (leave empty)
   ```
5. **Environment variables** → Agrega:
   ```
   DATABASE_URL=tu-connection-string
   AUTH_URL=https://tu-dominio.com
   AUTH_SECRET=genera-con-openssl-rand-base64-32
   EMAIL_SERVER_HOST=smtp.resend.com
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=resend
   EMAIL_SERVER_PASSWORD=tu-api-key-de-resend
   EMAIL_FROM=noreply@tudominio.com
   NEXT_PUBLIC_WEBAPP_URL=https://tu-dominio.com
   NEXT_PUBLIC_ADMIN_URL=https://admin.tudominio.com
   NEXT_PUBLIC_APP_NAME=Quinielas
   SPORTS_API_KEY=tu-api-key
   NODE_ENV=production
   ```
6. **Save and Deploy**

### 3️⃣ Deploy Admin App (2 min)

Repite el paso 2 pero con:
```
Project name: quinielas-admin
Build command: cd apps/admin && pnpm install && pnpm build
Build output: apps/admin/.next
AUTH_URL=https://admin.tudominio.com  # ⚠️ Diferente URL
```

### 4️⃣ Configurar Dominios (1 min)

Para cada proyecto:
1. **Custom domains** → **Set up a custom domain**
2. Web: `tudominio.com` o `quinielas.tudominio.com`
3. Admin: `admin.tudominio.com`
4. Cloudflare configura DNS automáticamente ✅

## 🧪 Verificar Deploy

```bash
# 1. Verifica que las apps cargan
curl -I https://tudominio.com
curl -I https://admin.tudominio.com

# 2. Prueba el login
# Ve a https://admin.tudominio.com/es-MX/auth/signin
# Ingresa tu email
# Verifica que llegue el magic link

# 3. Verifica la base de datos
# Inicia sesión y ve a /es-MX/profile
```

## 🐛 Problemas Comunes

### ❌ "Module not found" durante build

**Solución:**
```bash
# En Cloudflare Pages, cambia el build command a:
cd apps/web && pnpm install --shamefully-hoist && pnpm build
```

### ❌ "Database connection failed"

**Solución:**
1. En Neon → Settings → IP Allow
2. Selecciona "Allow all" (Cloudflare usa IPs dinámicas)

### ❌ "Email not sending"

**Solución:**
1. Verifica que `EMAIL_SERVER_PASSWORD` sea tu API key de Resend
2. En Resend, verifica tu dominio: Settings → Domains → Add Domain
3. Agrega los registros DNS que Resend te indique

### ❌ "AUTH_SECRET must be at least 32 characters"

**Solución:**
```bash
# Genera un secret válido:
openssl rand -base64 32

# Copia el resultado y úsalo como AUTH_SECRET
```

## 💡 Tips Pro

### Habilitar Preview Deployments

Cloudflare crea automáticamente previews para cada PR:
- `https://abc123.quinielas-web.pages.dev`
- Perfecto para testing antes de merge

### Ver Logs en Tiempo Real

```bash
# Instala Wrangler
pnpm add -D wrangler

# Ver logs
npx wrangler pages deployment tail --project-name=quinielas-web
```

### Rollback Rápido

En Cloudflare Dashboard:
1. Pages → Tu proyecto → Deployments
2. Encuentra el deployment anterior
3. Click en "..." → **Rollback to this deployment**

## 📊 Monitoreo

### Analytics en Cloudflare

- Dashboard → Analytics → Web Analytics
- Requests, bandwidth, cache hit ratio
- Gratis e ilimitado

### Alertas

1. Notifications → Add
2. Configura alertas para:
   - Errores 5xx
   - Alto uso de CPU
   - Fallos de deploy

## 💰 Costos

Con free tiers:
- ✅ Cloudflare Pages: $0 (500 builds/mes, unlimited requests)
- ✅ Neon Database: $0 (0.5GB, 1 proyecto)
- ✅ Resend Email: $0 (3,000 emails/mes)

**Total: $0/mes** 🎉

## 📚 Documentación Completa

Para configuración avanzada, ver: `CLOUDFLARE_DEPLOY.md`

## 🎉 ¡Listo!

Tu app está en producción en:
- 🌐 Web: https://tudominio.com
- 🔧 Admin: https://admin.tudominio.com

**Próximos pasos:**
1. Configura tu primer tenant
2. Crea tu primera quiniela
3. Invita usuarios
4. ¡Disfruta! 🚀
