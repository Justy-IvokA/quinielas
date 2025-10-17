# ✅ Implementación de Toolbar en Dashboard

## Resumen

Se implementó el componente `UserPoolsToolbar` en el Dashboard para agregar funcionalidad de búsqueda, filtrado y ordenamiento de quinielas, consolidando la funcionalidad y preparando para eliminar la ruta redundante `/pools`.

---

## 🎯 Objetivo

**Consolidar funcionalidad:**
- ✅ Implementar toolbar de búsqueda/filtros en Dashboard
- ✅ Mantener misma UX que `/pools`
- ✅ Preparar para deprecar ruta `/pools` (redundante)

---

## 📝 Cambios Implementados

### 1. DashboardView Actualizado

**Archivo:** `apps/web/app/[locale]/(player)/dashboard/_components/DashboardView.tsx`

#### Estados Agregados

```tsx
// Filter, search, and sort state
const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "FINALIZED" | "PENDING">("ACTIVE");
const [search, setSearch] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");
const [sort, setSort] = useState<"RECENT" | "NEXT_KICKOFF" | "FINALIZED_RECENT">("NEXT_KICKOFF");
const [page, setPage] = useState(1);
```

#### Debounce de Búsqueda

```tsx
// Debounce search - evita llamadas excesivas al API
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
    setPage(1); // Reset to first page on search
  }, 300);

  return () => clearTimeout(timer);
}, [search]);
```

#### Query Dinámica

```tsx
// Fetch user's pools con filtros dinámicos
const { data, isLoading, error, refetch } = trpc.userPools.list.useQuery({
  filter,
  search: debouncedSearch,
  page,
  pageSize: 50,
  sort
});
```

#### Toolbar Integrado

```tsx
<UserPoolsToolbar
  filter={filter}
  onFilterChange={setFilter}
  sort={sort}
  onSortChange={setSort}
  search={search}
  onSearchChange={setSearch}
/>
```

### 2. Estados de Vacío Mejorados

#### Sin Quinielas (Estado Inicial)

```tsx
const hasNoPools = activePools.length === 0 && !debouncedSearch && filter === "ACTIVE";

if (hasNoPools) {
  return (
    <div>
      <Trophy />
      <h2>No tienes quinielas activas</h2>
      <p>Únete a una quiniela para comenzar</p>
      <Button>Explorar quinielas</Button>
    </div>
  );
}
```

#### Sin Resultados (Con Filtros)

```tsx
const hasNoResults = activePools.length === 0 && (debouncedSearch || filter !== "ACTIVE");

{hasNoResults && (
  <div>
    <Trophy />
    <h2>No se encontraron quinielas</h2>
    <p>Intenta con diferentes filtros</p>
    <Button onClick={clearFilters}>Limpiar filtros</Button>
  </div>
)}
```

### 3. Condicionales para Stats y Pools

```tsx
{/* Stats Overview - Solo si hay resultados */}
{!hasNoResults && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    {/* Stats cards */}
  </div>
)}

{/* Active Pools - Solo si hay resultados */}
{!hasNoResults && (
  <div className="mb-6">
    <h2>Mis Quinielas</h2>
    <div className="grid">
      {activePools.map((pool) => (
        <PoolDashboardCard key={pool.poolId} pool={pool} locale={locale} />
      ))}
    </div>
  </div>
)}
```

---

## 🎨 Funcionalidades del Toolbar

### 1. Búsqueda

**Características:**
- ✅ Búsqueda en tiempo real con debounce (300ms)
- ✅ Busca en nombre de quiniela, competición, temporada
- ✅ Placeholder: "Buscar quinielas..."
- ✅ Icono de búsqueda (Search)

**Comportamiento:**
```
Usuario escribe "Liga MX"
  ↓ (espera 300ms)
Actualiza debouncedSearch
  ↓
Reset page = 1
  ↓
Query con search="Liga MX"
  ↓
Muestra resultados filtrados
```

