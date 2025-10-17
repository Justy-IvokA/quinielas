# User Metadata Guide

## Overview

El campo `metadata` en el modelo `User` es un campo JSON flexible que permite agregar nuevos datos de usuario sin necesidad de migraciones de base de datos constantes. Esto facilita la escalabilidad y experimentación rápida.

## Estructura del Metadata

```typescript
interface UserMetadata {
  preferences?: UserPreferences;      // Preferencias del usuario
  limits?: UsageLimits;              // Límites y cuotas
  flags?: FeatureFlags;              // Feature flags para A/B testing
  verification?: VerificationStatus; // Estado de verificación
  onboarding?: OnboardingProgress;   // Progreso de onboarding
  customData?: Record<string, unknown>; // Datos personalizados
}
```

## Casos de Uso

### 1. Preferencias del Usuario

```typescript
import { mergeUserMetadata, parseUserMetadata } from "@qp/db";

// Actualizar preferencias de notificaciones
const metadata = parseUserMetadata(user.metadata);
const updated = mergeUserMetadata(metadata, {
  preferences: {
    notifications: {
      email: true,
      push: false,
      sms: true,
    },
    theme: "dark",
    language: "es-MX",
  },
});

await prisma.user.update({
  where: { id: userId },
  data: { metadata: updated },
});
```

### 2. Límites de Uso

```typescript
// Verificar límite de cambios de perfil
const metadata = parseUserMetadata(user.metadata);
const profileChangesUsed = metadata?.limits?.profileChanges?.used ?? 0;
const profileChangesMax = metadata?.limits?.profileChanges?.max ?? 3;

if (profileChangesUsed >= profileChangesMax) {
  throw new Error("Límite alcanzado");
}

// Incrementar contador
const updated = mergeUserMetadata(metadata, {
  limits: {
    profileChanges: {
      used: profileChangesUsed + 1,
      max: profileChangesMax,
    },
  },
});
```

### 3. Feature Flags

```typescript
// Habilitar features beta para un usuario
const updated = mergeUserMetadata(metadata, {
  flags: {
    betaFeatures: true,
    advancedStats: true,
    socialSharing: false,
  },
});

// Verificar si un usuario tiene acceso a una feature
const hasBetaAccess = metadata?.flags?.betaFeatures ?? false;
```

### 4. Estado de Verificación

```typescript
// Marcar email como verificado
const updated = mergeUserMetadata(metadata, {
  verification: {
    email: {
      verified: true,
      verifiedAt: new Date().toISOString(),
    },
  },
});
```

### 5. Progreso de Onboarding

```typescript
// Actualizar progreso de onboarding
const updated = mergeUserMetadata(metadata, {
  onboarding: {
    completed: false,
    steps: {
      profileSetup: true,
      firstPrediction: false,
      firstPoolJoin: false,
      tutorialViewed: true,
    },
  },
});
```

### 6. Datos Personalizados por Tenant

```typescript
// Agregar datos específicos del tenant
const updated = mergeUserMetadata(metadata, {
  customData: {
    tenantSpecific: {
      favoriteTeam: "team_123",
      customBadges: ["early_adopter", "top_predictor"],
      loyaltyPoints: 1500,
    },
  },
});
```

## Migración de Datos Existentes

Si tienes campos existentes que quieres mover a metadata:

```typescript
// Script de migración
const users = await prisma.user.findMany({
  where: { metadata: null },
});

for (const user of users) {
  const metadata: UserMetadata = {
    limits: {
      profileChanges: {
        used: user.profileChangesCount,
        max: 3,
      },
    },
  };

  await prisma.user.update({
    where: { id: user.id },
    data: { metadata },
  });
}
```

## Mejores Prácticas

### 1. Siempre Usar Type Safety

