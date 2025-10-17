# Solución al Error de Autenticación "Verification"

## Problema
El magic link del email apunta al puerto incorrecto (`localhost:3000` en lugar de `localhost:3001`), causando que el token no se valide correctamente.

## Causa
Tu archivo `.env.local` en `apps/admin/` tiene configurado:
- `NEXTAUTH_URL=http://localhost:3000` (incorrecto - es el puerto de web app)
- O falta la variable `AUTH_URL`

## Solución

### 1. Actualiza tu archivo `.env.local` en `apps/admin/`

Asegúrate de tener estas variables configuradas correctamente:

```bash
# ============================================
# AUTH (Auth.js v5)
# ============================================
AUTH_URL=http://localhost:3001
AUTH_SECRET=tu-secret-de-32-caracteres-minimo

# Email Provider (Magic Link)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=chronos.devs@gmail.com
EMAIL_SERVER_PASSWORD=tu-app-password-de-gmail
EMAIL_FROM=chronos.devs@gmail.com
```

**IMPORTANTE:** 
- Admin app usa puerto **3001**
- Web app usa puerto **3000**
- Usa `AUTH_URL` (no `NEXTAUTH_URL`)
- `AUTH_SECRET` debe tener mínimo 32 caracteres

### 2. Genera un AUTH_SECRET seguro

```bash
# En tu terminal:
openssl rand -base64 32
```

Copia el resultado y úsalo como valor de `AUTH_SECRET`.

### 3. Configura Gmail App Password

Si usas Gmail, necesitas una "App Password" (no tu contraseña normal):

1. Ve a https://myaccount.google.com/security
2. Activa "2-Step Verification" si no lo tienes
3. Ve a "App passwords"
4. Genera una contraseña para "Mail"
5. Usa esa contraseña en `EMAIL_SERVER_PASSWORD`

### 4. Reinicia el servidor

```bash
# Detén el servidor (Ctrl+C)
# Luego reinicia:
pnpm dev
```

### 5. Prueba nuevamente

1. Ve a http://localhost:3001/es-MX/auth/signin
2. Ingresa tu email: chronos.devs@gmail.com
3. Revisa tu correo
4. El link ahora debería apuntar a `localhost:3001` (no 3000)
5. Haz clic en el link

## Verificación

El URL del magic link debería verse así:

```
http://localhost:3001/api/auth/callback/email?callbackUrl=...&token=...&email=...
```

**Nota el puerto 3001** (no 3000).

## Si sigue sin funcionar

1. **Limpia las cookies del navegador** para localhost
2. **Verifica que el puerto 3001 esté corriendo** el admin app
3. **Revisa los logs del servidor** para ver si hay errores
4. **Verifica que la base de datos** tenga las tablas de Auth.js:
   - `User`
   - `Account`
   - `Session`
   - `VerificationToken`

## Diferencias entre Apps

| Variable | Admin App (3001) | Web App (3000) |
|----------|------------------|----------------|
| AUTH_URL | http://localhost:3001 | http://localhost:3000 |
| Puerto | 3001 | 3000 |
| Uso | Panel administrativo | App pública |

## Comandos útiles

```bash
# Ver variables de entorno cargadas
pnpm --filter @qp/admin dev

# Verificar que el servidor esté en el puerto correcto
# Deberías ver: "ready started server on [::]:3001"
```
