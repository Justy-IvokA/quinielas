/**
 * Auto Sync Fixtures Job
 * 
 * Sincroniza automáticamente fixtures de todas las temporadas activas
 * cada 6 horas. Ideal para mantener datos actualizados sin intervención manual.
 */

import { prisma } from "@qp/db";
import { syncFixturesJob } from "./sync-fixtures";

export async function autoSyncFixturesJob() {
  console.log("[AutoSync] Starting automatic fixtures sync...");

  // Obtener todas las temporadas activas (que están en curso o próximas)
  const now = new Date();
  const activeSeasons = await prisma.season.findMany({
    where: {
      OR: [
        // Temporadas que ya iniciaron pero no han terminado
        {
          startsAt: { lte: now },
          endsAt: { gte: now }
        },
        // Temporadas que inician en los próximos 30 días
        {
          startsAt: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      ]
    },
    include: {
      competition: true
    }
  });

  console.log(`[AutoSync] Found ${activeSeasons.length} active seasons to sync`);

  const results = [];

  for (const season of activeSeasons) {
    try {
      // Buscar el mapeo externo de la competición en la tabla ExternalMap
      const competitionMap = await prisma.externalMap.findFirst({
        where: {
          entityType: "competition",
          entityId: season.competition.id,
        },
        include: {
          source: true,
        },
      });

      if (!competitionMap) {
        console.warn(`[AutoSync] No external mapping for competition ${season.competition.name}, skipping`);
        continue;
      }

      console.log(`[AutoSync] Syncing ${season.name} (${season.year})...`);

      const result = await syncFixturesJob({
        seasonId: season.id,
        competitionExternalId: competitionMap.externalId,
        year: season.year,
        providerName: competitionMap.source.slug
      });

      results.push({
        seasonId: season.id,
        seasonName: season.name,
        success: true,
        ...result
      });

      console.log(`[AutoSync] ✅ ${season.name}: ${result.syncedCount} matches synced`);

      // Pequeña pausa entre sincronizaciones para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`[AutoSync] ❌ Error syncing ${season.name}:`, error);
      results.push({
        seasonId: season.id,
        seasonName: season.name,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  console.log(`[AutoSync] Completed. Total seasons processed: ${results.length}`);

  return {
    totalSeasons: activeSeasons.length,
    results,
    timestamp: new Date()
  };
}