```typescript
import { UserMetadata, parseUserMetadata, mergeUserMetadata } from "@qp/db";

// ✅ Correcto
const metadata = parseUserMetadata(user.metadata);
const updated = mergeUserMetadata(metadata, { ... });

// ❌ Incorrecto
const metadata = user.metadata as any;
metadata.someField = "value";
```

### 2. Valores por Defecto

```typescript
import { DEFAULT_USER_METADATA } from "@qp/db";

// Al crear un nuevo usuario
await prisma.user.create({
  data: {
    email: "user@example.com",
    metadata: DEFAULT_USER_METADATA,
  },
});
```

### 3. Validación

```typescript
import { isValidUserMetadata } from "@qp/db";

if (!isValidUserMetadata(data)) {
  throw new Error("Invalid metadata structure");
}
```

### 4. Retrocompatibilidad

Siempre mantén retrocompatibilidad con campos existentes:

```typescript
// Usar metadata si existe, sino usar campo legacy
const profileChangesUsed = 
  metadata?.limits?.profileChanges?.used ?? 
  user.profileChangesCount;
```

### 5. No Almacenar Datos Sensibles

❌ **NO** almacenar:
- Contraseñas
- Tokens de acceso
- Información de pago
- Datos personales sensibles (SSN, etc.)

✅ **SÍ** almacenar:
- Preferencias de UI
- Feature flags
- Contadores y límites
- Estado de onboarding
- Configuraciones no sensibles

## Indexación

Si necesitas consultar por campos dentro de metadata frecuentemente, considera:

1. **Usar campos dedicados** para queries frecuentes
2. **Índices JSON** (PostgreSQL 14+):

```sql
CREATE INDEX idx_user_metadata_flags 
ON "User" USING GIN ((metadata->'flags'));
```

3. **Computed columns** para campos críticos

## Monitoreo

Monitorea el tamaño del campo metadata:

```sql
-- Ver tamaño promedio de metadata
SELECT 
  AVG(LENGTH(metadata::text)) as avg_size,
  MAX(LENGTH(metadata::text)) as max_size
FROM "User"
WHERE metadata IS NOT NULL;
```

## Límites

- **Tamaño máximo recomendado**: 10KB por usuario
- **Profundidad máxima**: 5 niveles de anidación
- **Número de campos**: < 50 campos por usuario

## Ejemplos de Uso en el Código

### En un tRPC Router

```typescript
import { parseUserMetadata, mergeUserMetadata } from "@qp/db";

export const userRouter = router({
  updatePreferences: protectedProcedure
    .input(z.object({
      theme: z.enum(["light", "dark", "system"]),
      notifications: z.object({
        email: z.boolean(),
        push: z.boolean(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      const metadata = parseUserMetadata(user?.metadata);
      const updated = mergeUserMetadata(metadata, {
        preferences: {
          theme: input.theme,
          notifications: input.notifications,
        },
      });

      return await prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { metadata: updated },
      });
    }),
});
```

### En el Frontend

```typescript
import { trpc } from "@web/trpc/react";

function UserPreferences() {
  const { data: profile } = trpc.user.getProfile.useQuery();
  
  const theme = profile?.metadata?.preferences?.theme ?? "system";
  const emailNotifications = 
    profile?.metadata?.preferences?.notifications?.email ?? true;

  return (
    <div>
      <p>Theme: {theme}</p>
      <p>Email Notifications: {emailNotifications ? "On" : "Off"}</p>
    </div>
  );
}
```

## Recursos Adicionales

- **Tipos TypeScript**: `packages/db/src/types/user-metadata.ts`
- **Helpers**: `parseUserMetadata`, `mergeUserMetadata`, `isValidUserMetadata`
- **Constantes**: `DEFAULT_USER_METADATA`

## Soporte

Para agregar nuevos campos al metadata, actualiza:
1. `packages/db/src/types/user-metadata.ts` - Definiciones de tipos
2. `DEFAULT_USER_METADATA` - Valores por defecto
3. Esta guía - Documentación y ejemplos
