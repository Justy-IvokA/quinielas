# Guía de Implementación - Notificaciones por Teléfono

**Fecha:** 2025-10-09  
**Objetivo:** Sistema de notificaciones WhatsApp/SMS para usuarios

---

## 📋 Cambios Aplicados

### 1. Schema Prisma - Modelo `User`

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  phone         String?  @unique          // ✅ NUEVO
  phoneVerified Boolean  @default(false)  // ✅ NUEVO
  name          String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastSignInAt  DateTime?
  
  @@index([phone])  // ✅ NUEVO - Para búsquedas rápidas
}
```

**Características:**
- ✅ `phone` es **opcional** y **único** (no duplicados)
- ✅ `phoneVerified` para confirmar que el usuario tiene acceso al número
- ✅ Formato internacional E.164: `+525512345678`
- ✅ Índice para búsquedas eficientes

### 2. Router tRPC - `users`

**Archivo:** `packages/api/src/routers/users/index.ts`

**Endpoints creados:**
- ✅ `users.getById` - Obtener usuario por ID
- ✅ `users.getByPhone` - Buscar usuario por teléfono
- ✅ `users.updateProfile` - Actualizar perfil (incluye phone)
- ✅ `users.sendPhoneVerification` - Enviar código de verificación
- ✅ `users.verifyPhone` - Verificar código y activar phone

### 3. Validación de Teléfonos

**Archivo:** `packages/api/src/routers/users/schema.ts`

```typescript
// Formato E.164: +[código país][número]
const phoneRegex = /^\+[1-9]\d{1,14}$/;

// Ejemplos válidos:
// +525512345678  (México)
// +14155552671   (USA)
// +34612345678   (España)
// +5491112345678 (Argentina)
```

---

## 🚀 Casos de Uso

### 1. **Recordatorios Pre-Kickoff**

```typescript
// apps/worker/src/jobs/send-match-reminders.ts

import { prisma } from "@qp/db";
import { sendWhatsAppMessage } from "../services/whatsapp";

export async function sendMatchReminders() {
  // Obtener partidos que inician en 30 minutos
  const upcomingMatches = await prisma.match.findMany({
    where: {
      kickoffTime: {
        gte: new Date(Date.now() + 25 * 60 * 1000),
        lte: new Date(Date.now() + 35 * 60 * 1000)
      },
      status: "SCHEDULED"
    },
    include: {
      predictions: {
        where: {
          user: {
            phone: { not: null },
            phoneVerified: true
          }
        },
        include: {
          user: true,
          pool: true
        }
      }
    }
  });

  for (const match of upcomingMatches) {
    for (const prediction of match.predictions) {
      await sendWhatsAppMessage({
        to: prediction.user.phone!,
        message: `🏆 ¡Tu partido ${match.homeTeam.name} vs ${match.awayTeam.name} inicia en 30 minutos! Tu predicción: ${prediction.homeScore}-${prediction.awayScore}`
      });
    }
  }
}
```

### 2. **Alerta de Premio Ganado**

```typescript
// apps/worker/src/jobs/notify-prize-winners.ts

export async function notifyPrizeWinners(poolId: string) {
  const winners = await prisma.prizeAward.findMany({
    where: { 
      prize: { poolId },
      notifiedAt: null  // No notificados aún
    },
    include: {
      user: true,
      prize: {
        include: {
          pool: true
        }
      }
    }
  });

  for (const winner of winners) {
    if (winner.user.phone && winner.user.phoneVerified) {
      await sendWhatsAppMessage({
        to: winner.user.phone,
        message: `🎉 ¡FELICIDADES! Has ganado ${winner.prize.title} en ${winner.prize.pool.name}. Premio: ${winner.prize.value}`
      });

      // Marcar como notificado
      await prisma.prizeAward.update({
        where: { id: winner.id },
        data: { notifiedAt: new Date() }
      });
    }
  }
}
```

### 3. **Cambios Importantes en Pool**

```typescript
// Cuando un admin cancela un partido o cambia reglas

