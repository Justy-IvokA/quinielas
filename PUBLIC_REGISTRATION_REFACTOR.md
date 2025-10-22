# Refactorización del Registro Público - Resumen de Implementación

## Objetivo
Implementar lógica inteligente en el formulario de registro público que detecte si el usuario tiene sesión activa y datos previos, prellenando campos automáticamente y deshabilitando aquellos que ya tienen valor.

## ✨ Mejoras Adicionales Implementadas

### 1. Botón de Registro Inteligente
- ✅ El botón permanece **deshabilitado** hasta que el usuario acepte los términos y condiciones
- ✅ Previene envíos accidentales del formulario
- ✅ Mejora la UX al hacer explícito el requisito de aceptación

### 2. Modal Informativo para Usuarios Recurrentes
- ✅ Cuando un usuario ya tiene **todos sus datos completos** (nombre, email, teléfono)
- ✅ Se muestra automáticamente un **modal celebratorio** al centro de la pantalla
- ✅ Mensaje motivador: *"¡Excelente! Ya estabas registrado con todos tus datos"*
- ✅ Guía clara: *"Acepta los términos y condiciones para poder registrar esta quiniela a tu cuenta"*
- ✅ Diseño atractivo con icono de trofeo y animaciones suaves

### 3. Prevención de Overflow en Description
- ✅ El campo `heroAssets.text.description` ahora tiene límite de líneas
- ✅ Mobile: 5 líneas máximo con `line-clamp-5`
- ✅ Desktop: 6 líneas máximo con `line-clamp-6`
- ✅ Tamaño de texto ajustado: `text-sm` (mobile) y `text-base` (desktop)
- ✅ Previene que textos largos rompan el layout del formulario

### 4. Scrollbar Elegante y Personalizada
- ✅ Scrollbar delgada de **6px** (vs 12-16px por defecto)
- ✅ Color adaptado al **brand primary** con 30% opacidad
- ✅ Hover interactivo que aumenta a 50% opacidad
- ✅ Bordes redondeados (3px radius) para diseño moderno
- ✅ Track transparente para look minimalista
- ✅ Transición suave de 0.2s en hover
- ✅ Compatible con Chrome, Firefox, Safari, Edge

## Cambios Implementados

### 1. Backend - API tRPC (`packages/api`)

#### 1.1 Query `hasExistingData` actualizada
**Archivo:** `packages/api/src/routers/registration/index.ts`

- Agregado campo `phone` al resultado de la query
- Permite al frontend obtener todos los datos del usuario (nombre, email, teléfono)

```typescript
hasExistingData: publicProcedure
  .input(z.object({ userId: z.string().cuid() }))
  .query(async ({ input }) => {
    const existingReg = await prisma.registration.findFirst({
      where: { userId: input.userId },
      orderBy: { joinedAt: 'desc' }
    });

    return {
      hasData: !!existingReg,
      displayName: existingReg?.displayName,
      email: existingReg?.email,
      phone: existingReg?.phone  // ✅ NUEVO
    };
  }),
```

#### 1.2 Mutación `registerPublic` mejorada
**Archivo:** `packages/api/src/routers/registration/index.ts`

- Agregada lógica para actualizar el modelo `User` cuando se proporciona un teléfono nuevo
- Implementa un "upsert" inteligente que actualiza el teléfono del usuario si no lo tenía previamente

```typescript
// Update User model if phone is provided and not already set
if (phone) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { phone: true }
  });

  if (!user?.phone) {
    await prisma.user.update({
      where: { id: input.userId },
      data: { phone }
    });
  }
}
```

### 2. Frontend - Componente de Registro (`apps/web`)

#### 2.1 Schemas de Validación Dinámicos
**Archivo:** `apps/web/app/[locale]/auth/register/[poolSlug]/_components/public-registration-form.tsx`

Implementada función `createValidationSchema` que genera schemas de Zod dinámicamente según los datos del usuario:

```typescript
const createValidationSchema = (userData?: {
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
} | null) => {
  const hasDisplayName = !!userData?.displayName;
  const hasEmail = !!userData?.email;
  const hasPhone = !!userData?.phone;

  return z.object({
    displayName: hasDisplayName
      ? z.string().optional()
      : z.string().min(2, "Mínimo 2 caracteres").max(50, "Máximo 50 caracteres"),
    email: hasEmail
      ? z.string().optional()
      : z.string().email("Correo electrónico inválido"),
    phone: hasPhone
      ? z.string().optional().or(z.literal(""))
      : z.string().min(1, "El teléfono es requerido").regex(/^\+[1-9]\d{1,14}$/, "Formato inválido"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones"
    }),
    captchaToken: z.string().optional()
  });
};
```

