# 🚨 URGENTE: Fix para Magic Links sin Subdominio

## Problema Actual

Los magic links se siguen enviando con `localhost` en lugar del subdominio:

```
❌ http://localhost:3000/api/auth/callback/email?...
✅ http://ivoka.localhost:3000/api/auth/callback/email?...
```

## Solución Aplicada

Se han realizado los siguientes cambios:

### 1. Configuración `trustHost: true`
**Archivo:** `packages/auth/src/config.ts` (línea 139)

### 2. Variable de entorno
**Archivo:** `packages/auth/src/env.ts` (línea 6)

## ⚡ PASOS CRÍTICOS PARA APLICAR EL FIX

### Paso 1: Detener COMPLETAMENTE el servidor

```bash
# Presiona Ctrl+C en la terminal donde corre pnpm dev
# Asegúrate de que el proceso se detuvo completamente
```

### Paso 2: Limpiar caché de Next.js

```bash
# En la raíz del proyecto
rm -rf apps/web/.next
# O en PowerShell:
Remove-Item -Recurse -Force apps\web\.next
```

### Paso 3: Reconstruir el paquete @qp/auth

```bash
pnpm --filter @qp/auth build
```

### Paso 4: Reiniciar el servidor

```bash
pnpm dev
```

### Paso 5: Limpiar caché del navegador

1. Abre DevTools (F12)
2. Click derecho en el botón de refresh
3. Selecciona "Empty Cache and Hard Reload"
4. O usa ventana de incógnito

### Paso 6: Probar desde un subdominio

```
http://ivoka.localhost:3000/es-MX/auth/signin
```

### Paso 7: Verificar logs del servidor

Deberías ver en la terminal:

```bash
[auth] sendVerificationRequest called
[auth] Email: tu-email@gmail.com
[auth] Generated URL: http://ivoka.localhost:3000/api/auth/callback/email?...
[auth] Host from URL: ivoka.localhost:3000
```

**IMPORTANTE:** Si el host muestra `localhost:3000` en lugar de `ivoka.localhost:3000`, el problema persiste.

---

## 🔍 Diagnóstico Adicional

Si después de seguir todos los pasos el problema persiste, verifica:

### 1. Verificar que trustHost está en el código compilado

```bash
# Ver el archivo compilado
cat packages/auth/dist/config.js | grep -A 5 "trustHost"
```

Debe mostrar `trustHost: true`

### 2. Verificar headers del request

Agrega logging temporal en `apps/web/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import { authConfig } from "@qp/api/context";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const headersList = headers();
  const host = headersList.get('host');
  console.log('[auth-route] Request host:', host);
  console.log('[auth-route] Request URL:', request.url);
  
  const { handlers } = NextAuth(authConfig);
  return handlers.GET(request);
}

export async function POST(request: Request) {
  const headersList = headers();
  const host = headersList.get('host');
  console.log('[auth-route] Request host:', host);
  console.log('[auth-route] Request URL:', request.url);
  
  const { handlers } = NextAuth(authConfig);
  return handlers.POST(request);
}
```

### 3. Verificar middleware

El middleware debe estar pasando el header `host` correctamente:

```bash
# Ver el middleware
cat apps/web/middleware.ts
```

Debe incluir el hostname en los headers.

---

## 🐛 Posibles Causas si Sigue Fallando

### Causa 1: Next.js está usando código cacheado

**Solución:**
```bash
# Detener servidor
# Limpiar TODO
rm -rf node_modules/.cache
rm -rf apps/web/.next
rm -rf packages/auth/dist

# Reconstruir
pnpm install
pnpm build
pnpm dev
```

### Causa 2: Auth.js no está leyendo trustHost

**Solución:** Verificar versión de Auth.js

```bash
cat package.json | grep "next-auth"
```

Debe ser v5.0.0-beta.4 o superior.

### Causa 3: Variable de entorno sobrescribiendo

**Solución:** Verificar que NO exista `AUTH_TRUST_HOST=false` en `.env`

```bash
# Ver .env (si existe)
cat .env | grep AUTH
```

### Causa 4: El request no llega con el host correcto

**Solución:** Verificar que el navegador está enviando el header correcto.

En DevTools → Network → Click en el request → Headers:
```
Request Headers:
  Host: ivoka.localhost:3000  ← Debe incluir el subdominio
```

---

## ✅ Checklist de Verificación

- [ ] Servidor detenido completamente
- [ ] Caché de Next.js limpiado (`apps/web/.next` eliminado)
- [ ] Paquete `@qp/auth` reconstruido
- [ ] Servidor reiniciado
- [ ] Caché del navegador limpiado
- [ ] Probado desde un subdominio (no desde `localhost`)
- [ ] Logs muestran el subdominio correcto
- [ ] Email recibido con URL correcta

---

## 📞 Si Nada Funciona

Si después de seguir TODOS los pasos el problema persiste:

1. **Captura de pantalla de los logs del servidor** mostrando:
   - `[auth] Generated URL: ...`
   - `[auth] Host from URL: ...`

2. **Captura del email recibido** mostrando la URL

3. **Verificar que estás accediendo desde el subdominio:**
   - URL en el navegador debe ser `http://ivoka.localhost:3000/...`
   - NO `http://localhost:3000/...`

4. **Verificar archivo hosts:**
   ```bash
   cat C:\Windows\System32\drivers\etc\hosts | grep localhost
   ```
   Debe incluir:
   ```
   127.0.0.1       ivoka.localhost
   127.0.0.1       cocacola.localhost
   127.0.0.1       pepsi.localhost
   ```

---

## 🔧 Solución Alternativa Temporal

Si el problema persiste y necesitas una solución inmediata, puedes hardcodear el subdominio temporalmente:

**NO RECOMENDADO - Solo para testing**

En `packages/auth/src/config.ts`:

```typescript
async sendVerificationRequest(params: SendVerificationRequestParams) {
  const { identifier: email, url, provider } = params;
  
  // TEMPORAL: Forzar subdominio
  let finalUrl = url;
  if (url.includes('localhost:3000/') && !url.includes('.localhost')) {
    // Extraer el subdominio del email o usar uno por defecto
    finalUrl = url.replace('http://localhost:3000', 'http://ivoka.localhost:3000');
    console.log('[auth] FORCED URL:', finalUrl);
  }
  
  const { host } = new URL(finalUrl);
  // ... resto del código usando finalUrl en lugar de url
}
```

**IMPORTANTE:** Esto es solo para debugging. La solución correcta es `trustHost: true`.

---

**Última actualización:** 2025-01-16 12:35 PM  
**Status:** 🔴 REQUIERE VERIFICACIÓN
