# 📖 Ejemplos de Uso: Sistema de Sincronización

## 🎯 Casos de Uso Comunes

### 1. Agregar una Nueva Temporada

```typescript
// 1. Crear la temporada en la base de datos
const season = await prisma.season.create({
  data: {
    name: "Premier League 2024/25",
    year: 2024,
    competitionId: "...", // ID de la competición
    startsAt: new Date("2024-08-17"),
    endsAt: new Date("2025-05-25")
  }
});

// 2. Crear el mapeo externo de la competición (si no existe)
await prisma.externalMap.create({
  data: {
    sourceId: "...", // ID de API-Football
    entityType: "competition",
    entityId: competition.id,
    externalId: "39" // Premier League ID en API-Football
  }
});

// 3. El worker automáticamente sincronizará esta temporada
// porque está dentro de los próximos 30 días
```

### 2. Sincronización Manual con Caché Forzado

```typescript
// En el admin panel
import { trpc } from "@admin/trpc";

function MyComponent() {
  const syncMutation = trpc.sync.triggerSync.useMutation({
    onSuccess: (data) => {
      console.log(`✅ ${data.message}`);
    }
  });

  const handleForceSync = () => {
    syncMutation.mutate({
      seasonId: "season-id-here",
      forceRefresh: true // Limpia caché antes de sincronizar
    });
  };

  return (
    <button onClick={handleForceSync}>
      Forzar Sincronización
    </button>
  );
}
```

### 3. Monitorear Estado del Caché

```typescript
import { sportsAPICache } from "@qp/utils/sports";

// Obtener estadísticas
const stats = sportsAPICache.getStats();
console.log(`
  Total: ${stats.total}
  Activas: ${stats.active}
  Expiradas: ${stats.expired}
  Hit Rate: ${(stats.active / stats.total * 100).toFixed(1)}%
`);

// Limpiar entradas expiradas manualmente
sportsAPICache.cleanup();

// Limpiar todo
sportsAPICache.clear();

// Limpiar solo un provider
sportsAPICache.invalidateProvider("api-football");
```

### 4. Configurar Múltiples Providers

```typescript
// En el seed o configuración inicial
const providers = [
  {
    name: "API-Football",
    slug: "api-football",
    competitions: [
      { name: "FIFA World Cup", externalId: "1" },
      { name: "Premier League", externalId: "39" },
      { name: "La Liga", externalId: "140" }
    ]
  },
  {
    name: "SportMonks",
    slug: "sportmonks",
    competitions: [
      { name: "Champions League", externalId: "2" }
    ]
  }
];

for (const provider of providers) {
  const source = await prisma.externalSource.upsert({
    where: { slug: provider.slug },
    create: {
      name: provider.name,
      slug: provider.slug
    },
    update: {}
  });

  for (const comp of provider.competitions) {
    const competition = await prisma.competition.findFirst({
      where: { name: comp.name }
    });

    if (competition) {
      await prisma.externalMap.upsert({
        where: {
          sourceId_entityType_externalId: {
            sourceId: source.id,
            entityType: "competition",
            externalId: comp.externalId
          }
        },
        create: {
          sourceId: source.id,
          entityType: "competition",
          entityId: competition.id,
          externalId: comp.externalId
        },
        update: {}
      });
    }
  }
}
```

### 5. Worker Job Personalizado

```typescript
// apps/worker/src/jobs/custom-sync.ts
import { prisma } from "@qp/db";
import { syncFixturesJob } from "./sync-fixtures";

export async function customSyncJob() {
  console.log("[CustomSync] Starting...");

  // Sincronizar solo temporadas de un deporte específico
  const footballSeasons = await prisma.season.findMany({
    where: {
      competition: {
        sport: {
          slug: "football"
        }
      },
      startsAt: { lte: new Date() },
      endsAt: { gte: new Date() }
    },
    include: {
      competition: {
        include: {
          externalMaps: {
            include: {
              source: true
            }
          }
        }
      }
    }
  });

  for (const season of footballSeasons) {
    const competitionMap = season.competition.externalMaps.find(
      map => map.entityType === "competition"
    );

    if (competitionMap) {
      await syncFixturesJob({
        seasonId: season.id,
        competitionExternalId: competitionMap.externalId,
        year: season.year,
        providerName: competitionMap.source.slug
      });
    }
  }

  console.log("[CustomSync] Completed");
}
```

### 6. Webhook Handler (Futuro)

```typescript
// apps/admin/app/api/webhooks/api-football/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@qp/db";
import { sportsAPICache } from "@qp/utils/sports";

export async function POST(req: NextRequest) {
  const payload = await req.json();

  // Verificar firma del webhook
  const signature = req.headers.get("x-api-football-signature");
  if (!verifySignature(signature, payload)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Procesar evento
  const { event, data } = payload;

  switch (event) {
    case "fixture.updated":
      // Invalidar caché del partido
      sportsAPICache.invalidate(
        "api-football",
        "/fixtures",
        { id: data.fixtureId }
      );

      // Actualizar partido en DB
      await updateFixture(data);
      break;

    case "fixture.finished":
      // Disparar scoring
      await triggerScoring(data.fixtureId);
      break;
  }

  return NextResponse.json({ success: true });
}
```

### 7. Dashboard Personalizado

