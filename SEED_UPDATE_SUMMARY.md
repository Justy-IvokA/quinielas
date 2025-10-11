# Resumen - Actualización del Seed

**Fecha:** 2025-10-09 10:20 AM  
**Archivo:** `packages/db/src/seed.ts`  
**Estado:** ✅ ACTUALIZADO (incluye campos phone en Registration)

---

## 📊 Cambios Aplicados

### 1. **Imports Actualizados** ✅
```typescript
// Agregado MatchStatus para usar SCHEDULED, LIVE, FINISHED
import { PrismaClient, AccessType, MatchStatus } from "@prisma/client";
```

### 2. **Competition con logoUrl** ✅
```typescript
logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/6/67/2026_FIFA_World_Cup.svg/200px-2026_FIFA_World_Cup.svg.png"
```

### 3. **AccessPolicy con tenantId** ✅
```typescript
create: {
  poolId: pool.id,
  tenantId: tenant.id,  // ✅ NUEVO - Campo requerido
  accessType: AccessType.PUBLIC,
  // ...
}
```

### 4. **Usuarios Demo con Phone** ✅
```typescript
// 3 usuarios creados:
- player1@demo.com (phone: +525512345678, verified: true)
- player2@demo.com (phone: +525587654321, verified: true)
- admin@demo.com (sin teléfono)
```

### 5. **Tenant Memberships** ✅
```typescript
// Roles asignados:
- admin@demo.com → TENANT_ADMIN
- player1@demo.com → PLAYER
```

### 6. **Equipos con logoUrl** ✅
```typescript
// 4 equipos creados con banderas:
- Mexico (MEX) - https://flagcdn.com/w80/mx.png
- United States (USA) - https://flagcdn.com/w80/us.png
- Canada (CAN) - https://flagcdn.com/w80/ca.png
- Argentina (ARG) - https://flagcdn.com/w80/ar.png
```

### 7. **Partidos con Nuevos Campos** ✅
```typescript
// 2 partidos creados con:
- round: 1
- kickoffTime (no kickoffAt)
- status: MatchStatus.SCHEDULED
- venue

Match 1: Mexico vs USA - 2026-06-08 18:00 UTC (Estadio Azteca)
Match 2: Canada vs Argentina - 2026-06-08 21:00 UTC (BMO Field)
```

### 8. **Premios con Nuevos Campos** ✅
```typescript
// 3 premios creados con:
- position (no rank)
- title (no name)
- value
- imageUrl

1er Lugar: $10,000 MXN
2do Lugar: $5,000 MXN
3er Lugar: $2,500 MXN
```

### 9. **Registrations con tenantId y phone** ✅
```typescript
create: {
  userId: demoUser1.id,
  poolId: pool.id,
  tenantId: tenant.id,  // ✅ Campo requerido
  phone: "+525512345678",  // ✅ NUEVO - Campo opcional
  phoneVerified: true  // ✅ NUEVO - Para testing
  // ...
}

// 2 registraciones creadas:
- Player One: +525512345678 (verificado)
- Player Two: +525587654321 (verificado)
```

### 10. **Predictions con tenantId** ✅
```typescript
// 2 predicciones creadas:
# Verificar en Prisma Studio
cd packages/db
pnpm prisma studio
# Navigate to Registration model and verify Player 2 has Mexico 1-1 USA prediction
```

**Navega a:**
- ✅ **Users** - Debe haber 3 usuarios (2 con phone verificado)
- ✅ **Teams** - Debe haber 4 equipos con logoUrl
- ✅ **Matches** - Debe haber 2 partidos con round y kickoffTime
- ✅ **Prizes** - Debe haber 3 premios con position y title
- ✅ **Predictions** - Debe haber 2 predicciones

---

## 🧪 Datos de Prueba

### Usuarios para Login
```
Email: player1@demo.com
Phone: +525512345678 (verificado)
Role: PLAYER

Email: player2@demo.com
Phone: +525587654321 (verificado)
Role: PLAYER

Email: admin@demo.com
Role: TENANT_ADMIN
```

### Pool Demo
```
URL: /demo/default/world-cup-2026
Access: PUBLIC (sin código requerido)
Prizes: 3 premios ($10k, $5k, $2.5k MXN)
```

### Partidos Demo
```
Match 1: Mexico vs USA
  - Fecha: 2026-06-08 18:00 UTC
  - Venue: Estadio Azteca
  - Predicciones: 2

Match 2: Canada vs Argentina
  - Fecha: 2026-06-08 21:00 UTC
  - Venue: BMO Field
  - Predicciones: 0
```

---

## 🔄 Cambios vs Versión Anterior

