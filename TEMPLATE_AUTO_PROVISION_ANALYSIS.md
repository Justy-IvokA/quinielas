# 🔍 Análisis: Auto-Provisión de Plantillas - Problema y Solución

## 🐛 Problema Reportado

Al asignar un template a un tenant, **NO sincroniza automáticamente los partidos**. El usuario debe hacerlo manualmente en `pool/[poolId]/edit/fixtures`.

## 🔎 Investigación

### Flujo Actual (Debería Funcionar)

```
1. Usuario asigna template a tenant
   ↓
2. Frontend llama: trpc.superadmin.tenants.assignTemplates
   ↓
3. Backend endpoint: tenants.ts → assignTemplates (línea 528)
   ├─ Valida tenant existe
   ├─ Valida templates están PUBLISHED
   └─ Para cada template:
      ├─ Crea TenantTemplateAssignment (status: RUNNING)
      ├─ Llama: provisionTemplateToTenant() ← AQUÍ DEBE SINCRONIZAR
      ├─ Si éxito: status = DONE
      └─ Si error: status = FAILED
   ↓
4. provisionTemplateToTenant() debería:
   ├─ Obtener competencia/temporada de API-Football
   ├─ Crear/actualizar ExternalMap
   ├─ Importar equipos y partidos
   └─ Crear Pool con todos los fixtures
```

### ✅ El Código Está Correcto

El endpoint **SÍ llama a `provisionTemplateToTenant()`** en línea 597:

```typescript
const result = await provisionTemplateToTenant({
  templateId,
  tenantId,
  brandId: brand.id
});
```

### ❌ Posibles Causas del Problema

1. **Error silencioso en `provisionTemplateToTenant()`**
   - La función falla pero el error no se propaga correctamente
   - El error se captura pero no se muestra al usuario

2. **Timeout en la sincronización**
   - Si la API-Football es lenta, la request podría timeout
   - El usuario ve "RUNNING" pero nunca termina

3. **Falta de logging detallado**
   - No hay forma de saber qué falló exactamente
   - Los logs están en el servidor, no en el frontend

4. **Falta de polling en el frontend**
   - El frontend no actualiza el estado después de que termina
   - El usuario ve "RUNNING" indefinidamente

## ✅ Soluciones Propuestas

### Solución 1: Mejorar Manejo de Errores (CRÍTICA)

**Archivo:** `packages/api/src/services/templateProvision.service.ts`

Agregar más logging y validaciones:

```typescript
export async function provisionTemplateToTenant(
  input: ProvisionTemplateInput
): Promise<ProvisionResult> {
  const { templateId, tenantId, brandId } = input;

  console.log(`[TemplateProvision] Starting provision: template=${templateId}, tenant=${tenantId}`);

  try {
    // Fetch template
    const template = await prisma.poolTemplate.findUnique({
      where: { id: templateId },
      include: { sport: true }
    });

    if (!template) {
      console.error(`[TemplateProvision] Template not found: ${templateId}`);
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Template not found"
      });
    }

    console.log(`[TemplateProvision] Template found: ${template.slug}`);

    // ... resto del código con más logging ...

    console.log(`[TemplateProvision] ✅ Provision completed successfully`);
    return result;

  } catch (error) {
    console.error(`[TemplateProvision] ❌ Provision failed:`, {
      templateId,
      tenantId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}
```

### Solución 2: Agregar Endpoint de Status (RECOMENDADO)

**Nuevo endpoint:** `superadmin.tenants.getAssignmentStatus`

```typescript
getAssignmentStatus: publicProcedure
  .use(requireSuperAdmin)
  .input(z.object({ assignmentId: z.string() }))
  .query(async ({ input }) => {
    const assignment = await prisma.tenantTemplateAssignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        template: {
          select: { id: true, slug: true, title: true }
        }
      }
    });

    if (!assignment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Assignment not found"
      });
    }

    return {
      id: assignment.id,
      status: assignment.status,
      result: assignment.result,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      template: assignment.template
    };
  })
```

### Solución 3: Agregar Polling en Frontend (RECOMENDADO)

**Archivo:** `apps/admin/app/[locale]/(authenticated)/superadmin/tenants/[id]/_components/AssignTemplatesCard.tsx`

```typescript
// Agregar polling para actualizar estado
const { data: assignment } = trpc.superadmin.tenants.getAssignmentStatus.useQuery(
  { assignmentId: selectedAssignmentId },
  {
    enabled: !!selectedAssignmentId && selectedAssignment?.status === "RUNNING",
    refetchInterval: 2000, // Actualizar cada 2 segundos
    refetchIntervalInBackground: true
  }
);

// Cuando status cambia a DONE o FAILED, dejar de polling
useEffect(() => {
  if (assignment?.status === "DONE" || assignment?.status === "FAILED") {
    // Dejar de polling
    // Mostrar resultado al usuario
    onRefetch();
  }
}, [assignment?.status]);
```

### Solución 4: Agregar Timeout y Reintentos (AVANZADO)

```typescript
// En assignTemplates endpoint
const MAX_PROVISION_TIME = 5 * 60 * 1000; // 5 minutos
const RETRY_COUNT = 3;

for (const templateId of templateIds) {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
    try {
      console.log(`[TemplateProvision] Attempt ${attempt}/${RETRY_COUNT}`);
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Provision timeout")), MAX_PROVISION_TIME)
      );

      const result = await Promise.race([
        provisionTemplateToTenant({ templateId, tenantId, brandId: brand.id }),
        timeoutPromise
      ]);

      // Éxito
      await prisma.tenantTemplateAssignment.update({
        where: { id: assignment.id },
        data: { status: "DONE", result: result as any }
      });
      
      break; // Salir del loop de reintentos

    } catch (error) {
      lastError = error as Error;
      console.error(`[TemplateProvision] Attempt ${attempt} failed:`, lastError.message);
      
      if (attempt === RETRY_COUNT) {
        // Último intento falló
        await prisma.tenantTemplateAssignment.update({
          where: { id: assignment.id },
          data: {
            status: "FAILED",
            result: { error: lastError.message, attempts: RETRY_COUNT } as any
          }
        });
      }
    }
  }
}
```

