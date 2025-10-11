/* eslint-disable no-console */
import { PrismaClient, AccessType, MatchStatus, PrizeType } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["warn", "error"]
});

/**
 * Demo theme with dark mode support and hero assets
 * Uses HSL format for Tailwind CSS variables
 */
const demoTheme = {
  name: "Demo Theme",
  slug: "demo-default",
  tokens: {
    colors: {
      background: "0 0% 100%",
      foreground: "224 71% 4%",
      primary: "199 84% 55%",
      primaryForeground: "0 0% 100%",
      secondary: "222 47% 11%",
      secondaryForeground: "0 0% 100%",
      accent: "199 84% 90%",
      accentForeground: "199 84% 25%",
      muted: "210 40% 96%",
      mutedForeground: "215 16% 47%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 98%",
      border: "214 32% 91%",
      ring: "199 84% 55%",
      input: "214 32% 91%",
      card: "0 0% 100%",
      cardForeground: "224 71% 4%",
      popover: "0 0% 100%",
      popoverForeground: "224 71% 4%"
    },
    radius: "0.75rem"
  },
  darkTokens: {
    colors: {
      background: "224 71% 4%",
      foreground: "210 40% 98%",
      card: "224 71% 4%",
      cardForeground: "210 40% 98%",
      popover: "224 71% 4%",
      popoverForeground: "210 40% 98%",
      primary: "199 84% 65%",
      primaryForeground: "224 71% 4%",
      secondary: "215 28% 17%",
      secondaryForeground: "210 40% 98%",
      muted: "215 28% 17%",
      mutedForeground: "217 33% 64%",
      accent: "215 28% 17%",
      accentForeground: "210 40% 98%",
      border: "215 28% 17%",
      input: "215 28% 17%",
      ring: "199 84% 55%"
    }
  },
  typography: {
    sans: "Inter, ui-sans-serif, system-ui",
    heading: "Poppins, ui-sans-serif, system-ui"
  },
  heroAssets: {
    video: false,
    assetUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1920&h=1080&fit=crop",
    fallbackImageUrl: null
  }
};

