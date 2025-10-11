/**
 * Script para crear datos de demostración de fixtures
 * Uso: pnpm tsx scripts/seed-fixtures-demo.ts
 */

import { PrismaClient } from "@qp/db";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creando datos de demostración...\n");

  // 1. Crear ExternalSource
  console.log("📡 Creando fuente externa...");
  const externalSource = await prisma.externalSource.upsert({
    where: { slug: "api-football" },
    create: {
      name: "API-Football",
      slug: "api-football"
    },
    update: {}
  });
  console.log(`✅ Fuente creada: ${externalSource.name} (${externalSource.id})\n`);

  // 2. Crear Sport
  console.log("⚽ Creando deporte...");
  const sport = await prisma.sport.upsert({
    where: { slug: "football" },
    create: {
      name: "Football",
      slug: "football"
    },
    update: {}
  });
  console.log(`✅ Deporte creado: ${sport.name}\n`);

  // 3. Crear Competition
  console.log("🏆 Creando competición...");
  const competition = await prisma.competition.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "world-cup" } },
    create: {
      name: "FIFA World Cup",
      slug: "world-cup",
      sportId: sport.id,
      logoUrl: "https://media.api-sports.io/football/leagues/1.png"
    },
    update: {}
  });
  console.log(`✅ Competición creada: ${competition.name}\n`);

  // 3.1. Crear mapeo externo para la competición (World Cup = ID 1 en API-Football)
  console.log("🔗 Creando mapeo externo de competición...");
  await prisma.externalMap.upsert({
    where: {
      sourceId_entityType_externalId: {
        sourceId: externalSource.id,
        entityType: "competition",
        externalId: "1" // World Cup ID en API-Football
      }
    },
    create: {
      sourceId: externalSource.id,
      entityType: "competition",
      entityId: competition.id,
      externalId: "1"
    },
    update: {
      entityId: competition.id
    }
  });
  console.log(`✅ Mapeo externo creado\n`);

  // 4. Crear Season (usando 2022 para tener datos reales)
  console.log("📅 Creando temporada...");
  const season = await prisma.season.upsert({
    where: { competitionId_year: { competitionId: competition.id, year: 2022 } },
    create: {
      name: "World Cup 2022",
      year: 2022,
      competitionId: competition.id,
      startsAt: new Date("2022-11-20"),
      endsAt: new Date("2022-12-18")
    },
    update: {}
  });
  console.log(`✅ Temporada creada: ${season.name} (${season.id})\n`);

  // 5. Crear algunos equipos de ejemplo
  console.log("🏴 Creando equipos...");
  const teams = await Promise.all([
    prisma.team.upsert({
      where: { sportId_slug: { sportId: sport.id, slug: "mexico" } },
      create: {
        name: "Mexico",
        slug: "mexico",
        shortName: "MEX",
        sportId: sport.id,
        countryCode: "MX",
        logoUrl: "https://media.api-sports.io/football/teams/16.png"
      },
      update: {}
    }),
    prisma.team.upsert({
      where: { sportId_slug: { sportId: sport.id, slug: "usa" } },
      create: {
        name: "United States",
        slug: "usa",
        shortName: "USA",
        sportId: sport.id,
        countryCode: "US",
        logoUrl: "https://media.api-sports.io/football/teams/2384.png"
      },
      update: {}
    }),
    prisma.team.upsert({
      where: { sportId_slug: { sportId: sport.id, slug: "canada" } },
      create: {
        name: "Canada",
        slug: "canada",
        shortName: "CAN",
        sportId: sport.id,
        countryCode: "CA",
        logoUrl: "https://media.api-sports.io/football/teams/1569.png"
      },
      update: {}
    }),
    prisma.team.upsert({
      where: { sportId_slug: { sportId: sport.id, slug: "brazil" } },
      create: {
        name: "Brazil",
        slug: "brazil",
        shortName: "BRA",
        sportId: sport.id,
        countryCode: "BR",
        logoUrl: "https://media.api-sports.io/football/teams/6.png"
      },
      update: {}
    })
  ]);
  console.log(`✅ Equipos creados: ${teams.length}\n`);

  // 6. Asociar equipos con la temporada
  console.log("🔗 Asociando equipos con temporada...");
  await Promise.all(
    teams.map((team) =>
      prisma.teamSeason.upsert({
        where: {
          teamId_seasonId: {
            teamId: team.id,
            seasonId: season.id
          }
        },
        create: {
          teamId: team.id,
          seasonId: season.id
        },
        update: {}
      })
    )
  );
  console.log(`✅ Equipos asociados\n`);

  // 7. Crear algunos partidos de ejemplo
  console.log("📋 Creando partidos de ejemplo...");
  const baseDate = new Date("2026-06-12T18:00:00Z");
  
  const matches = [
    {
      round: 1,
      homeTeam: teams[0], // Mexico
      awayTeam: teams[1], // USA
      kickoffTime: new Date(baseDate.getTime() + 0 * 24 * 60 * 60 * 1000),
      venue: "Estadio Azteca"
    },
    {
      round: 1,
      homeTeam: teams[2], // Canada
      awayTeam: teams[3], // Brazil
      kickoffTime: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
      venue: "BMO Field"
    },
    {
      round: 2,
      homeTeam: teams[1], // USA
      awayTeam: teams[3], // Brazil
      kickoffTime: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000),
      venue: "MetLife Stadium"
    }
  ];

  for (const match of matches) {
    await prisma.match.upsert({
      where: {
        seasonId_round_homeTeamId_awayTeamId: {
          seasonId: season.id,
          round: match.round,
          homeTeamId: match.homeTeam.id,
          awayTeamId: match.awayTeam.id
        }
      },
      create: {
        seasonId: season.id,
        round: match.round,
        homeTeamId: match.homeTeam.id,
        awayTeamId: match.awayTeam.id,
        kickoffTime: match.kickoffTime,
        venue: match.venue,
        status: "SCHEDULED",
        locked: false
      },
      update: {}
    });
  }
  console.log(`✅ Partidos creados: ${matches.length}\n`);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ SEED COMPLETADO");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("📋 Datos creados:");
  console.log(`   - ExternalSource ID: ${externalSource.id}`);
  console.log(`   - Season ID: ${season.id}`);
  console.log(`   - Equipos: ${teams.length}`);
  console.log(`   - Partidos: ${matches.length}\n`);
  console.log("🎯 Próximo paso:");
  console.log("   1. Ve a http://localhost:3001/es/fixtures");
  console.log("   2. Selecciona la temporada y fuente");
  console.log("   3. Haz clic en 'Sincronizar'\n");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
