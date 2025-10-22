/**
 * Script: Actualizar Pools con Filtro de Jornadas en ruleSet
 * 
 * Actualiza los pools existentes para incluir el filtro de rounds
 * en el campo ruleSet (JSON).
 * 
 * Uso:
 *   pnpm tsx scripts/update-pools-with-rounds.ts
 */

import { prisma } from "../packages/db/src/index.js";

interface PoolRuleSet {
  scoring?: {
    exact?: number;
    sign?: number;
    diff?: number;
  };
  rounds?: {
    start: number | null;
    end: number | null;
  };
}

async function updatePoolsWithRounds() {
  console.log("\n🔧 Actualizando Pools con Filtro de Jornadas");
  console.log("=============================================\n");

  try {
    // Obtener todos los pools del tenant Ivoka
    const pools = await prisma.pool.findMany({
      where: {
        tenantId: 'cmgzgs6be0006uvzgavy30ot7'
      },
      include: {
        season: {
          include: {
            competition: true
          }
        }
      }
    });

    console.log(`📊 Pools encontrados: ${pools.length}\n`);

    for (const pool of pools) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Pool: ${pool.name} (${pool.slug})`);
      console.log(`Season: ${pool.season.name}`);
      console.log(`Competition: ${pool.season.competition.name}`);

      // Obtener matches para determinar las jornadas
      const matches = await prisma.match.findMany({
        where: {
          seasonId: pool.season.id
        },
        select: {
          round: true
        },
        distinct: ['round'],
        orderBy: {
          round: 'asc'
        }
      });

      const availableRounds = matches.map(m => m.round).sort((a, b) => (a! - b!));
      console.log(`Jornadas disponibles: ${availableRounds.join(', ')}`);

      // Determinar rounds basándose en el slug o nombre del pool
      let roundStart: number | null = null;
      let roundEnd: number | null = null;

      // Intentar extraer el número de jornada del slug
      const slugMatch = pool.slug.match(/j(?:ornada)?[-_]?(\d+)/i);
      const nameMatch = pool.name.match(/j(?:ornada)?\s*(\d+)/i);
      
      if (slugMatch) {
        const round = parseInt(slugMatch[1]);
        roundStart = round;
        roundEnd = round;
        console.log(`✅ Detectado del slug: Jornada ${round}`);
      } else if (nameMatch) {
        const round = parseInt(nameMatch[1]);
        roundStart = round;
        roundEnd = round;
        console.log(`✅ Detectado del nombre: Jornada ${round}`);
      } else {
        // Si no se puede determinar, dejar null (todas las jornadas)
        console.log(`⚠️  No se pudo determinar jornada específica, usando TODAS`);
      }

      // Construir ruleSet
      const currentRuleSet = (pool.ruleSet as PoolRuleSet) || {};
      const newRuleSet: PoolRuleSet = {
        ...currentRuleSet,
        rounds: {
          start: roundStart,
          end: roundEnd
        }
      };

      console.log(`\nNuevo ruleSet.rounds:`);
      console.log(`  start: ${roundStart}`);
      console.log(`  end: ${roundEnd}`);

      // Actualizar pool
      await prisma.pool.update({
        where: { id: pool.id },
        data: {
          ruleSet: newRuleSet as any
        }
      });

      console.log(`✅ Pool actualizado`);
    }

    console.log(`\n\n${"=".repeat(60)}`);
    console.log("✅ ACTUALIZACIÓN COMPLETADA");
    console.log("=".repeat(60));
    console.log(`\n📊 Total de pools actualizados: ${pools.length}\n`);

  } catch (error) {
    console.error("\n❌ Error durante la actualización:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updatePoolsWithRounds()
  .then(() => {
    console.log("✅ Script completado\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error);
    process.exit(1);
  });
