/**
 * Script de Verificación de Pool para Estadísticas
 * 
 * Verifica que un pool tenga todos los componentes necesarios
 * para mostrar estadísticas (standings):
 * 1. Pool existe
 * 2. Season existe
 * 3. Competition existe
 * 4. ExternalMap de Competition existe (CRÍTICO)
 * 5. ExternalSource existe
 * 6. Matches existen
 * 7. Teams existen
 * 
 * Uso:
 *   pnpm tsx scripts/verify-pool-standings.ts <poolSlug> <tenantSlug>
 * 
 * Ejemplo:
 *   pnpm tsx scripts/verify-pool-standings.ts jornada-15 ivoka
 */

import { prisma } from "../packages/db/src/index.js";

interface VerificationResult {
  step: string;
  status: "✅" | "❌" | "⚠️";
  message: string;
  data?: any;
}

async function verifyPoolForStandings(poolSlug: string, tenantSlug: string) {
  const results: VerificationResult[] = [];
  let hasErrors = false;

  console.log("\n🔍 Verificando Pool para Estadísticas");
  console.log("=====================================\n");
  console.log(`Pool Slug: ${poolSlug}`);
  console.log(`Tenant Slug: ${tenantSlug}\n`);

  try {
    // 1. Verificar Tenant
    console.log("1️⃣  Verificando Tenant...");
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      results.push({
        step: "Tenant",
        status: "❌",
        message: `Tenant '${tenantSlug}' no encontrado`
      });
      hasErrors = true;
      printResults(results);
      return;
    }

    results.push({
      step: "Tenant",
      status: "✅",
      message: `Tenant encontrado: ${tenant.name}`,
      data: { id: tenant.id, name: tenant.name }
    });

    // 2. Verificar Pool
    console.log("2️⃣  Verificando Pool...");
    const pool = await prisma.pool.findUnique({
      where: {
        tenantId_slug: {
          tenantId: tenant.id,
          slug: poolSlug
        }
      },
      include: {
        season: {
          include: {
            competition: {
              include: {
                sport: true
              }
            }
          }
        },
        brand: {
          select: {
            name: true,
            domains: true
          }
        },
        _count: {
          select: {
            registrations: true,
            predictions: true,
            prizes: true
          }
        }
      }
    });

    if (!pool) {
      results.push({
        step: "Pool",
        status: "❌",
        message: `Pool '${poolSlug}' no encontrado en tenant '${tenantSlug}'`
      });
      hasErrors = true;
      printResults(results);
      return;
    }

    results.push({
      step: "Pool",
      status: "✅",
      message: `Pool encontrado: ${pool.name}`,
      data: {
        id: pool.id,
        name: pool.name,
        slug: pool.slug,
        isActive: pool.isActive,
        registrations: pool._count.registrations,
        predictions: pool._count.predictions,
        prizes: pool._count.prizes
      }
    });

    // 3. Verificar Season
    console.log("3️⃣  Verificando Season...");
    const season = pool.season;

    results.push({
      step: "Season",
      status: "✅",
      message: `Season encontrada: ${season.name}`,
      data: {
        id: season.id,
        name: season.name,
        year: season.year,
        competitionId: season.competitionId
      }
    });

    // 4. Verificar Competition
    console.log("4️⃣  Verificando Competition...");
    const competition = season.competition;

    results.push({
      step: "Competition",
      status: "✅",
      message: `Competition encontrada: ${competition.name}`,
      data: {
        id: competition.id,
        name: competition.name,
        slug: competition.slug,
        sportId: competition.sportId,
        sportName: competition.sport.name
      }
    });

    // 5. Verificar ExternalSource
    console.log("5️⃣  Verificando ExternalSource...");
    const externalSource = await prisma.externalSource.findFirst({
      where: { slug: "api-football" }
    });

    if (!externalSource) {
      results.push({
        step: "ExternalSource",
        status: "❌",
        message: "ExternalSource 'api-football' no encontrado"
      });
      hasErrors = true;
    } else {
      results.push({
        step: "ExternalSource",
        status: "✅",
        message: `ExternalSource encontrado: ${externalSource.name}`,
        data: {
          id: externalSource.id,
          slug: externalSource.slug,
          name: externalSource.name
        }
      });
    }

    // 6. Verificar ExternalMap de Competition (CRÍTICO)
    console.log("6️⃣  Verificando ExternalMap de Competition (CRÍTICO)...");
    const competitionExternalMap = await prisma.externalMap.findFirst({
      where: {
        entityId: competition.id,
        entityType: "COMPETITION"
      },
      include: {
        source: true
      }
    });

    if (!competitionExternalMap) {
      results.push({
        step: "ExternalMap (Competition)",
        status: "❌",
        message: "⚠️ CRÍTICO: ExternalMap de Competition NO ENCONTRADO - Las estadísticas NO funcionarán",
      });
      hasErrors = true;
    } else {
      results.push({
        step: "ExternalMap (Competition)",
        status: "✅",
        message: "ExternalMap de Competition encontrado",
        data: {
          id: competitionExternalMap.id,
          externalId: competitionExternalMap.externalId,
          source: competitionExternalMap.source.name,
          entityType: competitionExternalMap.entityType
        }
      });
    }

    // 7. Verificar Matches
    console.log("7️⃣  Verificando Matches...");
    const matchesCount = await prisma.match.count({
      where: { seasonId: season.id }
    });

    if (matchesCount === 0) {
      results.push({
        step: "Matches",
        status: "⚠️",
        message: "No hay matches en esta season"
      });
    } else {
      const matches = await prisma.match.findMany({
        where: { seasonId: season.id },
        take: 3,
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } }
        },
        orderBy: { kickoffTime: "asc" }
      });

      results.push({
        step: "Matches",
        status: "✅",
        message: `${matchesCount} matches encontrados`,
        data: {
          total: matchesCount,
          sample: matches.map(m => ({
            id: m.id,
            round: m.round,
            homeTeam: m.homeTeam.name,
            awayTeam: m.awayTeam.name,
            kickoffTime: m.kickoffTime,
            status: m.status
          }))
        }
      });
    }

    // 8. Verificar Teams
    console.log("8️⃣  Verificando Teams...");
    const teamsCount = await prisma.teamSeason.count({
      where: { seasonId: season.id }
    });

    if (teamsCount === 0) {
      results.push({
        step: "Teams",
        status: "⚠️",
        message: "No hay teams en esta season"
      });
    } else {
      const teams = await prisma.teamSeason.findMany({
        where: { seasonId: season.id },
        take: 5,
        include: {
          team: { select: { id: true, name: true, logoUrl: true } }
        }
      });

      results.push({
        step: "Teams",
        status: "✅",
        message: `${teamsCount} teams encontrados`,
        data: {
          total: teamsCount,
          sample: teams.map(ts => ({
            id: ts.team.id,
            name: ts.team.name,
            logoUrl: ts.team.logoUrl
          }))
        }
      });
    }

    // 9. Verificar CompetitionStandings (cache)
    console.log("9️⃣  Verificando CompetitionStandings (cache)...");
    const cachedStandings = await prisma.competitionStandings.findFirst({
      where: {
        competitionId: competition.id,
        seasonYear: season.year
      }
    });

    if (!cachedStandings) {
      results.push({
        step: "CompetitionStandings (cache)",
        status: "⚠️",
        message: "No hay estadísticas cacheadas (se obtendrán de API en primera consulta)"
      });
    } else {
      const ageInHours = (Date.now() - cachedStandings.lastFetchedAt.getTime()) / (1000 * 60 * 60);
      results.push({
        step: "CompetitionStandings (cache)",
        status: "✅",
        message: `Estadísticas cacheadas encontradas (${ageInHours.toFixed(1)}h antiguas)`,
        data: {
          id: cachedStandings.id,
          lastFetchedAt: cachedStandings.lastFetchedAt,
          ageInHours: ageInHours.toFixed(1)
        }
      });
    }

    // 10. Verificar AccessPolicy
    console.log("🔟 Verificando AccessPolicy...");
    const accessPolicy = await prisma.accessPolicy.findUnique({
      where: { poolId: pool.id }
    });

    if (!accessPolicy) {
      results.push({
        step: "AccessPolicy",
        status: "⚠️",
        message: "No hay AccessPolicy configurada"
      });
    } else {
      results.push({
        step: "AccessPolicy",
        status: "✅",
        message: `AccessPolicy configurada: ${accessPolicy.accessType}`,
        data: {
          accessType: accessPolicy.accessType,
          requireCaptcha: accessPolicy.requireCaptcha,
          maxRegistrations: accessPolicy.maxRegistrations
        }
      });
    }

  } catch (error) {
    console.error("\n❌ Error durante la verificación:", error);
    hasErrors = true;
  } finally {
    await prisma.$disconnect();
  }

  // Imprimir resultados
  printResults(results);

  // Resumen final
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMEN");
  console.log("=".repeat(60) + "\n");

  const successCount = results.filter(r => r.status === "✅").length;
  const errorCount = results.filter(r => r.status === "❌").length;
  const warningCount = results.filter(r => r.status === "⚠️").length;

  console.log(`✅ Exitosos: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`⚠️  Advertencias: ${warningCount}`);
  console.log();

  if (hasErrors || errorCount > 0) {
    console.log("❌ RESULTADO: La quiniela NO está lista para mostrar estadísticas");
    console.log("\n🔧 Acciones requeridas:");
    results
      .filter(r => r.status === "❌")
      .forEach(r => {
        console.log(`   - ${r.step}: ${r.message}`);
      });
  } else if (warningCount > 0) {
    console.log("⚠️  RESULTADO: La quiniela está configurada pero tiene advertencias");
    console.log("\n💡 Recomendaciones:");
    results
      .filter(r => r.status === "⚠️")
      .forEach(r => {
        console.log(`   - ${r.step}: ${r.message}`);
      });
  } else {
    console.log("✅ RESULTADO: La quiniela está LISTA para mostrar estadísticas");
  }

  console.log();
}

function printResults(results: VerificationResult[]) {
  console.log("\n" + "=".repeat(60));
  console.log("📋 RESULTADOS DE VERIFICACIÓN");
  console.log("=".repeat(60) + "\n");

  results.forEach((result, index) => {
    console.log(`${result.status} ${result.step}`);
    console.log(`   ${result.message}`);
    if (result.data) {
      console.log(`   Datos:`, JSON.stringify(result.data, null, 2).split('\n').map((line, i) => i === 0 ? line : `   ${line}`).join('\n'));
    }
    console.log();
  });
}

// Ejecutar script
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("❌ Error: Faltan argumentos");
  console.log("\nUso:");
  console.log("  pnpm tsx scripts/verify-pool-standings.ts <poolSlug> <tenantSlug>");
  console.log("\nEjemplo:");
  console.log("  pnpm tsx scripts/verify-pool-standings.ts jornada-15 ivoka");
  process.exit(1);
}

const [poolSlug, tenantSlug] = args;

verifyPoolForStandings(poolSlug, tenantSlug)
  .then(() => {
    console.log("✅ Verificación completada\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error);
    process.exit(1);
  });
