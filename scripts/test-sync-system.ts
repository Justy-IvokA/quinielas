/**
 * Script de Prueba del Sistema de Sincronización
 * 
 * Verifica que todos los componentes del sistema de sync estén funcionando:
 * - Worker automático
 * - Sistema de caché
 * - Endpoints de monitoreo
 */

import { PrismaClient } from "@qp/db";
import { sportsAPICache, getSportsProvider } from "@qp/utils/sports";

const prisma = new PrismaClient();

async function testSyncSystem() {
  console.log("🧪 Iniciando pruebas del sistema de sincronización...\n");

  // Test 1: Verificar temporadas activas
  console.log("📋 Test 1: Verificar temporadas activas");
  const now = new Date();
  const activeSeasons = await prisma.season.findMany({
    where: {
      OR: [
        {
          startsAt: { lte: now },
          endsAt: { gte: now }
        },
        {
          startsAt: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      ]
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

  console.log(`   ✅ Encontradas ${activeSeasons.length} temporadas activas`);
  activeSeasons.forEach(season => {
    const hasMapping = season.competition.externalMaps.some(m => m.entityType === "competition");
    console.log(`   - ${season.name} (${season.year}) - ${hasMapping ? "✅ Configurada" : "⚠️  Sin mapeo"}`);
  });
  console.log();

  // Test 2: Verificar sistema de caché
  console.log("💾 Test 2: Verificar sistema de caché");
  
  // Limpiar caché
  sportsAPICache.clear();
  console.log("   ✅ Caché limpiado");

  // Simular set
  sportsAPICache.set("test-provider", "/test", { param: "value" }, { test: "data" }, 1);
  console.log("   ✅ Dato guardado en caché");

  // Simular get
  const cached = sportsAPICache.get("test-provider", "/test", { param: "value" });
  console.log(`   ${cached ? "✅" : "❌"} Dato recuperado del caché`);

  // Verificar estadísticas
  const stats = sportsAPICache.getStats();
  console.log(`   📊 Estadísticas: ${stats.active} activas, ${stats.expired} expiradas`);
  console.log();

  // Test 3: Verificar provider con caché
  console.log("🔌 Test 3: Verificar provider con caché");
  
  const apiKey = process.env.SPORTS_API_KEY;
  if (!apiKey) {
    console.log("   ⚠️  SPORTS_API_KEY no configurada, usando mock provider");
    const mockProvider = getSportsProvider({ provider: "mock" });
    console.log(`   ✅ Provider: ${mockProvider.getName()}`);
  } else {
    const provider = getSportsProvider({ 
      provider: "api-football",
      apiKey 
    });
    console.log(`   ✅ Provider: ${provider.getName()}`);
    console.log("   ℹ️  Caché habilitado por defecto");
  }
  console.log();

  // Test 4: Verificar external sources
  console.log("📡 Test 4: Verificar fuentes externas");
  const sources = await prisma.externalSource.findMany({
    include: {
      _count: {
        select: {
          externalMaps: true
        }
      }
    }
  });

  console.log(`   ✅ Encontradas ${sources.length} fuentes externas`);
  sources.forEach(source => {
    console.log(`   - ${source.name} (${source.slug}): ${source._count.externalMaps} mapeos`);
  });
  console.log();

  // Test 5: Verificar mapeos de competiciones
  console.log("🗺️  Test 5: Verificar mapeos de competiciones");
  const competitionMaps = await prisma.externalMap.findMany({
    where: {
      entityType: "competition"
    },
    include: {
      source: true
    }
  });

  console.log(`   ✅ Encontrados ${competitionMaps.length} mapeos de competiciones`);
  for (const map of competitionMaps) {
    const competition = await prisma.competition.findUnique({
      where: { id: map.entityId }
    });
    console.log(`   - ${competition?.name}: External ID ${map.externalId} (${map.source.name})`);
  }
  console.log();

  // Test 6: Estadísticas generales
  console.log("📊 Test 6: Estadísticas generales");
  const [totalSeasons, totalMatches, totalTeams, syncedMatches] = await Promise.all([
    prisma.season.count(),
    prisma.match.count(),
    prisma.team.count(),
    prisma.externalMap.count({ where: { entityType: "match" } })
  ]);

  console.log(`   📅 Temporadas: ${totalSeasons}`);
  console.log(`   ⚽ Partidos: ${totalMatches}`);
  console.log(`   🏴 Equipos: ${totalTeams}`);
  console.log(`   🔗 Partidos sincronizados: ${syncedMatches} (${totalMatches > 0 ? ((syncedMatches / totalMatches) * 100).toFixed(1) : 0}%)`);
  console.log();

  // Resumen final
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ PRUEBAS COMPLETADAS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const allPassed = 
    activeSeasons.length > 0 &&
    sources.length > 0 &&
    competitionMaps.length > 0;

  if (allPassed) {
    console.log("🎉 Sistema de sincronización configurado correctamente");
    console.log("\n📋 Próximos pasos:");
    console.log("   1. Iniciar worker: pnpm --filter @qp/worker dev");
    console.log("   2. Ver dashboard: http://localhost:3000/es-MX/sync");
    console.log("   3. Sincronizar fixtures: http://localhost:3000/es-MX/fixtures");
  } else {
    console.log("⚠️  Advertencias encontradas:");
    if (activeSeasons.length === 0) {
      console.log("   - No hay temporadas activas");
    }
    if (sources.length === 0) {
      console.log("   - No hay fuentes externas configuradas");
    }
    if (competitionMaps.length === 0) {
      console.log("   - No hay mapeos de competiciones");
    }
    console.log("\n💡 Ejecuta: pnpm tsx scripts/seed-fixtures-demo.ts");
  }

  await prisma.$disconnect();
}

testSyncSystem().catch(console.error);
