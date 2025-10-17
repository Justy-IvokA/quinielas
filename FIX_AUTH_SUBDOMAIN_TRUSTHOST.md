# 🔧 Fix: Auth.js Magic Links con Subdominios

## Problema

Los magic links de Auth.js se generaban con `localhost` en lugar del subdominio correcto:

```
❌ Incorrecto:
http://localhost:3000/api/auth/callback/email?token=...

✅ Correcto:
http://ivoka.localhost:3000/api/auth/callback/email?token=...
```

---

## Causa Raíz

Auth.js v5 requiere la configuración `trustHost: true` para confiar en el header `host` del request. Sin esta configuración, Auth.js usa el valor de `NEXTAUTH_URL` (que típicamente es `http://localhost:3000`) en lugar del hostname real del request.

---

## Solución

### Cambio en `packages/auth/src/config.ts`

```typescript
export function createAuthConfig(options: AuthConfigOptions): NextAuthConfig {
  // ...
  
  return {
    adapter: PrismaAdapter(prisma) as any,
    providers,
    
    // ✅ CRÍTICO: Trust the host header for subdomain support
    trustHost: true,
    
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60
    },
    
    // ... resto de la configuración
  };
}
```

### Logging Agregado

También se agregó logging para debugging:

```typescript
async sendVerificationRequest(params: SendVerificationRequestParams) {
  const { identifier: email, url, provider } = params;
  const { host } = new URL(url);
  
  // Log for debugging
  console.log('[auth] sendVerificationRequest called');
  console.log('[auth] Email:', email);
  console.log('[auth] Generated URL:', url);
  console.log('[auth] Host from URL:', host);
  
  // ... resto del código
}
```

---

## Cómo Funciona

### Sin `trustHost: true`

```
1. Request llega a: http://cocacola.localhost:3000/api/auth/signin
2. Auth.js ignora el header 'host'
3. Usa NEXTAUTH_URL del .env: http://localhost:3000
4. Genera URL: http://localhost:3000/api/auth/callback/email?token=...
5. ❌ Usuario pierde el contexto del subdominio
```

### Con `trustHost: true`

```
1. Request llega a: http://cocacola.localhost:3000/api/auth/signin
2. Auth.js lee el header 'host': cocacola.localhost:3000
3. Genera URL: http://cocacola.localhost:3000/api/auth/callback/email?token=...
4. ✅ Usuario mantiene el contexto del subdominio
```

---

## Verificación

### 1. Reiniciar el servidor

```bash
# Detener el servidor actual (Ctrl+C)
pnpm dev
```

### 2. Probar desde un subdominio

Ir a: `http://ivoka.localhost:3000/es-MX/auth/signin`

### 3. Solicitar magic link

Ingresar un email y enviar el formulario.

### 4. Verificar logs del servidor

Deberías ver:

```bash
[auth] sendVerificationRequest called
[auth] Email: chronos.devs@gmail.com
[auth] Generated URL: http://ivoka.localhost:3000/api/auth/callback/email?callbackUrl=http%3A%2F%2Fivoka.localhost%3A3000%2Fes-MX&token=716646964fe9b38747dfd3318349176cfe1e9a9bf5c10fc38125fdb08fc3990c&email=chronos.devs%40gmail.com
[auth] Host from URL: ivoka.localhost:3000
```

**Puntos clave:**
- ✅ La URL incluye `ivoka.localhost:3000`
- ✅ El `callbackUrl` también incluye el subdominio
- ✅ El host extraído es correcto

### 5. Probar con diferentes subdominios

- `http://cocacola.localhost:3000/es-MX/auth/signin`
- `http://pepsi.localhost:3000/es-MX/auth/signin`
- `http://redbull.localhost:3000/es-MX/auth/signin`

Cada uno debe generar URLs con su respectivo subdominio.

---

## Troubleshooting

### Sigo viendo `localhost` sin subdominio

**Posibles causas:**

1. **No reiniciaste el servidor**
   ```bash
   # Detener completamente y reiniciar
   pnpm dev
   ```

2. **Caché del navegador**
   ```
   - Ctrl + Shift + Delete
   - Limpiar caché
   - O usar ventana de incógnito
   ```

3. **El archivo no se guardó correctamente**
   ```bash
   # Verificar que el cambio está en el archivo
   grep -n "trustHost" packages/auth/src/config.ts
   ```
   Debe mostrar la línea con `trustHost: true`

4. **TypeScript no recompiló**
   ```bash
   # Limpiar y reconstruir
   pnpm clean
   pnpm build
   pnpm dev
   ```

### Los logs no aparecen

**Causa:** El email provider no está configurado o está usando mock.

**Solución:** Verificar `.env`:
```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=tu-email@gmail.com
EMAIL_SERVER_PASSWORD=tu-app-password
EMAIL_FROM=noreply@quinielas.mx
```

Si no tienes SMTP configurado, los emails no se enviarán pero los logs deberían aparecer igual.

---

## Impacto

### ✅ Beneficios

1. **Magic links preservan el subdominio**
   - Los usuarios regresan al brand correcto
   - El tema/branding se mantiene

2. **Mejor UX**
   - No hay confusión al cambiar de brand
   - Sesión consistente con el contexto visual

3. **Multi-tenant correcto**
   - Cada brand tiene su propia experiencia
   - Los datos se filtran correctamente por tenant

### ⚠️ Consideraciones

1. **Desarrollo vs Producción**
   - En desarrollo: `trustHost: true` funciona con localhost
   - En producción: También funciona con dominios reales

2. **Seguridad**
   - `trustHost: true` es seguro cuando:
     - Estás detrás de un proxy confiable (Vercel, Cloudflare)
     - O en desarrollo local
   - Si expones directamente el servidor, considera validar el host

3. **Variables de entorno**
   - `NEXTAUTH_URL` sigue siendo útil como fallback
   - Pero `trustHost: true` tiene prioridad

---

## Documentación Relacionada

- **Auth.js v5 Docs:** https://authjs.dev/reference/core#trusthost
- **Subdomain Setup:** `SUBDOMAIN_SETUP_ES.md`
- **Email Integration:** `EMAIL_SUBDOMAIN_INTEGRATION.md`

---

## Resumen del Fix

| Archivo | Cambio | Línea |
|---------|--------|-------|
| `packages/auth/src/config.ts` | Agregado `trustHost: true` | ~139 |
| `packages/auth/src/config.ts` | Agregado logging en `sendVerificationRequest` | ~59-62 |

**Commit message sugerido:**
```
fix(auth): add trustHost to preserve subdomain in magic links

- Add trustHost: true to Auth.js config
- Add debug logging for sendVerificationRequest
- Fixes issue where magic links used localhost instead of subdomain
```

---

**Fecha:** 2025-01-16  
**Issue:** Magic links no preservaban subdominios  
**Status:** ✅ RESUELTO
