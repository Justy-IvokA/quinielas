# Estructura de Layout Autenticado - Admin App

## 🎯 Problema Resuelto

Antes tenías el `AdminHeader` en el layout principal, lo que causaba que apareciera incluso en las páginas de auth (login). Moviste el header a cada página individual, pero eso no es una buena práctica (código duplicado).

## ✅ Solución: Route Groups

He implementado un **Route Group** llamado `(authenticated)` que:

1. ✅ Agrupa todas las rutas que requieren autenticación
2. ✅ Verifica la sesión automáticamente
3. ✅ Renderiza el `AdminHeader` solo para rutas autenticadas
4. ✅ No afecta las URLs (los paréntesis se ignoran en la ruta)

## 📁 Nueva Estructura de Carpetas

```
apps/admin/app/[locale]/
├── (authenticated)/              ← Grupo de rutas autenticadas
│   ├── layout.tsx               ← Layout con AdminHeader + verificación de sesión
│   ├── page.tsx                 ← Dashboard (movido aquí)
│   ├── pools/                   ← Mover aquí
│   ├── fixtures/                ← Mover aquí
│   ├── access/                  ← Mover aquí
│   ├── brands/                  ← Mover aquí (si existe)
│   ├── analytics/               ← Mover aquí
│   ├── profile/                 ← Mover aquí
│   ├── settings/                ← Mover aquí
│   ├── sync/                    ← Mover aquí
│   ├── audit/                   ← Mover aquí
│   └── policies/                ← Mover aquí
│
├── auth/                        ← Páginas públicas (NO mover)
│   ├── signin/
│   ├── error/
│   └── ...
│
└── layout.tsx                   ← Layout principal (sin AdminHeader)
```

## 🔄 Comandos para Mover las Páginas

Ejecuta estos comandos en PowerShell desde la raíz del proyecto:

```powershell
# Ya movido:
# Move-Item "apps\admin\app\[locale]\page.tsx" "apps\admin\app\[locale]\(authenticated)\page.tsx"

# Mover el resto de páginas autenticadas:
Move-Item "apps\admin\app\[locale]\pools" "apps\admin\app\[locale]\(authenticated)\pools"
Move-Item "apps\admin\app\[locale]\fixtures" "apps\admin\app\[locale]\(authenticated)\fixtures"
Move-Item "apps\admin\app\[locale]\access" "apps\admin\app\[locale]\(authenticated)\access"
Move-Item "apps\admin\app\[locale]\analytics" "apps\admin\app\[locale]\(authenticated)\analytics"
Move-Item "apps\admin\app\[locale]\profile" "apps\admin\app\[locale]\(authenticated)\profile"
Move-Item "apps\admin\app\[locale]\settings" "apps\admin\app\[locale]\(authenticated)\settings"
Move-Item "apps\admin\app\[locale]\sync" "apps\admin\app\[locale]\(authenticated)\sync"
Move-Item "apps\admin\app\[locale]\audit" "apps\admin\app\[locale]\(authenticated)\audit"
Move-Item "apps\admin\app\[locale]\policies" "apps\admin\app\[locale]\(authenticated)\policies"

# Si existe admin/ (parece redundante, verifica si es necesario)
# Move-Item "apps\admin\app\[locale]\admin" "apps\admin\app\[locale]\(authenticated)\admin"
```

## 🎨 Cómo Funciona

### 1. Layout Principal (`[locale]/layout.tsx`)

```typescript
// NO tiene AdminHeader
// Solo providers y configuración global
<SessionProvider>
  <NextIntlClientProvider>
    <ThemeProvider>
      {children}  // Puede ser auth o authenticated
    </ThemeProvider>
  </NextIntlClientProvider>
</SessionProvider>
```

### 2. Layout Autenticado (`[locale]/(authenticated)/layout.tsx`)

```typescript
// Verifica sesión
const session = await getServerAuthSession(authConfig);
if (!session?.user) {
  redirect(`/${locale}/auth/signin`);
}

// Renderiza AdminHeader + children
<>
  <AdminHeader brandName={...} logoUrl={...} />
  {children}  // Páginas autenticadas
</>
```

