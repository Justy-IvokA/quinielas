# Ejemplos de Uso - Campo Teléfono en Registro

**Fecha:** 2025-10-09  
**Para:** Desarrolladores del equipo

---

## 📝 Ejemplos de Código

### 1. Consultar Registros con Teléfono Verificado

```typescript
// packages/api/src/routers/notifications/index.ts

import { prisma } from "@qp/db";

// Obtener usuarios de un pool con teléfono verificado
export async function getUsersWithVerifiedPhone(poolId: string) {
  return await prisma.registration.findMany({
    where: {
      poolId,
      phone: { not: null },
      phoneVerified: true
    },
    select: {
      userId: true,
      displayName: true,
      phone: true,
      user: {
        select: {
          id: true,
          email: true
        }
      }
    }
  });
}
```

### 2. Enviar Notificación a Usuarios con Teléfono

```typescript
// apps/worker/src/jobs/send-match-reminders.ts

import { prisma } from "@qp/db";
import { sendWhatsAppMessage } from "../services/whatsapp";

export async function sendMatchReminders(matchId: string) {
  // Obtener match con predicciones
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: {
        where: {
          registration: {
            phone: { not: null },
            phoneVerified: true
          }
        },
        include: {
          registration: {
            select: {
              displayName: true,
              phone: true
            }
          }
        }
      }
    }
  });

  if (!match) return;

  // Enviar recordatorio a cada usuario
  for (const prediction of match.predictions) {
    const phone = prediction.registration.phone;
    if (!phone) continue;

    const message = `⚽ ¡Hola ${prediction.registration.displayName}! 
Tu partido ${match.homeTeam.name} vs ${match.awayTeam.name} inicia en 30 minutos.
Tu predicción: ${prediction.homeScore}-${prediction.awayScore}`;

    await sendWhatsAppMessage({
      to: phone,
      message
    });
  }
}
```

### 3. Actualizar Teléfono en Perfil de Usuario

```typescript
// packages/api/src/routers/users/index.ts

import { z } from "zod";
import { prisma } from "@qp/db";
import { publicProcedure, router } from "../../trpc";

const updatePhoneSchema = z.object({
  userId: z.string().cuid(),
  poolId: z.string().cuid(),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/).optional()
});

export const usersRouter = router({
  updatePhone: publicProcedure
    .input(updatePhoneSchema)
    .mutation(async ({ input }) => {
      return await prisma.registration.update({
        where: {
          userId_poolId: {
            userId: input.userId,
            poolId: input.poolId
          }
        },
        data: {
          phone: input.phone,
          phoneVerified: false // Reset verification
        }
      });
    })
});
```

### 4. Componente React para Agregar/Editar Teléfono

```tsx
// apps/web/app/profile/components/phone-settings.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, FormField, Input, toastSuccess, toastError } from "@qp/ui";
import { trpc } from "@/lib/trpc";

interface PhoneFormData {
  phone: string;
}

export function PhoneSettings({ userId, poolId, currentPhone }: {
  userId: string;
  poolId: string;
  currentPhone?: string | null;
}) {
  const [isEditing, setIsEditing] = useState(!currentPhone);
  
  const { register, handleSubmit, formState: { errors } } = useForm<PhoneFormData>({
    defaultValues: {
      phone: currentPhone || ""
    }
  });

  const updateMutation = trpc.users.updatePhone.useMutation({
    onSuccess: () => {
      toastSuccess("Teléfono actualizado");
      setIsEditing(false);
    },
    onError: (error) => {
      toastError(error.message);
    }
  });

  const onSubmit = (data: PhoneFormData) => {
    updateMutation.mutate({
      userId,
      poolId,
      phone: data.phone || undefined
    });
  };

  if (!isEditing && currentPhone) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Teléfono</p>
          <p className="text-sm text-muted-foreground">{currentPhone}</p>
        </div>
        <Button variant="outline" onClick={() => setIsEditing(true)}>
          Editar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label="Teléfono"
        htmlFor="phone"
        error={errors.phone?.message}
        description="Formato internacional (ej: +525512345678)"
      >
        <Input
          id="phone"
          type="tel"
          placeholder="+525512345678"
          {...register("phone", {
            pattern: {
              value: /^\+[1-9]\d{1,14}$/,
              message: "Formato inválido"
            }
          })}
        />
      </FormField>

      <div className="flex gap-2">
        <Button type="submit" loading={updateMutation.isPending}>
          Guardar
        </Button>
        {currentPhone && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(false)}
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
```

### 5. Query para Estadísticas de Teléfonos