async function main() {
  console.log("🌱 Seeding Quinielas WL demo data...");

  // ========================================
  // 1. SUPERADMIN & AGENCIA TENANT
  // ========================================
  console.log("📦 Creating Agencia tenant and SUPERADMIN...");

  const agenciaTenant = await prisma.tenant.upsert({
    where: { slug: "innotecnia" },
    update: {
      name: "Innotecnia"
    },
    create: {
      slug: "innotecnia",
      name: "Innotecnia",
      description: "Tenant de Innotecnia para gestión global del sistema"
    }
  });

  const agenciaTheme = {
    name: "Innotecnia Theme",
    slug: "innotecnia-default",
    tokens: {
      colors: {
        background: "0 0% 100%",
        foreground: "222 47% 11%",
        primary: "258 90% 66%",
        primaryForeground: "0 0% 100%",
        secondary: "217 33% 17%",
        secondaryForeground: "210 40% 98%",
        accent: "258 90% 95%",
        accentForeground: "258 90% 30%",
        muted: "210 40% 96%",
        mutedForeground: "215 16% 47%",
        destructive: "0 84% 60%",
        destructiveForeground: "0 0% 98%",
        border: "214 32% 91%",
        ring: "258 90% 66%",
        input: "214 32% 91%",
        card: "0 0% 100%",
        cardForeground: "222 47% 11%",
        popover: "0 0% 100%",
        popoverForeground: "222 47% 11%"
      },
      radius: "0.5rem"
    },
    darkTokens: {
      colors: {
        background: "222 47% 11%",
        foreground: "210 40% 98%",
        primary: "258 90% 70%",
        primaryForeground: "222 47% 11%"
      }
    },
    typography: {
      sans: "Inter, ui-sans-serif, system-ui",
      heading: "Inter, ui-sans-serif, system-ui"
    },
    heroAssets: {
      video: false,
      assetUrl: null,
      fallbackImageUrl: null
    }
  };

  const agenciaBrand = await prisma.brand.upsert({
    where: { tenantId_slug: { tenantId: agenciaTenant.id, slug: "innotecnia" } },
    update: {
      name: "Innotecnia",
      theme: agenciaTheme
    },
    create: {
      tenantId: agenciaTenant.id,
      slug: "innotecnia",
      name: "Innotecnia",
      description: "La Innovación es lo que distingue al líder de sus seguidores.",
      logoUrl: "/agencia/logo.svg",
      theme: agenciaTheme,
      domains: []
    }
  });

  const superAdminUser = await prisma.user.upsert({
    where: { email: "vemancera@gmail.com" },
    update: {
      name: "Víctor E. Mancera G."
    },
    create: {
      email: "vemancera@gmail.com",
      name: "Víctor E. Mancera G."
    }
  });

  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: agenciaTenant.id, userId: superAdminUser.id } },
    update: { role: "SUPERADMIN" },
    create: {
      tenantId: agenciaTenant.id,
      userId: superAdminUser.id,
      role: "SUPERADMIN"
    }
  });

  console.log("✅ SUPERADMIN created:", {
    email: "vemancera@gmail.com",
    tenant: agenciaTenant.slug,
    role: "SUPERADMIN"
  });

  // ========================================
  // 2. DEMO TENANT
  // ========================================
  console.log("📦 Creating demo tenant...");

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

  // ========================================
  // 3. EXTERNAL SOURCE & MAPPINGS
  // ========================================
  console.log("🔗 Creating external source and mappings...");

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

  // Map Competition to API-Football
  // World Cup 2026 = League ID 1 in API-Football (example)
  await prisma.externalMap.upsert({
    where: {
      sourceId_entityType_externalId: {
        sourceId: externalSource.id,
        entityType: "competition",
        externalId: "1" // API-Football World Cup ID
      }
    },
    update: {
      entityId: competition.id,
      metadata: {
        name: "FIFA World Cup",
        type: "Cup",
        country: "World"
      }
    },
    create: {
      sourceId: externalSource.id,
      entityType: "competition",
      entityId: competition.id,
      externalId: "1",
      metadata: {
        name: "FIFA World Cup",
        type: "Cup",
        country: "World"
      }
    }
  });

  // Map Season to API-Football
  await prisma.externalMap.upsert({
    where: {
      sourceId_entityType_externalId: {
        sourceId: externalSource.id,
        entityType: "season",
        externalId: "2026" // API-Football season year
      }
    },
    update: {
      entityId: season.id,
      metadata: {
        year: 2026,
        current: false
      }
    },
    create: {
      sourceId: externalSource.id,
      entityType: "season",
      entityId: season.id,
      externalId: "2026",
      metadata: {
        year: 2026,
        current: false
      }
    }
  });

  console.log("✅ External mappings created:", {
    source: externalSource.slug,
    competition: "FIFA World Cup → ID 1",
    season: "2026 → ID 2026"
  });

  // ========================================
  // 4. DEMO USERS
  // ========================================
  console.log("👥 Creating demo users...");

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

  // ========================================
  // 5. TENANT MEMBERSHIPS
  // ========================================
  console.log("🔐 Creating tenant memberships...");

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

  // ========================================
  // 6. DEMO TEAMS
  // ========================================
  console.log("⚽ Creating demo teams...");

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

  // ========================================
  // 7. LINK TEAMS TO SEASON
  // ========================================
  console.log("🔗 Linking teams to season...");

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

  // ========================================
  // 8. DEMO MATCHES
  // ========================================
  console.log("🏟️  Creating demo matches...");

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

  // ========================================
  // 9. PRIZES
  // ========================================
  console.log("🏆 Creating prizes...");

  // First Place - Rank 1
  await prisma.prize.upsert({
    where: { poolId_rankFrom_rankTo: { poolId: pool.id, rankFrom: 1, rankTo: 1 } },
    update: {
      type: PrizeType.CASH,
      title: "Primer Lugar",
      description: "Ganador del pool Mundial 2026",
      value: "$10,000 MXN",
      imageUrl: "/prizes/gold-trophy.png",
      metadata: {
        currency: "MXN",
        amount: 10000,
        paymentMethod: "transfer"
      }
    },
    create: {
      poolId: pool.id,
      tenantId: tenant.id,
      rankFrom: 1,
      rankTo: 1,
      type: PrizeType.CASH,
      title: "Primer Lugar",
      description: "Ganador del pool Mundial 2026",
      value: "$10,000 MXN",
      imageUrl: "/prizes/gold-trophy.png",
      metadata: {
        currency: "MXN",
        amount: 10000,
        paymentMethod: "transfer"
      }
    }
  });

  // Second Place - Rank 2
  await prisma.prize.upsert({
    where: { poolId_rankFrom_rankTo: { poolId: pool.id, rankFrom: 2, rankTo: 2 } },
    update: {
      type: PrizeType.CASH,
      title: "Segundo Lugar",
      description: "Subcampeón del pool",
      value: "$5,000 MXN",
      imageUrl: "/prizes/silver-trophy.png",
      metadata: {
        currency: "MXN",
        amount: 5000,
        paymentMethod: "transfer"
      }
    },
    create: {
      poolId: pool.id,
      tenantId: tenant.id,
      rankFrom: 2,
      rankTo: 2,
      type: PrizeType.CASH,
      title: "Segundo Lugar",
      description: "Subcampeón del pool",
      value: "$5,000 MXN",
      imageUrl: "/prizes/silver-trophy.png",
      metadata: {
        currency: "MXN",
        amount: 5000,
        paymentMethod: "transfer"
      }
    }
  });

  // Third Place - Rank 3
  await prisma.prize.upsert({
    where: { poolId_rankFrom_rankTo: { poolId: pool.id, rankFrom: 3, rankTo: 3 } },
    update: {
      type: PrizeType.CASH,
      title: "Tercer Lugar",
      description: "Tercer mejor predictor",
      value: "$2,500 MXN",
      imageUrl: "/prizes/bronze-trophy.png",
      metadata: {
        currency: "MXN",
        amount: 2500,
        paymentMethod: "transfer"
      }
    },
    create: {
      poolId: pool.id,
      tenantId: tenant.id,
      rankFrom: 3,
      rankTo: 3,
      type: PrizeType.CASH,
      title: "Tercer Lugar",
      description: "Tercer mejor predictor",
      value: "$2,500 MXN",
      imageUrl: "/prizes/bronze-trophy.png",
      metadata: {
        currency: "MXN",
        amount: 2500,
        paymentMethod: "transfer"
      }
    }
  });

  // Top 10 - Ranks 4-10 (Range prize example)
  await prisma.prize.upsert({
    where: { poolId_rankFrom_rankTo: { poolId: pool.id, rankFrom: 4, rankTo: 10 } },
    update: {
      type: PrizeType.DISCOUNT,
      title: "Top 10",
      description: "Descuento especial para próxima quiniela",
      value: "50% OFF",
      metadata: {
        discountPercent: 50,
        validFor: "next-pool",
        expiresInDays: 90
      }
    },
    create: {
      poolId: pool.id,
      tenantId: tenant.id,
      rankFrom: 4,
      rankTo: 10,
      type: PrizeType.DISCOUNT,
      title: "Top 10",
      description: "Descuento especial para próxima quiniela",
      value: "50% OFF",
      metadata: {
        discountPercent: 50,
        validFor: "next-pool",
        expiresInDays: 90
      }
    }
  });

  // Participation Prize - Ranks 11-50 (Experience prize example)
  await prisma.prize.upsert({
    where: { poolId_rankFrom_rankTo: { poolId: pool.id, rankFrom: 11, rankTo: 50 } },
    update: {
      type: PrizeType.EXPERIENCE,
      title: "Reconocimiento Participación",
      description: "Acceso exclusivo a evento de cierre",
      value: "Evento Virtual",
      metadata: {
        eventType: "virtual",
        eventDate: "2026-07-22",
        includesRecording: true
      }
    },
    create: {
      poolId: pool.id,
      tenantId: tenant.id,
      rankFrom: 11,
      rankTo: 50,
      type: PrizeType.EXPERIENCE,
      title: "Reconocimiento Participación",
      description: "Acceso exclusivo a evento de cierre",
      value: "Evento Virtual",
      metadata: {
        eventType: "virtual",
        eventDate: "2026-07-22",
        includesRecording: true
      }
    }
  });

  // ========================================
  // 10. REGISTRATIONS
  // ========================================
  console.log("📝 Creating registrations...");

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

  // ========================================
  // 11. PREDICTIONS
  // ========================================
  console.log("🎯 Creating sample predictions...");

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

  // ========================================
  // SUMMARY
  // ========================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ SEED COMPLETE");
  console.log("=".repeat(60));
  console.log("\n📊 Summary:");
  console.log("\n🔐 SUPERADMIN:");
  console.log(`   Email: vemancera@gmail.com`);
  console.log(`   Tenant: ${agenciaTenant.slug}`);
  console.log(`   Role: SUPERADMIN`);
  console.log(`   Login: Use Auth.js magic link or OAuth with this email`);
  console.log(`   Access: Can manage all tenants via /superadmin/tenants`);
  console.log("\n📦 Demo Tenant:");
  console.log(`   Tenant: ${tenant.slug}`);
  console.log(`   Brand: ${brand.slug}`);
  console.log(`   Pool: ${pool.slug}`);
  console.log(`   Season: ${competition.slug}-${season.year}`);
  console.log("\n👥 Users:");
  console.log(`   - admin@demo.com (TENANT_ADMIN in demo tenant)`);
  console.log(`   - player1@demo.com (PLAYER in demo tenant)`);
  console.log(`   - player2@demo.com (PLAYER in demo tenant)`);
  console.log("\n⚽ Data:");
  console.log(`   Teams: 4 (Mexico, USA, Canada, Argentina)`);
  console.log(`   Matches: 2`);
  console.log(`   Prizes: 5 (Rank 1, 2, 3, 4-10, 11-50)`);
  console.log(`   Registrations: 2`);
  console.log(`   Predictions: 2`);
  console.log("\n🔗 External Mappings:");
  console.log(`   Source: ${externalSource.slug}`);
  console.log(`   Competition: FIFA World Cup → API-Football ID 1`);
  console.log(`   Season: 2026 → API-Football ID 2026`);

  // ========================================
  // GLOBAL SETTINGS (COMPLIANCE)
  // ========================================
  console.log("\n⚙️ Seeding global settings...");

  await prisma.setting.upsert({
    where: {
      scope_tenantId_poolId_key: {
        scope: "GLOBAL",
        tenantId: null,
        poolId: null,
        key: "antiAbuse.captchaLevel",
      },
    },
    update: {},
    create: {
      scope: "GLOBAL",
      key: "antiAbuse.captchaLevel",
      value: "auto",
    },
  });

  await prisma.setting.upsert({
    where: {
      scope_tenantId_poolId_key: {
        scope: "GLOBAL",
        tenantId: null,
        poolId: null,
        key: "antiAbuse.rateLimit",
      },
    },
    update: {},
    create: {
      scope: "GLOBAL",
      key: "antiAbuse.rateLimit",
      value: { windowSec: 60, max: 60 },
    },
  });

  await prisma.setting.upsert({
    where: {
      scope_tenantId_poolId_key: {
        scope: "GLOBAL",
        tenantId: null,
        poolId: null,
        key: "privacy.ipLogging",
      },
    },
    update: {},
    create: {
      scope: "GLOBAL",
      key: "privacy.ipLogging",
      value: true,
    },
  });

  await prisma.setting.upsert({
    where: {
      scope_tenantId_poolId_key: {
        scope: "GLOBAL",
        tenantId: null,
        poolId: null,
        key: "privacy.cookieBanner",
      },
    },
    update: {},
    create: {
      scope: "GLOBAL",
      key: "privacy.cookieBanner",
      value: true,
    },
  });

  await prisma.setting.upsert({
    where: {
      scope_tenantId_poolId_key: {
        scope: "GLOBAL",
        tenantId: null,
        poolId: null,
        key: "privacy.deviceFingerprint",
      },
    },
    update: {},
    create: {
      scope: "GLOBAL",
      key: "privacy.deviceFingerprint",
      value: false,
    },
  });

  console.log("✅ Global settings created");

  // ========================================
  // DATA RETENTION POLICY (DEMO TENANT)
  // ========================================
  console.log("\n🗑️ Creating data retention policy...");

  await prisma.dataRetentionPolicy.upsert({
    where: {
      tenantId_poolId: {
        tenantId: tenant.id,
        poolId: null,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      rules: {
        invitesDays: 90,
        auditDays: 365,
        tokensDays: 30,
      },
    },
  });

  console.log("✅ Data retention policy created");

  console.log("\n💡 Next Steps:");
  console.log(`   1. Run: pnpm db:migrate (to apply Auth.js schema)`);
  console.log(`   2. Set AUTH_SECRET in .env (min 32 chars)`);
  console.log(`   3. Configure email provider or OAuth in .env`);
  console.log(`   4. Start admin app and sign in as SUPERADMIN`);
  console.log("\n" + "=".repeat(60) + "\n");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });