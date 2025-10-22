# 🔧 Pool Delete con Flag Force para Testing

## 📋 Resumen

Para facilitar el testing y desarrollo, se ha agregado un parámetro `force` a la mutación `pools.delete` que permite eliminar pools con registros existentes.

---

## 🎯 Problema Original

El router de pools tenía una validación que impedía eliminar pools con registros:

```typescript
// ANTES:
if (pool._count.registrations > 0) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Cannot delete pool with existing registrations. Deactivate it instead."
  });
}
```

**Impacto:**
- ❌ No se podía eliminar una quiniela para re-probar el flujo de provisioning
- ❌ Necesitabas eliminar manualmente todos los registros primero
- ❌ Dificultaba el testing de bugs como el de ExternalMap

---

## ✅ Solución Implementada

### 1. Backend: Agregar Parámetro `force`

**Archivo:** `packages/api/src/routers/pools/index.ts`

```typescript
// DESPUÉS:
delete: publicProcedure
  .use(withTenant)
  .input(z.object({ 
    id: z.string().cuid(),
    force: z.boolean().optional().default(false) // ✅ Nuevo parámetro
  }))
  .mutation(async ({ ctx, input }) => {
    // ... validaciones ...

    // ✅ Solo valida si force=false
    if (pool._count.registrations > 0 && !input.force) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete pool with existing registrations. Deactivate it instead, or use force flag for testing."
      });
    }

    // Logging mejorado
    console.log(`[Pool Delete] Deleting pool ${input.id} with:`, {
      registrations: pool._count.registrations,
      predictions: pool._count.predictions,
      prizes: pool._count.prizes,
      invitations: pool._count.invitations,
      scoreAudits: pool._count.scoreAudits,
      leaderboards: pool._count.leaderboards,
      force: input.force // ✅ Log del flag
    });

    // Delete con cascade
    await prisma.pool.delete({
      where: { id: input.id }
    });

    return { success: true, deletedPoolId: input.id };
  })
```

### 2. Frontend: Usar `force=true` en Admin

**Archivo:** `apps/admin/app/[locale]/(authenticated)/pools/components/pools-list.tsx`

```typescript
const handleDelete = (id: string, name: string) => {
  const confirmMessage = t("actions.deleteConfirm", { name }) + 
    "\n\n⚠️ ADVERTENCIA: Esto eliminará TODOS los registros, predicciones y datos relacionados.";
  
  if (confirm(confirmMessage)) {
    deleteMutation.mutate({ id, force: true }); // ✅ force=true para testing
  }
};
```

---

## 🗑️ Relaciones Eliminadas en Cascada

Cuando se elimina un Pool con `force=true`, Prisma elimina automáticamente (gracias a `onDelete: Cascade`):

### Eliminación Directa
1. ✅ **AccessPolicy** - Política de acceso
2. ✅ **Registration** - Registros de usuarios
3. ✅ **Prediction** - Predicciones de usuarios
4. ✅ **Prize** - Premios configurados
5. ✅ **Invitation** - Invitaciones por email
6. ✅ **ScoreAudit** - Auditorías de scoring
7. ✅ **LeaderboardSnapshot** - Snapshots de leaderboard
8. ✅ **Setting** - Configuraciones específicas
9. ✅ **PolicyDocument** - Documentos de políticas
10. ✅ **ConsentRecord** - Registros de consentimiento
11. ✅ **DataRetentionPolicy** - Políticas de retención

### Verificación en Schema

```prisma
model Registration {
  // ...
  pool Pool @relation(fields: [poolId], references: [id], onDelete: Cascade)
  // ✅ onDelete: Cascade garantiza eliminación automática
}

model Prediction {
  // ...
  pool Pool @relation(fields: [poolId], references: [id], onDelete: Cascade)
  // ✅ onDelete: Cascade garantiza eliminación automática
}

// ... todas las relaciones tienen onDelete: Cascade
```

---

## 🧪 Uso para Testing

### Escenario: Probar Bug de ExternalMap

```bash
# 1. Asignar template "Liga MX - Jornada 15"
# 2. Registrarse en la quiniela
# 3. Verificar que el bug existe (estadísticas no funcionan)
# 4. Aplicar fix en templateProvision.service.ts
# 5. Eliminar quiniela desde admin (con force=true)
# 6. Re-asignar template "Liga MX - Jornada 15"
# 7. Registrarse nuevamente
# 8. ✅ Verificar que estadísticas ahora funcionan
```

### Flujo de Eliminación

```
1. Usuario hace clic en "Eliminar" en admin
2. Aparece confirmación con advertencia
3. Usuario confirma
4. Frontend → deleteMutation.mutate({ id, force: true })
5. Backend → Valida ownership
6. Backend → Verifica force=true
7. Backend → Ejecuta prisma.pool.delete()
8. Prisma → Elimina Pool + todas las relaciones en cascada
9. Backend → Retorna success
10. Frontend → Invalida cache y muestra toast
11. ✅ Pool eliminado completamente
```

---

## ⚠️ Advertencias de Seguridad

### Para Desarrollo

