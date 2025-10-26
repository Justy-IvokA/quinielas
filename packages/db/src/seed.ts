/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

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
  // 0. SPORTS (Required for templates and pools)
  // ========================================
  console.log("📦 Creating Football sport...");
  const football = await prisma.sport.upsert({
    where: { slug: "football" },
    update: {
      name: "Futbol Soccer",
    },
    create: {
      slug: "football",
      name: "Futbol Soccer",
    },
  });

  // ========================================
  // 1. SUPERADMIN & AGENCIA TENANT
  // ========================================
  console.log("📦 Creating Agencia tenant and SUPERADMIN...");

  const agenciaTenant = await prisma.tenant.upsert({
    where: { slug: "innotecnia" },
    update: {
      name: "Innotecnia",
      description: "Tenant nivel agencia, gestiona todos los modulos globales del sistema.",
      licenseTier: "COPA_DEL_MUNDO"
    },
    create: {
      slug: "innotecnia",
      name: "Innotecnia",
      description: "Tenant nivel agencia, gestiona todos los modulos globales del sistema.",
      licenseTier: "COPA_DEL_MUNDO"
    }
  });

  const agenciaTheme = {
    colors: {
      card: "0 0% 100%",
      ring: "262 83% 58%",
      input: "214 32% 91%",
      muted: "210 40% 96%",
      accent: "29 89% 48%",
      border: "214 32% 91%",
      popover: "0 0% 100%",
      primary: "55 92% 48%",
      secondary: "211 94% 48%",
      background: "0 0% 100%",
      foreground: "220 13% 9%",
      destructive: "0 84% 60%",
      cardForeground: "220 13% 9%",
      mutedForeground: "215 16% 47%",
      accentForeground: "262 83% 25%",
      popoverForeground: "220 13% 9%",
      primaryForeground: "210 40% 98%",
      secondaryForeground: "210 40% 98%",
      destructiveForeground: "210 40% 98%"
    },
    logo: {
      alt: "Innotecnia Logo",
      url: "https://storage.googleapis.com/rodsardb.firebasestorage.app/innotecnia/logo/1761333121060-uo7afe-innobanner-640-light.png"
    },
    text: {
      link: "https://innotecnia.com/",
      title: "Quinielas DataGol",
      slogan: "El futuro de la publicidad es ahora...",
      paragraph: "Participa, predice y gana fabulosos premios. Únete a nuestra comunidad de apasionados del deporte.",
      description: "\"DataGol\" la plataforma número uno en quinielas deportivas para las empresas."
    },
    logotype: {
      alt: "InnoLogo",
      url: "https://storage.googleapis.com/rodsardb.firebasestorage.app/innotecnia/logotype/1761331356867-ztb6q2-innologo-256-light.png"
    },
    mainCard: {
      url: "https://storage.googleapis.com/rodsardb.firebasestorage.app/innotecnia/mainCard/1761331474694-jnxqzb-stream.mp4",
      kind: "video",
      loop: true,
      muted: true,
      poster: "https://storage.googleapis.com/rodsardb.firebasestorage.app/innotecnia/poster/1761331506504-f1m1js-dp.png",
      autoplay: true
    },
    heroAssets: {
      alt: "InnoFondo",
      url: "https://storage.googleapis.com/rodsardb.firebasestorage.app/innotecnia/hero/1761331396133-oc7xti-admin-bg.jpg",
      kind: "image",
      loop: true,
      muted: true,
      overlay: false,
      autoplay: true
    },
    typography: {
      baseSize: "16px",
      fontFamily: "Poppins, system-ui, sans-serif",
      lineHeight: "1.5",
      headingsFamily: "Inter, ui-sans-serif, system-ui"
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
      description: "Tenant de nivel customer, gestiona quinielas, premios, reglas, Etc.",
      licenseTier: "GRAN_JUGADA"
    },
    create: {
      slug: "ivoka",
      name: "Ivoka",
      description: "Tenant de nivel customer, gestiona quinielas, premios, reglas, Etc.",
      licenseTier: "GRAN_JUGADA"
    }
  });

  const ivokaTheme = {
    colors: {
      card: "60 100% 99%",
      ring: "217 100% 50%",
      input: "60 10% 90%",
      muted: "60 10% 95%",
      accent: "248 84% 67%",
      border: "60 10% 90%",
      popover: "60 100% 99%",
      primary: "217 100% 50%",
      secondary: "20 99% 60%",
      background: "53 100% 98%",
      foreground: "90 8% 11%",
      destructive: "0 84% 60%",
      cardForeground: "80 7% 11%",
      mutedForeground: "80 5% 45%",
      accentForeground: "0 0% 100%",
      popoverForeground: "80 7% 11%",
      primaryForeground: "0 0% 100%",
      secondaryForeground: "0 0% 100%",
      destructiveForeground: "0 0% 98%"
    },
    logo: {
      alt: "Logo Color",
      url: "https://storage.googleapis.com/rodsardb.firebasestorage.app/ivoka/logo/1760809403916-h3pd7f-ivoka-black-2x.png"
    },
    text: {
      link: "ivoka.ai/eventosespeciales",
      title: "¡Únete Ahora!",
      slogan: "La Comunidad líder que une TU potencial humano con inteligencia artificial",
      paragraph: "Imagina un lugar donde la tecnología más avanzada del mundo no es una amenaza, sino tu mejor aliada para el crecimiento. Un espacio donde no solo aprendes a manejar herramientas de inteligencia artificial, sino que, en el proceso, redescubres el poder de tu propia voz, pones en orden tus finanzas y te conviertes en una versión más plena y auténtica de ti mismo.",
      description: "¡ Únete a esta quiniela exclusiva con código, solo nuestros mejores clientes participan, registra tus pronósticos y participa para ganar fabulosos premios !"
    },
    mainCard: {
      url: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2Fquinielas_video_loop.mp4?alt=media&token=4b8c5e3d-9f2a-4b3e-8f3d-5e3d9f2a4b3e",
      kind: "video",
      loop: true,
      muted: true,
      autoplay: true
    },
    heroAssets: {
      alt: "Quinielas Background",
      url: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2Fquinielas_bg.jpeg?alt=media&token=abeb5dbe-b395-4286-a24e-5580aeca612a",
      kind: "image",
      loop: true,
      muted: true,
      poster: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2Fivokalogo%2Bslogan%402x.png?alt=media&token=e0580c0e-40a8-499d-8cc9-1128412ad0d5",
      overlay: true,
      autoplay: true
    },
    typography: {
      baseSize: "16px",
      fontFamily: "Manrope, ui-sans-serif, system-ui",
      lineHeight: "1.5",
      headingsFamily: "Manrope, ui-sans-serif, system-ui"
    }
  };

  const brand = await prisma.brand.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "ivoka" } },
    update: {
      name: "Ivoka",
      description: "La Comunidad líder que une TU potencial humano con inteligencia artificial",
      logoUrl: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2Flogo_color_256x256.png?alt=media&token=73d1a20d-b3bb-4373-966d-a14c2ffbb4fa",
      theme: ivokaTheme,
      domains: ["ivoka.localhost"]
    },
    create: {
      tenantId: tenant.id,
      slug: "ivoka",
      name: "Ivoka",
      description: "La Comunidad líder que une TU potencial humano con inteligencia artificial",
      logoUrl: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2Flogo_color_256x256.png?alt=media&token=73d1a20d-b3bb-4373-966d-a14c2ffbb4fa",
      theme: ivokaTheme,
      domains: ["ivoka.localhost"]
    }
  });

  // ========================================
  // 3. ADDITIONAL DEMO BRANDS FOR SUBDOMAIN TESTING
  // ========================================
  console.log("📦 Creating additional demo brands for subdomain testing...");

  // Coca-Cola Brand
  const cocaColaTheme = {
    colors: {
      primary: "0 100% 50%",
      secondary: "0 0% 13%",
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
      url: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2Fcocacola_color.png?alt=media&token=86999e5c-ec3e-4b27-ad81-87cea9c18c7c",
      alt: "Coca-Cola Logo"
    },
    heroAssets: {
      kind: "image",
      url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&fm=jpg&q=60&w=3000",
      alt: "Coca-Cola Background",
      overlay: true,
      loop: true,
      muted: true,
      autoplay: true
    },
    mainCard: {
      kind: "video",
      url: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2FIvokaWEB.mp4?alt=media&token=c6d52eda-2fd4-4fbf-9505-ccc76d4bc4eb",
      loop: true,
      muted: true,
      autoplay: true
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
      logoUrl: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2Flogo_coca.webp?alt=media&token=34e02f78-84ef-4ebc-bc66-0dc1d314def8",
      theme: cocaColaTheme,
      domains: ["cocacola.localhost"]
    },
    create: {
      tenantId: tenant.id,
      slug: "cocacola",
      name: "Coca-Cola",
      description: "The Coca-Cola Company - Refreshing the World",
      logoUrl: "https://firebasestorage.googleapis.com/v0/b/rodsardb.firebasestorage.app/o/assets%2Flogo_coca.webp?alt=media&token=34e02f78-84ef-4ebc-bc66-0dc1d314def8",
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

  // ========================================
  // 3. IVOKA USERS
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

  // Player 1 - Angelica Osorio (PLAYER)
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

  // Player 2 - Sergio Sánchez (PLAYER)
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
  // 4. TENANT MEMBERSHIPS
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

  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: demoUser2.id } },
    update: { role: "PLAYER" },
    create: {
      tenantId: tenant.id,
      userId: demoUser2.id,
      role: "PLAYER"
    }
  });

  console.log("✅ TENANT_ADMIN created:", {
    email: "vemancera@ivoka.ai",
    tenant: tenant.slug,
    role: "TENANT_ADMIN"
  });

  // ========================================
  // FEATURE OVERRIDES (Example)
  // ========================================
  console.log("🔧 Creating example feature overrides...");

  // Example: Disable analytics for Ivoka tenant (even though GRAN_JUGADA includes it)
  await prisma.tenantFeatureOverride.upsert({
    where: {
      tenantId_feature: {
        tenantId: tenant.id,
        feature: "ANALYTICS_ADVANCED"
      }
    },
    update: {
      isEnabled: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },
    create: {
      tenantId: tenant.id,
      feature: "ANALYTICS_ADVANCED",
      isEnabled: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  });

  console.log("✅ Example feature override created (ANALYTICS_ADVANCED disabled for Ivoka)");

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
  console.log("\n👥 Users:");
  console.log(`   - vemancera@ivoka.ai (TENANT_ADMIN in ivoka tenant)`);
  console.log(`   - chronos.devs@gmail.com (PLAYER - Angelica Osorio)`);
  console.log(`   - sergio.sanchez@ivoka.ai (PLAYER - Sergio Sánchez)`);
  console.log("\n🎨 Demo Brands:");
  console.log(`   - Ivoka: ivoka.localhost:3000 or localhost:3000`);
  console.log(`   - Coca-Cola: cocacola.localhost:3000`);
  console.log(`   - Pepsi: pepsi.localhost:3000`);
  console.log(`   - Red Bull: redbull.localhost:3000`);

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
  console.log(`   5. Create pools using the Pool Wizard in admin panel`);
  console.log(`   6. Pools will automatically fetch data from API-Sports`);
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
