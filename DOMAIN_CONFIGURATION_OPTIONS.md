# Opciones de Configuración de Dominios

## 📋 Resumen

El sistema ofrece **3 formas** de configurar dominios para brands, cada una optimizada para diferentes momentos del flujo de trabajo.

---

## 🎯 Opción 1: Durante la Creación del Tenant ⭐ (NUEVO)

**Cuándo usar:** Al crear un nuevo tenant y ya conoces los dominios

**Ubicación:** Modal "Crear Tenant" → Sección "Dominios (Opcional)"

**Características:**
- ✅ Configuración inline durante la creación
- ✅ Agregar múltiples dominios con botón "+"
- ✅ Vista previa de dominios antes de crear
- ✅ Badge "Principal" en el primer dominio
- ✅ Eliminar dominios antes de confirmar
- ✅ Mensaje informativo si no se configuran dominios

**Flujo:**
```
1. Clic en "Crear Tenant"
2. Llenar nombre, slug, descripción
3. (Opcional) Agregar dominios:
   - Escribir dominio
   - Presionar Enter o clic en "+"
   - Repetir para múltiples dominios
4. Clic en "Crear Tenant"
```

**Ventajas:**
- ⚡ Más rápido: todo en un solo paso
- 🎯 Ideal para onboarding planificado
- 📋 Vista completa antes de crear

**Ejemplo:**
```
Tenant: CEMEX
Dominios agregados:
  1. quinielas.cemex.com (Principal)
  2. pools.cemex.com
  3. cemex.localhost (desarrollo)
```

---

## 🎯 Opción 2: Página Dedicada de Configuración

**Cuándo usar:** Para gestionar dominios de tenants existentes

**Ubicación:** 
```
/superadmin/tenants → [Seleccionar Tenant] → 
  Sección "Marcas" → Botón "Configurar Dominios"
```

**Características:**
- ✅ Interfaz completa y detallada
- ✅ Instrucciones de configuración DNS
- ✅ Agregar/eliminar dominios individualmente
- ✅ Copiar URLs al portapapeles
- ✅ Abrir dominios en nueva pestaña
- ✅ Verificación visual de estado
- ✅ Múltiples dominios por brand

**Flujo:**
```
1. Ir a /superadmin/tenants
2. Seleccionar tenant
3. En sección "Marcas", clic en "Configurar Dominios"
4. Agregar/eliminar dominios según necesites
```

**Ventajas:**
- 📚 Instrucciones completas de DNS
- 🔧 Gestión detallada post-creación
- 👁️ Vista completa del estado
- 🔗 Herramientas de verificación

**Ejemplo de uso:**
```
Caso: Cliente ya creado, necesita agregar dominio custom

1. Tenant "Coca-Cola" ya existe
2. Inicialmente sin dominios (usa subdomain)
3. Cliente configura DNS
4. SUPERADMIN agrega "mundial.cocacola.com"
5. Sistema empieza a usar dominio custom
```

---

## 🎯 Opción 3: Edición Rápida desde Lista (Futuro)

**Cuándo usar:** Para cambios rápidos sin salir de la lista

**Ubicación:** Menú de acciones (⋮) en cada tenant

**Características propuestas:**
- ⚡ Modal rápido desde la lista
- 🎯 Edición inline de dominios
- 📋 Vista resumida

**Estado:** 🚧 No implementado (puede agregarse si se necesita)

---

## 📊 Comparación de Opciones

| Característica | Opción 1: Al Crear | Opción 2: Página Dedicada |
|----------------|-------------------|---------------------------|
| **Velocidad** | ⚡⚡⚡ Muy rápida | ⚡⚡ Moderada |
| **Detalle** | 📋 Básico | 📚 Completo |
| **Instrucciones DNS** | ❌ No | ✅ Sí |
| **Verificación** | ❌ No | ✅ Sí (copiar, abrir) |
| **Edición posterior** | ❌ No | ✅ Sí |
| **Múltiples dominios** | ✅ Sí | ✅ Sí |
| **Ideal para** | Onboarding nuevo | Gestión existente |

---

## 🎬 Casos de Uso Recomendados

### Caso 1: Onboarding Planificado
**Situación:** Nuevo cliente, dominios ya conocidos

**Usar:** Opción 1 (Al crear)
```
Cliente: Pepsi
Dominios conocidos: quinielas.pepsi.com, mundial.pepsi.com
Acción: Crear tenant con dominios incluidos
```

### Caso 2: Onboarding Rápido
**Situación:** Crear tenant rápido, configurar después

