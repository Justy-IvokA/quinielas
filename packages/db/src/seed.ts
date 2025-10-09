/* eslint-disable no-console */
import { PrismaClient, AccessType, MatchStatus } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["warn", "error"]
});

const demoTheme = {
  logo: "/demo/logo.svg",
  colors: {
    primary: "#0ea5e9",
    secondary: "#111827",
    background: "#ffffff",
    foreground: "#0f172a"
  },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui"
  }
};

async function main() {
  console.log("🌱 Seeding Quinielas WL demo data...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {
      name: "Demo Tenant"
    },
    create: {
      slug: "demo",
      name: "Demo Tenant",
      description: "Demo tenant for Quinielas WL"
    }
  });

  const brand = await prisma.brand.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "default" } },
    update: {
      name: "Demo Brand",
      theme: demoTheme,
      domains: ["localhost"]
    },
    create: {
      tenantId: tenant.id,
      slug: "default",
      name: "Demo Brand",
      description: "Default brand for demo tenant",
      logoUrl: "/demo/logo.svg",
      theme: demoTheme,
      domains: ["localhost"]
    }
  });

  const sport = await prisma.sport.upsert({
    where: { slug: "football" },
    update: { name: "Football" },
    create: { slug: "football", name: "Football" }
  });

  const competition = await prisma.competition.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "fifa-world-cup" } },
    update: {
      name: "FIFA World Cup",
      logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/6/67/2026_FIFA_World_Cup.svg/200px-2026_FIFA_World_Cup.svg.png",
      metadata: { organizer: "FIFA" }
    },
    create: {
      sportId: sport.id,
      slug: "fifa-world-cup",
      name: "FIFA World Cup",
      logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/6/67/2026_FIFA_World_Cup.svg/200px-2026_FIFA_World_Cup.svg.png",
      metadata: { organizer: "FIFA" }
    }
  });

  const season = await prisma.season.upsert({
    where: { competitionId_year: { competitionId: competition.id, year: 2026 } },
    update: {
      name: "World Cup 2026"
    },
    create: {
      competitionId: competition.id,
      name: "World Cup 2026",
      year: 2026,
      startsAt: new Date("2026-06-08T00:00:00.000Z"),
      endsAt: new Date("2026-07-21T00:00:00.000Z")
    }
  });

  const pool = await prisma.pool.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "world-cup-2026" } },
    update: {
      name: "World Cup 2026 Demo Pool",
      prizeSummary: "Top predictors win Quinielas WL swag!",
      ruleSet: {
        exactScore: 5,
        correctSign: 3,
        goalDiffBonus: 1
      }
    },
    create: {
      tenantId: tenant.id,
      brandId: brand.id,
      seasonId: season.id,
      slug: "world-cup-2026",
      name: "World Cup 2026 Demo Pool",
      description: "Demo pool for the 2026 FIFA World Cup",
      prizeSummary: "Top predictors win Quinielas WL swag!",
      ruleSet: {
        exactScore: 5,
        correctSign: 3,
        goalDiffBonus: 1
      }
    }
  });

  await prisma.accessPolicy.upsert({
    where: { poolId: pool.id },
    update: {
      accessType: AccessType.PUBLIC,
      domainAllowList: ["localhost"],
      requireCaptcha: false,
      requireEmailVerification: false
    },
    create: {
      poolId: pool.id,
      tenantId: tenant.id,
      accessType: AccessType.PUBLIC,
      domainAllowList: ["localhost"],
      requireCaptcha: false,
      requireEmailVerification: false
    }
  });

  const externalSource = await prisma.externalSource.upsert({
    where: { slug: "api-football" },
    update: {
      name: "API-Football"
    },
    create: {
      slug: "api-football",
      name: "API-Football"
    }
  });

  // Create demo users
  const demoUser1 = await prisma.user.upsert({
    where: { email: "player1@demo.com" },
    update: {
      name: "Demo Player 1",
      phone: "+525512345678",
      phoneVerified: true
    },
    create: {
      email: "player1@demo.com",
      name: "Demo Player 1",
      phone: "+525512345678",
      phoneVerified: true
    }
  });

  const demoUser2 = await prisma.user.upsert({
    where: { email: "player2@demo.com" },
    update: {
      name: "Demo Player 2",
      phone: "+525587654321",
      phoneVerified: true
    },
    create: {
      email: "player2@demo.com",
      name: "Demo Player 2",
      phone: "+525587654321",
      phoneVerified: true
    }
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {
      name: "Demo Admin"
    },
    create: {
      email: "admin@demo.com",
      name: "Demo Admin"
    }
  });

  // Create tenant memberships
  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: adminUser.id } },
    update: { role: "TENANT_ADMIN" },
    create: {
      tenantId: tenant.id,
      userId: adminUser.id,
      role: "TENANT_ADMIN"
    }
  });

  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: demoUser1.id } },
    update: { role: "PLAYER" },
    create: {
      tenantId: tenant.id,
      userId: demoUser1.id,
      role: "PLAYER"
    }
  });

  // Create demo teams
  const teamMexico = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "mexico" } },
    update: {
      name: "Mexico",
      shortName: "MEX",
      logoUrl: "https://flagcdn.com/w80/mx.png",
      countryCode: "MX"
    },
    create: {
      sportId: sport.id,
      slug: "mexico",
      name: "Mexico",
      shortName: "MEX",
      logoUrl: "https://flagcdn.com/w80/mx.png",
      countryCode: "MX"
    }
  });

  const teamUSA = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "usa" } },
    update: {
      name: "United States",
      shortName: "USA",
      logoUrl: "https://flagcdn.com/w80/us.png",
      countryCode: "US"
    },
    create: {
      sportId: sport.id,
      slug: "usa",
      name: "United States",
      shortName: "USA",
      logoUrl: "https://flagcdn.com/w80/us.png",
      countryCode: "US"
    }
  });

  const teamCanada = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "canada" } },
    update: {
      name: "Canada",
      shortName: "CAN",
      logoUrl: "https://flagcdn.com/w80/ca.png",
      countryCode: "CA"
    },
    create: {
      sportId: sport.id,
      slug: "canada",
      name: "Canada",
      shortName: "CAN",
      logoUrl: "https://flagcdn.com/w80/ca.png",
      countryCode: "CA"
    }
  });

  const teamArgentina = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "argentina" } },
    update: {
      name: "Argentina",
      shortName: "ARG",
      logoUrl: "https://flagcdn.com/w80/ar.png",
      countryCode: "AR"
    },
    create: {
      sportId: sport.id,
      slug: "argentina",
      name: "Argentina",
      shortName: "ARG",
      logoUrl: "https://flagcdn.com/w80/ar.png",
      countryCode: "AR"
    }
  });

  // Link teams to season
  await prisma.teamSeason.upsert({
    where: { teamId_seasonId: { teamId: teamMexico.id, seasonId: season.id } },
    update: {},
    create: { teamId: teamMexico.id, seasonId: season.id }
  });

  await prisma.teamSeason.upsert({
    where: { teamId_seasonId: { teamId: teamUSA.id, seasonId: season.id } },
    update: {},
    create: { teamId: teamUSA.id, seasonId: season.id }
  });

  await prisma.teamSeason.upsert({
    where: { teamId_seasonId: { teamId: teamCanada.id, seasonId: season.id } },
    update: {},
    create: { teamId: teamCanada.id, seasonId: season.id }
  });

  await prisma.teamSeason.upsert({
    where: { teamId_seasonId: { teamId: teamArgentina.id, seasonId: season.id } },
    update: {},
    create: { teamId: teamArgentina.id, seasonId: season.id }
  });

  // Create demo matches with new fields
  const match1 = await prisma.match.upsert({
    where: {
      seasonId_round_homeTeamId_awayTeamId: {
        seasonId: season.id,
        round: 1,
        homeTeamId: teamMexico.id,
        awayTeamId: teamUSA.id
      }
    },
    update: {
      kickoffTime: new Date("2026-06-08T18:00:00.000Z"),
      venue: "Estadio Azteca",
      status: MatchStatus.SCHEDULED
    },
    create: {
      seasonId: season.id,
      round: 1,
      matchday: 1,
      homeTeamId: teamMexico.id,
      awayTeamId: teamUSA.id,
      kickoffTime: new Date("2026-06-08T18:00:00.000Z"),
      venue: "Estadio Azteca",
      status: MatchStatus.SCHEDULED
    }
  });

  const match2 = await prisma.match.upsert({
    where: {
      seasonId_round_homeTeamId_awayTeamId: {
        seasonId: season.id,
        round: 1,
        homeTeamId: teamCanada.id,
        awayTeamId: teamArgentina.id
      }
    },
    update: {
      kickoffTime: new Date("2026-06-08T21:00:00.000Z"),
      venue: "BMO Field",
      status: MatchStatus.SCHEDULED
    },
    create: {
      seasonId: season.id,
      round: 1,
      matchday: 1,
      homeTeamId: teamCanada.id,
      awayTeamId: teamArgentina.id,
      kickoffTime: new Date("2026-06-08T21:00:00.000Z"),
      venue: "BMO Field",
      status: MatchStatus.SCHEDULED
    }
  });

  // Create prizes with new fields
  await prisma.prize.upsert({
    where: { poolId_position: { poolId: pool.id, position: 1 } },
    update: {
      title: "Primer Lugar",
      description: "Ganador del pool Mundial 2026",
      value: "$10,000 MXN",
      imageUrl: "/prizes/gold-trophy.png"
    },
    create: {
      poolId: pool.id,
      tenantId: tenant.id,
      position: 1,
      title: "Primer Lugar",
      description: "Ganador del pool Mundial 2026",
      value: "$10,000 MXN",
      imageUrl: "/prizes/gold-trophy.png"
    }
  });

  await prisma.prize.upsert({
    where: { poolId_position: { poolId: pool.id, position: 2 } },
    update: {
      title: "Segundo Lugar",
      description: "Subcampeón del pool",
      value: "$5,000 MXN",
      imageUrl: "/prizes/silver-trophy.png"
    },
    create: {
      poolId: pool.id,
      tenantId: tenant.id,
      position: 2,
      title: "Segundo Lugar",
      description: "Subcampeón del pool",
      value: "$5,000 MXN",
      imageUrl: "/prizes/silver-trophy.png"
    }
  });

  await prisma.prize.upsert({
    where: { poolId_position: { poolId: pool.id, position: 3 } },
    update: {
      title: "Tercer Lugar",
      description: "Tercer mejor predictor",
      value: "$2,500 MXN",
      imageUrl: "/prizes/bronze-trophy.png"
    },
    create: {
      poolId: pool.id,
      tenantId: tenant.id,
      position: 3,
      title: "Tercer Lugar",
      description: "Tercer mejor predictor",
      value: "$2,500 MXN",
      imageUrl: "/prizes/bronze-trophy.png"
    }
  });

  // Create registrations
  await prisma.registration.upsert({
    where: { userId_poolId: { userId: demoUser1.id, poolId: pool.id } },
    update: {
      displayName: "Player One",
      email: demoUser1.email,
      emailVerified: true,
      phone: "+525512345678",
      phoneVerified: true
    },
    create: {
      userId: demoUser1.id,
      poolId: pool.id,
      tenantId: tenant.id,
      displayName: "Player One",
      email: demoUser1.email,
      emailVerified: true,
      phone: "+525512345678",
      phoneVerified: true
    }
  });

  await prisma.registration.upsert({
    where: { userId_poolId: { userId: demoUser2.id, poolId: pool.id } },
    update: {
      displayName: "Player Two",
      email: demoUser2.email,
      emailVerified: true,
      phone: "+525587654321",
      phoneVerified: true
    },
    create: {
      userId: demoUser2.id,
      poolId: pool.id,
      tenantId: tenant.id,
      displayName: "Player Two",
      email: demoUser2.email,
      emailVerified: true,
      phone: "+525587654321",
      phoneVerified: true
    }
  });

  // Create sample predictions
  await prisma.prediction.upsert({
    where: {
      matchId_poolId_userId: {
        matchId: match1.id,
        poolId: pool.id,
        userId: demoUser1.id
      }
    },
    update: {
      homeScore: 2,
      awayScore: 1
    },
    create: {
      matchId: match1.id,
      poolId: pool.id,
      userId: demoUser1.id,
      tenantId: tenant.id,
      homeScore: 2,
      awayScore: 1
    }
  });

  await prisma.prediction.upsert({
    where: {
      matchId_poolId_userId: {
        matchId: match1.id,
        poolId: pool.id,
        userId: demoUser2.id
      }
    },
    update: {
      homeScore: 1,
      awayScore: 1
    },
    create: {
      matchId: match1.id,
      poolId: pool.id,
      userId: demoUser2.id,
      tenantId: tenant.id,
      homeScore: 1,
      awayScore: 1
    }
  });

  console.log("✅ Seed complete", {
    tenant: tenant.slug,
    brand: brand.slug,
    pool: pool.slug,
    season: `${competition.slug}-${season.year}`,
    users: 3,
    teams: 4,
    matches: 2,
    prizes: 3,
    registrations: 2,
    predictions: 2
  });
}

main()
  .catch((error) => {
    console.error("❌ Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });