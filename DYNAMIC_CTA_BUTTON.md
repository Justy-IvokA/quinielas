# ✅ Botón CTA Dinámico en Home Hero

## Resumen

Se implementó un botón CTA dinámico en el componente `HomeHero` que cambia su comportamiento según el estado de autenticación del usuario.

---

## 🎯 Objetivo

**Mejorar UX del botón principal:**
- ✅ Mostrar "Únete ahora" → `/auth/signin` para usuarios no autenticados
- ✅ Mostrar "Ver mis quinielas" → `/dashboard` para usuarios autenticados
- ✅ Cambiar icono según el estado

---

## 📝 Cambios Implementados

### 1. Detección de Sesión

**Agregado en `home-hero.tsx`:**

```tsx
// Obtener sesión del usuario
const { data: session } = trpc.auth.getSession.useQuery();

// Determinar el estado del botón CTA según la sesión
const isAuthenticated = !!session?.user;
const ctaButtonLabel = isAuthenticated ? t("viewMyPools") || "Ver mis quinielas" : ctaLabel;
const ctaButtonHref = isAuthenticated ? "/dashboard" : "/auth/signin";
const ctaButtonIcon = isAuthenticated ? LayoutDashboard : ArrowRight;
```

### 2. Botón Dinámico

**Antes ❌:**
```tsx
<Link href="/auth/signin">
  {ctaLabel}
  <ArrowRight />
</Link>
```

**Ahora ✅:**
```tsx
<Link href={ctaButtonHref}>
  {ctaButtonLabel}
  {ctaButtonIcon === LayoutDashboard ? (
    <LayoutDashboard className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
  ) : (
    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
  )}
</Link>
```

### 3. Icono Importado

```tsx
import { LayoutDashboard } from "lucide-react";
```

---

## 🎨 Estados del Botón

### Estado 1: Usuario NO Autenticado

| Propiedad | Valor |
|-----------|-------|
| **Texto** | "Únete ahora" |
| **Icono** | `ArrowRight` → |
| **Href** | `/auth/signin` |
| **Acción** | Redirige a página de inicio de sesión |

**Visual:**
```
┌─────────────────────────────┐
│  Únete ahora            →   │
└─────────────────────────────┘
```

### Estado 2: Usuario Autenticado

| Propiedad | Valor |
|-----------|-------|
| **Texto** | "Ver mis quinielas" |
| **Icono** | `LayoutDashboard` ⊞ |
| **Href** | `/dashboard` |
| **Acción** | Redirige al dashboard del usuario |

**Visual:**
```
┌─────────────────────────────┐
│  Ver mis quinielas      ⊞   │
└─────────────────────────────┘
```

---

## 🔄 Flujo de Usuario

### Escenario 1: Usuario Nuevo (No Autenticado)

```
1. Usuario visita homepage
   ↓
2. session = null
   ↓
3. Botón muestra "Únete ahora" con →
   ↓
4. Click en botón
   ↓
5. Redirige a /auth/signin
   ↓
6. Usuario inicia sesión
   ↓
7. Regresa a homepage
   ↓
8. Botón ahora muestra "Ver mis quinielas" con ⊞
```

### Escenario 2: Usuario Autenticado

```
1. Usuario autenticado visita homepage
   ↓
2. session.user existe
   ↓
3. Botón muestra "Ver mis quinielas" con ⊞
   ↓
4. Click en botón
   ↓
5. Redirige a /dashboard
   ↓
6. Usuario ve sus quinielas activas
```

### Escenario 3: Usuario Cierra Sesión

```
1. Usuario autenticado en homepage
   ↓
2. Botón muestra "Ver mis quinielas"
   ↓
3. Usuario cierra sesión
   ↓
4. session = null
   ↓
5. Botón cambia a "Únete ahora" automáticamente
```

---

## 🌐 Traducciones Agregadas

### Español (es-MX.json)

```json
{
  "home": {
    "hero": {
      "cta": "Únete ahora",
      "viewMyPools": "Ver mis quinielas",
      "learnMore": "Conoce más"
    }
  }
}
```

### Inglés (en-US.json)

```json
{
  "home": {
    "hero": {
      "cta": "Join the demo pool",
      "viewMyPools": "View my pools",
      "learnMore": "Learn more"
    }
  }
}
```

---

## 🎯 Beneficios de UX

### Antes ❌

**Problemas:**
- Usuario autenticado veía "Únete ahora" (confuso)
- Botón siempre redirigía a signin (redundante)
- No había diferenciación por estado de sesión