**Usar:** Opción 1 sin dominios → Opción 2 después
```
1. Crear tenant sin dominios (usa subdomain automático)
2. Cliente configura DNS
3. Agregar dominios via página dedicada
```

### Caso 3: Cambio de Dominios
**Situación:** Tenant existente cambia dominio

**Usar:** Opción 2 (Página dedicada)
```
Tenant: Coca-Cola
Cambio: De subdomain a custom domain
Acción: Ir a configuración, agregar nuevo dominio
```

### Caso 4: Múltiples Dominios
**Situación:** Cliente con varios dominios apuntando al mismo brand

**Usar:** Opción 2 (Página dedicada)
```
Brand: Mundial 2026
Dominios:
  - mundial.cocacola.com (principal)
  - worldcup.cocacola.com
  - quinielas.cocacola.com
```

---

## 💡 Mejores Prácticas

### Durante Creación (Opción 1)
✅ **Hacer:**
- Agregar dominios si ya están configurados en DNS
- Usar para demos y desarrollo (*.localhost)
- Configurar dominio principal primero

❌ **Evitar:**
- Agregar dominios que aún no apuntan al servidor
- Configurar dominios sin verificar DNS primero

### Gestión Post-Creación (Opción 2)
✅ **Hacer:**
- Verificar DNS antes de agregar
- Usar botón "Abrir" para probar
- Leer instrucciones DNS completas
- Mantener primer dominio como principal

❌ **Evitar:**
- Eliminar todos los dominios si hay pools activos
- Cambiar dominio principal sin comunicar a usuarios

---

## 🔄 Flujo Completo Recomendado

### Para Nuevos Clientes

```mermaid
1. Crear Tenant
   ├─ Con dominios conocidos → Opción 1 ✅
   └─ Sin dominios → Opción 1 (vacío)
   
2. Cliente configura DNS
   └─ Esperar propagación (hasta 48h)
   
3. Agregar dominios
   └─ Opción 2 (Página dedicada)
   
4. Verificar
   ├─ Copiar URL
   ├─ Abrir en navegador
   └─ Confirmar resolución
```

### Para Clientes Existentes

```mermaid
1. Acceder a Tenant
   └─ /superadmin/tenants/[id]
   
2. Ir a Configuración de Dominios
   └─ Botón "Configurar Dominios"
   
3. Gestionar dominios
   ├─ Agregar nuevos
   ├─ Eliminar obsoletos
   └─ Verificar estado
```

---

## 🎨 Interfaz de Usuario

### Opción 1: Modal de Creación
```
┌─────────────────────────────────────┐
│ Crear Nuevo Tenant                  │
├─────────────────────────────────────┤
│ Nombre: [CEMEX                   ]  │
│ Slug:   [cemex                   ]  │
│ Desc:   [Cliente corporativo     ]  │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ Dominios (Opcional)                 │
│ ┌─────────────────────────┬───┐    │
│ │ ejemplo.com             │ + │    │
│ └─────────────────────────┴───┘    │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ quinielas.cemex.com [Principal]│ │
│ │                           [×]│    │
│ └─────────────────────────────┘    │
│                                     │
│ 💡 Sin dominios: {slug}.domain.com │
│                                     │
│        [Cancelar]  [Crear Tenant]  │
└─────────────────────────────────────┘
```

### Opción 2: Página Dedicada
```
┌─────────────────────────────────────┐
│ ← Volver a Tenant                   │
│                                     │
│ 🌐 Configuración de Dominios        │
│    CEMEX (Innovatica)               │
├─────────────────────────────────────┤
│ ℹ️ Instrucciones DNS                │
│ • Crear registro CNAME...           │
│ • Apuntar a: servidor.com           │
│ • Esperar propagación               │
├─────────────────────────────────────┤
│ Dominios Configurados (2)           │
│                    [+ Agregar]      │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ 🌐 quinielas.cemex.com      │    │
│ │    [Principal]              │    │
│ │              [📋] [🔗] [🗑️]│    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ 🌐 pools.cemex.com          │    │
│ │              [📋] [🔗] [🗑️]│    │
│ └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## 🚀 Resumen Ejecutivo

**Implementado:**
- ✅ Opción 1: Configuración inline al crear tenant
- ✅ Opción 2: Página dedicada de gestión
- ✅ Validaciones y seguridad completas
- ✅ Audit trail de todas las operaciones

**Recomendación de uso:**
1. **Onboarding nuevo** → Opción 1 (más rápido)
2. **Gestión detallada** → Opción 2 (más completo)
3. **Cambios frecuentes** → Opción 2 (herramientas completas)

**Ventaja principal:**
Flexibilidad total - el SUPERADMIN elige el flujo que mejor se adapte a cada situación.
