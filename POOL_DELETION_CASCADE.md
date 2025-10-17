# Pool Deletion - Cascade Delete Implementation

## 🎯 Objetivo

Asegurar que al eliminar una quiniela (Pool) se eliminen **todos los registros relacionados** correctamente, sin dejar datos huérfanos en la base de datos.

---

## ✅ Implementación Mejorada

### Endpoint de Eliminación

**Archivo**: `packages/api/src/routers/pools/index.ts`

```typescript
delete: publicProcedure
  .use(withTenant)
  .input(z.object({ id: z.string().cuid() }))
  .mutation(async ({ ctx, input }) => {
    // 1. Verificar que el pool existe
    const pool = await prisma.pool.findUnique({
      where: { id: input.id },
      include: {
        _count: {
          select: {
            registrations: true,
            predictions: true,
            prizes: true,
            invitations: true,
            scoreAudits: true,
            leaderboards: true
          }
        }
      }
    });

    if (!pool) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pool not found"
      });
    }

    // 2. Verificar ownership (tenant)
    if (pool.tenantId !== ctx.tenant.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to delete this pool"
      });
    }

    // 3. Prevenir eliminación si hay registraciones
    if (pool._count.registrations > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete pool with existing registrations. Deactivate it instead."
      });
    }

    // 4. Log de lo que se va a eliminar
    console.log(`[Pool Delete] Deleting pool ${input.id} with:`, {
      predictions: pool._count.predictions,
      prizes: pool._count.prizes,
      invitations: pool._count.invitations,
      scoreAudits: pool._count.scoreAudits,
      leaderboards: pool._count.leaderboards
    });

    // 5. Eliminar pool (cascade automático)
    await prisma.pool.delete({
      where: { id: input.id }
    });

    console.log(`[Pool Delete] Successfully deleted pool ${input.id}`);

    return { success: true, deletedPoolId: input.id };
  })
```

---

## 🔄 Cascade Delete en Prisma Schema

Las siguientes relaciones tienen `onDelete: Cascade` configurado en el schema:

### Relaciones del Pool

```prisma
model Pool {
  id            String        @id @default(cuid())
  tenantId      String
  brandId       String?
  seasonId      String
  // ... otros campos

  // Relaciones con CASCADE
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  season Season @relation(fields: [seasonId], references: [id], onDelete: Cascade)

  // Relaciones que se eliminan automáticamente
  accessPolicy AccessPolicy?              // ✅ Cascade
  registrations Registration[]            // ⚠️ Bloqueado si > 0
  prizes        Prize[]                   // ✅ Cascade
  predictions   Prediction[]              // ✅ Cascade
  scoreAudits   ScoreAudit[]             // ✅ Cascade
  leaderboards  LeaderboardSnapshot[]     // ✅ Cascade
  invitations   Invitation[]              // ✅ Cascade
  settings      Setting[]                 // ✅ Cascade
  policyDocuments PolicyDocument[]        // ✅ Cascade
  consentRecords  ConsentRecord[]         // ✅ Cascade
  dataRetentionPolicies DataRetentionPolicy[] // ✅ Cascade
}
```

### AccessPolicy

```prisma
model AccessPolicy {
  id       String @id @default(cuid())
  poolId   String @unique
  // ...

  pool Pool @relation(fields: [poolId], references: [id], onDelete: Cascade)
  
  // Estas también se eliminan
  codeBatches CodeBatch[]  // ✅ Cascade
  invitations Invitation[] // ✅ Cascade
}
```

---

## 📋 Registros Eliminados en Cascada

Cuando eliminas un Pool, se eliminan automáticamente:

### 1. **AccessPolicy** (1 registro)
- Política de acceso de la quiniela
- Incluye: tipo de acceso, captcha, verificación email, etc.

### 2. **Prizes** (N registros)
- Todos los premios configurados
- Incluye: rangos, títulos, descripciones, valores

### 3. **Predictions** (N registros)
- Todas las predicciones de usuarios
- ⚠️ Solo si no hay registraciones

### 4. **Invitations** (N registros)
- Invitaciones por email enviadas
- Incluye: tokens, estados, fechas

### 5. **CodeBatches** (N registros)
- Lotes de códigos de invitación
- Incluye: códigos individuales (InviteCode)

### 6. **ScoreAudits** (N registros)
- Auditorías de calificación
- Incluye: snapshots de reglas, metadata

