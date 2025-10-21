# ✅ Checklist de Deployment - Cloudflare

Usa este checklist para asegurar que todos los pasos se completen correctamente.

## 📋 Pre-Deployment

### Servicios Externos
- [ ] **Neon PostgreSQL**
  - [ ] Cuenta creada en https://console.neon.tech
  - [ ] Proyecto `quinielas-prod` creado
  - [ ] Connection string copiada y guardada
  - [ ] Migraciones aplicadas (`pnpm db:push`)
  - [ ] Seed ejecutado (opcional)

- [ ] **Resend (Email)**
  - [ ] Cuenta creada en https://resend.com
  - [ ] API Key generada
  - [ ] Dominio agregado y verificado (o usando dominio de prueba)

- [ ] **API-Football**
  - [ ] Cuenta en RapidAPI creada
  - [ ] Suscrito al plan Free
  - [ ] API Key copiada

- [ ] **Cloudflare**
  - [ ] Cuenta creada en https://dash.cloudflare.com
  - [ ] Wrangler CLI autenticado (`npx wrangler login`)
  - [ ] Dominio agregado (opcional)

### Código y Configuración
- [ ] **Dependencias instaladas**
  - [ ] `wrangler` instalado
  - [ ] `@cloudflare/next-on-pages` instalado
  - [ ] Todos los packages actualizados (`pnpm install`)

- [ ] **Variables de entorno preparadas**
  - [ ] `DATABASE_URL` de producción
  - [ ] `AUTH_SECRET` generado (32+ caracteres)
  - [ ] Credenciales de email (Resend)
  - [ ] API keys de sports API
  - [ ] URLs de apps definidas

- [ ] **Build local exitoso**
  - [ ] Web app: `pnpm --filter @qp/web run build`
  - [ ] Admin app: `pnpm --filter @qp/admin run build`
  - [ ] Worker: `pnpm --filter @qp/worker run build`

---

## 🚀 Deployment

### Web App (Cloudflare Pages)
- [ ] **Configuración inicial**
  - [ ] Proyecto creado en Cloudflare Pages
  - [ ] Nombre: `quinielas-web`
  - [ ] Conectado a GitHub (o deploy manual)

- [ ] **Variables de entorno configuradas**
  - [ ] `DATABASE_URL`
  - [ ] `AUTH_URL`
  - [ ] `AUTH_SECRET`
  - [ ] `EMAIL_SERVER_*` (todas)
  - [ ] `EMAIL_FROM`
  - [ ] `NEXT_PUBLIC_WEBAPP_URL`
  - [ ] `NEXT_PUBLIC_ADMIN_URL`
  - [ ] `NEXT_PUBLIC_APP_NAME`
  - [ ] `SPORTS_API_KEY`
  - [ ] `SPORTS_API_HOST`
  - [ ] `NODE_ENV=production`

- [ ] **Build y Deploy**
  - [ ] Build command configurado correctamente
  - [ ] Build output directory: `apps/web/.vercel/output/static`
  - [ ] Deploy exitoso
  - [ ] URL de producción funciona

- [ ] **Dominio personalizado** (opcional)
  - [ ] Dominio agregado: `quinielas.tudominio.com`
  - [ ] DNS configurado
  - [ ] SSL/TLS activo

### Admin App (Cloudflare Pages)
- [ ] **Configuración inicial**
  - [ ] Proyecto creado: `quinielas-admin`
  - [ ] Conectado a GitHub (o deploy manual)

- [ ] **Variables de entorno configuradas**
  - [ ] Todas las mismas que Web App
  - [ ] `AUTH_URL` apunta a admin domain
  - [ ] `NEXT_PUBLIC_ADMIN_URL` correcto

- [ ] **Build y Deploy**
  - [ ] Build command configurado
  - [ ] Build output directory: `apps/admin/.vercel/output/static`
  - [ ] Deploy exitoso
  - [ ] URL de producción funciona

- [ ] **Dominio personalizado** (opcional)
  - [ ] Dominio agregado: `admin.tudominio.com`
  - [ ] DNS configurado
  - [ ] SSL/TLS activo

### Worker (Cloudflare Workers)
- [ ] **Secrets configurados**
  - [ ] `DATABASE_URL` (`wrangler secret put DATABASE_URL`)
  - [ ] `SPORTS_API_KEY`
  - [ ] `EMAIL_SERVER_PASSWORD`

- [ ] **Deploy**
  - [ ] Worker desplegado (`pnpm --filter @qp/worker run deploy`)
  - [ ] Cron triggers configurados:
    - [ ] `*/15 * * * *` - Lock predictions
    - [ ] `0 */6 * * *` - Sync fixtures
    - [ ] `0 2 * * *` - Daily scoring

- [ ] **Verificación**
  - [ ] Worker responde correctamente
  - [ ] Logs sin errores (`npx wrangler tail`)

---

## 🧪 Verificación Post-Deployment

### Funcionalidad Básica
- [ ] **Web App**
  - [ ] Página principal carga
  - [ ] Assets (CSS, JS, imágenes) cargan correctamente
  - [ ] No hay errores en consola del navegador
  - [ ] SSL/TLS activo (candado verde)

