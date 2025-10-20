# Implementación: Usuarios Recurrentes en Registro

## Resumen

Se implementó la funcionalidad para que usuarios ya registrados en una quiniela no tengan que volver a ingresar sus datos personales al registrarse en otra quiniela.

## Fecha de Implementación
19 de Octubre, 2025

## Problema Resuelto

**Antes**: Un usuario que ya estaba registrado en una quiniela tenía que volver a llenar todos sus datos (nombre, email, teléfono) cada vez que se registraba en una nueva quiniela.

**Ahora**: El sistema detecta automáticamente si el usuario ya tiene registros previos y:
- Oculta los campos de datos personales
- Muestra un mensaje informativo
- Usa automáticamente los datos del registro anterior
- Solo requiere validar el código/invitación

## Cambios Técnicos

### Backend

#### 1. Schemas Actualizados (`packages/api/src/routers/registration/schema.ts`)

```typescript
// Campos displayName, email y phone ahora son opcionales
export const registerPublicSchema = z.object({
  poolId: z.string().cuid(),
  userId: z.string().cuid(),
  displayName: z.string().min(2).max(50).optional(), // ← Opcional
  email: z.string().email().optional(),              // ← Opcional
  phone: phoneSchema,
  captchaToken: z.string().optional()
});

// Igual para registerWithCodeSchema y registerWithEmailInviteSchema
```

#### 2. Helper Function (`packages/api/src/routers/registration/index.ts`)

```typescript
/**
 * Obtiene datos del usuario desde registros existentes
 */
async function getUserDataFromExistingRegistration(userId: string) {
  const existingReg = await prisma.registration.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  if (existingReg) {
    return {
      displayName: existingReg.displayName,
      email: existingReg.email,
      phone: existingReg.phone
    };
  }

  return null;
}
```

#### 3. Lógica en Endpoints

Cada endpoint ahora verifica si se proporcionaron datos personales:

```typescript
// Ejemplo en registerWithCode
let displayName = input.displayName;
let email = input.email;
let phone = input.phone;

if (!displayName || !email) {
  const userData = await getUserDataFromExistingRegistration(input.userId);
  if (!userData) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Display name and email are required for first-time registration"
    });
  }
  displayName = displayName || userData.displayName;
  email = email || userData.email;
  phone = phone || userData.phone;
}
```

### Frontend

#### 1. Detección de Usuarios Existentes

Cada formulario usa localStorage para detectar usuarios con datos previos:

```typescript
const [hasExistingData, setHasExistingData] = useState(false);

useEffect(() => {
  const checkExistingData = () => {
    try {
      const hasData = localStorage.getItem(`user_${userId}_has_data`);
      setHasExistingData(hasData === 'true');
    } catch {
      setHasExistingData(false);
    }
  };
  checkExistingData();
}, [userId]);
```

#### 2. Schemas Duales

Cada formulario tiene dos schemas:

```typescript
// Para usuarios nuevos (todos los campos)
const codeRegistrationSchemaFull = z.object({
  inviteCode: z.string()...,
  displayName: z.string()...,
  email: z.string()...,
  phone: phoneSchema,
  acceptTerms: z.boolean()...
});

// Para usuarios recurrentes (solo lo necesario)
const codeRegistrationSchemaSimple = z.object({
  inviteCode: z.string()...
});

// Uso dinámico
const form = useForm({
  resolver: zodResolver(
    hasExistingData ? codeRegistrationSchemaSimple : codeRegistrationSchemaFull
  )
});
```

#### 3. UI Condicional

Los campos personales se ocultan para usuarios existentes:

```tsx
{/* Mensaje para usuarios recurrentes */}
{hasExistingData && (
  <Alert className="bg-blue-500/10 border-blue-500/50">
    <CheckCircle2 className="h-4 w-4 text-blue-600" />
    <AlertDescription>
      Usaremos tu información de registro anterior
    </AlertDescription>
  </Alert>
)}

{/* Campos solo para nuevos usuarios */}
{!hasExistingData && (
  <>
    <FormField name="displayName" ... />
    <FormField name="email" ... />
    <FormField name="phone" ... />
    <FormField name="acceptTerms" ... />
  </>
)}
```

#### 4. Submit Condicional

```typescript
registerMutation.mutate({
  poolId,
  userId,
  inviteCode: data.inviteCode,
  // Solo enviar datos personales si es primera vez
  ...(hasExistingData ? {} : {
    displayName: data.displayName,
    email: data.email,
    phone: data.phone || undefined
  })
} as any);
```

#### 5. Persistencia en localStorage

Al completar registro exitoso:

```typescript
const registerMutation = trpc.registration.registerWithCode.useMutation({
  onSuccess: () => {
    try {
      localStorage.setItem(`user_${userId}_has_data`, 'true');
    } catch {}
    setShowSuccessModal(true);
  }
});
```

## Archivos Modificados