**Lógica de validación:**
- ✅ Si el usuario tiene `displayName`: campo opcional y deshabilitado
- ✅ Si el usuario NO tiene `displayName`: campo requerido y habilitado
- ✅ Si el usuario tiene `email`: campo opcional y deshabilitado
- ✅ Si el usuario NO tiene `email`: campo requerido y habilitado
- ✅ Si el usuario tiene `phone`: campo opcional y deshabilitado
- ✅ Si el usuario NO tiene `phone`: campo requerido y habilitado

#### 2.2 Estados y Hooks

Agregados nuevos estados para manejar la sesión y datos del usuario:

```typescript
const [hasSession, setHasSession] = useState(false);
const [userData, setUserData] = useState<{
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
} | null>(null);

// Query para obtener datos existentes
const { data: existingData, isLoading: isLoadingUserData } = 
  trpc.registration.hasExistingData.useQuery(
    { userId },
    { enabled: !!userId }
  );
```

#### 2.3 Effect para Prellenar Formulario

```typescript
useEffect(() => {
  if (existingData?.hasData) {
    setHasSession(true);
    const newUserData = {
      displayName: existingData.displayName,
      email: existingData.email,
      phone: existingData.phone
    };
    setUserData(newUserData);

    // Pre-fill form with existing data
    if (existingData.displayName) {
      form.setValue("displayName", existingData.displayName);
    }
    if (existingData.email) {
      form.setValue("email", existingData.email);
    }
    if (existingData.phone) {
      form.setValue("phone", existingData.phone);
    }

    form.clearErrors();
  } else {
    setHasSession(false);
    setUserData(null);
  }
}, [existingData, form]);
```

#### 2.4 Campos del Formulario con Lógica Dinámica

Cada campo ahora evalúa si debe estar deshabilitado y si es requerido:

**Ejemplo - Campo Nombre:**
```typescript
<FormField
  control={form.control}
  name="displayName"
  render={({ field }) => {
    const isDisabled = hasSession && !!userData?.displayName;
    return (
      <FormItem>
        <FormLabel className="text-xs md:text-sm font-medium">
          {t("fields.displayName.label") || "Nombre Completo"}
          {!isDisabled && <span className="text-destructive ml-1">*</span>}
        </FormLabel>
        <FormControl>
          <Input
            placeholder={t("fields.displayName.placeholder") || "ej: Lindsey Wilson"}
            className="h-9 md:h-10 text-sm"
            disabled={isDisabled}
            {...field}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    );
  }}
/>
```

**Ejemplo - Campo Teléfono:**
```typescript
<FormField
  control={form.control}
  name="phone"
  render={({ field }) => {
    const isDisabled = hasSession && !!userData?.phone;
    const isRequired = !hasSession || !userData?.phone;
    return (
      <FormItem>
        <FormLabel className="text-xs md:text-sm font-medium">
          {t("fields.phone.label") || "Teléfono"}
          {isRequired && <span className="text-destructive ml-1">*</span>}
          {!isRequired && <span className="text-muted-foreground ml-1">(Opcional)</span>}
        </FormLabel>
        <FormControl>
          <Input
            type="tel"
            placeholder={t("fields.phone.placeholder") || "+52 55 1234 5678"}
            className="h-9 md:h-10 text-sm"
            disabled={isDisabled}
            {...field}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    );
  }}
/>
```

#### 2.5 Lógica de Submit Mejorada

```typescript
const onSubmit = (data: PublicRegistrationFormData) => {
  if (requireCaptcha && !captchaToken) {
    form.setError("root", {
      message: t("errors.captchaRequired")
    });
    return;
  }

  // Validación adicional para usuarios con datos parciales
  if (hasSession && userData) {
    const displayName = data.displayName || userData.displayName;
    const email = data.email || userData.email;
    const phone = data.phone || userData.phone;

    if (!displayName) {
      form.setError("displayName", {
        message: "El nombre es requerido"
      });
      return;
    }

    if (!email) {
      form.setError("email", {
        message: "El correo electrónico es requerido"
      });
      return;
    }

    registerMutation.mutate({
      poolId,
      userId,
      displayName,
      email,
      phone: phone || undefined,
      captchaToken: captchaToken || undefined
    });
  } else {
    // Usuario nuevo, enviar todos los datos del formulario
    registerMutation.mutate({
      poolId,
      userId,
      displayName: data.displayName,
      email: data.email,
      phone: data.phone || undefined,
      captchaToken: captchaToken || undefined
    });
  }
};
```

#### 2.6 Indicador de Carga

