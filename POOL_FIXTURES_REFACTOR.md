# 🔄 Pool Fixtures Refactorización - Sistema de Tabs

## Resumen

Se refactorizó el módulo de fixtures para integrarlo dentro de cada pool individual usando un sistema de tabs, eliminando datos hardcodeados y mejorando la experiencia de usuario.

---

## 🎯 Problema Original

### Antes
```
❌ /fixtures (módulo independiente)
   └─ fixtures-manager.tsx
       ├─ seasonId hardcodeado
       ├─ sourceId hardcodeado
       └─ Sin relación con pools
```

**Problemas:**
- Fixtures no estaban asociados a pools específicos
- IDs hardcodeados en el código
- Difícil navegación entre pools y fixtures
- No escalable

---

## ✅ Solución Implementada

### Después
```
✅ /pools/[id] (detalles del pool)
   └─ Sistema de Tabs:
       ├─ Overview (detalles + premios)
       ├─ Fixtures (partidos del pool) ← NUEVO
       ├─ Registrations (jugadores)
       ├─ Prizes (premios)
       └─ Settings (configuración)
```

**Beneficios:**
- ✅ Fixtures asociados a cada pool
- ✅ Sin datos hardcodeados
- ✅ Navegación intuitiva
- ✅ Escalable y mantenible

---

## 📁 Estructura de Archivos

### Archivos Creados

```
apps/admin/app/[locale]/(authenticated)/pools/[id]/
├─ page.tsx (refactorizado)
└─ components/
    ├─ pool-details-tabs.tsx          ← Sistema de tabs principal
    ├─ pool-fixtures-manager.tsx      ← Fixtures refactorizado
    ├─ pool-registrations.tsx         ← Tab de registraciones
    ├─ pool-settings.tsx              ← Tab de configuración
    ├─ pool-details.tsx               (existente)
    └─ prizes-manager.tsx             (existente)
```

### Archivos Modificados

```
apps/admin/app/[locale]/(authenticated)/pools/
├─ [id]/page.tsx                      ← Ahora usa PoolDetailsTabs
└─ components/pools-list.tsx          ← Botón "Ver" más prominente
```

### Archivos Deprecados (mantener por ahora)

```
apps/admin/app/[locale]/(authenticated)/fixtures/
└─ components/fixtures-manager.tsx    ← Ya no se usa, eliminar después
```

---

## 🎨 Sistema de Tabs

### Componente Principal: `pool-details-tabs.tsx`

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
    <TabsTrigger value="registrations">Registrations</TabsTrigger>
    <TabsTrigger value="prizes">Prizes</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    <PoolDetails poolId={poolId} />
  </TabsContent>

  <TabsContent value="fixtures">
    <PoolFixturesManager poolId={poolId} />
  </TabsContent>

  {/* ... otros tabs ... */}
</Tabs>
```

---

## 🔧 Componente Refactorizado: `pool-fixtures-manager.tsx`

### Cambios Principales

#### Antes (Hardcoded)
```tsx
// ❌ Datos hardcodeados
const seasons = [{ 
  id: "cmgjzoic30007uv5k3k5tc7p4", 
  name: "World Cup 2022" 
}];
const sources = [{ 
  id: "cmgjmobdm000cuvzkokqnyhwx", 
  name: "API-Football" 
}];

const seasonId = "cmgjzoic30007uv5k3k5tc7p4"; // Hardcoded
```

#### Después (Dinámico)
```tsx
// ✅ Obtiene datos del pool
interface PoolFixturesManagerProps {
  poolId: string; // ← Recibe poolId como prop
}

export function PoolFixturesManager({ poolId }: PoolFixturesManagerProps) {
  // Obtiene pool con su season
  const { data: pool } = trpc.pools.getById.useQuery({ id: poolId });
  
  // Extrae seasonId del pool
  const seasonId = pool?.seasonId || "";
  
  // Obtiene fixtures de esa season
  const { data: matches } = trpc.fixtures.getBySeasonId.useQuery(
    { seasonId, includeFinished: true },
    { enabled: !!seasonId }
  );
}
```

### Flujo de Datos

```
1. Usuario accede a /pools/[id]
   ↓
2. PoolDetailsTabs recibe poolId
   ↓
3. Usuario hace clic en tab "Fixtures"
   ↓
