# Solución: Error de Verificación de Auth.js

## 🔴 Problema

```
[auth][error] Verification
An operation failed because it depends on one or more records that were required but not found.
No record was found for a delete.
```

**Causa:** El `callbackUrl` en el magic link apunta al puerto incorrecto (`localhost:3000` en lugar de `localhost:3001`).

## ✅ Solución

### Paso 1: Verifica tu `.env.local` del Admin

Abre `apps/admin/.env.local` y asegúrate de tener:

```bash
# ❌ INCORRECTO
AUTH_URL=http://localhost:3000

# ✅ CORRECTO
AUTH_URL=http://localhost:3001

# También verifica:
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
```

### Paso 2: Limpia la Base de Datos

Los tokens viejos pueden estar causando conflictos. Límpia la tabla de verificación:

```sql
-- Conecta a tu base de datos y ejecuta:
DELETE FROM "VerificationToken" WHERE expires < NOW();
```

O desde Prisma Studio:

```bash
# Abre Prisma Studio
cd packages/db
npx prisma studio

# Ve a la tabla VerificationToken
# Elimina todos los registros expirados
```

### Paso 3: Reinicia el Servidor

```bash
# Detén el servidor (Ctrl+C)
# Reinicia
pnpm dev
```

### Paso 4: Prueba Nuevamente

1. Ve a http://localhost:3001/es-MX/auth/signin
2. Ingresa tu email: chronos.devs@gmail.com
3. Revisa tu correo
4. **IMPORTANTE:** El link ahora debe verse así:
   ```
   http://localhost:3001/api/auth/callback/email?...
                     ^^^^
                     ✅ Puerto 3001
   ```
5. Haz clic en el link

## 🔍 Verificación Adicional

### Verifica que AUTH_URL esté cargándose

Agrega un log temporal en tu configuración de Auth.js:

```typescript
// packages/auth/src/config.ts
console.log('AUTH_URL:', process.env.AUTH_URL);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
```

Deberías ver en los logs:
```
AUTH_URL: http://localhost:3001
NEXTAUTH_URL: undefined (o http://localhost:3001)
```

### Verifica el Email

El email que recibes debe tener un link que apunte a:
- ✅ `http://localhost:3001/api/auth/callback/email?...`
- ❌ NO `http://localhost:3000/api/auth/callback/email?...`

## 🐛 Si el Problema Persiste

### Opción 1: Limpia Completamente las Sesiones

```sql
-- Limpia todas las tablas de Auth.js
DELETE FROM "Session";
DELETE FROM "VerificationToken";
DELETE FROM "Account";
```

### Opción 2: Verifica la Configuración de Auth.js

```typescript
// packages/auth/src/config.ts
export const authConfig = {
  // ...
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log('SignIn callback:', { user, account, email });
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback:', { url, baseUrl });
      // Asegúrate de que baseUrl sea correcto
      return url.startsWith(baseUrl) ? url : baseUrl;
    }
  }
}
```

### Opción 3: Usa Variables de Entorno Explícitas

En lugar de confiar en la detección automática, especifica explícitamente:

```bash
# apps/admin/.env.local
AUTH_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3001  # Fallback para compatibilidad
```

## 📝 Checklist de Verificación

- [ ] `AUTH_URL=http://localhost:3001` en `.env.local`
- [ ] `NEXT_PUBLIC_ADMIN_URL=http://localhost:3001` en `.env.local`
- [ ] Servidor reiniciado después de cambios
- [ ] Tokens viejos eliminados de la base de datos
- [ ] Email recibido con link correcto (puerto 3001)
- [ ] Click en el link funciona sin errores

## 🎯 Resultado Esperado

Después de aplicar estos cambios:

1. ✅ El email llega con el link correcto
2. ✅ El link apunta a `localhost:3001`
3. ✅ El token se valida correctamente
4. ✅ Inicias sesión exitosamente
5. ✅ Eres redirigido al dashboard

## 💡 Prevención Futura

Para evitar este problema en el futuro:

1. **Nunca cambies `AUTH_URL`** sin reiniciar el servidor
2. **Limpia tokens expirados** regularmente (puedes crear un cron job)
3. **Usa diferentes emails** para web y admin en desarrollo
4. **Documenta los puertos** claramente:
   - Web: 3000
   - Admin: 3001
   - Worker: 3002 (si aplica)

## 🔗 Referencias

- [Auth.js Verification Error](https://errors.authjs.dev#verification)
- [Auth.js Configuration](https://authjs.dev/reference/core)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
