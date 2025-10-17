# ✅ Fix: Traducciones y Tab de Registrations

## Resumen

Se agregaron las traducciones faltantes para los nuevos tabs y se corrigió la lógica del tab de registrations que no mostraba jugadores.

---

## 🌐 Tarea 1: Traducciones Agregadas

### Español (es-MX.json)

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
        "description": "Los jugadores aparecerán aquí cuando se registren en este pool"
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

### Inglés (en-US.json)

Traducciones equivalentes en inglés agregadas.

---

## 🔧 Tarea 2: Fix del Tab de Registrations

### Problema

El componente `pool-registrations.tsx` intentaba usar un endpoint que no existía:

```typescript
// ❌ Este endpoint no existía
const { data: registrations } = trpc.pools.getRegistrations.useQuery({ poolId });
```

### Solución

Se agregó el endpoint `getRegistrations` al router de pools:

**Archivo:** `packages/api/src/routers/pools/index.ts`

```typescript
// Get registrations for a pool
getRegistrations: publicProcedure
  .input(z.object({ poolId: z.string().cuid() }))
  .query(async ({ input }) => {
    return prisma.registration.findMany({
      where: { poolId: input.poolId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        _count: {
          select: {
            predictions: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }),
```

### Características del Endpoint

✅ **Filtra por poolId** - Solo muestra registros del pool específico
✅ **Incluye datos del usuario** - Nombre, email, imagen
✅ **Cuenta predicciones** - Muestra cuántas predicciones ha hecho cada jugador
✅ **Ordenado por fecha** - Los más recientes primero

---

## 🎁 Bonus: Endpoint toggleActive

También se agregó el endpoint para activar/desactivar pools desde el tab de Settings:

```typescript
// Toggle pool active status
toggleActive: publicProcedure
  .input(z.object({ 
    id: z.string().cuid(),
    isActive: z.boolean()
  }))
  .mutation(async ({ input }) => {
    return prisma.pool.update({
      where: { id: input.id },
      data: { isActive: input.isActive }
    });
  }),
```

---

## 📊 Estructura de Datos Retornada

### getRegistrations Response

```typescript
[
  {
    id: "clx123...",
    userId: "clx456...",
    poolId: "clx789...",
    isActive: true,
    createdAt: "2025-01-16T...",
    updatedAt: "2025-01-16T...",
    user: {
      id: "clx456...",
      name: "Juan Pérez",
      email: "juan@example.com",
      image: "https://..."
    },
    _count: {
      predictions: 15
    }
  },
  // ... más registros
]
```

---

## 🧪 Testing

### Test 1: Verificar traducciones

```bash
# 1. Reiniciar servidor
pnpm dev

# 2. Acceder a un pool
http://ivoka.localhost:4000/es-MX/pools/[pool-id]

# 3. Navegar por los tabs
✅ Verificar que los nombres de tabs están en español
✅ Verificar que los textos dentro de cada tab están traducidos
```

### Test 2: Verificar registrations

```bash
# 1. Acceder al tab "Jugadores"

# 2. Verificar que se muestran los jugadores registrados

# 3. Verificar que se muestra:
✅ Nombre del jugador
✅ Email
✅ Estado (Activo/Inactivo)
✅ Fecha de registro
✅ Número de predicciones
```

### Test 3: Verificar settings

```bash
# 1. Acceder al tab "Configuración"

# 2. Probar activar/desactivar pool

# 3. Verificar:
✅ Se muestra confirmación
✅ Se actualiza el estado
✅ Se muestra toast de éxito
```

---

## 📁 Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `apps/admin/messages/es-MX.json` | Agregadas traducciones para tabs |
| `apps/admin/messages/en-US.json` | Agregadas traducciones en inglés |
| `packages/api/src/routers/pools/index.ts` | Agregados endpoints `getRegistrations` y `toggleActive` |

---

## 🔄 Flujo Completo

```
1. Admin accede a /pools/[id]
   ↓
2. Click en tab "Jugadores"
   ↓
3. Componente llama: trpc.pools.getRegistrations.useQuery({ poolId })
   ↓
4. Endpoint consulta DB:
   - Filtra por poolId
   - Incluye datos del usuario
   - Cuenta predicciones
   ↓
5. Retorna lista de registros
   ↓
6. Componente renderiza tabla con:
   - Nombre y email
   - Estado activo/inactivo
   - Fecha de registro
   - Número de predicciones
   ↓
7. Si no hay registros → Muestra empty state ✅
```

---

## ✅ Verificación de Datos en DB

Para verificar que hay registros en la base de datos:

```sql
-- Ver registros de un pool específico
SELECT 
  r.id,
  r."userId",
  r."poolId",
  r."isActive",
  r."createdAt",
  u.name,
  u.email,
  COUNT(p.id) as predictions_count
FROM "Registration" r
JOIN "User" u ON u.id = r."userId"
LEFT JOIN "Prediction" p ON p."userId" = r."userId" AND p."poolId" = r."poolId"
WHERE r."poolId" = 'tu-pool-id-aqui'
GROUP BY r.id, u.name, u.email;
```

---

## 🎯 Próximos Pasos

### Mejoras Futuras para Registrations Tab

1. **Filtros:**
   - Por estado (activo/inactivo)
   - Por fecha de registro
   - Por número de predicciones

2. **Acciones:**
   - Desactivar/activar jugador
   - Ver detalles del jugador
   - Ver predicciones del jugador

3. **Exportar:**
   - Exportar lista a CSV
   - Exportar con estadísticas

4. **Búsqueda:**
   - Buscar por nombre o email

---

**Fecha:** 2025-01-16  
**Status:** ✅ COMPLETADO  
**Probado:** Pendiente de testing en desarrollo