### 7. **LeaderboardSnapshots** (N registros)
- Snapshots de tabla de posiciones
- Incluye: rankings históricos

### 8. **Settings** (N registros)
- Configuraciones específicas del pool
- Incluye: notificaciones, preferencias

### 9. **PolicyDocuments** (N registros)
- Documentos de políticas (T&C, privacidad)
- Incluye: versiones, contenido

### 10. **ConsentRecords** (N registros)
- Registros de consentimiento de usuarios
- Incluye: aceptaciones, fechas

### 11. **DataRetentionPolicies** (N registros)
- Políticas de retención de datos
- Incluye: configuraciones GDPR/compliance

---

## 🛡️ Protecciones Implementadas

### 1. **No eliminar pools con registraciones**

```typescript
if (pool._count.registrations > 0) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Cannot delete pool with existing registrations. Deactivate it instead."
  });
}
```

**Razón**: Si usuarios ya participaron, no se debe eliminar. En su lugar:
- Desactivar el pool (`isActive = false`)
- Mantener datos históricos
- Cumplir con auditoría y compliance

### 2. **Verificar ownership (tenant)**

```typescript
if (pool.tenantId !== ctx.tenant.id) {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You don't have permission to delete this pool"
  });
}
```

**Razón**: Solo el tenant propietario puede eliminar sus pools.

### 3. **Logs detallados**

```typescript
console.log(`[Pool Delete] Deleting pool ${input.id} with:`, {
  predictions: pool._count.predictions,
  prizes: pool._count.prizes,
  invitations: pool._count.invitations,
  scoreAudits: pool._count.scoreAudits,
  leaderboards: pool._count.leaderboards
});
```

**Razón**: Auditoría y debugging.

---

## 🔍 Verificación en Base de Datos

### Antes de Eliminar

```sql
-- Ver todos los registros relacionados
SELECT 
  p.id as pool_id,
  p.name as pool_name,
  COUNT(DISTINCT r.id) as registrations,
  COUNT(DISTINCT pred.id) as predictions,
  COUNT(DISTINCT pr.id) as prizes,
  COUNT(DISTINCT inv.id) as invitations,
  COUNT(DISTINCT sa.id) as score_audits,
  COUNT(DISTINCT lb.id) as leaderboards
FROM "Pool" p
LEFT JOIN "Registration" r ON p.id = r."poolId"
LEFT JOIN "Prediction" pred ON p.id = pred."poolId"
LEFT JOIN "Prize" pr ON p.id = pr."poolId"
LEFT JOIN "Invitation" inv ON p.id = inv."poolId"
LEFT JOIN "ScoreAudit" sa ON p.id = sa."poolId"
LEFT JOIN "LeaderboardSnapshot" lb ON p.id = lb."poolId"
WHERE p.id = 'pool_id_aqui'
GROUP BY p.id, p.name;
```

### Después de Eliminar

```sql
-- Verificar que no quedaron registros huérfanos
SELECT 'AccessPolicy' as table_name, COUNT(*) as orphans
FROM "AccessPolicy" WHERE "poolId" = 'pool_id_eliminado'
UNION ALL
SELECT 'Prize', COUNT(*) FROM "Prize" WHERE "poolId" = 'pool_id_eliminado'
UNION ALL
SELECT 'Prediction', COUNT(*) FROM "Prediction" WHERE "poolId" = 'pool_id_eliminado'
UNION ALL
SELECT 'Invitation', COUNT(*) FROM "Invitation" WHERE "poolId" = 'pool_id_eliminado'
UNION ALL
SELECT 'ScoreAudit', COUNT(*) FROM "ScoreAudit" WHERE "poolId" = 'pool_id_eliminado'
UNION ALL
SELECT 'LeaderboardSnapshot', COUNT(*) FROM "LeaderboardSnapshot" WHERE "poolId" = 'pool_id_eliminado';

-- Debe retornar 0 en todas las filas
```

---

## 🧪 Testing

### Test 1: Eliminar pool sin registraciones