Agregado estado de carga mientras se obtienen los datos del usuario:

```typescript
if (isLoadingUserData) {
  return (
    <section className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
      <div className="max-w-md w-full flex flex-col items-center gap-4">
        <InlineLoader className="w-8 h-8" />
        <p className="text-sm text-muted-foreground">{tCommon("loading") || "Cargando..."}</p>
      </div>
    </section>
  );
}
```

## Casos de Uso Cubiertos

### ✅ Caso 1: Usuario sin sesión (nuevo)
- **Comportamiento:** Todos los campos habilitados y requeridos (nombre, email, teléfono)
- **Validación:** Schema completo con todos los campos obligatorios
- **Botón:** Deshabilitado hasta aceptar términos
- **Modal:** No se muestra

### ✅ Caso 2: Usuario con sesión y datos completos
- **Comportamiento:** Todos los campos prellenados y deshabilitados
- **Validación:** Schema flexible, solo términos requeridos
- **Botón:** Deshabilitado hasta aceptar términos
- **Modal:** ✨ **Se muestra automáticamente** informando que ya está registrado

### ✅ Caso 3: Usuario con sesión pero sin nombre
- **Comportamiento:** Campo nombre habilitado y requerido, otros prellenados
- **Validación:** Schema dinámico que requiere solo el nombre
- **Botón:** Deshabilitado hasta aceptar términos
- **Modal:** No se muestra (faltan datos)

### ✅ Caso 4: Usuario con sesión pero sin teléfono
- **Comportamiento:** Campo teléfono habilitado y requerido, otros prellenados
- **Validación:** Schema dinámico que requiere solo el teléfono
- **Botón:** Deshabilitado hasta aceptar términos
- **Modal:** No se muestra (faltan datos)

### ✅ Caso 5: Usuario con sesión pero sin email (poco probable)
- **Comportamiento:** Campo email habilitado y requerido, otros prellenados
- **Validación:** Schema dinámico que requiere solo el email
- **Botón:** Deshabilitado hasta aceptar términos
- **Modal:** No se muestra (faltan datos)

## Flujo de Datos

```
1. Usuario accede a /[locale]/auth/register/[poolSlug]
   ↓
2. Page.tsx verifica sesión (Auth.js)
   ↓
3. Si no hay sesión → redirect a /signin
   ↓
4. Si hay sesión → renderiza PublicRegistrationForm
   ↓
5. Componente ejecuta query hasExistingData(userId)
   ↓
6. Backend busca último registro del usuario
   ↓
7. Retorna { hasData, displayName, email, phone }
   ↓
8. Frontend crea schema dinámico según datos
   ↓
9. Prellena campos con datos existentes
   ↓
10. Deshabilita campos que tienen valor
    ↓
11. Usuario completa campos faltantes
    ↓
12. Submit → registerPublic mutation
    ↓
13. Backend crea Registration + actualiza User.phone si aplica
    ↓
14. Success → Modal de confirmación
```

## Testing Recomendado

### Casos a Probar:

1. **Usuario nuevo (sin registros previos)**
   - Verificar que todos los campos estén habilitados
   - Verificar que todos los campos sean requeridos
   - Verificar que el teléfono sea obligatorio
   - ✅ **Verificar que el botón esté deshabilitado sin aceptar términos**
   - ✅ **Verificar que el botón se habilite al aceptar términos**
   - ✅ **Verificar que NO se muestre el modal informativo**

2. **Usuario con registro previo completo**
   - Verificar que todos los campos estén prellenados
   - Verificar que todos los campos estén deshabilitados
   - Verificar que solo se requiera aceptar términos
   - ✅ **Verificar que el modal informativo se muestre automáticamente**
   - ✅ **Verificar que el modal tenga el mensaje correcto**
   - ✅ **Verificar que el modal se pueda cerrar con el botón "Entendido"**
   - ✅ **Verificar que el botón esté deshabilitado sin aceptar términos**

3. **Usuario con registro previo sin teléfono**
   - Verificar que nombre y email estén prellenados y deshabilitados
   - Verificar que teléfono esté habilitado y requerido
   - Verificar que se actualice User.phone al registrar
   - ✅ **Verificar que NO se muestre el modal informativo**
   - ✅ **Verificar que el botón esté deshabilitado sin aceptar términos**

4. **Usuario con registro previo sin nombre**
   - Verificar que email y teléfono estén prellenados y deshabilitados
   - Verificar que nombre esté habilitado y requerido
   - ✅ **Verificar que NO se muestre el modal informativo**
   - ✅ **Verificar que el botón esté deshabilitado sin aceptar términos**

