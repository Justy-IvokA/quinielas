# 🚀 Producción - Inicio Rápido

Esta guía te ayudará a preparar y desplegar el proyecto a producción.

## 📚 Documentación

- **[PRODUCTION_BUILD_GUIDE.md](./PRODUCTION_BUILD_GUIDE.md)** - Guía completa de configuración para producción
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Checklist de despliegue a Cloudflare
- **[env.production.example](./env.production.example)** - Ejemplo de variables de entorno

## ⚡ Quick Start

### 1. Preparar Variables de Entorno

```bash
# Copia el ejemplo
cp env.production.example .env.production.local

# Edita con tus valores reales
# Asegúrate de cambiar:
# - DATABASE_URL
# - NEXTAUTH_SECRET (genera uno nuevo)
# - API keys
```

### 2. Ejecutar Build de Producción

**Windows (PowerShell):**
```powershell
.\scripts\build-production.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/build-production.sh
./scripts/build-production.sh
```

**Manual:**
```bash
pnpm clean
pnpm install --frozen-lockfile
pnpm --filter @qp/db prisma generate
pnpm build
pnpm typecheck
```

### 3. Aplicar Migraciones

```bash
# En producción, usa migrate deploy (no migrate dev)
pnpm --filter @qp/db prisma migrate deploy
```

### 4. Seed de Datos (Opcional)

```bash
# Solo si necesitas datos iniciales
pnpm --filter @qp/db prisma db seed
```

### 5. Desplegar

Elige tu plataforma:

#### Vercel (Recomendado)
```bash
cd apps/web
vercel --prod
```

#### Docker
```bash
docker build --build-arg APP_NAME=web -t quinielas-web .
docker run -p 3000:3000 --env-file .env.production.local quinielas-web
```

#### Cloudflare Pages
Ver [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

## 🔍 Verificación Post-Despliegue

### Health Checks

```bash
# Verifica que la app responda
curl https://tu-dominio.com/api/health

# Verifica la base de datos
curl https://tu-dominio.com/api/trpc/health.check
```

### Logs

```bash
# Vercel
vercel logs

# Docker
docker logs quinielas-web

# Railway/Render
# Usa su dashboard web
```

## 🐛 Troubleshooting Común

### Error: "Prisma Client not generated"

```bash
pnpm --filter @qp/db prisma generate
pnpm build
```

### Error: "Module not found @qp/utils"

```bash
# Asegúrate de que los packages estén compilados
pnpm --filter @qp/utils build
pnpm --filter @qp/api build
```

### Error: "Database connection failed"

1. Verifica `DATABASE_URL` en `.env.production.local`
2. Asegúrate de que la IP del servidor esté en la whitelist de tu DB
3. Verifica que las migraciones estén aplicadas

### Error: "NEXTAUTH_SECRET is not set"

```bash
# Genera un nuevo secret
openssl rand -base64 32

# Agrégalo a .env.production.local
NEXTAUTH_SECRET="el-secret-generado"
```

## 📊 Monitoreo

### Métricas Importantes

- **Response Time**: < 200ms para páginas estáticas
- **Database Queries**: < 100ms promedio
- **Error Rate**: < 1%
- **Uptime**: > 99.9%

### Herramientas Recomendadas

- **Sentry** - Error tracking
- **Vercel Analytics** - Performance monitoring
- **Prisma Pulse** - Database monitoring
- **Uptime Robot** - Uptime monitoring

## 🔐 Seguridad

### Checklist de Seguridad

- [ ] `NEXTAUTH_SECRET` es único y seguro
- [ ] Variables de entorno no están en git
- [ ] Database tiene SSL habilitado
- [ ] Rate limiting configurado
- [ ] CORS configurado correctamente
- [ ] Headers de seguridad configurados
- [ ] Dependencias actualizadas

### Headers de Seguridad (next.config.js)

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        }
      ]
    }
  ]
}
```

## 🔄 CI/CD

### GitHub Actions (Ejemplo)

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build
        run: pnpm build
      
      - name: Run tests
        run: pnpm test
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📈 Escalabilidad

### Database

- **Connection Pooling**: Usa Prisma Accelerate o PgBouncer
- **Read Replicas**: Para queries pesadas
- **Indexes**: Asegúrate de tener indexes en campos frecuentes

### Caching

- **Redis**: Para sessions y rate limiting
- **CDN**: Para assets estáticos
- **ISR**: Para páginas semi-estáticas

### Worker

- **Queue**: Usa BullMQ o similar para jobs pesados
- **Cron Jobs**: Para sincronización de fixtures
- **Horizontal Scaling**: Múltiples instancias del worker

## 🆘 Soporte

Si encuentras problemas:

1. Revisa [PRODUCTION_BUILD_GUIDE.md](./PRODUCTION_BUILD_GUIDE.md)
2. Verifica los logs de tu plataforma
3. Consulta la documentación de Next.js/Prisma
4. Abre un issue en el repositorio

## 📝 Notas Finales

- **Backups**: Configura backups automáticos de la base de datos
- **Staging**: Prueba en staging antes de producción
- **Rollback Plan**: Ten un plan para revertir cambios
- **Documentation**: Mantén esta documentación actualizada

---

**¡Éxito con tu despliegue! 🎉**
