# 🗑️ Feature: Eliminar Tenant con Cascada

## 🎯 Funcionalidad Implementada

Se ha agregado la capacidad de eliminar tenants (clientes) desde el panel de superadmin con las siguientes características:

### **1. Menú de Acciones** ✅

**Ubicación**: Tabla de tenants en `/superadmin/tenants`

**Antes**:
- Solo botón "Ver detalles"

**Ahora**:
- Menú dropdown con:
  - 👁️ Ver detalles
  - 🗑️ Eliminar (en rojo)

### **2. Validación de Dependencias** ✅

El sistema valida automáticamente si el tenant puede ser eliminado:

```typescript
// Backend validation (packages/api/src/routers/superadmin/tenants.ts)
if (tenant._count.pools > 0) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `Cannot delete tenant with ${tenant._count.pools} pool(s). Delete pools first.`
  });
}

if (tenant._count.registrations > 0) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `Cannot delete tenant with ${tenant._count.registrations} registration(s).`
  });
}
```

### **3. Dialog de Confirmación** ✅

**Escenario 1: Tenant con Pools (No se puede eliminar)**

```
┌─────────────────────────────────────────┐
│ ¿Eliminar Cliente?                      │
├─────────────────────────────────────────┤
│ Estás a punto de eliminar el cliente    │
│ Mi Empresa.                              │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ ⚠️ No se puede eliminar este cliente│ │
│ │                                      │ │
│ │ El cliente tiene 3 quiniela(s)      │ │
│ │ activa(s). Debes eliminar todas las │ │
│ │ quinielas antes de eliminar el      │ │
│ │ cliente.                             │ │
│ └─────────────────────────────────────┘ │
│                                          │
│              [Cancelar]                  │
└─────────────────────────────────────────┘
```

**Escenario 2: Tenant sin Pools (Se puede eliminar)**

```
┌─────────────────────────────────────────┐
│ ¿Eliminar Cliente?                      │
├─────────────────────────────────────────┤
│ Estás a punto de eliminar el cliente    │
│ Mi Empresa.                              │
│                                          │
│ Esta acción eliminará permanentemente:   │
│ • El cliente y su configuración         │
│ • Todas las marcas asociadas            │
│ • Todos los miembros del tenant         │
│ • Registros de auditoría relacionados   │
│                                          │
│ Esta acción no se puede deshacer.       │
│                                          │
│     [Cancelar]  [Eliminar Cliente]      │
└─────────────────────────────────────────┘
```

---

## 🔄 Cascada de Eliminación

### **Configuración en Prisma Schema**

```prisma
model Tenant {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  
  brands      Brand[]
  members     TenantMember[]
  pools       Pool[]
  // ... otras relaciones
}

model Brand {
  id          String   @id @default(cuid())
  tenantId    String
  
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  // ✅ Cascade: Se elimina automáticamente cuando se elimina el tenant
}

model TenantMember {
  id        String     @id @default(cuid())
  tenantId  String
  
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  // ✅ Cascade: Se elimina automáticamente cuando se elimina el tenant
}
```

### **Flujo de Eliminación**

```
1. Usuario hace clic en "Eliminar" en el menú
   ↓
2. Se abre dialog de confirmación
   ↓
3. Sistema valida dependencias (pools, registrations)
   ↓
4a. Si tiene pools → Mostrar error, NO permitir eliminar
   ↓
4b. Si NO tiene pools → Mostrar advertencia, permitir eliminar
   ↓
5. Usuario confirma eliminación
   ↓
6. Backend elimina tenant
   ↓
7. Prisma elimina automáticamente en cascada:
   - Brands (todas las marcas)
   - TenantMembers (todos los miembros)
   - AuditLogs (logs de auditoría)
   - Settings (configuraciones)
   - PolicyDocuments (documentos de política)
   - ConsentRecords (registros de consentimiento)
   - DataRetentionPolicies (políticas de retención)
   - TenantTemplateAssignments (asignaciones de templates)
   ↓
8. Se crea log de auditoría de eliminación
   ↓
9. Toast de éxito + Refetch de lista
```

---

## 📋 Archivos Modificados

### **1. Frontend: Página de Tenants**

**Archivo**: `apps/admin/app/[locale]/(authenticated)/superadmin/tenants/page.tsx`

**Cambios**:
- ✅ Agregado `DropdownMenu` con acciones
- ✅ Agregado estado `deleteDialogOpen` y `tenantToDelete`
- ✅ Agregado mutation `deleteMutation`
- ✅ Agregado Dialog de confirmación con validación
- ✅ Importados componentes de UI necesarios

### **2. Backend: Router de Tenants**

**Archivo**: `packages/api/src/routers/superadmin/tenants.ts`

**Endpoint existente** (líneas 268-329):
```typescript
delete: publicProcedure
  .use(requireSuperAdmin)
  .input(deleteTenantSchema)
  .mutation(async ({ input, ctx }) => {
    // Validación de dependencias
    // Eliminación del tenant
    // Log de auditoría
  })
```

**Ya estaba implementado** ✅ - Solo se conectó desde el frontend

### **3. Schema de Base de Datos**

**Archivo**: `packages/db/prisma/schema.prisma`