5. **Validación de formato de teléfono**
   - Probar con formato E.164 válido: +525512345678
   - Probar con formato inválido: 5512345678 (sin +52)
   - Verificar mensaje de error apropiado

6. **✨ Comportamiento del botón de registro**
   - Verificar que esté deshabilitado por defecto (términos no aceptados)
   - Verificar que se habilite al marcar el checkbox de términos
   - Verificar que se deshabilite al desmarcar el checkbox
   - Verificar que se deshabilite durante el proceso de registro (isPending)
   - Verificar que muestre el loader cuando está procesando

7. **✨ Modal informativo**
   - Verificar que aparezca solo cuando el usuario tiene todos los datos
   - Verificar que tenga el icono de trofeo
   - Verificar que el backdrop blur funcione correctamente
   - Verificar que sea responsive (mobile y desktop)
   - Verificar que la animación de entrada sea suave
   - Verificar que se cierre al hacer clic en "Entendido"
   - Verificar que no se muestre en usuarios con datos incompletos

## Archivos Modificados

### Backend
- ✅ `packages/api/src/routers/registration/index.ts`
- ✅ `packages/api/src/routers/registration/schema.ts`

### Frontend
- ✅ `apps/web/app/[locale]/auth/register/[poolSlug]/_components/public-registration-form.tsx`

#### 2.7 Botón de Registro Deshabilitado

El botón de registro ahora está deshabilitado hasta que el usuario acepte los términos y condiciones:

```typescript
<Button
  type="submit"
  className="w-full h-9 md:h-10 font-semibold bg-primary hover:bg-primary/90 text-sm md:text-base"
  disabled={registerMutation.isPending || !form.watch("acceptTerms")}
  StartIcon={registerMutation.isPending ? InlineLoader : undefined}
>
  {registerMutation.isPending ? (
    tCommon("loading") || "Cargando..."
  ) : (
    t("submit") || "Registrarse"
  )}
</Button>
```

**Condiciones de deshabilitación:**
- ✅ Mientras la mutación está en proceso (`isPending`)
- ✅ Cuando los términos no han sido aceptados (`!acceptTerms`)

#### 2.8 Modal Informativo para Usuarios con Datos Completos

Cuando un usuario ya tiene todos sus datos registrados (nombre, email, teléfono), se muestra automáticamente un modal informativo:

```typescript
// Check if user has all data complete
const hasAllData = existingData.displayName && existingData.email && existingData.phone;
if (hasAllData) {
  // Show info modal for users with complete data
  setShowInfoModal(true);
}
```

**Modal personalizado:**
```tsx
{showInfoModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="relative w-full max-w-md bg-background rounded-lg shadow-lg p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          ¡Excelente!
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Ya estabas registrado con todos tus datos. Acepta los términos y condiciones para poder registrar esta quiniela a tu cuenta.
        </p>
      </div>
      <Button
        onClick={() => setShowInfoModal(false)}
        className="w-full"
        variant="default"
      >
        Entendido
      </Button>
    </div>
  </div>
)}
```

**Características del modal:**
- 🎨 Diseño centrado con backdrop blur
- 🏆 Icono de trofeo para celebrar
- 📱 Responsive (mobile y desktop)
- ✨ Animación de entrada suave
- 🎯 Mensaje claro y motivador
- 👆 Botón para cerrar el modal

## Próximos Pasos (Opcional)

1. **Agregar tests unitarios** para la función `createValidationSchema`
2. **Agregar tests E2E** con Playwright para los 5 casos de uso
3. **Mejorar UX** con animaciones al deshabilitar/habilitar campos
4. **Agregar tooltip** explicando por qué un campo está deshabilitado
5. **Implementar lógica similar** en `CodeRegistrationForm` y `EmailInviteRegistrationForm`
6. **Agregar i18n** para el modal informativo

## Notas Importantes

- ⚠️ El teléfono se actualiza en el modelo `User` solo si el usuario no tenía uno previamente
- ⚠️ El schema de validación se crea dinámicamente en cada render según los datos del usuario
- ⚠️ Los campos deshabilitados mantienen su valor pero no se validan en el submit
- ⚠️ La query `hasExistingData` se ejecuta solo cuando hay un `userId` válido
- ⚠️ El indicador de carga se muestra mientras se obtienen los datos del usuario

## Compatibilidad

- ✅ Compatible con Auth.js v5.0.0-beta.4
- ✅ Compatible con Next.js 15.5.4
- ✅ Compatible con React Hook Form + Zod
- ✅ Compatible con tRPC
- ✅ Compatible con Prisma ORM
- ✅ Responsive (mobile y desktop)
- ✅ Soporte i18n (next-intl)