### Solución 5: Usar Worker para Provisión Asíncrona (IDEAL)

**Crear nuevo job:** `apps/worker/src/jobs/provision-template.ts`

```typescript
export async function provisionTemplateJob() {
  console.log("[ProvisionTemplate] Starting job...");

  // Buscar assignments en estado RUNNING
  const pendingAssignments = await prisma.tenantTemplateAssignment.findMany({
    where: { status: "RUNNING" },
    include: {
      template: true,
      tenant: true
    }
  });

  if (pendingAssignments.length === 0) {
    console.log("[ProvisionTemplate] No pending assignments");
    return;
  }

  console.log(`[ProvisionTemplate] Found ${pendingAssignments.length} pending assignments`);

  for (const assignment of pendingAssignments) {
    try {
      console.log(`[ProvisionTemplate] Processing assignment: ${assignment.id}`);

      const result = await provisionTemplateToTenant({
        templateId: assignment.templateId,
        tenantId: assignment.tenantId,
        brandId: null
      });

      await prisma.tenantTemplateAssignment.update({
        where: { id: assignment.id },
        data: {
          status: "DONE",
          result: result as any
        }
      });

      console.log(`[ProvisionTemplate] ✅ Assignment completed: ${assignment.id}`);

    } catch (error) {
      console.error(`[ProvisionTemplate] ❌ Assignment failed: ${assignment.id}`, error);

      await prisma.tenantTemplateAssignment.update({
        where: { id: assignment.id },
        data: {
          status: "FAILED",
          result: {
            error: error instanceof Error ? error.message : "Unknown error"
          } as any
        }
      });
    }
  }
}
```

**Agregar a worker:** `apps/worker/src/index.ts`

```typescript
// Schedule provision template job (every 30 seconds)
setInterval(async () => {
  try {
    await provisionTemplateJob();
  } catch (error) {
    console.error("[Worker] Error in provisionTemplateJob:", error);
  }
}, 30 * 1000);
```

## 📊 Comparación de Soluciones

| Solución | Complejidad | Beneficio | Tiempo |
|----------|-------------|----------|--------|
| 1. Mejorar Errores | ⭐ Baja | Debugging | 30 min |
| 2. Endpoint Status | ⭐⭐ Media | Visibilidad | 1 hora |
| 3. Polling Frontend | ⭐⭐ Media | UX | 1 hora |
| 4. Timeout/Reintentos | ⭐⭐⭐ Alta | Confiabilidad | 2 horas |
| 5. Worker Asíncrono | ⭐⭐⭐⭐ Muy Alta | Escalabilidad | 3 horas |

## 🎯 Recomendación

**Implementar en orden:**

1. ✅ **Solución 1** (Mejorar Errores) - INMEDIATO
   - Ayuda a diagnosticar el problema actual
   - Bajo riesgo, alto valor

2. ✅ **Solución 2 + 3** (Status + Polling) - CORTO PLAZO
   - Mejora UX significativamente
   - Usuario ve progreso en tiempo real
   - Fácil de implementar

3. ✅ **Solución 4** (Timeout/Reintentos) - MEDIANO PLAZO
   - Mejora confiabilidad
   - Maneja casos de falla de API

4. ✅ **Solución 5** (Worker) - LARGO PLAZO
   - Mejor escalabilidad
   - No bloquea request HTTP
   - Permite reintentos automáticos

## 🚀 Plan de Implementación Inmediata

### Paso 1: Diagnosticar el Problema (5 min)

```bash
# Ver logs del servidor
# Buscar errores en [TemplateProvision]
# Verificar si provisionTemplateToTenant() está siendo llamado
```

### Paso 2: Implementar Solución 1 (30 min)

Agregar logging detallado en `templateProvision.service.ts`

### Paso 3: Implementar Soluciones 2+3 (1-2 horas)

- Crear endpoint `getAssignmentStatus`
- Agregar polling en frontend
- Mostrar progreso al usuario

### Paso 4: Verificar Funcionamiento

```sql
-- Ver assignments
SELECT id, status, result, createdAt, updatedAt
FROM TenantTemplateAssignment
ORDER BY createdAt DESC
LIMIT 5;

-- Ver pools creados
SELECT id, slug, tenantId, createdAt
FROM Pool
WHERE createdAt > NOW() - INTERVAL '1 hour'
ORDER BY createdAt DESC;
```

## ⚠️ Notas Importantes

1. **No es un bug del código actual**
   - El código está correcto y debería funcionar
   - Probablemente hay un error silencioso que no se propaga

2. **El problema es de visibilidad**
   - El usuario no sabe qué está pasando
   - No hay feedback en tiempo real

3. **La solución ideal es el Worker**
   - Desacopla la provisión de la request HTTP
   - Permite reintentos automáticos
   - Mejor escalabilidad

## 📝 Checklist de Implementación

- [ ] Agregar logging detallado en `templateProvision.service.ts`
- [ ] Crear endpoint `getAssignmentStatus`
- [ ] Implementar polling en frontend
- [ ] Probar con template de prueba
- [ ] Verificar que ExternalMap se crea
- [ ] Verificar que Pool se crea con fixtures
- [ ] Documentar el flujo completo
- [ ] Considerar implementar Worker para provisión asíncrona