export async function notifyPoolParticipants(poolId: string, message: string) {
  const registrations = await prisma.registration.findMany({
    where: { poolId },
    include: {
      user: {
        select: {
          phone: true,
          phoneVerified: true
        }
      }
    }
  });

  const verifiedPhones = registrations
    .filter(r => r.user.phone && r.user.phoneVerified)
    .map(r => r.user.phone!);

  // Envío en batch
  await sendBulkWhatsAppMessages({
    phones: verifiedPhones,
    message
  });
}
```

---

## 🔌 Integraciones Recomendadas

### Opción 1: **Twilio** (Recomendado para MVP)

**Pros:**
- ✅ WhatsApp Business API oficial
- ✅ SMS fallback automático
- ✅ Excelente documentación
- ✅ Precios competitivos

**Instalación:**
```bash
pnpm add twilio
```

**Implementación:**
```typescript
// packages/notifications/src/twilio.ts

import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsAppMessage({
  to,
  message
}: {
  to: string;
  message: string;
}) {
  try {
    const result = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
      body: message
    });

    console.log(`[WhatsApp] Message sent to ${to}: ${result.sid}`);
    return result;
  } catch (error) {
    console.error(`[WhatsApp] Failed to send to ${to}:`, error);
    
    // Fallback a SMS
    return sendSMS({ to, message });
  }
}

export async function sendSMS({
  to,
  message
}: {
  to: string;
  message: string;
}) {
  const result = await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
    body: message
  });

  console.log(`[SMS] Message sent to ${to}: ${result.sid}`);
  return result;
}
```

**Costos aproximados:**
- WhatsApp: $0.005 USD por mensaje (México)
- SMS: $0.0075 USD por mensaje (México)

### Opción 2: **AWS SNS** (Para escala)

**Pros:**
- ✅ Muy económico a gran escala
- ✅ Integración con AWS ecosystem
- ✅ Alta disponibilidad

**Contras:**
- ❌ No soporta WhatsApp directamente
- ❌ Solo SMS

### Opción 3: **Meta Cloud API** (WhatsApp oficial)

**Pros:**
- ✅ API oficial de WhatsApp
- ✅ Primeros 1,000 mensajes gratis/mes
- ✅ Plantillas aprobadas por Meta

**Contras:**
- ❌ Proceso de aprobación más complejo
- ❌ Requiere Business Manager de Facebook

---

## 📝 Migración de Base de Datos

### Paso 1: Crear migración

```bash
cd packages/db
pnpm prisma migrate dev --name add_phone_to_user
```

### Paso 2: Actualizar cliente

```bash
pnpm prisma generate
```

### Paso 3: Verificar

```bash
cd ../..
pnpm turbo build --filter=@qp/api
```

---

## 🔐 Seguridad y Privacidad

### 1. **Verificación Obligatoria**

```typescript
// Antes de enviar notificaciones, SIEMPRE verificar:
if (!user.phone || !user.phoneVerified) {
  console.log(`User ${user.id} has no verified phone`);
  return;
}
```

### 2. **Opt-in/Opt-out**

Agregar preferencias de notificación:

```prisma
model User {
  // ... campos existentes
  notificationPreferences Json? @default("{\"whatsapp\": true, \"sms\": true, \"email\": true}")
}
```

### 3. **Rate Limiting**

```typescript
// Máximo 5 mensajes por usuario por día
const messageCount = await redis.get(`notifications:${userId}:${today}`);

if (parseInt(messageCount || "0") >= 5) {
  console.log(`Rate limit reached for user ${userId}`);
  return;
}

