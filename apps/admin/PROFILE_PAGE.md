# Página de Perfil de Usuario - Admin App

## 📍 Ubicación
`apps/admin/app/[locale]/profile/page.tsx`

## ✨ Características

### 🎨 Diseño Profesional y Sorprendente

La página de perfil muestra información completa del usuario con un diseño moderno y atractivo:

#### 1. **Header con Avatar Grande**
- Avatar del usuario con efecto de gradiente animado
- Nombre y email del usuario
- Badge de rol con colores distintivos según el nivel de acceso
- Badge de verificación de email
- Estadísticas rápidas (Tenants y Quinielas)

#### 2. **Información de Cuenta**
- Fecha de registro
- Último acceso
- Total de predicciones realizadas
- Premios ganados

#### 3. **Estado de Verificación**
- Email verificado/no verificado con fecha
- Teléfono verificado/no verificado (si aplica)
- Indicadores visuales con colores (verde = verificado, naranja = pendiente)

#### 4. **Membresías de Tenants**
- Lista de todos los tenants donde el usuario tiene roles
- Muestra el rol específico en cada tenant
- Colores distintivos por rol
- Descripción del tenant

#### 5. **Quinielas Activas**
- Lista de quinielas donde está registrado
- Nombre de la quiniela y tenant
- Badge de estado "Activo"

## 🎭 Roles y Colores

Cada rol tiene su propia identidad visual:

### SUPERADMIN
- **Color**: Gradiente púrpura-rosa
- **Label**: "Super Administrador"
- **Descripción**: "Acceso completo al sistema"
- **Permisos**: Gestiona todo el sistema

### TENANT_ADMIN
- **Color**: Gradiente azul-cyan
- **Label**: "Administrador de Tenant"
- **Descripción**: "Gestión completa del tenant"
- **Permisos**: Gestiona su tenant completamente

### TENANT_EDITOR
- **Color**: Gradiente verde-esmeralda
- **Label**: "Editor"
- **Descripción**: "Permisos de edición limitados"
- **Permisos**: Edición limitada en el tenant

### PLAYER
- **Color**: Gradiente naranja-ámbar
- **Label**: "Jugador"
- **Descripción**: "Participante en quinielas"
- **Permisos**: Solo predicciones

## 🔐 Seguridad

- **Autenticación requerida**: Redirige a `/auth/signin` si no hay sesión
- **Server-side rendering**: Toda la data se obtiene en el servidor
- **Protección de datos**: Solo muestra información del usuario autenticado

## 📊 Datos Mostrados

### Información del Usuario
```typescript
- ID
- Email
- Email verificado (fecha)
- Imagen de perfil
- Teléfono (opcional)
- Teléfono verificado
- Nombre
- Fecha de creación
- Última sesión
```

### Estadísticas
```typescript
- Total de membresías (tenants)
- Total de registraciones (quinielas)
- Total de predicciones
- Total de premios ganados
```

### Relaciones
```typescript
- Membresías con tenants (incluye rol y datos del tenant)
- Registraciones en pools (incluye datos del pool y tenant)
```

## 🎨 Componentes UI Utilizados

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Avatar` con tamaños personalizados
- `Badge` con variantes
- `Separator` para divisiones visuales
- Iconos de `lucide-react`:
  - `Shield` (roles)
  - `Mail` (email)
  - `Calendar` (fechas)
  - `Clock` (tiempo)
  - `Building2` (tenants)
  - `Trophy` (quinielas/premios)
  - `Activity` (actividad)
  - `CheckCircle2` (verificado)
  - `XCircle` (no verificado)

## 🌐 Internacionalización

Todas las cadenas de texto están traducidas usando `next-intl`:

```typescript
const t = await getTranslations({ locale, namespace: "profile" });
```

Las traducciones están en `apps/admin/messages/es-MX.json` bajo la clave `profile`.

## 📱 Responsive Design

- **Mobile**: Layout en columna única
- **Tablet**: Grid de 2 columnas para cards
- **Desktop**: Grid optimizado con espaciado amplio

## 🎯 Casos de Uso

### Usuario SUPERADMIN
Verá:
- Badge púrpura de "Super Administrador"
- Todas sus membresías en diferentes tenants
- Todas las quinielas donde participa
- Acceso completo a la información

### Usuario TENANT_ADMIN
Verá:
- Badge azul de "Administrador de Tenant"
- Sus tenants administrados
- Quinielas de sus tenants
- Estadísticas relevantes

### Usuario PLAYER
Verá:
- Badge naranja de "Jugador"
- Quinielas donde está registrado
- Sus predicciones y premios
- Información básica de perfil

## 🔄 Flujo de Navegación

```
Header Dropdown → Perfil → /[locale]/profile
                → Configuración → /[locale]/settings
                → Cerrar sesión → signOut()
```

## 🚀 Mejoras Futuras

- [ ] Edición de perfil (nombre, imagen)
- [ ] Cambio de contraseña (si se agrega auth por password)
- [ ] Historial de actividad detallado
- [ ] Gráficas de estadísticas
- [ ] Exportar datos del usuario (GDPR)
- [ ] Preferencias de notificaciones
- [ ] Configuración de privacidad

## 📸 Vista Previa

La página incluye:

1. **Header Hero** con gradiente y efectos decorativos
2. **Grid de 2 columnas** con información de cuenta y verificación
3. **Sección de membresías** con cards por tenant
4. **Sección de quinielas** con lista de participaciones
5. **Animaciones suaves** en hover y transiciones
6. **Tema claro/oscuro** totalmente soportado

## 🛠️ Tecnologías

- **Next.js 15.5.4** (App Router)
- **Server Components** para mejor performance
- **Prisma** para queries optimizadas
- **Auth.js v5** para autenticación
- **Tailwind CSS** para estilos
- **Radix UI** para componentes accesibles
- **next-intl** para internacionalización

## 📝 Notas de Implementación

- La página es **100% server-side rendered**
- No hay estado del cliente, todo se renderiza en el servidor
- Las queries de Prisma están optimizadas con `include` selectivos
- Los colores de roles están centralizados en `roleConfig`
- Formato de fechas respeta el locale del usuario
- Todos los textos son traducibles