### Backend
1. `packages/api/src/routers/registration/schema.ts`
   - Campos opcionales en los 3 schemas

2. `packages/api/src/routers/registration/index.ts`
   - Helper function `getUserDataFromExistingRegistration()`
   - Lógica actualizada en `registerPublic`
   - Lógica actualizada en `registerWithCode`
   - Lógica actualizada en `registerWithEmailInvite`

### Frontend
3. `apps/web/app/[locale]/auth/register/[poolSlug]/_components/code-registration-form.tsx`
   - Schemas duales (Full/Simple)
   - Detección de usuarios existentes
   - UI condicional
   - Submit condicional

4. `apps/web/app/[locale]/auth/register/[poolSlug]/_components/public-registration-form.tsx`
   - Mismos cambios que código

5. `apps/web/app/[locale]/auth/register/[poolSlug]/_components/email-invite-registration-form.tsx`
   - Mismos cambios que código

## Flujos de Usuario

### Flujo 1: Primera Vez
```
Usuario → Recibe invitación
       → Se autentica
       → Ve formulario completo
       → Llena: código + nombre + email + teléfono + términos
       → Submit
       → Backend guarda datos
       → localStorage marca: user_{id}_has_data = true
       → ✅ Registro exitoso
```

### Flujo 2: Usuario Recurrente
```
Usuario → Recibe invitación para otra quiniela
       → Ya tiene sesión activa
       → localStorage detecta: user_{id}_has_data = true
       → Ve formulario simplificado (solo código)
       → Mensaje: "Usaremos tu información anterior"
       → Valida código
       → Submit (sin datos personales)
       → Backend obtiene datos de registro previo
       → ✅ Registro exitoso (1 clic)
```

### Flujo 3: Usuario Recurrente sin localStorage
```
Usuario → Limpia navegador / usa otro dispositivo
       → localStorage NO encuentra flag
       → Ve formulario completo
       → Llena datos (o puede usar los mismos)
       → Submit
       → Backend detecta que datos ya existen
       → Usa datos proporcionados o existentes
       → localStorage marca: user_{id}_has_data = true
       → ✅ Registro exitoso
```

## Beneficios

### UX
- ✅ Menos fricción en registros subsecuentes
- ✅ Proceso más rápido (1 clic vs 5+ campos)
- ✅ Reduce abandono en el funnel de registro
- ✅ Experiencia consistente entre quinielas

### Técnico
- ✅ Menos datos duplicados/actualizados innecesariamente
- ✅ Backend más eficiente
- ✅ Validación robusta (fallback a BD si no hay localStorage)
- ✅ Datos consistentes entre registros

### Negocio
- ✅ Mayor tasa de conversión en registros
- ✅ Usuarios pueden unirse a múltiples quinielas fácilmente
- ✅ Mejor retención de usuarios

## Consideraciones

### localStorage
- **Ventaja**: Rápido, sin llamadas al servidor
- **Limitación**: Se limpia si usuario borra datos del navegador
- **Solución**: Backend siempre valida y obtiene datos de BD como fallback

### Privacidad
- Solo se guarda un flag booleano en localStorage
- No se almacenan datos personales en el cliente
- Datos reales siempre vienen de la base de datos

### Seguridad
- Backend siempre valida permisos y ownership
- No se confía ciegamente en el flag de localStorage
- Si no hay datos previos y no se envían, se rechaza el registro

## Testing

### Casos de Prueba

1. **Usuario Nuevo**
   - ✅ Ve formulario completo
   - ✅ Debe llenar todos los campos
   - ✅ Registro exitoso guarda flag en localStorage

2. **Usuario Recurrente (mismo navegador)**
   - ✅ Ve formulario simplificado
   - ✅ Solo valida código/invitación
   - ✅ Usa datos del registro anterior
   - ✅ Registro exitoso

3. **Usuario Recurrente (navegador limpio)**
   - ✅ Ve formulario completo (no hay flag)
   - ✅ Backend detecta datos existentes
   - ✅ Usa datos existentes si no se proporcionan
   - ✅ Registro exitoso

4. **Usuario con múltiples registros**
   - ✅ Backend usa el registro más reciente
   - ✅ Datos consistentes

## Próximas Mejoras (Opcional)

1. **Endpoint de verificación**: Crear endpoint para verificar si usuario tiene datos previos (en lugar de localStorage)
2. **Edición de datos**: Permitir al usuario actualizar sus datos desde el formulario simplificado
3. **Preferencias**: Permitir al usuario elegir si quiere usar datos anteriores o nuevos
4. **Sincronización**: Sincronizar flag entre dispositivos del mismo usuario

## Notas de Mantenimiento

- Si se agregan nuevos campos al registro, actualizar la función `getUserDataFromExistingRegistration()`
- Si se cambia la estructura de `Registration`, verificar compatibilidad con datos existentes
- El flag en localStorage es solo una optimización; el backend siempre es la fuente de verdad