### 2. Filtro por Estado

**Opciones:**
- **ALL** - Todas las quinielas
- **ACTIVE** - Solo activas (default)
- **FINALIZED** - Solo finalizadas
- **PENDING** - Pendientes de inicio

**Comportamiento:**
```
Usuario selecciona "FINALIZED"
  ↓
setFilter("FINALIZED")
  ↓
Reset page = 1
  ↓
Query con filter="FINALIZED"
  ↓
Muestra solo quinielas finalizadas
```

### 3. Ordenamiento

**Opciones:**
- **RECENT** - Más recientes primero
- **NEXT_KICKOFF** - Próximo partido (default)
- **FINALIZED_RECENT** - Finalizadas recientemente

**Comportamiento:**
```
Usuario selecciona "RECENT"
  ↓
setSort("RECENT")
  ↓
Reset page = 1
  ↓
Query con sort="RECENT"
  ↓
Reordena resultados
```

---

## 🔄 Flujos de Usuario

### Escenario 1: Búsqueda Simple

```
1. Usuario en Dashboard
2. Escribe "Mundial" en búsqueda
3. Espera 300ms (debounce)
4. Se filtran quinielas con "Mundial"
5. Stats se actualizan
6. Grid muestra resultados
```

### Escenario 2: Filtro + Búsqueda

```
1. Usuario selecciona filtro "FINALIZED"
2. Escribe "2024" en búsqueda
3. Muestra quinielas finalizadas de 2024
4. Si no hay resultados:
   - Muestra mensaje "No se encontraron quinielas"
   - Botón "Limpiar filtros"
```

### Escenario 3: Sin Resultados

```
1. Usuario busca "XYZ" (no existe)
2. hasNoResults = true
3. Oculta stats y grid
4. Muestra mensaje vacío
5. Botón "Limpiar filtros":
   - setFilter("ACTIVE")
   - setSearch("")
   - setPage(1)
```

---

## 📊 Comparación: Antes vs Ahora

### Antes ❌

**Dashboard:**
- Sin búsqueda
- Sin filtros
- Sin ordenamiento
- Solo mostraba quinielas activas
- Ruta `/pools` separada con misma funcionalidad

**Problemas:**
- Duplicación de código
- Dos rutas para lo mismo
- Confusión para usuarios
- Más mantenimiento

### Ahora ✅

**Dashboard:**
- ✅ Búsqueda con debounce
- ✅ Filtros (ALL, ACTIVE, FINALIZED, PENDING)
- ✅ Ordenamiento (RECENT, NEXT_KICKOFF, FINALIZED_RECENT)
- ✅ Estados vacíos inteligentes
- ✅ Funcionalidad consolidada

**Ventajas:**
- ✅ Una sola fuente de verdad
- ✅ Mejor UX
- ✅ Menos código duplicado
- ✅ Preparado para deprecar `/pools`

---

## 🌐 Traducciones Agregadas

### Español (es-MX.json)

```json
{
  "dashboard": {
    "empty": {
      "noResults": "No se encontraron quinielas",
      "tryDifferentFilters": "Intenta con diferentes filtros o búsqueda",
      "clearFilters": "Limpiar filtros"
    }
  }
}
```

### Inglés (Pendiente)

```json
{
  "dashboard": {
    "empty": {
      "noResults": "No pools found",
      "tryDifferentFilters": "Try different filters or search",
      "clearFilters": "Clear filters"
    }
  }
}
```

---

## 🧪 Testing

### Test 1: Búsqueda

```bash
# 1. Ir a Dashboard
http://localhost:3000/es-MX/dashboard

# 2. Escribir en búsqueda: "Liga"
# 3. Verificar:
✅ Espera 300ms antes de buscar
✅ Filtra quinielas con "Liga"
✅ Stats se actualizan
✅ Grid muestra resultados
```

