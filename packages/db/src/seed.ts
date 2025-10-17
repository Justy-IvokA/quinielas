/* eslint-disable no-console */
import { PrismaClient, AccessType, MatchStatus, PrizeType } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["warn", "error"]
});

/**
 * Demo theme with dark mode support and hero assets
 * Uses HSL format for Tailwind CSS variables and new BrandTheme schema
 */
const demoTheme = {
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
  logo: {
    url: "https://via.placeholder.com/256x256?text=Demo+Logo",
    alt: "Demo Logo"
  },
  heroAssets: {
    kind: "image",
    url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1920&h=1080&fit=crop",
    alt: "Hero Background",
    overlay: true,
    loop: true,
    muted: true,
    autoplay: true
  },
  mainCard: {
    kind: "none",
    url: null,
    loop: true,
    muted: true,
    autoplay: false
  },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui",
    headingsFamily: "Poppins, ui-sans-serif, system-ui",
    baseSize: "16px",
    lineHeight: "1.5"
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
      name: "Innotecnia",
      description: "Tenant nivel agencia, gestiona todos los modulos globales del sistema."
    },
    create: {
      slug: "innotecnia",
      name: "Innotecnia",
      description: "Tenant nivel agencia, gestiona todos los modulos globales del sistema."
    }
  });

  const agenciaTheme = {
    colors: {
      primary: "262 83% 58%", // #7c3aed converted to HSL
      secondary: "217 19% 17%", // #1f2937
      background: "0 0% 100%", // #ffffff
      foreground: "220 13% 9%", // #111827
      accent: "262 83% 90%",
      card: "0 0% 100%",
      muted: "210 40% 96%",
      border: "214 32% 91%",
      input: "214 32% 91%",
      ring: "262 83% 58%",
      primaryForeground: "210 40% 98%",
      secondaryForeground: "210 40% 98%",
      accentForeground: "262 83% 25%",
      mutedForeground: "215 16% 47%",
      destructive: "0 84% 60%",
      destructiveForeground: "210 40% 98%",
      cardForeground: "220 13% 9%",
      popover: "0 0% 100%",
      popoverForeground: "220 13% 9%"
    },
    logo: {
      url: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2Finnovatica_banner.jpg?alt=media&token=7e3d1aac-172b-459f-9580-406771501dfd",
      alt: "Innotecnia Logo"
    },
    heroAssets: {
      kind: "none",
      url: null,
      overlay: false,
      loop: true,
      muted: true,
      autoplay: true
    },
    mainCard: {
      kind: "none",
      url: null,
      loop: true,
      muted: true,
      autoplay: false
    },
    typography: {
      fontFamily: "Inter, ui-sans-serif, system-ui",
      headingsFamily: "Inter, ui-sans-serif, system-ui",
      baseSize: "16px",
      lineHeight: "1.5"
    }
  };

  const agenciaBrand = await prisma.brand.upsert({
    where: { tenantId_slug: { tenantId: agenciaTenant.id, slug: "innotecnia" } },
    update: {
      name: "Innotecnia",
      description: "La Innovación es lo que distingue al líder de sus seguidores.",
      logoUrl: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2Finnovatica_banner.jpg?alt=media&token=7e3d1aac-172b-459f-9580-406771501dfd",
      theme: agenciaTheme,
      domains: []
    },
    create: {
      tenantId: agenciaTenant.id,
      slug: "innotecnia",
      name: "Innotecnia",
      description: "La Innovación es lo que distingue al líder de sus seguidores.",
      logoUrl: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2Finnovatica_banner.jpg?alt=media&token=7e3d1aac-172b-459f-9580-406771501dfd",
      theme: agenciaTheme,
      domains: []
    }
  });

  const superAdminUser = await prisma.user.upsert({
    where: { email: "vemancera@gmail.com" },
    update: {
      name: "Víctor E. Mancera G.",
      phone: "+522221757251",
      phoneVerified: true
    },
    create: {
      email: "vemancera@gmail.com",
      name: "Víctor E. Mancera G.",
      phone: "+522221757251",
      phoneVerified: true
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
  // 2. IVOKA TENANT (Customer)
  // ========================================
  console.log("📦 Creating Ivoka tenant...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "ivoka" },
    update: {
      name: "Ivoka",
      description: "Tenant de nivel customer, gestiona quinielas, premios, reglas, Etc."
    },
    create: {
      slug: "ivoka",
      name: "Ivoka",
      description: "Tenant de nivel customer, gestiona quinielas, premios, reglas, Etc."
    }
  });

  const ivokaTheme = {
    colors: {
      primary: "217 100% 50%", // #0062FF
      secondary: "20 99% 60%", // #FE7734
      background: "60 100% 99%", // #FFFEF7
      foreground: "80 7% 11%", // #1E1F1C
      accent: "249 85% 67%", // #7964F2
      card: "60 100% 99%",
      muted: "60 10% 95%",
      border: "60 10% 90%",
      input: "60 10% 90%",
      ring: "217 100% 50%",
      primaryForeground: "0 0% 100%",
      secondaryForeground: "0 0% 100%",
      accentForeground: "0 0% 100%",
      mutedForeground: "80 5% 45%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 98%",
      cardForeground: "80 7% 11%",
      popover: "60 100% 99%",
      popoverForeground: "80 7% 11%"
    },
    logo: {
      url: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2FIvoka-Black%402x.png?alt=media&token=ca95321d-fd20-4c45-8702-6eae8c59ca39",
      alt: "Ivoka Logo"
    },
    heroAssets: {
      kind: "image",
      url: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2Fquinielas_bg.jpeg?alt=media&token=abeb5dbe-b395-4286-a24e-5580aeca612a",
      alt: "Quinielas Background",
      poster: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2Fivokalogo%2Bslogan%402x.png?alt=media&token=e0580c0e-40a8-499d-8cc9-1128412ad0d5",
      overlay: true,
      loop: true,
      muted: true,
      autoplay: true
    },
    mainCard: {
      kind: "none",
      url: null,
      loop: true,
      muted: true,
      autoplay: false
    },
    typography: {
      fontFamily: "Manrope, ui-sans-serif, system-ui",
      headingsFamily: "Manrope, ui-sans-serif, system-ui",
      baseSize: "16px",
      lineHeight: "1.5"
    }
  };

  const brand = await prisma.brand.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "ivoka" } },
    update: {
      name: "Ivoka",
      description: "La Comunidad líder que une TU potencial humano con inteligencia artificial",
      logoUrl: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2Ftenant01.jpg?alt=media&token=cccc06a7-6ba2-4d27-9926-ce92c387dbd5",
      theme: ivokaTheme,
      domains: ["localhost", "ivoka.localhost"]
    },
    create: {
      tenantId: tenant.id,
      slug: "ivoka",
      name: "Ivoka",
      description: "La Comunidad líder que une TU potencial humano con inteligencia artificial",
      logoUrl: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2Ftenant01.jpg?alt=media&token=cccc06a7-6ba2-4d27-9926-ce92c387dbd5",
      theme: ivokaTheme,
      domains: ["localhost", "ivoka.localhost"]
    }
  });

  // ========================================
  // 3. ADDITIONAL DEMO BRANDS FOR SUBDOMAIN TESTING
  // ========================================
  console.log("📦 Creating additional demo brands for subdomain testing...");

  // Coca-Cola Brand
  const cocaColaTheme = {
    colors: {
      primary: "0 100% 50%", // Coca-Cola Red
      secondary: "0 0% 13%", // Dark Gray
      background: "0 0% 100%",
      foreground: "0 0% 13%",
      accent: "0 100% 90%",
      card: "0 0% 100%",
      muted: "0 0% 96%",
      border: "0 0% 91%",
      input: "0 0% 91%",
      ring: "0 100% 50%",
      primaryForeground: "0 0% 100%",
      secondaryForeground: "0 0% 100%",
      accentForeground: "0 100% 25%",
      mutedForeground: "0 0% 47%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 98%",
      cardForeground: "0 0% 13%",
      popover: "0 0% 100%",
      popoverForeground: "0 0% 13%"
    },
    logo: {
      url: "https://via.placeholder.com/256x256/FF0000/FFFFFF?text=Coca-Cola",
      alt: "Coca-Cola Logo"
    },
    heroAssets: {
      kind: "image",
      url: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=1920&h=1080&fit=crop",
      alt: "Coca-Cola Background",
      overlay: true,
      loop: true,
      muted: true,
      autoplay: true
    },
    mainCard: {
      kind: "none",
      url: null,
      loop: true,
      muted: true,
      autoplay: false
    },
    typography: {
      fontFamily: "Inter, ui-sans-serif, system-ui",
      headingsFamily: "Inter, ui-sans-serif, system-ui",
      baseSize: "16px",
      lineHeight: "1.5"
    }
  };

  await prisma.brand.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "cocacola" } },
    update: {
      name: "Coca-Cola",
      description: "The Coca-Cola Company - Refreshing the World",
      theme: cocaColaTheme,
      domains: ["cocacola.localhost"]
    },
    create: {
      tenantId: tenant.id,
      slug: "cocacola",
      name: "Coca-Cola",
      description: "The Coca-Cola Company - Refreshing the World",
      theme: cocaColaTheme,
      domains: ["cocacola.localhost"]
    }
  });

  // Pepsi Brand
  const pepsiTheme = {
    colors: {
      primary: "210 100% 50%", // Pepsi Blue
      secondary: "0 100% 50%", // Pepsi Red
      background: "0 0% 100%",
      foreground: "220 13% 9%",
      accent: "210 100% 90%",
      card: "0 0% 100%",
      muted: "210 40% 96%",
      border: "214 32% 91%",
      input: "214 32% 91%",
      ring: "210 100% 50%",
      primaryForeground: "0 0% 100%",
      secondaryForeground: "0 0% 100%",
      accentForeground: "210 100% 25%",
      mutedForeground: "215 16% 47%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 98%",
      cardForeground: "220 13% 9%",
      popover: "0 0% 100%",
      popoverForeground: "220 13% 9%"
    },
    logo: {
      url: "https://via.placeholder.com/256x256/0066FF/FFFFFF?text=Pepsi",
      alt: "Pepsi Logo"
    },
    heroAssets: {
      kind: "image",
      url: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=1920&h=1080&fit=crop",
      alt: "Pepsi Background",
      overlay: true,
      loop: true,
      muted: true,
      autoplay: true
    },
    mainCard: {
      kind: "none",
      url: null,
      loop: true,
      muted: true,
      autoplay: false
    },
    typography: {
      fontFamily: "Inter, ui-sans-serif, system-ui",
      headingsFamily: "Inter, ui-sans-serif, system-ui",
      baseSize: "16px",
      lineHeight: "1.5"
    }
  };

  await prisma.brand.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "pepsi" } },
    update: {
      name: "Pepsi",
      description: "Pepsi - That's What I Like",
      theme: pepsiTheme,
      domains: ["pepsi.localhost"]
    },
    create: {
      tenantId: tenant.id,
      slug: "pepsi",
      name: "Pepsi",
      description: "Pepsi - That's What I Like",
      theme: pepsiTheme,
      domains: ["pepsi.localhost"]
    }
  });

  // Red Bull Brand
  const redbullTheme = {
    colors: {
      primary: "210 100% 50%", // Red Bull Blue
      secondary: "45 100% 50%", // Red Bull Yellow
      background: "220 13% 9%", // Dark background
      foreground: "0 0% 100%",
      accent: "210 100% 90%",
      card: "220 13% 13%",
      muted: "217 33% 17%",
      border: "217 33% 25%",
      input: "217 33% 25%",
      ring: "210 100% 50%",
      primaryForeground: "0 0% 100%",
      secondaryForeground: "220 13% 9%",
      accentForeground: "210 100% 25%",
      mutedForeground: "215 20% 65%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 98%",
      cardForeground: "0 0% 100%",
      popover: "220 13% 13%",
      popoverForeground: "0 0% 100%"
    },
    logo: {
      url: "https://via.placeholder.com/256x256/0066FF/FFFFFF?text=Red+Bull",
      alt: "Red Bull Logo"
    },
    heroAssets: {
      kind: "image",
      url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1920&h=1080&fit=crop",
      alt: "Red Bull Background",
      overlay: true,
      loop: true,
      muted: true,
      autoplay: true
    },
    mainCard: {
      kind: "none",
      url: null,
      loop: true,
      muted: true,
      autoplay: false
    },
    typography: {
      fontFamily: "Inter, ui-sans-serif, system-ui",
      headingsFamily: "Inter, ui-sans-serif, system-ui",
      baseSize: "16px",
      lineHeight: "1.5"
    }
  };

  await prisma.brand.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "redbull" } },
    update: {
      name: "Red Bull",
      description: "Red Bull - Gives You Wings",
      theme: redbullTheme,
      domains: ["redbull.localhost"]
    },
    create: {
      tenantId: tenant.id,
      slug: "redbull",
      name: "Red Bull",
      description: "Red Bull - Gives You Wings",
      theme: redbullTheme,
      domains: ["redbull.localhost"]
    }
  });

  console.log("✅ Demo brands created for subdomain testing:", {
    cocacola: "cocacola.localhost:3000",
    pepsi: "pepsi.localhost:3000",
    redbull: "redbull.localhost:3000"
  });

  const sport = await prisma.sport.upsert({
    where: { slug: "football" },
    update: { name: "Football" },
    create: { slug: "football", name: "Football" }
  });

  const competition = await prisma.competition.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "liga-mx" } },
    update: {
      name: "Liga MX",
      logoUrl: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2FligaMX-logo.png?alt=media&token=f380f212-c5e0-4f74-9577-f05c7c6a8e8f",
      metadata: { organizer: "Federación Mexicana de Futbol (FMF)" }
    },
    create: {
      sportId: sport.id,
      slug: "liga-mx",
      name: "Liga MX",
      logoUrl: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2FligaMX-logo.png?alt=media&token=f380f212-c5e0-4f74-9577-f05c7c6a8e8f",
      metadata: { organizer: "Federación Mexicana de Futbol (FMF)" }
    }
  });

  const season = await prisma.season.upsert({
    where: { competitionId_year: { competitionId: competition.id, year: 2025 } },
    update: {
      name: "Liga MX 2025"
    },
    create: {
      competitionId: competition.id,
      name: "Liga MX 2025",
      year: 2025,
      startsAt: new Date("2025-10-17T00:00:00.000Z"),
      endsAt: new Date("2025-10-19T23:59:59.000Z")
    }
  });

  const pool = await prisma.pool.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "liga-mx-13" } },
    update: {
      name: "Liga MX 2025 Quiniela | Jornada 13",
      prizeSummary: "¡Los que tengan más aciertos ganarán!",
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
      slug: "liga-mx-13",
      name: "Liga MX 2025 Quiniela | Jornada 13",
      description: "Quiniela para la jornada 13 de la Liga MX 2025",
      prizeSummary: "¡Los que tengan más aciertos ganarán!",
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
  // Liga MX = League ID 262 in API-Football
  await prisma.externalMap.upsert({
    where: {
      sourceId_entityType_externalId: {
        sourceId: externalSource.id,
        entityType: "competition",
        externalId: "262" // API-Football Liga MX ID
      }
    },
    update: {
      entityId: competition.id,
      metadata: {
        name: "Liga MX",
        type: "League",
        country: "Mexico"
      }
    },
    create: {
      sourceId: externalSource.id,
      entityType: "competition",
      entityId: competition.id,
      externalId: "262",
      metadata: {
        name: "Liga MX",
        type: "League",
        country: "Mexico"
      }
    }
  });

  // Map Season to API-Football
  await prisma.externalMap.upsert({
    where: {
      sourceId_entityType_externalId: {
        sourceId: externalSource.id,
        entityType: "season",
        externalId: "2025" // API-Football season year
      }
    },
    update: {
      entityId: season.id,
      metadata: {
        year: 2025,
        current: true
      }
    },
    create: {
      sourceId: externalSource.id,
      entityType: "season",
      entityId: season.id,
      externalId: "2025",
      metadata: {
        year: 2025,
        current: true
      }
    }
  });

  console.log("✅ External mappings created:", {
    source: externalSource.slug,
    competition: "Liga MX → ID 262",
    season: "2025 → ID 2025"
  });

  // ========================================
  // 4. IVOKA USERS
  // ========================================
  console.log("👥 Creating Ivoka users...");

  // TENANT_ADMIN for Ivoka
  const adminUser = await prisma.user.upsert({
    where: { email: "vemancera@ivoka.ai" },
    update: {
      name: "Eduardo Mancera G.",
      phone: "+522213528341",
      phoneVerified: true
    },
    create: {
      email: "vemancera@ivoka.ai",
      name: "Eduardo Mancera G.",
      phone: "+522213528341",
      phoneVerified: true
    }
  });

  // Player 1 - Angelica Osorio
  const demoUser1 = await prisma.user.upsert({
    where: { email: "chronos.devs@gmail.com" },
    update: {
      name: "Angelica Osorio Aceves",
      phone: "+522225102025",
      phoneVerified: true
    },
    create: {
      email: "chronos.devs@gmail.com",
      name: "Angelica Osorio Aceves",
      phone: "+522225102025",
      phoneVerified: true
    }
  });

  // Player 2 - Sergio Sánchez
  const demoUser2 = await prisma.user.upsert({
    where: { email: "sergio.sanchez@ivoka.ai" },
    update: {
      name: "Sergio Sánchez del Valle",
      phone: "+522227690231",
      phoneVerified: true
    },
    create: {
      email: "sergio.sanchez@ivoka.ai",
      name: "Sergio Sánchez del Valle",
      phone: "+522227690231",
      phoneVerified: true
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

  console.log("✅ TENANT_ADMIN created:", {
    email: "vemancera@ivoka.ai",
    tenant: tenant.slug,
    role: "TENANT_ADMIN"
  });

  // ========================================
  // 6. LIGA MX TEAMS
  // ========================================
  console.log("⚽ Creating Liga MX teams...");

  const teamGuadalajara = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "guadalajara-chivas" } },
    update: {
      name: "Guadalajara Chivas",
      shortName: "GUA",
      logoUrl: "https://media.api-sports.io/football/teams/2278.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "guadalajara-chivas",
      name: "Guadalajara Chivas",
      shortName: "GUA",
      logoUrl: "https://media.api-sports.io/football/teams/2278.png",
      countryCode: "Mexico"
    }
  });

  const teamTigres = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "tigres-uanl" } },
    update: {
      name: "Tigres UANL",
      shortName: "UAN",
      logoUrl: "https://media.api-sports.io/football/teams/2279.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "tigres-uanl",
      name: "Tigres UANL",
      shortName: "UAN",
      logoUrl: "https://media.api-sports.io/football/teams/2279.png",
      countryCode: "Mexico"
    }
  });

  const teamTijuana = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "club-tijuana" } },
    update: {
      name: "Club Tijuana",
      shortName: "CLU",
      logoUrl: "https://media.api-sports.io/football/teams/2280.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "club-tijuana",
      name: "Club Tijuana",
      shortName: "CLU",
      logoUrl: "https://media.api-sports.io/football/teams/2280.png",
      countryCode: "Mexico"
    }
  });

  const teamToluca = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "toluca" } },
    update: {
      name: "Toluca",
      shortName: "TOL",
      logoUrl: "https://media.api-sports.io/football/teams/2281.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "toluca",
      name: "Toluca",
      shortName: "TOL",
      logoUrl: "https://media.api-sports.io/football/teams/2281.png",
      countryCode: "Mexico"
    }
  });

  const teamMonterrey = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "monterrey" } },
    update: {
      name: "Monterrey",
      shortName: "MON",
      logoUrl: "https://media.api-sports.io/football/teams/2282.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "monterrey",
      name: "Monterrey",
      shortName: "MON",
      logoUrl: "https://media.api-sports.io/football/teams/2282.png",
      countryCode: "Mexico"
    }
  });

  const teamAtlas = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "atlas" } },
    update: {
      name: "Atlas",
      shortName: "ATL",
      logoUrl: "https://media.api-sports.io/football/teams/2283.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "atlas",
      name: "Atlas",
      shortName: "ATL",
      logoUrl: "https://media.api-sports.io/football/teams/2283.png",
      countryCode: "Mexico"
    }
  });

  const teamSantos = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "santos-laguna" } },
    update: {
      name: "Santos Laguna",
      shortName: "SAN",
      logoUrl: "https://media.api-sports.io/football/teams/2285.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "santos-laguna",
      name: "Santos Laguna",
      shortName: "SAN",
      logoUrl: "https://media.api-sports.io/football/teams/2285.png",
      countryCode: "Mexico"
    }
  });

  const teamPumas = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "u.n.a.m.---pumas" } },
    update: {
      name: "U.N.A.M. - Pumas",
      shortName: "UNA",
      logoUrl: "https://media.api-sports.io/football/teams/2286.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "u.n.a.m.---pumas",
      name: "U.N.A.M. - Pumas",
      shortName: "UNA",
      logoUrl: "https://media.api-sports.io/football/teams/2286.png",
      countryCode: "Mexico"
    }
  });

  const teamAmerica = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "club-america" } },
    update: {
      name: "Club America",
      shortName: "CLU",
      logoUrl: "https://media.api-sports.io/football/teams/2287.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "club-america",
      name: "Club America",
      shortName: "CLU",
      logoUrl: "https://media.api-sports.io/football/teams/2287.png",
      countryCode: "Mexico"
    }
  });

  const teamNecaxa = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "necaxa" } },
    update: {
      name: "Necaxa",
      shortName: "NEC",
      logoUrl: "https://media.api-sports.io/football/teams/2288.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "necaxa",
      name: "Necaxa",
      shortName: "NEC",
      logoUrl: "https://media.api-sports.io/football/teams/2288.png",
      countryCode: "Mexico"
    }
  });

  const teamLeon = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "leon" } },
    update: {
      name: "Leon",
      shortName: "CLU",
      logoUrl: "https://media.api-sports.io/football/teams/2289.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "leon",
      name: "Leon",
      shortName: "CLU",
      logoUrl: "https://media.api-sports.io/football/teams/2289.png",
      countryCode: "Mexico"
    }
  });

  const teamQueretaro = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "club-queretaro" } },
    update: {
      name: "Club Queretaro",
      shortName: "QUE",
      logoUrl: "https://media.api-sports.io/football/teams/2290.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "club-queretaro",
      name: "Club Queretaro",
      shortName: "QUE",
      logoUrl: "https://media.api-sports.io/football/teams/2290.png",
      countryCode: "Mexico"
    }
  });

  const teamPuebla = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "puebla" } },
    update: {
      name: "Puebla",
      shortName: "PUE",
      logoUrl: "https://media.api-sports.io/football/teams/2291.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "puebla",
      name: "Puebla",
      shortName: "PUE",
      logoUrl: "https://media.api-sports.io/football/teams/2291.png",
      countryCode: "Mexico"
    }
  });

  const teamPachuca = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "pachuca" } },
    update: {
      name: "Pachuca",
      shortName: "PAC",
      logoUrl: "https://media.api-sports.io/football/teams/2292.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "pachuca",
      name: "Pachuca",
      shortName: "PAC",
      logoUrl: "https://media.api-sports.io/football/teams/2292.png",
      countryCode: "Mexico"
    }
  });

  const teamCruzAzul = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "cruz-azul" } },
    update: {
      name: "Cruz Azul",
      shortName: "CRU",
      logoUrl: "https://media.api-sports.io/football/teams/2295.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "cruz-azul",
      name: "Cruz Azul",
      shortName: "CRU",
      logoUrl: "https://media.api-sports.io/football/teams/2295.png",
      countryCode: "Mexico"
    }
  });

  const teamJuarez = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "fc-juarez" } },
    update: {
      name: "FC Juarez",
      shortName: "FC ",
      logoUrl: "https://media.api-sports.io/football/teams/2298.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "fc-juarez",
      name: "FC Juarez",
      shortName: "FC ",
      logoUrl: "https://media.api-sports.io/football/teams/2298.png",
      countryCode: "Mexico"
    }
  });

  const teamSanLuis = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "atletico-san-luis" } },
    update: {
      name: "Atletico San Luis",
      shortName: "ASL",
      logoUrl: "https://media.api-sports.io/football/teams/2314.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "atletico-san-luis",
      name: "Atletico San Luis",
      shortName: "ASL",
      logoUrl: "https://media.api-sports.io/football/teams/2314.png",
      countryCode: "Mexico"
    }
  });

  const teamMazatlan = await prisma.team.upsert({
    where: { sportId_slug: { sportId: sport.id, slug: "mazatlán" } },
    update: {
      name: "Mazatlán",
      shortName: "MAZ",
      logoUrl: "https://media.api-sports.io/football/teams/14002.png",
      countryCode: "Mexico"
    },
    create: {
      sportId: sport.id,
      slug: "mazatlán",
      name: "Mazatlán",
      shortName: "MAZ",
      logoUrl: "https://media.api-sports.io/football/teams/14002.png",
      countryCode: "Mexico"
    }
  });

  // ========================================
  // 7. LINK TEAMS TO SEASON
  // ========================================
  console.log("🔗 Linking teams to season...");

  const ligaMxTeams = [
    teamGuadalajara, teamTigres, teamTijuana, teamToluca, teamMonterrey,
    teamAtlas, teamSantos, teamPumas, teamAmerica, teamNecaxa,
    teamLeon, teamQueretaro, teamPuebla, teamPachuca, teamCruzAzul,
    teamJuarez, teamSanLuis, teamMazatlan
  ];

  for (const team of ligaMxTeams) {
    await prisma.teamSeason.upsert({
      where: { teamId_seasonId: { teamId: team.id, seasonId: season.id } },
      update: {},
      create: { teamId: team.id, seasonId: season.id }
    });
  }

  // ========================================
  // 8. LIGA MX JORNADA 13 MATCHES
  // ========================================
  console.log("🏟️  Creating Liga MX Jornada 13 matches...");

  const match1 = await prisma.match.upsert({
    where: {
      seasonId_round_homeTeamId_awayTeamId: {
        seasonId: season.id,
        round: 13,
        homeTeamId: teamPuebla.id,
        awayTeamId: teamTijuana.id
      }
    },
    update: {
      kickoffTime: new Date("2025-10-18T01:00:00.000Z"),
      venue: "Estadio Cuauhtémoc",
      status: MatchStatus.SCHEDULED,
      locked: false
    },
    create: {
      seasonId: season.id,
      round: 13,
      matchday: null,
      homeTeamId: teamPuebla.id,
      awayTeamId: teamTijuana.id,
      kickoffTime: new Date("2025-10-18T01:00:00.000Z"),
      venue: "Estadio Cuauhtémoc",
      status: MatchStatus.SCHEDULED,
      locked: false
    }
  });

  const match2 = await prisma.match.upsert({
    where: {
      seasonId_round_homeTeamId_awayTeamId: {
        seasonId: season.id,
        round: 13,
        homeTeamId: teamTigres.id,
        awayTeamId: teamNecaxa.id
      }
    },
    update: {
      kickoffTime: new Date("2025-10-18T03:00:00.000Z"),
      venue: "Estadio Universitario",
      status: MatchStatus.SCHEDULED,
      locked: false
    },
    create: {
      seasonId: season.id,
      round: 13,
      matchday: null,
      homeTeamId: teamTigres.id,
      awayTeamId: teamNecaxa.id,
      kickoffTime: new Date("2025-10-18T03:00:00.000Z"),
      venue: "Estadio Universitario",
      status: MatchStatus.SCHEDULED,
      locked: false
    }
  });

  const match3 = await prisma.match.upsert({
    where: {
      seasonId_round_homeTeamId_awayTeamId: {
        seasonId: season.id,
        round: 13,
        homeTeamId: teamSanLuis.id,
        awayTeamId: teamAtlas.id
      }
    },
    update: {
      kickoffTime: new Date("2025-10-18T03:00:00.000Z"),
      venue: "Estadio Alfonso Lastras Ramírez",
      status: MatchStatus.SCHEDULED,
      locked: false
    },
    create: {
      seasonId: season.id,
      round: 13,
      matchday: null,
      homeTeamId: teamSanLuis.id,
      awayTeamId: teamAtlas.id,
      kickoffTime: new Date("2025-10-18T03:00:00.000Z"),
      venue: "Estadio Alfonso Lastras Ramírez",
      status: MatchStatus.SCHEDULED,
      locked: false
    }
  });

  const match4 = await prisma.match.upsert({
    where: {
      seasonId_round_homeTeamId_awayTeamId: {
        seasonId: season.id,
        round: 13,
        homeTeamId: teamToluca.id,
        awayTeamId: teamQueretaro.id
      }
    },
    update: {
      kickoffTime: new Date("2025-10-18T23:00:00.000Z"),
      venue: "Estadio Nemesio Díez",
      status: MatchStatus.SCHEDULED,
      locked: false
    },
    create: {
      seasonId: season.id,
      round: 13,
      matchday: null,
      homeTeamId: teamToluca.id,
      awayTeamId: teamQueretaro.id,
      kickoffTime: new Date("2025-10-18T23:00:00.000Z"),
      venue: "Estadio Nemesio Díez",
      status: MatchStatus.SCHEDULED,
      locked: false
    }
  });

  const match5 = await prisma.match.upsert({
    where: {
      seasonId_round_homeTeamId_awayTeamId: {
        seasonId: season.id,
        round: 13,
        homeTeamId: teamSantos.id,
        awayTeamId: teamLeon.id
      }
    },
    update: {
      kickoffTime: new Date("2025-10-18T23:00:00.000Z"),
      venue: "Estadio Corona",
      status: MatchStatus.SCHEDULED,
      locked: false
    },
    create: {
      seasonId: season.id,
      round: 13,
      matchday: null,
      homeTeamId: teamSantos.id,
      awayTeamId: teamLeon.id,
      kickoffTime: new Date("2025-10-18T23:00:00.000Z"),
      venue: "Estadio Corona",
      status: MatchStatus.SCHEDULED,
      locked: false
    }
  });

  const match6 = await prisma.match.upsert({
    where: {
      seasonId_round_homeTeamId_awayTeamId: {
        seasonId: season.id,
        round: 13,
        homeTeamId: teamJuarez.id,
        awayTeamId: teamPachuca.id
      }
    },
    update: {
      kickoffTime: new Date("2025-10-18T23:00:00.000Z"),
      venue: "Estadio Olímpico Benito Juárez",
      status: MatchStatus.SCHEDULED,
      locked: false
    },
    create: {
      seasonId: season.id,
      round: 13,
      matchday: null,
      homeTeamId: teamJuarez.id,
      awayTeamId: teamPachuca.id,
      kickoffTime: new Date("2025-10-18T23:00:00.000Z"),
      venue: "Estadio Olímpico Benito Juárez",
      status: MatchStatus.SCHEDULED,
      locked: false
    }
  });

  const match7 = await prisma.match.upsert({
    where: {
      seasonId_round_homeTeamId_awayTeamId: {
        seasonId: season.id,
        round: 13,
        homeTeamId: teamMonterrey.id,
        awayTeamId: teamPumas.id
      }
    },
    update: {
      kickoffTime: new Date("2025-10-19T01:00:00.000Z"),
      venue: "Estadio BBVA",
      status: MatchStatus.SCHEDULED,
      locked: false
    },
    create: {
      seasonId: season.id,
      round: 13,
      matchday: null,
      homeTeamId: teamMonterrey.id,
      awayTeamId: teamPumas.id,
      kickoffTime: new Date("2025-10-19T01:00:00.000Z"),
      venue: "Estadio BBVA",
      status: MatchStatus.SCHEDULED,
      locked: false
    }
  });

  const match8 = await prisma.match.upsert({
    where: {
      seasonId_round_homeTeamId_awayTeamId: {
        seasonId: season.id,
        round: 13,
        homeTeamId: teamGuadalajara.id,
        awayTeamId: teamMazatlan.id
      }
    },
    update: {
      kickoffTime: new Date("2025-10-19T01:07:00.000Z"),
      venue: "Estadio AKRON",
      status: MatchStatus.SCHEDULED,
      locked: false
    },
    create: {
      seasonId: season.id,
      round: 13,
      matchday: null,
      homeTeamId: teamGuadalajara.id,
      awayTeamId: teamMazatlan.id,
      kickoffTime: new Date("2025-10-19T01:07:00.000Z"),
      venue: "Estadio AKRON",
      status: MatchStatus.SCHEDULED,
      locked: false
    }
  });

  const match9 = await prisma.match.upsert({
    where: {
      seasonId_round_homeTeamId_awayTeamId: {
        seasonId: season.id,
        round: 13,
        homeTeamId: teamCruzAzul.id,
        awayTeamId: teamAmerica.id
      }
    },
    update: {
      kickoffTime: new Date("2025-10-19T03:05:00.000Z"),
      venue: "Estadio Olímpico Universitario",
      status: MatchStatus.SCHEDULED,
      locked: false
    },
    create: {
      seasonId: season.id,
      round: 13,
      matchday: null,
      homeTeamId: teamCruzAzul.id,
      awayTeamId: teamAmerica.id,
      kickoffTime: new Date("2025-10-19T03:05:00.000Z"),
      venue: "Estadio Olímpico Universitario",
      status: MatchStatus.SCHEDULED,
      locked: false
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
      displayName: "Angelica Osorio",
      email: demoUser1.email,
      emailVerified: true,
      phone: "+522225102025",
      phoneVerified: true
    },
    create: {
      userId: demoUser1.id,
      poolId: pool.id,
      tenantId: tenant.id,
      displayName: "Angelica Osorio",
      email: demoUser1.email,
      emailVerified: true,
      phone: "+522225102025",
      phoneVerified: true
    }
  });

  await prisma.registration.upsert({
    where: { userId_poolId: { userId: demoUser2.id, poolId: pool.id } },
    update: {
      displayName: "Sergio Sánchez",
      email: demoUser2.email,
      emailVerified: true,
      phone: "+522227690231",
      phoneVerified: true
    },
    create: {
      userId: demoUser2.id,
      poolId: pool.id,
      tenantId: tenant.id,
      displayName: "Sergio Sánchez",
      email: demoUser2.email,
      emailVerified: true,
      phone: "+522227690231",
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
  console.log("\n🔐 TENANT_ADMIN:");
  console.log(`   Email: vemancera@ivoka.ai`);
  console.log(`   Tenant: ${tenant.slug}`);
  console.log(`   Role: TENANT_ADMIN`);
  console.log(`   Login: Use Auth.js magic link or OAuth with this email`);
  console.log(`   Access: Can manage ${tenant.slug} tenant via admin panel`);
  console.log("\n📦 Ivoka Tenant:");
  console.log(`   Tenant: ${tenant.slug}`);
  console.log(`   Brand: ${brand.slug}`);
  console.log(`   Pool: ${pool.slug}`);
  console.log(`   Season: ${competition.slug}-${season.year}`);
  console.log("\n👥 Users:");
  console.log(`   - vemancera@ivoka.ai (TENANT_ADMIN in ivoka tenant)`);
  console.log(`   - chronos.devs@gmail.com (PLAYER - Angelica Osorio)`);
  console.log(`   - sergio.sanchez@ivoka.ai (PLAYER - Sergio Sánchez)`);
  console.log("\n⚽ Data:");
  console.log(`   Competition: Liga MX`);
  console.log(`   Season: Liga MX 2025`);
  console.log(`   Teams: 18 (All Liga MX teams)`);
  console.log(`   Matches: 9 (Jornada 13)`);
  console.log(`   Prizes: 4 (Rank 1, 2, 3, 4-10, 11-50)`);
  console.log(`   Registrations: 2`);
  console.log(`   Predictions: 2`);
  console.log("\n🔗 External Mappings:");
  console.log(`   Source: ${externalSource.slug}`);
  console.log(`   Competition: Liga MX → API-Football ID 262`);
  console.log(`   Season: 2025 → API-Football ID 2025`);

  // ========================================
  // GLOBAL SETTINGS (COMPLIANCE)
  // ========================================
  console.log("\n⚙️ Seeding global settings...");

  // Helper function to create or skip global settings
  const createGlobalSettingIfNotExists = async (key: string, value: any) => {
    const existing = await prisma.setting.findFirst({
      where: {
        scope: "GLOBAL",
        tenantId: null,
        poolId: null,
        key,
      },
    });

    if (!existing) {
      await prisma.setting.create({
        data: {
          scope: "GLOBAL",
          key,
          value,
        },
      });
    }
  };

  await createGlobalSettingIfNotExists("antiAbuse.captchaLevel", "auto");
  await createGlobalSettingIfNotExists("antiAbuse.rateLimit", { windowSec: 60, max: 60 });
  await createGlobalSettingIfNotExists("privacy.ipLogging", true);
  await createGlobalSettingIfNotExists("privacy.cookieBanner", true);
  await createGlobalSettingIfNotExists("privacy.deviceFingerprint", false);

  console.log("✅ Global settings created");

  // ========================================
  // DATA RETENTION POLICY (IVOKA TENANT)
  // ========================================
  console.log("\n🗑️ Creating data retention policy...");

  const existingPolicy = await prisma.dataRetentionPolicy.findFirst({
    where: {
      tenantId: tenant.id,
      poolId: null,
    },
  });

  if (!existingPolicy) {
    await prisma.dataRetentionPolicy.create({
      data: {
        tenantId: tenant.id,
        rules: {
          invitesDays: 90,
          auditDays: 365,
          tokensDays: 30,
        },
      },
    });
  }

  console.log("✅ Data retention policy created");

  console.log("\n💡 Next Steps:");
  console.log(`   1. Run: pnpm db:migrate (to apply Auth.js schema)`);
  console.log(`   2. Set AUTH_SECRET in .env (min 32 chars)`);
  console.log(`   3. Configure email provider or OAuth in .env`);
  console.log(`   4. Start admin app and sign in as SUPERADMIN`);
  console.log(`   5. Access pool at: http://localhost:3000/ivoka/liga-mx-13`);
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