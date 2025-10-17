# 📋 Instrucciones de Verificación - Fix Auth Subdomain

## Cambios Aplicados

Se han realizado 3 cambios críticos para resolver el problema de subdominios en magic links:

1. ✅ **`trustHost: true`** en `packages/auth/src/config.ts`
2. ✅ **`AUTH_TRUST_HOST`** variable de entorno en `packages/auth/src/env.ts`
3. ✅ **Logging mejorado** en `apps/web/app/api/auth/[...nextauth]/route.ts`

---

## 🚀 Pasos para Aplicar y Verificar

### Paso 1: Detener el Servidor

```bash
# En la terminal donde corre el servidor
# Presiona Ctrl+C
# Espera a que el proceso termine completamente
```

### Paso 2: Limpiar Caché de Next.js

```powershell
# En PowerShell (raíz del proyecto)
Remove-Item -Recurse -Force .\apps\web\.next
```

### Paso 3: Reconstruir Paquete Auth

```bash
pnpm --filter @qp/auth build
```

### Paso 4: Reiniciar Servidor

```bash
pnpm dev
```

Espera a que el servidor inicie completamente. Deberías ver:

```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Paso 5: Abrir Navegador en Modo Incógnito

- Chrome/Edge: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`

### Paso 6: Ir a un Subdominio

```
http://ivoka.localhost:3000/es-MX/auth/signin
```

**IMPORTANTE:** Asegúrate de que la URL incluya `ivoka.localhost` y NO solo `localhost`.

### Paso 7: Solicitar Magic Link

1. Ingresa tu email: `ivokamx@gmail.com`
2. Click en "Sign in"
3. **INMEDIATAMENTE** ve a la terminal del servidor

### Paso 8: Verificar Logs del Servidor

Deberías ver algo como esto:

```bash
[auth-route] POST Request
[auth-route] Host header: ivoka.localhost:3000
[auth-route] Request URL: http://ivoka.localhost:3000/api/auth/signin/email
[auth-route] URL hostname: ivoka.localhost

[auth] sendVerificationRequest called
[auth] Email: ivokamx@gmail.com
[auth] Generated URL: http://ivoka.localhost:3000/api/auth/callback/email?callbackUrl=http%3A%2F%2Fivoka.localhost%3A3000%2Fes-MX&token=...
[auth] Host from URL: ivoka.localhost:3000
```

### Paso 9: Verificar el Email

Abre tu cliente de email y busca el email de "Sign in to Quinielas".

**La URL en el botón "Sign In" debe ser:**

```
http://ivoka.localhost:3000/api/auth/callback/email?callbackUrl=http%3A%2F%2Fivoka.localhost%3A3000%2Fes-MX&token=...
```

**NO debe ser:**

```
❌ http://localhost:3000/api/auth/callback/email?...
```

---

## ✅ Criterios de Éxito

| Criterio | Esperado | ¿Cumple? |
|----------|----------|----------|
| Host header en logs | `ivoka.localhost:3000` | [ ] |
| Generated URL en logs | Incluye `ivoka.localhost:3000` | [ ] |
| URL en email | Incluye `ivoka.localhost:3000` | [ ] |
| Click en link funciona | Regresa al subdominio correcto | [ ] |

---

## 🐛 Si los Logs Muestran `localhost` sin Subdominio

### Diagnóstico 1: Verificar que estás en el subdominio correcto

En el navegador, la URL debe ser:
```
✅ http://ivoka.localhost:3000/es-MX/auth/signin
❌ http://localhost:3000/es-MX/auth/signin
```

Si estás en `localhost` sin subdominio, **los logs mostrarán localhost**.

### Diagnóstico 2: Verificar archivo hosts

```powershell
# Ver archivo hosts
notepad C:\Windows\System32\drivers\etc\hosts
```

Debe contener:
```
127.0.0.1       ivoka.localhost
127.0.0.1       cocacola.localhost
127.0.0.1       pepsi.localhost
```

Si no están, ejecuta:
```powershell
.\scripts\setup-local-hosts.ps1
```

### Diagnóstico 3: Limpiar DNS cache

```powershell
ipconfig /flushdns
```

Luego reinicia el navegador (cierra TODAS las ventanas).

### Diagnóstico 4: Verificar que trustHost está en el código compilado

```powershell
# Ver el archivo compilado
Get-Content packages\auth\dist\config.js | Select-String -Pattern "trustHost" -Context 2,2
```

Debe mostrar:
```javascript
trustHost: true,
```

Si no aparece, el paquete no se recompiló. Repite Paso 3.

---

## 🔍 Debugging Avanzado

### Ver todos los headers del request

Modifica temporalmente `apps/web/app/api/auth/[...nextauth]/route.ts`:

```typescript
export async function POST(request: Request) {
  const headersList = headers();
  
  console.log('[auth-route] ALL HEADERS:');
  headersList.forEach((value, key) => {
    console.log(`  ${key}: ${value}`);
  });
  
  return handlers.POST(request);
}
```

Esto mostrará TODOS los headers. Busca:
```
host: ivoka.localhost:3000
```

### Verificar que Next.js no está sobrescribiendo

En `apps/web/next.config.js`, verifica que NO haya configuración que sobrescriba el host:

```javascript
// NO debe haber algo como:
// env: {
//   NEXTAUTH_URL: 'http://localhost:3000'
// }
```

---

## 📸 Capturas Requeridas para Debugging

Si el problema persiste, necesito ver:

1. **Screenshot de los logs del servidor** mostrando:
   - `[auth-route] Host header: ...`
   - `[auth] Generated URL: ...`

2. **Screenshot del navegador** mostrando:
   - URL en la barra de direcciones
   - Debe ser `ivoka.localhost:3000`

3. **Screenshot del email** mostrando:
   - La URL completa del botón "Sign In"

4. **Output del comando:**
   ```powershell
   Get-Content packages\auth\dist\config.js | Select-String -Pattern "trustHost"
   ```

---

## 🎯 Resumen Rápido

```bash
# 1. Detener servidor (Ctrl+C)

# 2. Limpiar
Remove-Item -Recurse -Force .\apps\web\.next

# 3. Rebuild
pnpm --filter @qp/auth build

# 4. Iniciar
pnpm dev

# 5. Probar desde:
# http://ivoka.localhost:3000/es-MX/auth/signin
# (NO desde localhost)

# 6. Verificar logs muestren:
# Host header: ivoka.localhost:3000
```

---

**Fecha:** 2025-01-16  
**Hora:** 12:40 PM  
**Status:** 🟡 PENDIENTE DE VERIFICACIÓN
