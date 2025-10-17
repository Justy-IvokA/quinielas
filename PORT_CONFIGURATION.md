# Configuración de Puertos Fijos - Solución Definitiva

## 🔴 Problema

Cuando ejecutas `pnpm dev`, Turbo inicia múltiples apps en paralelo y Next.js asigna puertos **dinámicamente**. Esto causa:

- ❌ Admin a veces en puerto 3000, a veces en 3001
- ❌ Web a veces en puerto 3000, a veces en 3001
- ❌ Auth.js genera callback URLs incorrectos
- ❌ CORS y cookies no funcionan correctamente

## ✅ Solución Aplicada

He fijado los puertos explícitamente en cada aplicación:

### Puertos Asignados

```
📱 Web App:    http://localhost:3000
🔧 Admin App:  http://localhost:3001
⚙️ Worker:     (sin puerto HTTP, solo background jobs)
```

### Cambios Realizados

#### 1. `apps/web/package.json`
```json
{
  "scripts": {
    "dev": "next dev --port 3000"  // ✅ Puerto fijo
  }
}
```

#### 2. `apps/admin/package.json`
```json
{
  "scripts": {
    "dev": "next dev --port 3001"  // ✅ Puerto fijo
  }
}
```

## 🔧 Configuración de Variables de Entorno

Ahora que los puertos son fijos, actualiza tus `.env.local`:

### `apps/web/.env.local`
```bash
# Auth.js
AUTH_URL=http://localhost:3000
NEXT_PUBLIC_WEBAPP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001

# Resto de variables...
```

### `apps/admin/.env.local`
```bash
# Auth.js
AUTH_URL=http://localhost:3001
NEXT_PUBLIC_WEBAPP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001

# Resto de variables...
```

## 🚀 Cómo Usar

### Iniciar Todo el Monorepo
```bash
pnpm dev
```

Ahora verás:
```
@qp/web:dev: ready - started server on 0.0.0.0:3000, url: http://localhost:3000
@qp/admin:dev: ready - started server on 0.0.0.0:3001, url: http://localhost:3001
@qp/worker:dev: [Worker] Starting...
```

### Iniciar Apps Individualmente
```bash
# Solo web
pnpm --filter @qp/web dev

# Solo admin
pnpm --filter @qp/admin dev

# Solo worker
pnpm --filter @qp/worker dev
```

## ✅ Verificación

### 1. Verifica que los Puertos sean Correctos

```bash
# Inicia el servidor
pnpm dev

# En otra terminal, verifica los puertos
curl -I http://localhost:3000  # Web
curl -I http://localhost:3001  # Admin
```

### 2. Verifica los Magic Links

1. Ve a http://localhost:3001/es-MX/auth/signin
2. Ingresa tu email
3. Revisa el email recibido
4. El link debe ser: `http://localhost:3001/api/auth/callback/email?...`

### 3. Verifica CORS

Si usas tRPC entre apps, verifica que las URLs sean correctas:

```typescript
// apps/web/trpc/client.ts
const url = process.env.NEXT_PUBLIC_ADMIN_URL + '/api/trpc';
// Debe ser: http://localhost:3001/api/trpc
```

## 🐛 Troubleshooting

### Error: "Port 3000 is already in use"

**Causa:** Otra aplicación está usando el puerto.

**Solución:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# O cambia el puerto temporalmente
pnpm --filter @qp/web dev -- --port 3002
```

### Error: "EADDRINUSE: address already in use"

**Causa:** El puerto ya está ocupado por una instancia anterior.

**Solución:**
```bash
# Detén todos los procesos de Node
taskkill /F /IM node.exe

# Reinicia
pnpm dev
```

### Los Puertos Siguen Siendo Dinámicos

**Causa:** Caché de Turbo o node_modules corruptos.

**Solución:**
```bash
# Limpia todo
pnpm clean  # Si tienes este script
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm -rf apps/*/.next

# Reinstala
pnpm install

# Reinicia
pnpm dev
```

## 📝 Mejores Prácticas

### 1. Documenta los Puertos

Agrega un comentario en el README principal:

```markdown
## Puertos de Desarrollo

- Web App: http://localhost:3000
- Admin App: http://localhost:3001
- Worker: Background jobs (sin puerto HTTP)
```

### 2. Usa Variables de Entorno Consistentes

Siempre usa las mismas variables:
- `AUTH_URL` - URL completa de la app actual
- `NEXT_PUBLIC_WEBAPP_URL` - URL de la web app
- `NEXT_PUBLIC_ADMIN_URL` - URL de la admin app

### 3. Verifica Antes de Commitear

Antes de hacer commit, verifica:
```bash
# Verifica que los puertos estén en los package.json
grep -r "next dev --port" apps/*/package.json

# Debe mostrar:
# apps/web/package.json:    "dev": "next dev --port 3000",
# apps/admin/package.json:    "dev": "next dev --port 3001",
```

## 🎯 Beneficios

Con puertos fijos:

✅ **Auth.js funciona correctamente** - Callback URLs siempre correctos
✅ **CORS predecible** - Sabes exactamente qué orígenes permitir
✅ **Cookies funcionan** - Dominios consistentes
✅ **Debugging más fácil** - Siempre sabes dónde está cada app
✅ **Documentación clara** - Puertos documentados y consistentes
✅ **CI/CD más simple** - Scripts de test saben qué puertos usar

## 🚀 Producción

En producción, usa dominios reales:

```bash
# Production
AUTH_URL=https://admin.tudominio.com
NEXT_PUBLIC_WEBAPP_URL=https://quinielas.tudominio.com
NEXT_PUBLIC_ADMIN_URL=https://admin.tudominio.com
```

## 📚 Referencias

- [Next.js CLI Options](https://nextjs.org/docs/app/api-reference/cli/next#development)
- [Turbo Parallel Execution](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Auth.js Configuration](https://authjs.dev/reference/core)

## ✨ Resultado Final

Después de estos cambios:

1. ✅ Puertos siempre consistentes
2. ✅ Auth.js funciona correctamente
3. ✅ Magic links con URLs correctos
4. ✅ No más errores de verificación
5. ✅ Desarrollo más predecible

¡Ahora puedes desarrollar sin preocuparte por puertos dinámicos! 🎉