```typescript
// packages/api/src/routers/analytics/index.ts

import { prisma } from "@qp/db";

export async function getPhoneStatistics(poolId: string) {
  const stats = await prisma.registration.groupBy({
    by: ['phoneVerified'],
    where: {
      poolId,
      phone: { not: null }
    },
    _count: true
  });

  const total = await prisma.registration.count({
    where: { poolId }
  });

  const withPhone = await prisma.registration.count({
    where: {
      poolId,
      phone: { not: null }
    }
  });

  return {
    total,
    withPhone,
    withoutPhone: total - withPhone,
    verified: stats.find(s => s.phoneVerified)?._count || 0,
    unverified: stats.find(s => !s.phoneVerified)?._count || 0,
    percentageWithPhone: ((withPhone / total) * 100).toFixed(2)
  };
}
```

---

## 🔍 Queries SQL Útiles

### Ver registros con teléfono

```sql
SELECT 
  "displayName",
  "email",
  "phone",
  "phoneVerified",
  "joinedAt"
FROM "Registration"
WHERE "poolId" = 'tu-pool-id'
  AND "phone" IS NOT NULL
ORDER BY "joinedAt" DESC;
```

### Estadísticas de teléfonos por pool

```sql
SELECT 
  p."name" as pool_name,
  COUNT(*) as total_registrations,
  COUNT(r."phone") as with_phone,
  COUNT(*) - COUNT(r."phone") as without_phone,
  COUNT(CASE WHEN r."phoneVerified" = true THEN 1 END) as verified,
  ROUND(
    (COUNT(r."phone")::numeric / COUNT(*)) * 100, 
    2
  ) as percentage_with_phone
FROM "Registration" r
JOIN "Pool" p ON r."poolId" = p.id
GROUP BY p.id, p."name"
ORDER BY percentage_with_phone DESC;
```

### Usuarios que necesitan verificar teléfono

```sql
SELECT 
  r."displayName",
  r."email",
  r."phone",
  r."joinedAt",
  p."name" as pool_name
FROM "Registration" r
JOIN "Pool" p ON r."poolId" = p.id
WHERE r."phone" IS NOT NULL
  AND r."phoneVerified" = false
ORDER BY r."joinedAt" DESC;
```

---

## 🧪 Testing con Jest/Vitest

### Test de validación de teléfono

```typescript
// packages/api/src/routers/registration/schema.test.ts

import { describe, it, expect } from 'vitest';
import { registerPublicSchema } from './schema';

describe('Phone validation', () => {
  it('should accept valid E.164 phone numbers', () => {
    const validPhones = [
      '+525512345678',
      '+14155552671',
      '+34612345678',
      '+5491112345678'
    ];

    validPhones.forEach(phone => {
      const result = registerPublicSchema.safeParse({
        poolId: 'test-pool',
        userId: 'test-user',
        displayName: 'Test User',
        email: 'test@example.com',
        phone
      });

      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid phone numbers', () => {
    const invalidPhones = [
      '5512345678',           // Missing +
      '+52 55 1234 5678',     // Spaces
      '+0525512345678',       // Starts with 0
      '+52-55-1234-5678',     // Dashes
      'not-a-phone'           // Invalid format
    ];

    invalidPhones.forEach(phone => {
      const result = registerPublicSchema.safeParse({
        poolId: 'test-pool',
        userId: 'test-user',
        displayName: 'Test User',
        email: 'test@example.com',
        phone
      });

      expect(result.success).toBe(false);
    });
  });

  it('should accept registration without phone', () => {
    const result = registerPublicSchema.safeParse({
      poolId: 'test-pool',
      userId: 'test-user',
      displayName: 'Test User',
      email: 'test@example.com'
      // phone is optional
    });

    expect(result.success).toBe(true);
  });
});
```

### Test de mutation de registro

```typescript
// packages/api/src/routers/registration/index.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@qp/db';
import { registrationRouter } from './index';

describe('Registration with phone', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.registration.deleteMany({
      where: { email: 'test@example.com' }
    });
  });

  it('should create registration with phone', async () => {
    const caller = registrationRouter.createCaller({ prisma });

    const result = await caller.registerPublic({
      poolId: 'test-pool-id',
      userId: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com',
      phone: '+525512345678'
    });

    expect(result.phone).toBe('+525512345678');
    expect(result.phoneVerified).toBe(false);
  });

  it('should create registration without phone', async () => {
    const caller = registrationRouter.createCaller({ prisma });

    const result = await caller.registerPublic({
      poolId: 'test-pool-id',
      userId: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com'
    });

    expect(result.phone).toBeNull();
    expect(result.phoneVerified).toBe(false);
  });
});
```

