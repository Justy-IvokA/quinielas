# Propuesta: Modelo UserPassword (Opcional)

**Fecha:** 2025-10-09  
**Estado:** 🟡 Propuesta para evaluación (NO recomendado para MVP)

---

## Contexto

El proyecto usa **Auth.js con magic links** (passwordless) como método principal de autenticación. Sin embargo, si en el futuro se requiere autenticación con contraseña (ej: para superadmins), aquí está la propuesta.

---

## ⚠️ Recomendación: NO implementar para MVP

### Razones

1. **Arquitectura actual es passwordless**
   - Auth.js con magic links por email
   - No requiere almacenar contraseñas
   - Más seguro y mejor UX

2. **Cumple con principios del proyecto**
   - "Store minimal PII" (.windsurfrules línea 99)
   - Menos superficie de ataque
   - No requiere gestión de passwords (reset, rotación, etc.)

3. **Complejidad innecesaria para MVP**
   - Magic links son suficientes para jugadores
   - OAuth puede agregarse después para admins

---

## 🔧 Si decides implementar passwords

### Propuesta Corregida

Tu propuesta original tiene un error de tipo de dato. El `userId` debe ser `String` (cuid), no `Int`:

```prisma
model UserPassword {
  id        String   @id @default(cuid())
  userId    String   @unique
  hash      String   // bcrypt/argon2 hash
  algorithm String   @default("bcrypt") // Para migración futura
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model User {
  id            String          @id @default(cuid())  // ✅ Es String, no Int
  email         String          @unique
  phone         String?         @unique
  phoneVerified Boolean         @default(false)
  name          String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  lastSignInAt  DateTime?

  password      UserPassword?   // ✅ Relación opcional
  // ... resto de relaciones
}
```

### Mejoras Adicionales

1. **Campo `algorithm`**: Permite migrar de bcrypt a argon2 en el futuro
2. **Relación opcional**: No todos los usuarios necesitan password (magic link users)
3. **Timestamps**: Para auditoría y rotación forzada
4. **Campo `id`**: Permite múltiples passwords históricos si implementas rotación

### Alternativa: Usar tabla de Auth.js

Auth.js ya tiene soporte para passwords mediante el adaptador de Prisma:

```prisma
// Opción 1: Usar schema estándar de Auth.js
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String  // "credentials" para passwords
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  password      String?   // ⚠️ Opción simple pero menos segura
  // ...
  accounts      Account[]
}
```

**Problema:** Esto mezcla el hash con el modelo User, que es lo que querías evitar.

---

## ✅ Recomendación Final

### Para MVP (Ahora)

**NO agregar UserPassword.** Usar solo:
- ✅ Magic links por email (Auth.js EmailProvider)
- ✅ OAuth opcional (Google, GitHub) para admins

### Post-MVP (Si realmente lo necesitas)

**Opción A: Tabla separada (tu propuesta mejorada)**
```prisma
model UserPassword {
  id        String   @id @default(cuid())
  userId    String   @unique
  hash      String
  algorithm String   @default("argon2id")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Opción B: Solo para superadmins**
```prisma
model AdminCredentials {
  id        String   @id @default(cuid())
  userId    String   @unique
  hash      String
  mfaSecret String?  // Para 2FA
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

---

## Implementación Segura (si decides hacerlo)

### 1. Hashing

```typescript
// packages/auth/src/password.ts
import { hash, verify } from "@node-rs/argon2";

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  return await verify(hash, password);
}
```

### 2. Validación

```typescript
// packages/api/src/routers/auth/schema.ts
import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(12, "Mínimo 12 caracteres")
  .max(128, "Máximo 128 caracteres")
  .regex(/[a-z]/, "Debe contener minúsculas")
  .regex(/[A-Z]/, "Debe contener mayúsculas")
  .regex(/[0-9]/, "Debe contener números")
  .regex(/[^a-zA-Z0-9]/, "Debe contener símbolos");
```

### 3. Rate Limiting

```typescript
// Prevenir brute force
export const loginProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Rate limit: 5 intentos por 15 minutos
    const attempts = await redis.incr(`login:${input.email}`);
    if (attempts > 5) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Demasiados intentos. Intenta en 15 minutos.",
      });
    }
    await redis.expire(`login:${input.email}`, 900); // 15 min

    // Verificar password
    const userPassword = await prisma.userPassword.findUnique({
      where: { userId: user.id },
    });

    if (!userPassword || !(await verifyPassword(userPassword.hash, input.password))) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Credenciales inválidas",
      });
    }

    // Login exitoso
    await redis.del(`login:${input.email}`);
    return { success: true };
  });
```

---

## Comparación: Magic Link vs Password

| Aspecto | Magic Link | Password |
|---------|-----------|----------|
| **Seguridad** | ✅ Alta (tokens temporales) | ⚠️ Media (depende del usuario) |
| **UX** | ✅ Simple (1 click) | ❌ Compleja (recordar, reset) |
| **Implementación** | ✅ Simple | ❌ Compleja (hashing, validation, reset) |
| **Superficie de ataque** | ✅ Mínima | ❌ Hashes pueden filtrarse |
| **Compliance** | ✅ Minimal PII | ⚠️ Requiere políticas de rotación |
| **Costo de mantenimiento** | ✅ Bajo | ❌ Alto (reset flows, 2FA, etc.) |

---

## Decisión Recomendada

### ❌ NO implementar UserPassword para MVP

**Razones:**
1. Magic links son suficientes y más seguros
2. Agrega complejidad innecesaria
3. No alineado con arquitectura passwordless
4. Requiere flows adicionales (reset, rotación, etc.)

### ✅ Alternativas

1. **Ahora (MVP):**
   - Magic links para todos los usuarios
   - OAuth (Google/GitHub) para admins si lo necesitas

2. **Post-MVP (si realmente lo necesitas):**
   - Solo para superadmins (tabla `AdminCredentials`)
   - Con 2FA obligatorio
   - Rate limiting agresivo

---

## Conclusión

Tu observación sobre separar el hash del modelo User es **técnicamente correcta** para arquitecturas con passwords. Sin embargo, **no aplica a este proyecto** porque usa autenticación passwordless.

**Recomendación final:** Mantener la arquitectura actual sin passwords para MVP. Si en el futuro lo necesitas, implementar solo para admins con 2FA obligatorio.

---

**Autor:** Cascade AI  
**Revisión:** Recomendada antes de decidir implementar passwords