**Cascadas configuradas** ✅:
- `Brand.tenant` → `onDelete: Cascade`
- `TenantMember.tenant` → `onDelete: Cascade`
- Otras relaciones también tienen cascade configurado

---

## 🧪 Testing

### **Test 1: Intentar eliminar tenant con pools**

```bash
# Crear tenant con pool
1. Crear tenant "Test Company"
2. Crear pool en ese tenant
3. Intentar eliminar tenant
4. ✅ Debe mostrar error: "No se puede eliminar este cliente"
5. ✅ Botón "Eliminar Cliente" NO debe aparecer
```

### **Test 2: Eliminar tenant sin pools**

```bash
# Crear tenant vacío
1. Crear tenant "Empty Company"
2. NO crear pools
3. Intentar eliminar tenant
4. ✅ Debe mostrar advertencia con lista de lo que se eliminará
5. ✅ Botón "Eliminar Cliente" debe aparecer
6. Confirmar eliminación
7. ✅ Debe eliminar tenant y todas sus relaciones
8. ✅ Debe mostrar toast de éxito
9. ✅ Debe refrescar la lista
```

### **Test 3: Verificar cascada en DB**

```sql
-- Antes de eliminar
SELECT 
  t.id as tenant_id,
  t.name,
  (SELECT COUNT(*) FROM "Brand" WHERE "tenantId" = t.id) as brands_count,
  (SELECT COUNT(*) FROM "TenantMember" WHERE "tenantId" = t.id) as members_count
FROM "Tenant" t
WHERE t.slug = 'test-company';

-- Eliminar tenant via UI

-- Después de eliminar
SELECT COUNT(*) FROM "Brand" WHERE "tenantId" = 'deleted_tenant_id';
-- ✅ Debe retornar 0

SELECT COUNT(*) FROM "TenantMember" WHERE "tenantId" = 'deleted_tenant_id';
-- ✅ Debe retornar 0
```

---

## 🔐 Seguridad

### **1. Autorización**

```typescript
// Solo SUPERADMIN puede eliminar tenants
delete: publicProcedure
  .use(requireSuperAdmin) // ← Middleware de autorización
  .input(deleteTenantSchema)
  .mutation(...)
```

### **2. Validación de Dependencias**

El sistema previene eliminaciones que causarían inconsistencias:

```typescript
// ❌ No se puede eliminar si tiene pools
if (tenant._count.pools > 0) {
  throw new TRPCError({ ... });
}

// ❌ No se puede eliminar si tiene registrations
if (tenant._count.registrations > 0) {
  throw new TRPCError({ ... });
}
```

### **3. Auditoría**

Cada eliminación se registra:

```typescript
await prisma.auditLog.create({
  data: {
    tenantId: input.id,
    actorId: ctx.session?.user?.id,
    action: "TENANT_DELETE",
    resourceType: "TENANT",
    resourceId: input.id,
    metadata: {
      name: tenant.name,
      slug: tenant.slug
    }
  }
});
```

---

## 🎨 UX Considerations

### **1. Feedback Visual**

- ✅ Botón "Eliminar" en rojo (`text-destructive`)
- ✅ Icono de basura (`TrashIcon`)
- ✅ Dialog con advertencias claras
- ✅ Estado de loading ("Eliminando...")
- ✅ Toast de confirmación

### **2. Prevención de Errores**

- ✅ Validación en frontend (no mostrar botón si tiene pools)
- ✅ Validación en backend (doble check)
- ✅ Mensajes de error claros y accionables
- ✅ Confirmación explícita requerida

### **3. Información Clara**

El dialog muestra exactamente qué se eliminará:
- El cliente y su configuración
- Todas las marcas asociadas
- Todos los miembros del tenant
- Registros de auditoría relacionados

---

## 🚀 Deployment

### **No requiere migración de DB**

Las cascadas ya están configuradas en el schema. No se necesitan cambios en la base de datos.

### **Checklist de Deploy**

- [x] Código frontend actualizado
- [x] Backend ya tenía el endpoint
- [x] Schema de Prisma ya tiene cascadas
- [x] Testing manual completado
- [ ] Deploy a staging
- [ ] Testing en staging
- [ ] Deploy a producción

---

## 📝 Notas Adicionales

### **Limitaciones Actuales**

1. **No se puede eliminar tenant con pools**: Esto es intencional para prevenir pérdida de datos importantes.
2. **No se puede eliminar tenant con registrations**: Protege datos de usuarios.

### **Mejoras Futuras (Opcional)**

1. **Soft Delete**: En lugar de eliminar permanentemente, marcar como "deleted" y ocultar.
2. **Backup antes de eliminar**: Crear snapshot del tenant antes de eliminación.
3. **Eliminación programada**: Permitir programar eliminación para fecha futura.
4. **Exportar datos antes de eliminar**: Ofrecer descarga de datos del tenant.

---

## ✅ Resultado Final

Con esta implementación:

1. ✅ **Superadmin puede eliminar tenants** desde la UI
2. ✅ **Validación de dependencias** previene eliminaciones problemáticas
3. ✅ **Cascada automática** elimina brands, members, etc.
4. ✅ **Confirmación explícita** previene eliminaciones accidentales
5. ✅ **Auditoría completa** de todas las eliminaciones
6. ✅ **UX clara** con feedback visual y mensajes informativos

¡Feature completo y listo para producción! 🎉
