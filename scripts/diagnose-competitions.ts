/**
 * Script de Diagnóstico: Competitions Duplicadas
 * 
 * Identifica Competitions que deberían ser la misma pero están duplicadas
 */

import { prisma } from "../packages/db/src/index.js";

async function diagnoseCompetitions() {
  console.log("\n🔍 Diagnosticando Competitions");
  console.log("================================\n");

  // Obtener todas las competitions con sus external maps
  const competitions = await prisma.competition.findMany({
    include: {
      sport: true,
      seasons: {
        include: {
          pools: {
            select: {
              id: true,
              name: true,
              slug: true,
              tenant: {
                select: { name: true, slug: true }
              }
            }
          }
        }
      }
    }
  });

  console.log(`📊 Total de Competitions: ${competitions.length}\n`);

  for (const comp of competitions) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🏆 Competition: ${comp.name}`);
    console.log(`   ID: ${comp.id}`);
    console.log(`   Slug: ${comp.slug}`);
    console.log(`   Sport: ${comp.sport.name}`);

    // Buscar ExternalMap
    const externalMap = await prisma.externalMap.findFirst({
      where: {
        entityId: comp.id,
        entityType: "COMPETITION"
      },
      include: {
        source: true
      }
    });

    if (externalMap) {
      console.log(`   ✅ ExternalMap: ${externalMap.externalId} (${externalMap.source.name})`);
    } else {
      console.log(`   ❌ ExternalMap: NO EXISTE`);
    }

    console.log(`\n   📅 Seasons (${comp.seasons.length}):`);
    for (const season of comp.seasons) {
      console.log(`      - ${season.name} (${season.year})`);
      console.log(`        Pools: ${season.pools.length}`);
      for (const pool of season.pools) {
        console.log(`          • ${pool.name} (${pool.slug}) - ${pool.tenant.name}`);
      }
    }
  }

  // Buscar ExternalMaps de COMPETITION
  console.log(`\n\n${"=".repeat(60)}`);
  console.log(`📋 ExternalMaps de COMPETITION`);
  console.log(`${"=".repeat(60)}\n`);

  const competitionMaps = await prisma.externalMap.findMany({
    where: {
      entityType: "COMPETITION"
    },
    include: {
      source: true
    }
  });

  console.log(`Total: ${competitionMaps.length}\n`);

  for (const map of competitionMaps) {
    const comp = competitions.find(c => c.id === map.entityId);
    console.log(`External ID: ${map.externalId}`);
    console.log(`  → Competition: ${comp?.name || "UNKNOWN"}`);
    console.log(`  → Competition ID: ${map.entityId}`);
    console.log(`  → Source: ${map.source.name}\n`);
  }

  // Identificar duplicados por externalId
  const externalIdGroups = new Map<string, typeof competitionMaps>();
  for (const map of competitionMaps) {
    const key = map.externalId;
    if (!externalIdGroups.has(key)) {
      externalIdGroups.set(key, []);
    }
    externalIdGroups.get(key)!.push(map);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`⚠️  ANÁLISIS DE DUPLICADOS`);
  console.log(`${"=".repeat(60)}\n`);

  let hasDuplicates = false;
  for (const [externalId, maps] of externalIdGroups) {
    if (maps.length > 1) {
      hasDuplicates = true;
      console.log(`❌ External ID ${externalId} tiene ${maps.length} Competitions:`);
      for (const map of maps) {
        const comp = competitions.find(c => c.id === map.entityId);
        console.log(`   - ${comp?.name} (${comp?.slug})`);
        console.log(`     ID: ${map.entityId}`);
        console.log(`     Pools: ${comp?.seasons.flatMap(s => s.pools).length || 0}`);
      }
      console.log();
    }
  }

  if (!hasDuplicates) {
    console.log(`✅ No se encontraron duplicados\n`);
  }

  // Identificar Competitions sin ExternalMap
  console.log(`\n${"=".repeat(60)}`);
  console.log(`⚠️  COMPETITIONS SIN EXTERNALMAP`);
  console.log(`${"=".repeat(60)}\n`);

  const competitionsWithoutMap = competitions.filter(comp => {
    return !competitionMaps.some(map => map.entityId === comp.id);
  });

  if (competitionsWithoutMap.length === 0) {
    console.log(`✅ Todas las Competitions tienen ExternalMap\n`);
  } else {
    console.log(`❌ ${competitionsWithoutMap.length} Competitions sin ExternalMap:\n`);
    for (const comp of competitionsWithoutMap) {
      console.log(`   - ${comp.name} (${comp.slug})`);
      console.log(`     ID: ${comp.id}`);
      console.log(`     Seasons: ${comp.seasons.length}`);
      console.log(`     Pools: ${comp.seasons.flatMap(s => s.pools).length}`);
      console.log();
    }
  }

  await prisma.$disconnect();
}

diagnoseCompetitions()
  .then(() => {
    console.log("✅ Diagnóstico completado\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