### Test 2: Filtros

```bash
# 1. Seleccionar filtro "FINALIZED"
# 2. Verificar:
✅ Muestra solo quinielas finalizadas
✅ Stats reflejan solo finalizadas
✅ Page resetea a 1

# 3. Seleccionar "ALL"
# 4. Verificar:
✅ Muestra todas las quinielas
```

### Test 3: Sin Resultados

```bash
# 1. Buscar "XXXXX" (no existe)
# 2. Verificar:
✅ Muestra mensaje "No se encontraron quinielas"
✅ Oculta stats y grid
✅ Botón "Limpiar filtros" visible

# 3. Click en "Limpiar filtros"
# 4. Verificar:
✅ Limpia búsqueda
✅ Resetea filtro a "ACTIVE"
✅ Muestra quinielas activas
```

### Test 4: Ordenamiento

```bash
# 1. Seleccionar "RECENT"
# 2. Verificar:
✅ Quinielas ordenadas por fecha
✅ Más recientes primero

# 3. Seleccionar "NEXT_KICKOFF"
# 4. Verificar:
✅ Quinielas ordenadas por próximo partido
```

---

## 📁 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `DashboardView.tsx` | Agregado toolbar, estados, lógica de filtrado |
| `es-MX.json` | Agregadas traducciones para estados vacíos |
| `UserPoolsToolbar.tsx` | Reutilizado (sin cambios) |

---

## 🚀 Próximos Pasos

### Fase 1: Deprecar `/pools` (Opcional)

```tsx
// apps/web/app/[locale]/pools/page.tsx
export default function PoolsPage() {
  redirect("/dashboard");
}
```

**O mantener con mensaje:**
```tsx
<Alert>
  Esta página será deprecada. 
  Usa el <Link href="/dashboard">Dashboard</Link> en su lugar.
</Alert>
```

### Fase 2: Paginación

```tsx
// Agregar controles de paginación
const pagination = data?.pagination;

<div className="flex justify-center gap-2 mt-6">
  <Button 
    disabled={page === 1}
    onClick={() => setPage(page - 1)}
  >
    Anterior
  </Button>
  <span>Página {page} de {pagination?.totalPages}</span>
  <Button 
    disabled={page === pagination?.totalPages}
    onClick={() => setPage(page + 1)}
  >
    Siguiente
  </Button>
</div>
```

### Fase 3: Filtros Avanzados

```tsx
// Agregar más filtros
- Por competición
- Por temporada
- Por rango de fechas
- Por número de participantes
```

---

## 💡 Notas de Implementación

### Debounce

**Por qué 300ms?**
- ✅ Balance entre UX y performance
- ✅ No muy rápido (muchas llamadas)
- ✅ No muy lento (sensación de lag)

### Reset de Página

**Por qué resetear a página 1?**
- ✅ Evita mostrar página vacía
- ✅ Usuario espera ver resultados inmediatos
- ✅ Comportamiento estándar en búsquedas

### Condicionales

**Por qué ocultar stats cuando no hay resultados?**
- ✅ Stats serían 0, no aportan valor
- ✅ Foco en mensaje de "no resultados"
- ✅ Mejor UX

---

## ✅ Checklist de Implementación

- [x] Agregar estados (filter, search, sort, page)
- [x] Implementar debounce de búsqueda
- [x] Integrar UserPoolsToolbar
- [x] Agregar lógica de hasNoResults
- [x] Condicionales para stats y pools
- [x] Mensaje de "no resultados"
- [x] Botón "Limpiar filtros"
- [x] Agregar traducciones
- [x] Documentación completa
- [ ] Testing en desarrollo
- [ ] Decidir sobre deprecación de `/pools`
- [ ] Implementar paginación (opcional)

---

**Fecha:** 2025-01-16  
**Status:** ✅ COMPLETADO  
**Próximo:** Testing y decisión sobre deprecar `/pools`