| Campo/Entidad | Antes | Ahora |
|---------------|-------|-------|
| `MatchStatus` | IN_PROGRESS, COMPLETED | LIVE, FINISHED |
| `Match.kickoffAt` | ✅ | ❌ (ahora kickoffTime) |
| `Match.kickoffTime` | ❌ | ✅ |
| `Match.round` | ❌ | ✅ |
| `Match.finishedAt` | ❌ | ✅ |
| `Prize.name` | ✅ | ❌ (ahora title) |
| `Prize.rank` | ✅ | ❌ (ahora position) |
| `Prize.title` | ❌ | ✅ |
| `Prize.value` | ❌ | ✅ |
| `Prize.imageUrl` | ❌ | ✅ |
| `User.phone` | ❌ | ✅ |
| `User.phoneVerified` | ❌ | ✅ |
| `Registration.phone` | ❌ | ✅ |
| `Registration.phoneVerified` | ❌ | ✅ |
| `Team.logoUrl` | ❌ | ✅ |
| `Competition.logoUrl` | ❌ | ✅ |
| `AccessPolicy.tenantId` | ❌ | ✅ |
| `Registration.tenantId` | ❌ | ✅ |
| `Prediction.tenantId` | ❌ | ✅ |

---

## 📝 Notas Importantes

### 1. **Teléfonos de Prueba**
Los números de teléfono en el seed son ficticios pero válidos en formato E.164:
- **User.phone**: `+525512345678` (Player 1), `+525587654321` (Player 2)
- **Registration.phone**: `+525512345678` (Player One), `+525587654321` (Player Two)
- Ambos marcados como `phoneVerified: true` para facilitar testing de notificaciones SMS

### 2. **Logos de Equipos**
Se usan URLs públicas de flagcdn.com para las banderas. En producción, considera:
- Subir logos a tu CDN
- Usar sprites para mejor performance
- Tener fallbacks para logos faltantes

### 3. **Fechas de Partidos**
Los partidos están programados para 2026-06-08 (fecha de inicio del Mundial 2026). Ajusta según necesites para pruebas.

### 4. **Premios**
Los valores de premios son ejemplos. Ajusta según tu modelo de negocio.

### 5. **Idempotencia**
El seed usa `upsert` en todos lados, por lo que es **seguro ejecutarlo múltiples veces** sin duplicar datos.

---

## 🎯 Próximos Pasos

1. **Ejecutar migración primero:**
   ```bash
   cd packages/db
   pnpm prisma migrate dev --name align_schema_with_trpc
   ```

2. **Luego ejecutar seed:**
   ```bash
   pnpm prisma migrate reset
   # O
   pnpm prisma db seed
   ```

3. **Verificar en Prisma Studio:**
   ```bash
   pnpm prisma studio
   ```

4. **Probar endpoints tRPC:**
   ```bash
   cd ../..
   pnpm turbo dev --filter=@qp/api
   ```

---

## 🐛 Troubleshooting

### Error: "tenantId is required"
✅ **Solucionado** - Ahora el seed incluye `tenantId` en AccessPolicy, Registration y Prediction

### Error: "kickoffAt does not exist"
✅ **Solucionado** - Ahora usa `kickoffTime`

### Error: "rank does not exist on Prize"
✅ **Solucionado** - Ahora usa `position`

### Error: "name does not exist on Prize"
✅ **Solucionado** - Ahora usa `title`

### Error: "Unique constraint failed"
⚠️ Si ves este error, ejecuta `pnpm prisma migrate reset` para limpiar la DB

---

---

## 📱 Actualización: Campos de Teléfono (2025-10-09)

### Cambios Aplicados

**Modelos actualizados:**
1. ✅ `User` - Ya tenía campos `phone` y `phoneVerified`
2. ✅ `Registration` - **AGREGADOS** campos `phone` y `phoneVerified`

**Datos de seed actualizados:**

```typescript
// User (ya existía)
{
  email: "player1@demo.com",
  phone: "+525512345678",
  phoneVerified: true
}

// Registration (NUEVO)
{
  userId: demoUser1.id,
  poolId: pool.id,
  phone: "+525512345678",  // ✅ AGREGADO
  phoneVerified: true       // ✅ AGREGADO
}
```

### Beneficios

- ✅ Testing completo de notificaciones SMS/WhatsApp
- ✅ Datos de ejemplo para queries de usuarios con teléfono
- ✅ Registraciones con teléfonos verificados para pruebas
- ✅ Consistencia entre User y Registration

### Verificación

Después de ejecutar el seed, verifica:

```sql
-- Ver registraciones con teléfono
SELECT 
  "displayName",
  "email",
  "phone",
  "phoneVerified"
FROM "Registration"
WHERE "phone" IS NOT NULL;

-- Resultado esperado:
-- Player One  | player1@demo.com | +525512345678 | true
-- Player Two  | player2@demo.com | +525587654321 | true
```

---

**Todo listo para ejecutar el seed actualizado!** 🌱

```bash
cd packages/db
pnpm prisma migrate reset
```