```typescript
// apps/admin/app/[locale]/my-dashboard/page.tsx
"use client";

import { trpc } from "@admin/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@qp/ui";

export default function MyDashboard() {
  const { data: stats } = trpc.sync.getStats.useQuery();
  const { data: seasons } = trpc.sync.getActiveSeasons.useQuery();

  return (
    <div className="grid gap-4">
      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Temporadas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {stats?.seasons.active || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Partidos Sincronizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {stats?.matches.synced || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              {stats?.matches.percentage.toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Caché Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {stats?.cache.active && stats?.cache.total
                ? ((stats.cache.active / stats.cache.total) * 100).toFixed(1)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Temporadas */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Sincronizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {seasons?.map(season => (
              <li key={season.id} className="flex items-center justify-between">
                <span>{season.name}</span>
                <span className="text-sm text-muted-foreground">
                  {season.matchCount} partidos
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 8. Notificaciones de Sincronización

```typescript
// apps/worker/src/jobs/auto-sync-fixtures.ts
import { sendEmail } from "@qp/utils/email";

export async function autoSyncFixturesJob() {
  const results = [];
  
  // ... código de sincronización ...

  // Enviar notificación si hay errores
  const errors = results.filter(r => !r.success);
  
  if (errors.length > 0) {
    await sendEmail({
      to: "admin@example.com",
      subject: "⚠️ Errores en Sincronización de Fixtures",
      html: `
        <h2>Se encontraron ${errors.length} errores</h2>
        <ul>
          ${errors.map(e => `
            <li>
              <strong>${e.seasonName}</strong>: ${e.error}
            </li>
          `).join('')}
        </ul>
      `
    });
  }

  // Enviar resumen diario
  if (shouldSendDailySummary()) {
    const summary = results.map(r => ({
      season: r.seasonName,
      synced: r.syncedCount,
      status: r.success ? "✅" : "❌"
    }));

    await sendEmail({
      to: "admin@example.com",
      subject: "📊 Resumen Diario de Sincronización",
      html: generateSummaryHTML(summary)
    });
  }

  return { results };
}
```

### 9. Métricas con Prometheus (Futuro)

```typescript
// packages/utils/src/metrics.ts
import { Counter, Histogram, Gauge } from "prom-client";

export const syncCounter = new Counter({
  name: "sync_fixtures_total",
  help: "Total de sincronizaciones de fixtures",
  labelNames: ["provider", "status"]
});

export const syncDuration = new Histogram({
  name: "sync_fixtures_duration_seconds",
  help: "Duración de sincronizaciones",
  labelNames: ["provider", "season"]
});

export const cacheHitRate = new Gauge({
  name: "cache_hit_rate",
  help: "Porcentaje de cache hits"
});

// En el job de sync
export async function syncWithMetrics(params) {
  const start = Date.now();
  
  try {
    const result = await syncFixturesJob(params);
    
    syncCounter.inc({ provider: params.providerName, status: "success" });
    syncDuration.observe(
      { provider: params.providerName, season: params.seasonId },
      (Date.now() - start) / 1000
    );
    
    return result;
  } catch (error) {
    syncCounter.inc({ provider: params.providerName, status: "error" });
    throw error;
  }
}
```

### 10. Testing del Sistema

```typescript
// packages/api/src/routers/sync/sync.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { sportsAPICache } from "@qp/utils/sports";

describe("Sync System", () => {
  beforeEach(() => {
    sportsAPICache.clear();
  });

  it("should cache API responses", () => {
    const testData = { test: "data" };
    
    sportsAPICache.set("test", "/endpoint", { param: "1" }, testData, 1);
    const cached = sportsAPICache.get("test", "/endpoint", { param: "1" });
    
    expect(cached).toEqual(testData);
  });

  it("should invalidate expired cache", async () => {
    sportsAPICache.set("test", "/endpoint", { param: "1" }, { test: "data" }, 0.01); // 0.6 segundos
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const cached = sportsAPICache.get("test", "/endpoint", { param: "1" });
    expect(cached).toBeNull();
  });

  it("should clear cache by provider", () => {
    sportsAPICache.set("provider1", "/endpoint", {}, { data: 1 }, 1);
    sportsAPICache.set("provider2", "/endpoint", {}, { data: 2 }, 1);
    
    sportsAPICache.invalidateProvider("provider1");
    
    expect(sportsAPICache.get("provider1", "/endpoint", {})).toBeNull();
    expect(sportsAPICache.get("provider2", "/endpoint", {})).not.toBeNull();
  });
});
```

---

## 🎓 Mejores Prácticas

### 1. Manejo de Errores

```typescript
try {
  await syncFixturesJob(params);
} catch (error) {
  if (error.message.includes("rate limit")) {
    // Esperar y reintentar
    await sleep(60000);
    await syncFixturesJob(params);
  } else if (error.message.includes("not found")) {
    // Log y continuar
    console.warn(`Season not found: ${params.seasonId}`);
  } else {
    // Re-throw errores desconocidos
    throw error;
  }
}
```

### 2. Optimización de Caché

```typescript
// TTL dinámico basado en el tipo de dato
function getCacheTTL(dataType: string): number {
  switch (dataType) {
    case "teams":
      return 24 * 60; // 24 horas (datos estáticos)
    case "fixtures":
      return 60; // 1 hora (datos dinámicos)
    case "live-scores":
      return 1; // 1 minuto (datos en tiempo real)
    default:
      return 60;
  }
}
```

### 3. Logging Estructurado

```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: "info",
  service: "sync-worker",
  action: "sync_fixtures",
  seasonId: params.seasonId,
  provider: params.providerName,
  result: {
    synced: result.syncedCount,
    errors: result.errorCount
  }
}));
```

---

**Última actualización:** 2025-10-09