```typescript
// Setup
const pool = await prisma.pool.create({
  data: {
    tenantId: 'test-tenant',
    seasonId: 'test-season',
    name: 'Test Pool',
    slug: 'test-pool'
  }
});

await prisma.prize.create({
  data: { poolId: pool.id, title: 'Prize 1', rankFrom: 1, rankTo: 1 }
});

// Execute
await trpc.pools.delete({ id: pool.id });

// Verify
const deletedPool = await prisma.pool.findUnique({ where: { id: pool.id } });
const orphanPrizes = await prisma.prize.findMany({ where: { poolId: pool.id } });

expect(deletedPool).toBeNull(); // ✅
expect(orphanPrizes).toHaveLength(0); // ✅
```

### Test 2: Prevenir eliminación con registraciones

```typescript
// Setup
const pool = await prisma.pool.create({ /* ... */ });
await prisma.registration.create({
  data: { poolId: pool.id, userId: 'user-1' }
});

// Execute & Verify
await expect(
  trpc.pools.delete({ id: pool.id })
).rejects.toThrow('Cannot delete pool with existing registrations');

// Pool debe seguir existiendo
const stillExists = await prisma.pool.findUnique({ where: { id: pool.id } });
expect(stillExists).not.toBeNull(); // ✅
```

### Test 3: Verificar ownership

```typescript
// Setup
const pool = await prisma.pool.create({
  data: { tenantId: 'tenant-A', /* ... */ }
});

// Execute con tenant-B
await expect(
  trpc.pools.delete.mutate(
    { id: pool.id },
    { ctx: { tenant: { id: 'tenant-B' } } }
  )
).rejects.toThrow("You don't have permission");
```

---

## 📊 Flujo de Eliminación

```
Usuario click "Eliminar" en UI
    ↓
Confirmación (¿Estás seguro?)
    ↓
Frontend: trpc.pools.delete.mutate({ id })
    ↓
Backend: Verificar pool existe
    ↓
Backend: Verificar ownership (tenant)
    ↓
Backend: Verificar registraciones = 0
    ↓
Backend: Log registros a eliminar
    ↓
Backend: prisma.pool.delete()
    ↓
Prisma: Cascade delete automático
    ├─ AccessPolicy (1)
    ├─ Prizes (N)
    ├─ Predictions (N)
    ├─ Invitations (N)
    ├─ ScoreAudits (N)
    ├─ LeaderboardSnapshots (N)
    ├─ Settings (N)
    ├─ PolicyDocuments (N)
    ├─ ConsentRecords (N)
    └─ DataRetentionPolicies (N)
    ↓
Backend: Log éxito
    ↓
Frontend: Invalidar cache (utils.pools.listByTenant.invalidate)
    ↓
Frontend: Toast success
    ↓
UI: Pool desaparece de la lista
```

---

## ⚠️ Consideraciones Importantes

### 1. **Matches NO se eliminan**

Los partidos (Match) pertenecen a la Season, NO al Pool:
```prisma
model Match {
  seasonId String
  season Season @relation(fields: [seasonId], references: [id])
  // NO tiene relación directa con Pool
}
```

**Razón**: Los partidos son datos compartidos entre múltiples pools.

### 2. **Teams NO se eliminan**

Los equipos (Team) son entidades globales:
```prisma
model Team {
  sportId String
  sport Sport @relation(fields: [sportId], references: [id])
  // NO tiene relación con Pool
}
```

**Razón**: Los equipos se reutilizan en múltiples temporadas y pools.

### 3. **Registrations bloquean eliminación**

Si hay usuarios registrados, NO se puede eliminar:
- Usar `isActive = false` en su lugar
- Mantener datos históricos
- Cumplir con compliance (GDPR, auditoría)

---

## 🎯 Resultado Final

### ✅ Lo que SÍ se elimina
- AccessPolicy
- Prizes
- Predictions (si no hay registraciones)
- Invitations
- CodeBatches + InviteCodes
- ScoreAudits
- LeaderboardSnapshots
- Settings
- PolicyDocuments
- ConsentRecords
- DataRetentionPolicies

### ❌ Lo que NO se elimina
- Matches (pertenecen a Season)
- Teams (entidades globales)
- Season (puede tener otros pools)
- Competition (puede tener otras seasons)
- Registrations (bloquean eliminación)

### 📝 Logs Generados
```
[Pool Delete] Deleting pool clxyz123 with: {
  predictions: 0,
  prizes: 3,
  invitations: 15,
  scoreAudits: 0,
  leaderboards: 0
}
[Pool Delete] Successfully deleted pool clxyz123
```

**¡La eliminación en cascada funciona correctamente!** 🎉
