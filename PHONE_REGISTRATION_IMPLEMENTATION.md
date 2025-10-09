# Implementación de Campo Teléfono en Registro

**Fecha:** 2025-10-09  
**Estado:** ✅ Completado

---

## 📋 Resumen de Cambios

Se agregó el campo de **teléfono opcional** en los 3 formularios de registro para habilitar notificaciones SMS/WhatsApp en el futuro.

### Estrategia Implementada

- ✅ Campo **opcional** (no bloquea el registro)
- ✅ Validación formato E.164 (`+525512345678`)
- ✅ Consistente en los 3 métodos de acceso (público, código, email)
- ✅ `phoneVerified` siempre `false` en registro inicial

---

## 🔧 Archivos Modificados

### 1. Backend - Schema Prisma

**Archivo:** `packages/db/prisma/schema.prisma`

```prisma
model Registration {
  // ... campos existentes
  phone         String?  // ← NUEVO
  phoneVerified Boolean @default(false)  // ← NUEVO
}
```

**Acción requerida:** Ejecutar migración
```bash
cd packages/db
pnpm prisma migrate dev --name add_phone_to_registration
pnpm prisma generate
```

### 2. Backend - Schemas tRPC

**Archivo:** `packages/api/src/routers/registration/schema.ts`

**Cambios:**
- ✅ Agregado `phoneSchema` con validación E.164
- ✅ Campo `phone` opcional en `registerPublicSchema`
- ✅ Campo `phone` opcional en `registerWithCodeSchema`
- ✅ Campo `phone` opcional en `registerWithEmailInviteSchema`

### 3. Backend - Routers de Registro

**Archivo:** `packages/api/src/routers/registration/index.ts`

**Cambios en 3 mutations:**
- ✅ `registerPublic` - Guarda `phone` y `phoneVerified: false`
- ✅ `registerWithCode` - Guarda `phone` y `phoneVerified: false`
- ✅ `registerWithEmailInvite` - Guarda `phone` y `phoneVerified: false`

### 4. Frontend - Formulario Público

**Archivo:** `apps/web/app/register/components/public-registration-form.tsx`

**Cambios:**
- ✅ Agregado campo `phone?: string` a interfaz `FormData`
- ✅ Nuevo `FormField` con validación E.164
- ✅ Placeholder: `+525512345678`
- ✅ Descripción: "Para recibir recordatorios por WhatsApp/SMS"

### 5. Frontend - Formulario con Código

**Archivo:** `apps/web/app/register/components/code-registration-form.tsx`

**Cambios:**
- ✅ Agregado campo `phone?: string` a interfaz `FormData`
- ✅ Nuevo `FormField` con validación E.164
- ✅ Mismo formato y validación que formulario público

### 6. Frontend - Formulario Email Invite

**Archivo:** `apps/web/app/register/components/email-invite-registration-form.tsx`

**Cambios:**
- ✅ Agregado campo `phone?: string` a interfaz `FormData`
- ✅ Nuevo `FormField` con validación E.164
- ✅ Mismo formato y validación que otros formularios

---

## 🎯 Validación Implementada

### Formato E.164
```typescript
/^\+[1-9]\d{1,14}$/
```

### Ejemplos Válidos
- ✅ `+525512345678` (México)
- ✅ `+14155552671` (USA)
- ✅ `+34612345678` (España)
- ✅ `+5491112345678` (Argentina)

### Ejemplos Inválidos
- ❌ `5512345678` (falta +)
- ❌ `+52 55 1234 5678` (espacios)
- ❌ `+0525512345678` (empieza con 0)
- ❌ `+52-55-1234-5678` (guiones)

---

## 🚀 Próximos Pasos

### Inmediato (Requerido)
1. **Ejecutar migración de base de datos**
   ```bash
   cd packages/db
   pnpm prisma migrate dev --name add_phone_to_registration
   pnpm prisma generate
   ```

2. **Rebuild de packages**
   ```bash
   cd ../..
   pnpm turbo build --filter=@qp/db
   pnpm turbo build --filter=@qp/api
   ```

3. **Probar formularios de registro**
   - Registro público sin teléfono
   - Registro público con teléfono válido
   - Registro con código + teléfono
   - Registro email invite + teléfono

### Corto Plazo (Post-MVP)
- [ ] UI de verificación de teléfono en perfil de usuario
- [ ] Endpoint para re-enviar código de verificación
- [ ] Integración con proveedor SMS (Twilio recomendado)

### Mediano Plazo
- [ ] Job de recordatorios pre-kickoff (30 min antes)
- [ ] Job de notificación de premios ganados
- [ ] Preferencias de notificación por usuario
- [ ] Rate limiting de mensajes SMS

---

## 📊 Casos de Uso Habilitados

### 1. Recordatorios Pre-Kickoff
```
⚽ Tu partido México vs Argentina inicia en 30 minutos!
Tu predicción: 2-1
```

### 2. Alertas de Premios
```
🎉 ¡FELICIDADES! Ganaste el 1er lugar en Quiniela Mundial 2026
Premio: $5,000 MXN
```

### 3. Cambios Importantes
```
⚠️ El partido de hoy fue pospuesto
Nueva fecha: 15 de Junio, 3:00 PM
```

---

## 🔐 Consideraciones de Seguridad

### Implementado
- ✅ Campo opcional (no obligatorio)
- ✅ Validación formato E.164
- ✅ `phoneVerified` separado de captura inicial
- ✅ Sin verificación durante registro (no bloquea flujo)

### Pendiente
- ⏳ Verificación por código SMS (post-registro)
- ⏳ Rate limiting de intentos de verificación
- ⏳ Opt-in/opt-out de notificaciones
- ⏳ Compliance GDPR/LFPDPPP

---

## 📝 Notas Técnicas

### Base de Datos
- El campo `phone` en `Registration` es **independiente** del campo `phone` en `User`
- Esto permite que un usuario tenga diferentes teléfonos por pool si es necesario
- En el futuro se puede sincronizar con `User.phone` si se desea

### Verificación
- La verificación de teléfono se hará **después** del registro
- Endpoint ya existe: `users.sendPhoneVerification` y `users.verifyPhone`
- Se puede implementar en perfil de usuario o dashboard

### Costos Estimados (Twilio)
- WhatsApp: ~$0.005 USD por mensaje
- SMS: ~$0.0075 USD por mensaje
- Para 10,000 usuarios = ~$50-75 USD por campaña

---

## ✅ Testing Checklist

### Manual Testing
- [ ] Registro público sin teléfono → debe funcionar
- [ ] Registro público con teléfono válido → debe guardar
- [ ] Registro público con teléfono inválido → debe mostrar error
- [ ] Registro con código + teléfono → debe guardar
- [ ] Registro email invite + teléfono → debe guardar
- [ ] Verificar en DB que `phoneVerified` es `false`

### Automated Testing (Futuro)
- [ ] Unit test: validación formato E.164
- [ ] Integration test: registro con/sin teléfono
- [ ] E2E test: flujo completo de registro

---

## 📚 Referencias

- [PHONE_NOTIFICATIONS_GUIDE.md](./PHONE_NOTIFICATIONS_GUIDE.md) - Guía completa de notificaciones
- [E.164 Format](https://en.wikipedia.org/wiki/E.164) - Estándar internacional
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp) - Documentación oficial

---

**Implementado por:** Cascade AI  
**Revisado por:** Pendiente  
**Aprobado por:** Pendiente