- [ ] **Admin App**
  - [ ] Página de login carga
  - [ ] Assets cargan correctamente
  - [ ] No hay errores en consola
  - [ ] SSL/TLS activo

### Autenticación
- [ ] **Magic Link (Email)**
  - [ ] Formulario de login funciona
  - [ ] Email se envía correctamente
  - [ ] Link en email funciona
  - [ ] Sesión se crea correctamente
  - [ ] Logout funciona

- [ ] **Sesiones**
  - [ ] Sesión persiste después de refresh
  - [ ] Sesión expira correctamente
  - [ ] Redirect después de login funciona

### Base de Datos
- [ ] **Conexión**
  - [ ] App conecta a Neon PostgreSQL
  - [ ] Queries funcionan correctamente
  - [ ] No hay errores de timeout

- [ ] **Operaciones CRUD**
  - [ ] Crear tenant funciona
  - [ ] Crear brand funciona
  - [ ] Crear pool funciona
  - [ ] Leer datos funciona
  - [ ] Actualizar datos funciona
  - [ ] Eliminar datos funciona

### Email
- [ ] **Envío de emails**
  - [ ] Magic link emails se envían
  - [ ] Invitations emails se envían
  - [ ] Emails llegan a inbox (no spam)
  - [ ] Formato de email correcto
  - [ ] Links en emails funcionan

### Worker (Background Jobs)
- [ ] **Cron Jobs**
  - [ ] Fixtures sync ejecuta correctamente
  - [ ] Prediction lock ejecuta correctamente
  - [ ] Scoring ejecuta correctamente
  - [ ] No hay errores en logs

- [ ] **Logs**
  - [ ] Logs son legibles
  - [ ] No hay errores críticos
  - [ ] Performance es aceptable

### Performance
- [ ] **Tiempos de carga**
  - [ ] Web app carga en < 3 segundos
  - [ ] Admin app carga en < 3 segundos
  - [ ] API responses en < 1 segundo

- [ ] **Caching**
  - [ ] Assets estáticos se cachean
  - [ ] Cache headers configurados
  - [ ] CDN funciona correctamente

### Seguridad
- [ ] **SSL/TLS**
  - [ ] Certificado válido
  - [ ] HTTPS forzado
  - [ ] No hay mixed content warnings

- [ ] **Headers de seguridad**
  - [ ] `X-Frame-Options` presente
  - [ ] `X-Content-Type-Options` presente
  - [ ] `Referrer-Policy` presente

- [ ] **Autenticación**
  - [ ] Rutas protegidas requieren login
  - [ ] Roles funcionan correctamente
  - [ ] No hay acceso no autorizado

---

## 📊 Monitoreo

### Cloudflare Analytics
- [ ] **Analytics habilitado**
  - [ ] Web Analytics configurado
  - [ ] Métricas visibles en dashboard

### Alertas
- [ ] **Notificaciones configuradas**
  - [ ] Deployment failures
  - [ ] High error rates
  - [ ] Worker failures

### Logs
- [ ] **Acceso a logs**
  - [ ] Web app logs accesibles
  - [ ] Admin app logs accesibles
  - [ ] Worker logs accesibles

---

## 🔧 Optimizaciones (Opcional)

### Performance
- [ ] **Caching avanzado**
  - [ ] Browser cache TTL configurado
  - [ ] Always Online habilitado
  - [ ] Argo Smart Routing (paid)

### Monitoreo
- [ ] **Error tracking**
  - [ ] Sentry integrado
  - [ ] Error notifications configuradas

- [ ] **Uptime monitoring**
  - [ ] Uptime Robot configurado
  - [ ] Alertas de downtime

### CI/CD
- [ ] **GitHub Actions**
  - [ ] Workflow de deploy configurado
  - [ ] Auto-deploy en push a main
  - [ ] Preview deploys en PRs

---

## 📝 Documentación

- [ ] **URLs documentadas**
  - [ ] Production URLs guardadas
  - [ ] Preview URLs guardadas
  - [ ] API endpoints documentados

- [ ] **Credenciales seguras**
  - [ ] API keys en password manager
  - [ ] Database credentials seguras
  - [ ] Secrets documentados (sin valores)

- [ ] **Runbook**
  - [ ] Proceso de deploy documentado
  - [ ] Troubleshooting guide actualizado
  - [ ] Contactos de emergencia

---

## 🎉 Deployment Completo

Una vez que todos los items estén marcados:

✅ **Tu aplicación está lista para producción**

### Próximos pasos:
1. Monitorear logs por 24-48 horas
2. Probar con usuarios reales
3. Configurar backups de base de datos
4. Implementar staging environment
5. Configurar CI/CD automático

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa los logs**:
   ```powershell
   npx wrangler pages deployment tail --project-name=quinielas-web
   npx wrangler tail quinielas-worker-prod
   ```

2. **Consulta la documentación**:
   - `CLOUDFLARE_DEPLOYMENT_GUIDE.md`
   - `TROUBLESHOOTING.md`

3. **Recursos externos**:
   - [Cloudflare Community](https://community.cloudflare.com/)
   - [Neon Discord](https://discord.gg/neon)
   - [Next.js Discord](https://discord.gg/nextjs)

---

**Última actualización**: 2025-01-21
**Versión**: 1.0.0