- ✅ **Usar force=true** en desarrollo/testing
- ✅ **Advertir al usuario** con mensaje claro
- ✅ **Logging completo** de lo que se elimina

### Para Producción

**IMPORTANTE:** En producción, considera:

1. **Opción 1: Deshabilitar force** completamente
   ```typescript
   // En producción, siempre force=false
   if (process.env.NODE_ENV === "production" && input.force) {
     throw new TRPCError({
       code: "FORBIDDEN",
       message: "Force delete is not allowed in production"
     });
   }
   ```

2. **Opción 2: Requerir rol SUPERADMIN**
   ```typescript
   // Solo superadmins pueden usar force
   if (input.force && ctx.session?.user?.highestRole !== "SUPERADMIN") {
     throw new TRPCError({
       code: "FORBIDDEN",
       message: "Only superadmins can force delete pools"
     });
   }
   ```

3. **Opción 3: Soft Delete**
   ```typescript
   // En lugar de eliminar, marcar como deleted
   await prisma.pool.update({
     where: { id: input.id },
     data: { 
       isActive: false,
       deletedAt: new Date(),
       deletedBy: ctx.session?.user?.id
     }
   });
   ```

---

## 📊 Logging y Auditoría

### Logs Generados

```typescript
console.log(`[Pool Delete] Deleting pool ${input.id} with:`, {
  registrations: 5,      // Número de usuarios registrados
  predictions: 45,       // Número de predicciones
  prizes: 3,            // Número de premios
  invitations: 10,      // Número de invitaciones
  scoreAudits: 2,       // Número de auditorías
  leaderboards: 1,      // Número de snapshots
  force: true           // ✅ Flag usado
});

console.log(`[Pool Delete] Successfully deleted pool ${input.id}`);
```

### Recomendación: Agregar Audit Log

```typescript
// Después de eliminar, crear audit log
await prisma.auditLog.create({
  data: {
    tenantId: pool.tenantId,
    actorId: ctx.session?.user?.id,
    action: "POOL_DELETE_FORCE",
    resourceType: "POOL",
    resourceId: input.id,
    metadata: {
      poolName: pool.name,
      registrationsDeleted: pool._count.registrations,
      predictionsDeleted: pool._count.predictions,
      force: input.force
    }
  }
});
```

---

## 🔄 Alternativas Consideradas

### Opción 1: Endpoint Separado (Rechazada)
```typescript
// Crear endpoint específico para force delete
forceDelete: publicProcedure...
// ❌ Rechazada: Duplica código
```

### Opción 2: Eliminar Registros Manualmente (Rechazada)
```typescript
// Eliminar registros uno por uno antes del pool
await prisma.registration.deleteMany({ where: { poolId } });
await prisma.prediction.deleteMany({ where: { poolId } });
// ❌ Rechazada: Tedioso y propenso a errores
```

### Opción 3: Flag Force (Seleccionada) ✅
```typescript
// Agregar parámetro opcional force
input: z.object({ 
  id: z.string().cuid(),
  force: z.boolean().optional().default(false)
})
// ✅ Seleccionada: Simple, flexible, seguro
```

---

## 📝 Checklist de Verificación

Para verificar que la eliminación funciona correctamente:

- [x] Backend: Parámetro `force` agregado al schema
- [x] Backend: Validación condicional basada en `force`
- [x] Backend: Logging mejorado con flag
- [x] Frontend: Mensaje de advertencia al usuario
- [x] Frontend: Pasar `force=true` en la mutación
- [ ] Testing: Eliminar pool con registros
- [ ] Testing: Verificar que cascade funciona
- [ ] Testing: Verificar que no quedan registros huérfanos
- [ ] Producción: Decidir estrategia de seguridad

---

## 🎯 Próximos Pasos

### Inmediato
1. ✅ Aplicar cambios en código
2. [ ] Reiniciar servidor de desarrollo
3. [ ] Probar eliminación de quiniela "Jornada 15"
4. [ ] Verificar que se eliminan todos los registros
5. [ ] Re-asignar template y verificar fix de ExternalMap

### Corto Plazo
- [ ] Agregar audit log para force deletes
- [ ] Considerar estrategia para producción
- [ ] Documentar en guía de admin

### Largo Plazo
- [ ] Implementar soft delete para producción
- [ ] Agregar confirmación de dos pasos para force delete
- [ ] Crear herramienta de backup antes de eliminar

---

## 📚 Referencias

- **Archivos modificados:**
  - `packages/api/src/routers/pools/index.ts` (líneas 237-315)
  - `apps/admin/app/[locale]/(authenticated)/pools/components/pools-list.tsx` (líneas 40-47)

- **Schema Prisma:** `packages/db/prisma/schema.prisma`
  - `model Pool` (línea 286)
  - `model Registration` (línea 348)
  - Todas las relaciones con `onDelete: Cascade`

- **Documentos relacionados:**
  - `BUG_EXTERNALMAP_COMPETITION_RESUELTO.md`
  - `VERIFICACION_FLUJO_AUTENTICACION.md`

---

**Fecha:** 21 de Octubre, 2025  
**Implementado por:** Cascade AI  
**Propósito:** Facilitar testing y desarrollo  
**Estado:** ✅ Implementado
