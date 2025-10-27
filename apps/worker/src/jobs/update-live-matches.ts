/**
 * Update Live Matches Job
 * 
 * Actualiza solo los partidos que están en vivo o que terminaron recientemente
 * para mantener los resultados actualizados en tiempo casi real.
 * Se ejecuta cada 5 minutos durante días de partido.
 */

import { prisma } from "@qp/db";
import { getSportsProvider } from "@qp/utils";

export async function updateLiveMatchesJob() {
  console.log("[UpdateLive] Iniciando actualización de partidos en vivo...");

  const now = new Date();
  
  // Buscar partidos que:
  // 1. Están en vivo (status = LIVE)
  // 2. Terminaron en las últimas 2 horas (para capturar resultados finales)
  // 3. Están programados para hoy (para detectar cuando empiezan)
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const matchesToUpdate = await prisma.match.findMany({
    where: {
      OR: [
        // Partidos en vivo
        { status: "LIVE" },
        // Partidos que terminaron en las últimas 2 horas
        {
          status: "FINISHED",
          finishedAt: { gte: twoHoursAgo }
        },
        // Partidos programados para hoy
        {
          status: "SCHEDULED",
          kickoffTime: {
            gte: todayStart,
            lte: todayEnd
          }
        }
      ]
    },
    include: {
      season: {
        include: {
          competition: true
        }
      },
      homeTeam: true,
      awayTeam: true
    }
  });

  if (matchesToUpdate.length === 0) {
    console.log("[UpdateLive] No encontré partidos en vivo o recientes");
    return {
      updatedCount: 0,
      errorCount: 0,
      timestamp: now
    };
  }

  console.log(`[UpdateLive] Encontré ${matchesToUpdate.length} partidos para actualizar`);

  let updatedCount = 0;
  let errorCount = 0;

  // Agrupar por season para hacer menos llamadas a la API
  const matchesBySeason = new Map<string, typeof matchesToUpdate>();
  
  for (const match of matchesToUpdate) {
    const seasonId = match.seasonId;
    if (!matchesBySeason.has(seasonId)) {
      matchesBySeason.set(seasonId, []);
    }
    matchesBySeason.get(seasonId)!.push(match);
  }

  // Actualizar por season
  for (const [seasonId, matches] of matchesBySeason.entries()) {
    try {
      const firstMatch = matches[0];
      const season = firstMatch.season;

      // Buscar el mapeo externo de la competición
      const competitionMap = await prisma.externalMap.findFirst({
        where: {
          entityType: "COMPETITION",
          entityId: season.competition.id,
        },
        include: {
          source: true,
        },
      });

      if (!competitionMap) {
        console.warn(
          `[UpdateLive] ❌ No encontré mapeo externo para la competencia "${season.competition.name}" (ID: ${season.competition.id}). ` +
          `Omitiendo ${matches.length} partidos de la temporada "${season.name}"`
        );
        errorCount += matches.length;
        continue;
      }

      // Obtener provider
      const provider = getSportsProvider({
        provider: competitionMap.source.slug as "mock" | "api-football" | "sportmonks",
        apiKey: process.env.SPORTS_API_KEY
      });

      console.log(`[UpdateLive] Obteniendo datos para la temporada ${season.name} desde ${provider.getName()}`);

      // Fetch season data
      const seasonData = await provider.fetchSeason({
        competitionExternalId: competitionMap.externalId,
        year: season.year
      });

      // Crear mapa de external IDs a matches
      const externalMatchMap = new Map<string, typeof seasonData.matches[0]>();
      for (const matchDTO of seasonData.matches) {
        externalMatchMap.set(matchDTO.externalId, matchDTO);
      }

      // Actualizar cada match
      for (const match of matches) {
        try {
          // Buscar el external ID del match
          const matchMap = await prisma.externalMap.findFirst({
            where: {
              entityType: "MATCH",
              entityId: match.id,
              sourceId: competitionMap.sourceId
            }
          });

          if (!matchMap) {
            console.warn(
              `[UpdateLive] ❌ No encontré mapeo externo para el partido: ${match.homeTeam.shortName} vs ${match.awayTeam.shortName} ` +
              `(ID del partido: ${match.id}, Temporada: ${season.name})`
            );
            errorCount++;
            continue;
          }

          const matchDTO = externalMatchMap.get(matchMap.externalId);
          
          if (!matchDTO) {
            console.warn(
              `[UpdateLive] ❌ No encontré el partido en los datos del proveedor: ${match.homeTeam.shortName} vs ${match.awayTeam.shortName} ` +
              `(External ID: ${matchMap.externalId}, Temporada: ${season.name})`
            );
            errorCount++;
            continue;
          }

          // Actualizar el match
          await prisma.match.update({
            where: { id: match.id },
            data: {
              status: matchDTO.status,
              homeScore: matchDTO.homeScore,
              awayScore: matchDTO.awayScore,
              locked: matchDTO.status !== "SCHEDULED",
              finishedAt: matchDTO.finishedAt,
              kickoffTime: matchDTO.kickoffTime
            }
          });

          console.log(
            `[UpdateLive] ✅ Actualizado ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}: ` +
            `${matchDTO.homeScore ?? '-'}-${matchDTO.awayScore ?? '-'} (${matchDTO.status})`
          );

          updatedCount++;
        } catch (error) {
          console.error(`[UpdateLive] Error actualizando el partido ${match.id}:`, error);
          errorCount++;
        }
      }

      // Pequeña pausa entre seasons
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`[UpdateLive] Error procesando la temporada ${seasonId}:`, error);
      errorCount += matches.length;
    }
  }

  console.log(
    `[UpdateLive] Finalizado. Actualizados: ${updatedCount}, Errores: ${errorCount}, Total: ${matchesToUpdate.length}`
  );
  
  if (errorCount > 0) {
    console.warn(
      `[UpdateLive] ⚠️ Ocurrieron ${errorCount} error(es) durante la actualización. ` +
      `Verifique los logs anteriores para detalles sobre mapeos externos faltantes o desajustes en los datos del proveedor.`
    );
  }

  return {
    updatedCount,
    errorCount,
    totalMatches: matchesToUpdate.length,
    timestamp: now
  };
}