await redis.incr(`notifications:${userId}:${today}`);
await redis.expire(`notifications:${userId}:${today}`, 86400); // 24h
```

### 4. **Compliance (GDPR/LFPDPPP)**

- ✅ Consentimiento explícito para recibir notificaciones
- ✅ Opción de eliminar teléfono en cualquier momento
- ✅ No compartir número con terceros
- ✅ Encriptar en tránsito (HTTPS/TLS)

---

## 🎨 UI/UX - Formulario de Teléfono

### Componente React

```typescript
// apps/web/app/components/phone-input.tsx

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function PhoneVerificationForm({ userId }: { userId: string }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "verify">("phone");

  const sendCode = trpc.users.sendPhoneVerification.useMutation();
  const verifyCode = trpc.users.verifyPhone.useMutation();

  const handleSendCode = async () => {
    await sendCode.mutateAsync({ userId, phone });
    setStep("verify");
  };

  const handleVerify = async () => {
    await verifyCode.mutateAsync({ userId, phone, verificationCode: code });
    // Mostrar éxito
  };

  if (step === "phone") {
    return (
      <div className="space-y-4">
        <label>
          Teléfono (formato internacional)
          <input
            type="tel"
            placeholder="+525512345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
        </label>
        <button
          onClick={handleSendCode}
          disabled={sendCode.isLoading}
          className="btn-primary"
        >
          {sendCode.isLoading ? "Enviando..." : "Enviar código"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p>Código enviado a {phone}</p>
      <input
        type="text"
        placeholder="123456"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full px-4 py-2 border rounded text-center text-2xl"
      />
      <button
        onClick={handleVerify}
        disabled={verifyCode.isLoading}
        className="btn-primary"
      >
        {verifyCode.isLoading ? "Verificando..." : "Verificar"}
      </button>
    </div>
  );
}
```

---

## 📊 Métricas y Monitoreo

### KPIs a trackear:

1. **Tasa de verificación de teléfono**
   - Meta: >60% de usuarios verifican su teléfono

2. **Tasa de entrega de mensajes**
   - WhatsApp: >95%
   - SMS: >98%

3. **Tasa de apertura** (si usas links rastreables)
   - Meta: >40%

4. **Costo por notificación**
   - Meta: <$0.01 USD promedio

### Dashboard recomendado:

```typescript
// Query para métricas
const metrics = await prisma.$queryRaw`
  SELECT 
    COUNT(*) FILTER (WHERE phone IS NOT NULL) as users_with_phone,
    COUNT(*) FILTER (WHERE phone_verified = true) as verified_phones,
    COUNT(*) as total_users,
    ROUND(
      COUNT(*) FILTER (WHERE phone_verified = true)::numeric / 
      NULLIF(COUNT(*), 0) * 100, 
      2
    ) as verification_rate
  FROM "User"
`;
```

---

## ✅ Checklist de Implementación

### Fase 1: Setup Básico
- [x] Agregar campos `phone` y `phoneVerified` a User
- [x] Crear router `users` con endpoints de verificación
- [x] Migración de base de datos
- [ ] Elegir proveedor (Twilio recomendado)
- [ ] Configurar cuenta y obtener credenciales
- [ ] Crear package `@qp/notifications`

### Fase 2: Verificación
- [ ] Implementar envío de código SMS
- [ ] Implementar validación de código
- [ ] UI de verificación en perfil de usuario
- [ ] Tests de flujo completo

### Fase 3: Notificaciones
- [ ] Job de recordatorios pre-kickoff
- [ ] Job de notificación de premios
- [ ] Job de cambios importantes
- [ ] Rate limiting y anti-spam

### Fase 4: Optimización
- [ ] Plantillas de mensajes personalizables
- [ ] Preferencias de notificación por usuario
- [ ] Analytics y métricas
- [ ] A/B testing de mensajes

---

## 🎯 Recomendación Final

**Para MVP (Mundial 2026):**

1. **Implementar Twilio** - Más rápido de configurar
2. **Solo 2 tipos de notificaciones iniciales:**
   - Recordatorio 30min antes del partido
   - Alerta de premio ganado
3. **Hacer verificación opcional** - No bloquear registro
4. **Monitorear costos** - Establecer límite mensual

**Post-MVP:**
- Expandir a más tipos de notificaciones
- Implementar preferencias granulares
- Considerar Meta Cloud API para reducir costos
- Agregar notificaciones push (web/mobile)

---

**Próximo paso:** Ejecutar migración y elegir proveedor de SMS/WhatsApp

```bash
cd packages/db
pnpm prisma migrate dev --name add_phone_to_user
```