4. PoolFixturesManager recibe poolId
   ↓
5. Query: pools.getById({ id: poolId })
   ↓
6. Extrae: seasonId del pool
   ↓
7. Query: fixtures.getBySeasonId({ seasonId })
   ↓
8. Muestra fixtures del pool ✅
```

---

## 📊 Tabs Implementados

### 1. Overview (Detalles)
**Componente:** `pool-details.tsx` (existente)

**Muestra:**
- Información general del pool
- Brand asociado
- Season y competición
- Descripción
- Fechas de inicio/fin

### 2. Fixtures (Partidos) ← NUEVO
**Componente:** `pool-fixtures-manager.tsx`

**Funcionalidades:**
- ✅ Lista de partidos por estado (upcoming, live, finished)
- ✅ Sincronización con fuente externa (API-Football)
- ✅ Contador de predicciones por partido
- ✅ Estado de lock de predicciones
- ✅ Scores en tiempo real

**Sub-tabs:**
- Upcoming (próximos)
- Live (en vivo)
- Finished (finalizados)

### 3. Registrations (Jugadores) ← NUEVO
**Componente:** `pool-registrations.tsx`

**Muestra:**
- Lista de usuarios registrados
- Email y nombre
- Estado (activo/inactivo)
- Fecha de registro
- Número de predicciones realizadas

### 4. Prizes (Premios)
**Componente:** `prizes-manager.tsx` (existente)

**Funcionalidades:**
- Gestión de premios del pool
- Posiciones y montos
- Asignación de ganadores

### 5. Settings (Configuración) ← NUEVO
**Componente:** `pool-settings.tsx`

**Funcionalidades:**
- ✅ Toggle activo/inactivo del pool
- ✅ Información del pool (ID, slug, fechas)
- ✅ Danger zone (eliminar pool - deshabilitado)

---

## 🎯 Mejoras en UI

### Pool Cards (pools-list.tsx)

#### Antes
```tsx
<div className="flex gap-2">
  <Button variant="secondary">Ver</Button>
  <Button variant="minimal">Editar</Button>
  <Button variant="destructive">Eliminar</Button>
</div>
```

#### Después
```tsx
<div className="flex flex-col gap-2">
  {/* Botón principal más prominente */}
  <Button variant="default" className="w-full">
    Ver Detalles
  </Button>
  
  {/* Acciones secundarias */}
  <div className="flex gap-2">
    <Button variant="outline" className="flex-1">Editar</Button>
    <Button variant="destructive" className="flex-1">Eliminar</Button>
  </div>
</div>
```

**Mejoras:**
- ✅ Botón "Ver" más prominente (full width, variant default)
- ✅ Jerarquía visual clara
- ✅ Mejor UX en mobile

---

## 🔄 Flujo de Usuario

### Navegación Completa

```
1. Admin accede a /pools
   ↓
2. Ve lista de pools (cards)
   ↓
3. Click en "Ver Detalles"
   ↓
4. Llega a /pools/[id] (tab Overview por default)
   ↓
5. Navegación por tabs:
   ├─ Overview: Info general
   ├─ Fixtures: Ver/sincronizar partidos ← NUEVO
   ├─ Registrations: Ver jugadores ← NUEVO
   ├─ Prizes: Gestionar premios
   └─ Settings: Configurar pool ← NUEVO
```

---

## 🧪 Testing

### Test 1: Verificar que fixtures se cargan correctamente

```bash
# 1. Acceder a un pool
http://ivoka.localhost:4000/es-MX/pools/[pool-id]

# 2. Click en tab "Fixtures"

# 3. Verificar:
✅ Se muestra el nombre del pool
✅ Se muestra la season correcta
✅ Se cargan los partidos
✅ No hay IDs hardcodeados en consola
```

### Test 2: Sincronización de fixtures

```bash
# 1. En tab Fixtures, seleccionar fuente de datos

# 2. Click en "Sincronizar Fixtures"

# 3. Verificar:
✅ Se sincronizan partidos desde API externa
✅ Se muestra toast de éxito
✅ Se actualiza la lista de partidos
```

### Test 3: Navegación entre tabs

```bash
# 1. Navegar entre todos los tabs

