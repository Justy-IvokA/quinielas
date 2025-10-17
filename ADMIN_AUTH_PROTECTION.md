# Protección de Autenticación en Admin App

## ✅ Solución Implementada

He implementado **protección completa de autenticación** en el admin app. Ahora **todas las rutas requieren autenticación** excepto las páginas de auth y las rutas de API.

## 🔐 Cómo Funciona

### Middleware de Autenticación

El middleware (`apps/admin/middleware.ts`) ahora:

1. ✅ **Verifica la cookie de sesión** de Auth.js
2. ✅ **Permite acceso público** solo a:
   - `/[locale]/auth/*` (páginas de login)
   - `/api/*` (rutas de API de Auth.js)
3. ✅ **Redirige a sign-in** si no hay sesión activa
4. ✅ **Preserva el callback URL** para redirigir después del login

### Flujo de Autenticación

```
Usuario intenta acceder a /es-MX/dashboard
    ↓
Middleware verifica cookie de sesión
    ↓
¿Tiene sesión?
    ├─ SÍ → Permite acceso ✅
    └─ NO → Redirige a /es-MX/auth/signin?callbackUrl=/es-MX/dashboard
              ↓
         Usuario hace login
              ↓
         Redirige a /es-MX/dashboard ✅
```

## 🛡️ Rutas Protegidas

### Requieren Autenticación ✅

- `/es-MX/` (dashboard/home)
- `/es-MX/dashboard`
- `/es-MX/pools`
- `/es-MX/fixtures`
- `/es-MX/access`
- `/es-MX/brands`
- `/es-MX/analytics`
- `/es-MX/profile`
- `/es-MX/settings`
- Cualquier otra ruta en el admin

### Públicas (No Requieren Auth) 🌐

- `/es-MX/auth/signin`
- `/es-MX/auth/error`
- `/api/auth/*` (Auth.js endpoints)
- Archivos estáticos (`/_next/*`, `/favicon.ico`, etc.)

## 🔍 Verificación de Sesión

El middleware verifica la cookie de sesión de Auth.js:

```typescript
// Auth.js usa estas cookies:
authjs.session-token           // HTTP (desarrollo)
__Secure-authjs.session-token  // HTTPS (producción)
```

Si la cookie existe, el usuario tiene sesión activa. Si no existe, se redirige a sign-in.

## 🧪 Pruebas

### Caso 1: Usuario Sin Sesión

```bash
# 1. Abre el navegador en modo incógnito
# 2. Ve a http://localhost:3001/es-MX/dashboard
# 3. Deberías ser redirigido a:
#    http://localhost:3001/es-MX/auth/signin?callbackUrl=%2Fes-MX%2Fdashboard
```

### Caso 2: Usuario Con Sesión

```bash
# 1. Inicia sesión en http://localhost:3001/es-MX/auth/signin
# 2. Serás redirigido al dashboard
# 3. Ahora puedes navegar libremente por todas las rutas
```

### Caso 3: Sesión Expirada

```bash
# 1. Inicia sesión
# 2. Espera a que expire la sesión (o elimina la cookie manualmente)
# 3. Intenta navegar a cualquier ruta
# 4. Serás redirigido a sign-in automáticamente
```

## 🔧 Configuración

### Variables de Entorno Importantes

```bash
# apps/admin/.env.local
AUTH_URL=http://localhost:3001
AUTH_SECRET=tu-secret-de-32-caracteres-minimo

# La cookie de sesión se crea automáticamente con estos valores
```

### Duración de Sesión

Por defecto, Auth.js configura:
- **Sesión**: 30 días
- **Token de verificación**: 24 horas

Puedes ajustar esto en `packages/auth/src/config.ts`:

```typescript
export const authConfig = {
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  // ...
}
```

## 🐛 Troubleshooting

### Problema: "Redirect loop" (bucle infinito)

**Causa:** La ruta de sign-in también está protegida.

**Solución:** Verifica que el middleware excluya correctamente `/auth/*`:

```typescript
const isAuthRoute = pathname.match(new RegExp(`^/(${locales.join('|')})/auth(/.*)?$`));
```

### Problema: "Cookie not found"

**Causa:** La cookie de sesión no se está creando.

**Solución:**
1. Verifica que `AUTH_URL` esté correctamente configurado
2. Verifica que el login funcione correctamente
3. Revisa las cookies en DevTools (Application → Cookies)

### Problema: "Redirige a sign-in incluso con sesión activa"

**Causa:** El nombre de la cookie no coincide.

**Solución:** Auth.js usa diferentes nombres según el entorno:
- Desarrollo (HTTP): `authjs.session-token`
- Producción (HTTPS): `__Secure-authjs.session-token`

El middleware verifica ambos.

## 📊 Ventajas de Este Enfoque

### ✅ Edge Runtime Compatible

- No usa Prisma en el middleware
- Solo verifica la cookie (muy rápido)
- Compatible con Cloudflare Pages

### ✅ Seguro

- Verifica sesión en cada request
- Redirige automáticamente si no hay sesión
- Preserva el callback URL

### ✅ User-Friendly

- Redirige al destino original después del login
- No muestra contenido protegido sin autenticación
- Experiencia fluida

## 🎯 Mejoras Futuras

### 1. Verificación de Roles

Agregar verificación de roles en el middleware:

```typescript
// Verificar que el usuario tenga rol de admin
const hasAdminRole = await checkUserRole(sessionToken);
if (!hasAdminRole) {
  return NextResponse.redirect(new URL('/unauthorized', req.url));
}
```

### 2. Rate Limiting

Agregar rate limiting para prevenir ataques:

```typescript
const rateLimitResult = await rateLimit(req.ip);
if (!rateLimitResult.success) {
  return new NextResponse('Too Many Requests', { status: 429 });
}
```

### 3. Logging de Accesos

Registrar intentos de acceso no autorizados:

```typescript
if (!sessionToken) {
  await logUnauthorizedAccess({
    ip: req.ip,
    pathname: pathname,
    timestamp: new Date()
  });
}
```

## 📚 Referencias

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Auth.js Session Management](https://authjs.dev/concepts/session-strategies)
- [Edge Runtime](https://nextjs.org/docs/app/api-reference/edge)

## ✨ Resultado

Con esta implementación:

1. ✅ **Todas las rutas están protegidas** por defecto
2. ✅ **Solo usuarios autenticados** pueden acceder al admin
3. ✅ **Redireccionamiento automático** a sign-in
4. ✅ **Callback URL preservado** para UX fluida
5. ✅ **Compatible con Edge Runtime** (Cloudflare)
6. ✅ **Seguro y performante**

¡Tu admin app ahora está completamente protegida! 🔐