### 3. Páginas de Auth (`[locale]/auth/*`)

```typescript
// NO pasan por (authenticated)/layout.tsx
// Solo usan el layout principal
// NO tienen AdminHeader ✅
```

## 🔍 Flujo de Renderizado

### Ruta Autenticada: `/es-MX/dashboard`

```
[locale]/layout.tsx (providers)
    ↓
(authenticated)/layout.tsx (verifica sesión + AdminHeader)
    ↓
(authenticated)/page.tsx (dashboard)
```

### Ruta Pública: `/es-MX/auth/signin`

```
[locale]/layout.tsx (providers)
    ↓
auth/signin/page.tsx (login form)
```

## ✅ Ventajas de Este Enfoque

### 1. **Código DRY (Don't Repeat Yourself)**
- AdminHeader en un solo lugar
- No se repite en cada página

### 2. **Seguridad en Capas**
- Middleware verifica cookie (primera capa)
- Layout verifica sesión en servidor (segunda capa)
- Doble protección

### 3. **Mantenibilidad**
- Cambios al header en un solo archivo
- Fácil agregar nuevas páginas autenticadas

### 4. **URLs Limpias**
- Los paréntesis `(authenticated)` no aparecen en la URL
- `/es-MX/dashboard` (no `/es-MX/(authenticated)/dashboard`)

### 5. **Separación Clara**
- Rutas públicas: `auth/`
- Rutas privadas: `(authenticated)/`

## 🧪 Pruebas

### Caso 1: Acceso Sin Sesión

```bash
# 1. Abre modo incógnito
# 2. Ve a http://localhost:3001/es-MX/dashboard
# 3. Middleware redirige a /es-MX/auth/signin
# 4. NO ves el AdminHeader en la página de login ✅
```

### Caso 2: Acceso Con Sesión

```bash
# 1. Inicia sesión
# 2. Ve a http://localhost:3001/es-MX/dashboard
# 3. VES el AdminHeader ✅
# 4. Navega a /es-MX/pools
# 5. VES el AdminHeader ✅
```

### Caso 3: Página de Login

```bash
# 1. Ve a http://localhost:3001/es-MX/auth/signin
# 2. NO ves el AdminHeader ✅
# 3. Solo ves el formulario de login
```

## 🔧 Limpieza del Código

### Remover AdminHeader de page.tsx

Ya moviste el dashboard a `(authenticated)/page.tsx`, ahora remueve el AdminHeader que agregaste:

```typescript
// apps/admin/app/[locale]/(authenticated)/page.tsx

// ❌ REMOVER ESTO:
import { AdminHeader } from "../components/admin-header";

// Y en el return:
// ❌ REMOVER ESTO:
<AdminHeader 
  brandName={brand?.name || adminEnv.NEXT_PUBLIC_APP_NAME}
  logoUrl={...}
/>

// ✅ Solo dejar el contenido:
<div className="flex flex-col gap-10">
  <DashboardWelcome ... />
  {/* resto del contenido */}
</div>
```

El AdminHeader ahora viene automáticamente del layout `(authenticated)/layout.tsx`.

## 📚 Recursos

- [Next.js Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Next.js Layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)

## 🎯 Resultado Final

Con esta estructura:

1. ✅ **AdminHeader solo en rutas autenticadas**
2. ✅ **Código limpio y mantenible**
3. ✅ **Doble capa de seguridad** (middleware + layout)
4. ✅ **Fácil agregar nuevas páginas** (solo créalas en `(authenticated)/`)
5. ✅ **URLs limpias** (sin `(authenticated)` en la URL)

## 🚀 Próximos Pasos

1. ✅ Ya creé el layout `(authenticated)/layout.tsx`
2. ✅ Ya moví `page.tsx` a `(authenticated)/page.tsx`
3. ⏳ Ejecuta los comandos para mover las demás carpetas
4. ⏳ Remueve el AdminHeader que agregaste manualmente en page.tsx
5. ⏳ Prueba que todo funcione correctamente

¡Esta es la forma correcta y profesional de estructurar un admin app con Next.js! 🎉