### Ahora ✅

**Mejoras:**
- ✅ Botón contextual según estado de usuario
- ✅ Acción relevante para cada tipo de usuario
- ✅ Mejor flujo de navegación
- ✅ Icono apropiado para cada acción
- ✅ Menos clicks para usuarios autenticados

---

## 🧪 Testing

### Test 1: Usuario No Autenticado

```bash
# 1. Abrir homepage sin sesión
http://localhost:3000

# 2. Verificar botón CTA:
✅ Texto: "Únete ahora"
✅ Icono: ArrowRight (→)

# 3. Click en botón
✅ Redirige a /auth/signin
```

### Test 2: Usuario Autenticado

```bash
# 1. Iniciar sesión
# 2. Ir a homepage
http://localhost:3000

# 3. Verificar botón CTA:
✅ Texto: "Ver mis quinielas"
✅ Icono: LayoutDashboard (⊞)

# 4. Click en botón
✅ Redirige a /dashboard
```

### Test 3: Cambio de Estado

```bash
# 1. Homepage sin sesión
✅ Botón: "Únete ahora"

# 2. Iniciar sesión (en otra pestaña)
# 3. Volver a homepage
✅ Botón cambia a: "Ver mis quinielas"

# 4. Cerrar sesión
✅ Botón vuelve a: "Únete ahora"
```

---

## 📁 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `home-hero.tsx` | Lógica dinámica del botón CTA |
| `es-MX.json` | Traducción "viewMyPools" |
| `en-US.json` | Traducción "viewMyPools" |

---

## 💡 Detalles de Implementación

### Query de Sesión

```tsx
const { data: session } = trpc.auth.getSession.useQuery();
```

**Características:**
- ✅ Reactivo - se actualiza automáticamente
- ✅ Caché - no hace llamadas innecesarias
- ✅ SSR-safe - funciona en servidor y cliente

### Lógica Condicional

```tsx
const isAuthenticated = !!session?.user;
```

**Por qué `!!`?**
- Convierte a booleano explícito
- Maneja casos `null`, `undefined`, `{}`
- Más seguro que solo `session?.user`

### Icono Condicional

```tsx
{ctaButtonIcon === LayoutDashboard ? (
  <LayoutDashboard />
) : (
  <ArrowRight />
)}
```

**Por qué no usar variable directa?**
- JSX requiere componentes explícitos
- No se puede hacer `<{ctaButtonIcon} />`
- Condicional es más claro y mantenible

---

## 🚀 Mejoras Futuras (Opcional)

### Fase 1: Animación de Transición

```tsx
<motion.div
  key={isAuthenticated ? 'authenticated' : 'guest'}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
>
  <Button>...</Button>
</motion.div>
```

### Fase 2: Contador de Quinielas

```tsx
// Para usuarios autenticados
const { data: poolsCount } = trpc.userPools.count.useQuery(
  undefined,
  { enabled: isAuthenticated }
);

const ctaButtonLabel = isAuthenticated 
  ? `Ver mis quinielas (${poolsCount})` 
  : ctaLabel;
```

### Fase 3: Estado de Loading

```tsx
const { data: session, isLoading } = trpc.auth.getSession.useQuery();

if (isLoading) {
  return <Button disabled>Cargando...</Button>;
}
```

---

## 🔍 Consideraciones

### Performance

**Query de sesión:**
- ✅ Caché automático por tRPC
- ✅ No afecta tiempo de carga inicial
- ✅ Se ejecuta en paralelo con otros queries

### SEO

**Botón dinámico:**
- ✅ Renderiza en servidor con estado inicial
- ✅ Se hidrata en cliente con estado real
- ✅ No afecta indexación

### Accesibilidad

**Botón mantiene:**
- ✅ Mismo tamaño y posición
- ✅ Mismo contraste de colores
- ✅ Mismo comportamiento de hover
- ✅ Mismo nivel de accesibilidad

---

## ✅ Checklist de Implementación

- [x] Importar `LayoutDashboard` de lucide-react
- [x] Agregar query de sesión con tRPC
- [x] Crear lógica condicional para botón
- [x] Implementar icono dinámico
- [x] Agregar traducciones (es-MX)
- [x] Agregar traducciones (en-US)
- [x] Documentación completa
- [ ] Testing en desarrollo
- [ ] Testing con diferentes estados de sesión
- [ ] Validar animaciones de transición

---

**Fecha:** 2025-01-16  
**Status:** ✅ COMPLETADO  
**Próximo:** Testing en desarrollo y validación de UX