# 2. Verificar:
✅ Cada tab carga su contenido
✅ No hay errores en consola
✅ Los datos son correctos para el pool actual
```

---

## 📝 Traducciones Necesarias

Agregar a `messages/es-MX.json`:

```json
{
  "pools": {
    "tabs": {
      "overview": "Resumen",
      "fixtures": "Partidos",
      "registrations": "Jugadores",
      "prizes": "Premios",
      "settings": "Configuración"
    },
    "registrations": {
      "title": "Jugadores Registrados",
      "description": "{count} jugadores registrados",
      "empty": {
        "title": "No hay jugadores registrados",
        "description": "Los jugadores aparecerán aquí cuando se registren"
      },
      "table": {
        "user": "Usuario",
        "email": "Email",
        "status": "Estado",
        "registeredAt": "Fecha de registro",
        "predictions": "Predicciones",
        "noName": "Sin nombre"
      },
      "status": {
        "active": "Activo",
        "inactive": "Inactivo"
      }
    },
    "settings": {
      "status": {
        "title": "Estado del Pool",
        "description": "Controla si el pool está activo o inactivo",
        "active": "Activo",
        "inactive": "Inactivo",
        "activeDescription": "El pool está activo y los jugadores pueden registrarse y hacer predicciones",
        "inactiveDescription": "El pool está inactivo. Los jugadores no pueden registrarse ni hacer predicciones"
      },
      "actions": {
        "activate": "Activar Pool",
        "deactivate": "Desactivar Pool",
        "activateConfirm": "¿Estás seguro de activar {name}?",
        "deactivateConfirm": "¿Estás seguro de desactivar {name}?",
        "activateSuccess": "Pool activado correctamente",
        "deactivateSuccess": "Pool desactivado correctamente",
        "error": "Error: {message}"
      },
      "danger": {
        "title": "Zona de Peligro",
        "description": "Acciones irreversibles",
        "deleteTitle": "Eliminar Pool",
        "deleteDescription": "Una vez eliminado, no se puede recuperar:",
        "deleteWarning1": "Todos los registros de jugadores se eliminarán",
        "deleteWarning2": "Todas las predicciones se perderán",
        "deleteWarning3": "Los premios asignados se eliminarán",
        "deleteButton": "Eliminar Pool Permanentemente",
        "deleteNote": "Esta función está deshabilitada por seguridad"
      },
      "info": {
        "title": "Información del Pool",
        "description": "Datos técnicos del pool",
        "id": "ID",
        "slug": "Slug",
        "createdAt": "Creado",
        "updatedAt": "Actualizado"
      }
    }
  }
}
```

---

## 🚀 Próximos Pasos

### Fase 1: Completar (Actual)
- [x] Crear sistema de tabs
- [x] Refactorizar fixtures manager
- [x] Crear componentes de registrations y settings
- [x] Mejorar UI de pools-list
- [ ] Agregar traducciones
- [ ] Testing completo

### Fase 2: Mejoras Futuras
- [ ] Tab de Analytics (gráficas de participación)
- [ ] Tab de Leaderboard (tabla de posiciones)
- [ ] Filtros avanzados en fixtures (por round, fecha)
- [ ] Exportar datos (CSV, PDF)
- [ ] Notificaciones push para admins

### Fase 3: Optimizaciones
- [ ] Server-side rendering para tabs
- [ ] Infinite scroll en registrations
- [ ] Real-time updates en fixtures live
- [ ] Cache de queries con React Query

---

## 🗑️ Limpieza Pendiente

### Archivos a Eliminar (después de verificar)

```bash
# 1. Verificar que nadie usa el módulo antiguo
# 2. Eliminar:
apps/admin/app/[locale]/(authenticated)/fixtures/

# 3. Eliminar ruta del navigation (si existe)
```

---

## 📚 Referencias

- **Pool Details:** `apps/admin/app/[locale]/(authenticated)/pools/[id]/page.tsx`
- **Tabs System:** `apps/admin/app/[locale]/(authenticated)/pools/[id]/components/pool-details-tabs.tsx`
- **Fixtures Manager:** `apps/admin/app/[locale]/(authenticated)/pools/[id]/components/pool-fixtures-manager.tsx`
- **Pools List:** `apps/admin/app/[locale]/(authenticated)/pools/components/pools-list.tsx`

---

**Fecha:** 2025-01-16  
**Status:** ✅ IMPLEMENTADO  
**Próximo:** Agregar traducciones y testing completo
