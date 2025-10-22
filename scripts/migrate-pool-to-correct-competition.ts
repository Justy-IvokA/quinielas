/**
 * Script de Migración: Mover Pool a Competition Correcta
 * 
 * Migra un pool de una Competition duplicada a la Competition correcta
 * que tiene el ExternalMap configurado.
 * 
 * Uso:
 *   pnpm tsx scripts/migrate-pool-to-correct-competition.ts <poolId> <targetCompetitionId>
 * 
 * Ejemplo:
 *   pnpm tsx scripts/migrate-pool-to-correct-competition.ts cmgzvjf7h004kuvak15gbdeqx cmh0xqfzm0007uvqcxasv4ndn
 */

import { prisma } from "../packages/db/src/index.js";

async function migratePoolToCorrectCompetition(poolId: string, targetCompetitionId: string) {
  console.log("\n🔄 Migrando Pool a Competition Correcta");
  console.log("=========================================\n");

  try {
    // 1. Obtener Pool actual
    console.log("1️⃣  Obteniendo Pool actual...");
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      include: {
        season: {
          include: {
            competition: true
          }
        },
        tenant: {
          select: { name: true, slug: true }
        }
      }
    });

    if (!pool) {
      console.error(`❌ Pool '${poolId}' no encontrado`);
      process.exit(1);
    }

    console.log(`✅ Pool encontrado: ${pool.name}`);
    console.log(`   Tenant: ${pool.tenant.name}`);
    console.log(`   Season actual: ${pool.season.name}`);
    console.log(`   Competition actual: ${pool.season.competition.name} (${pool.season.competition.id})\n`);

    // 2. Obtener Competition objetivo
    console.log("2️⃣  Verificando Competition objetivo...");
    const targetCompetition = await prisma.competition.findUnique({
      where: { id: targetCompetitionId },
      include: {
        sport: true
      }
    });

    if (!targetCompetition) {
      console.error(`❌ Competition objetivo '${targetCompetitionId}' no encontrada`);
      process.exit(1);
    }

    console.log(`✅ Competition objetivo: ${targetCompetition.name}`);
    console.log(`   ID: ${targetCompetition.id}`);
    console.log(`   Slug: ${targetCompetition.slug}`);
    console.log(`   Sport: ${targetCompetition.sport.name}\n`);

    // 3. Verificar ExternalMap de Competition objetivo
    console.log("3️⃣  Verificando ExternalMap de Competition objetivo...");
    const targetExternalMap = await prisma.externalMap.findFirst({
      where: {
        entityId: targetCompetition.id,
        entityType: "COMPETITION"
      }
    });

    if (!targetExternalMap) {
      console.error(`❌ Competition objetivo NO tiene ExternalMap`);
      console.error(`   No se puede migrar a una Competition sin ExternalMap`);
      process.exit(1);
    }

    console.log(`✅ ExternalMap encontrado: ${targetExternalMap.externalId}\n`);

    // 4. Buscar o crear Season en la Competition objetivo
    console.log("4️⃣  Buscando Season en Competition objetivo...");
    let targetSeason = await prisma.season.findFirst({
      where: {
        competitionId: targetCompetition.id,
        year: pool.season.year
      }
    });

    if (!targetSeason) {
      console.log(`⚠️  Season no existe, creando nueva...`);
      targetSeason = await prisma.season.create({
        data: {
          competitionId: targetCompetition.id,
          name: `${targetCompetition.name} ${pool.season.year}`,
          year: pool.season.year
        }
      });
      console.log(`✅ Season creada: ${targetSeason.name} (${targetSeason.id})`);
    } else {
      console.log(`✅ Season encontrada: ${targetSeason.name} (${targetSeason.id})`);
    }
    console.log();

    // 5. Migrar matches a la nueva season
    console.log("5️⃣  Migrando matches...");
    const matchesCount = await prisma.match.count({
      where: { seasonId: pool.season.id }
    });

    if (matchesCount > 0) {
      console.log(`   Encontrados ${matchesCount} matches para migrar`);
      
      // Actualizar matches
      const updateResult = await prisma.match.updateMany({
        where: { seasonId: pool.season.id },
        data: { seasonId: targetSeason.id }
      });

      console.log(`   ✅ ${updateResult.count} matches migrados`);
    } else {
      console.log(`   ℹ️  No hay matches para migrar`);
    }
    console.log();

    // 6. Migrar TeamSeasons
    console.log("6️⃣  Migrando teams...");
    const teamSeasonsCount = await prisma.teamSeason.count({
      where: { seasonId: pool.season.id }
    });

    if (teamSeasonsCount > 0) {
      console.log(`   Encontrados ${teamSeasonsCount} teams para migrar`);
      
      // Obtener teams actuales
      const currentTeamSeasons = await prisma.teamSeason.findMany({
        where: { seasonId: pool.season.id }
      });

      // Migrar cada team (usar upsert para evitar duplicados)
      for (const ts of currentTeamSeasons) {
        await prisma.teamSeason.upsert({
          where: {
            teamId_seasonId: {
              teamId: ts.teamId,
              seasonId: targetSeason.id
            }
          },
          create: {
            teamId: ts.teamId,
            seasonId: targetSeason.id
          },
          update: {}
        });
      }

      // Eliminar TeamSeasons antiguos
      await prisma.teamSeason.deleteMany({
        where: { seasonId: pool.season.id }
      });

      console.log(`   ✅ ${teamSeasonsCount} teams migrados`);
    } else {
      console.log(`   ℹ️  No hay teams para migrar`);
    }
    console.log();

    // 7. Actualizar Pool para usar la nueva Season
    console.log("7️⃣  Actualizando Pool...");
    await prisma.pool.update({
      where: { id: pool.id },
      data: {
        seasonId: targetSeason.id
      }
    });
    console.log(`   ✅ Pool actualizado para usar Season: ${targetSeason.name}\n`);

    // 8. Limpiar Season antigua si está vacía
    console.log("8️⃣  Limpiando Season antigua...");
    const oldSeasonPools = await prisma.pool.count({
      where: { seasonId: pool.season.id }
    });

    if (oldSeasonPools === 0) {
      console.log(`   Season antigua no tiene más pools, eliminando...`);
      await prisma.season.delete({
        where: { id: pool.season.id }
      });
      console.log(`   ✅ Season antigua eliminada`);
    } else {
      console.log(`   ℹ️  Season antigua aún tiene ${oldSeasonPools} pool(s), no se elimina`);
    }
    console.log();

    // 9. Verificar resultado
    console.log("9️⃣  Verificando migración...");
    const updatedPool = await prisma.pool.findUnique({
      where: { id: poolId },
      include: {
        season: {
          include: {
            competition: true
          }
        }
      }
    });

    if (updatedPool?.season.competitionId === targetCompetitionId) {
      console.log(`   ✅ Migración exitosa!`);
      console.log(`   Pool ahora usa: ${updatedPool.season.competition.name}`);
    } else {
      console.error(`   ❌ Error: Pool no se migró correctamente`);
      process.exit(1);
    }

    // Resumen
    console.log(`\n${"=".repeat(60)}`);
    console.log("✅ MIGRACIÓN COMPLETADA");
    console.log("=".repeat(60));
    console.log(`\n📊 Resumen:`);
    console.log(`   Pool: ${pool.name}`);
    console.log(`   Competition anterior: ${pool.season.competition.name}`);
    console.log(`   Competition nueva: ${targetCompetition.name}`);
    console.log(`   Season: ${targetSeason.name}`);
    console.log(`   Matches migrados: ${matchesCount}`);
    console.log(`   Teams migrados: ${teamSeasonsCount}`);
    console.log(`\n🎉 Las estadísticas ahora deberían funcionar!\n`);

  } catch (error) {
    console.error("\n❌ Error durante la migración:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("❌ Error: Faltan argumentos");
  console.log("\nUso:");
  console.log("  pnpm tsx scripts/migrate-pool-to-correct-competition.ts <poolId> <targetCompetitionId>");
  console.log("\nEjemplo:");
  console.log("  pnpm tsx scripts/migrate-pool-to-correct-competition.ts cmgzvjf7h004kuvak15gbdeqx cmh0xqfzm0007uvqcxasv4ndn");
  console.log("\nPara encontrar los IDs, ejecuta primero:");
  console.log("  pnpm tsx scripts/diagnose-competitions.ts");
  process.exit(1);
}

const [poolId, targetCompetitionId] = args;

migratePoolToCorrectCompetition(poolId, targetCompetitionId)
  .then(() => {
    console.log("✅ Script completado\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error);
    process.exit(1);
  });
