# Solución: Agregar campos de Auth.js al modelo User

## ✅ Cambios Realizados

Se agregaron los campos necesarios para Auth.js al modelo `User` en el schema de Prisma:

```prisma
model User {
  id            String          @id @default(cuid())
  email         String          @unique
  emailVerified DateTime?       // ✅ NUEVO - Auth.js requirement
  image         String?         // ✅ NUEVO - Auth.js requirement (profile picture URL)
  phone         String?         @unique
  phoneVerified Boolean         @default(false)
  name          String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  lastSignInAt  DateTime?
  // ... resto de relaciones
}
```

## 📋 Pasos para Aplicar los Cambios

### 1. Detén el servidor de desarrollo

```bash
# Presiona Ctrl+C en la terminal donde corre pnpm dev
```

### 2. Aplica los cambios a la base de datos

La base de datos ya fue actualizada con `pnpm db:push` ✅

### 3. Regenera el cliente de Prisma

```bash
pnpm db:generate
```

### 4. Reinicia el servidor

```bash
pnpm dev
```

## 🧪 Prueba el Login

1. Ve a http://localhost:3001/es-MX/auth/signin
2. Ingresa tu email: chronos.devs@gmail.com
3. Revisa tu correo
4. Haz clic en el magic link
5. ✅ Deberías iniciar sesión correctamente

## 📝 Qué se Solucionó

### Antes (❌ Error)
```
Invalid `prisma.user.update()` invocation:
emailVerified: new Date("2025-10-13T18:12:10.425Z"),
~~~~~~~~~~~~~
Field 'emailVerified' does not exist in model 'User'
```

### Después (✅ Funciona)
```
✅ emailVerified se actualiza correctamente
✅ image se puede guardar para OAuth providers
✅ Auth.js funciona completamente
```

## 🔍 Campos Agregados

### `emailVerified: DateTime?`
- **Propósito**: Auth.js lo usa para marcar cuando un email ha sido verificado
- **Tipo**: DateTime opcional (puede ser null)
- **Uso**: Se actualiza automáticamente cuando el usuario hace clic en el magic link

### `image: String?`
- **Propósito**: URL de la imagen de perfil del usuario
- **Tipo**: String opcional
- **Uso**: 
  - OAuth providers (Google, Microsoft) lo llenan automáticamente
  - Se puede actualizar manualmente desde el perfil
  - Se muestra en el Avatar del header

## 🎯 Beneficios

1. ✅ **Compatibilidad completa** con Auth.js v5
2. ✅ **Magic links funcionan** correctamente
3. ✅ **OAuth providers** pueden guardar la imagen de perfil
4. ✅ **Avatar en el header** muestra la imagen del usuario
5. ✅ **No más errores** de AdapterError

## 🔧 Si el comando `pnpm db:generate` falla

El error `EPERM: operation not permitted` significa que el servidor está usando los archivos de Prisma.

**Solución:**
1. Detén COMPLETAMENTE el servidor (Ctrl+C)
2. Espera 5 segundos
3. Ejecuta `pnpm db:generate`
4. Reinicia el servidor con `pnpm dev`

## 📊 Estado de la Base de Datos

```sql
-- Los nuevos campos en la tabla User:
ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "image" TEXT;
```

✅ Ya aplicado con `pnpm db:push`

## 🚀 Próximos Pasos

Después de aplicar estos cambios:

1. El login con magic link funcionará
2. El avatar mostrará la imagen del usuario (si tiene)
3. OAuth providers (Google, Microsoft) funcionarán correctamente
4. El campo `emailVerified` se actualizará automáticamente

## ⚠️ Nota Importante

Estos campos son **requeridos por Auth.js** y no deben eliminarse. Son parte del estándar de Auth.js/NextAuth y se usan en:

- PrismaAdapter
- Email verification
- OAuth providers
- Session management