---

## 📱 Ejemplos de Mensajes SMS/WhatsApp

### Recordatorio de partido

```typescript
const message = `⚽ ¡Hola ${userName}!

Tu partido ${homeTeam} vs ${awayTeam} inicia en 30 minutos.

Tu predicción: ${homeScore}-${awayScore}

¡Buena suerte! 🍀`;
```

### Premio ganado

```typescript
const message = `🎉 ¡FELICIDADES ${userName}!

Has ganado ${prizeName} en ${poolName}.

Premio: ${prizeValue}

Revisa tu dashboard para más detalles.`;
```

### Cambio importante

```typescript
const message = `⚠️ Atención ${userName}

El partido ${homeTeam} vs ${awayTeam} ha sido pospuesto.

Nueva fecha: ${newDate}
Nueva hora: ${newTime}

Tu predicción sigue activa.`;
```

---

## 🎨 Componente de Input de Teléfono Mejorado

```tsx
// packages/ui/src/components/phone-input.tsx

"use client";

import { forwardRef, useState } from "react";
import { Input } from "./input";
import { Label } from "./label";

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, description, ...props }, ref) => {
    const [value, setValue] = useState(props.defaultValue || "");

    const formatPhone = (input: string) => {
      // Auto-add + if missing
      if (input && !input.startsWith("+")) {
        return "+" + input.replace(/[^\d]/g, "");
      }
      return input.replace(/[^\d+]/g, "");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhone(e.target.value);
      setValue(formatted);
      
      // Call original onChange if provided
      if (props.onChange) {
        e.target.value = formatted;
        props.onChange(e);
      }
    };

    return (
      <div className="space-y-2">
        {label && <Label htmlFor={props.id}>{label}</Label>}
        <Input
          {...props}
          ref={ref}
          type="tel"
          value={value}
          onChange={handleChange}
          placeholder="+525512345678"
          className={error ? "border-destructive" : ""}
        />
        {description && !error && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
```

---

## 🔐 Validación de Teléfono en Backend

```typescript
// packages/api/src/utils/phone-validator.ts

export class PhoneValidator {
  private static readonly E164_REGEX = /^\+[1-9]\d{1,14}$/;

  static isValid(phone: string): boolean {
    return this.E164_REGEX.test(phone);
  }

  static normalize(phone: string): string {
    // Remove all non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, "");
    
    // Ensure it starts with +
    if (!normalized.startsWith("+")) {
      normalized = "+" + normalized;
    }
    
    return normalized;
  }

  static getCountryCode(phone: string): string | null {
    if (!this.isValid(phone)) return null;
    
    // Extract country code (1-3 digits after +)
    const match = phone.match(/^\+(\d{1,3})/);
    return match ? match[1] : null;
  }

  static format(phone: string): string {
    if (!this.isValid(phone)) return phone;
    
    const countryCode = this.getCountryCode(phone);
    const number = phone.slice(countryCode!.length + 1);
    
    // Format based on country (basic example)
    if (countryCode === "52") {
      // Mexico: +52 55 1234 5678
      return `+52 ${number.slice(0, 2)} ${number.slice(2, 6)} ${number.slice(6)}`;
    }
    
    return phone;
  }
}
```

---

## 📊 Dashboard de Métricas

```typescript
// apps/admin/app/pools/[id]/components/phone-metrics.tsx

"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@qp/ui";

export function PhoneMetrics({ poolId }: { poolId: string }) {
  const { data: stats } = trpc.analytics.getPhoneStatistics.useQuery({ poolId });

  if (!stats) return <div>Cargando...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Registros</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.total}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Con Teléfono</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.withPhone}</p>
          <p className="text-sm text-muted-foreground">
            {stats.percentageWithPhone}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verificados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">{stats.verified}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sin Verificar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-yellow-600">{stats.unverified}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🚀 Próximos Pasos

1. **Implementar verificación de teléfono**
   - Ver `PHONE_NOTIFICATIONS_GUIDE.md` sección "Verificación"

2. **Integrar proveedor SMS**
   - Twilio recomendado para MVP
   - Ver ejemplos en guía de notificaciones

3. **Crear jobs de notificaciones**
   - Recordatorios pre-kickoff
   - Alertas de premios
   - Cambios importantes

---

**Documentación relacionada:**
- `PHONE_REGISTRATION_IMPLEMENTATION.md`
- `PHONE_NOTIFICATIONS_GUIDE.md`
- `MIGRATION_INSTRUCTIONS.md`
