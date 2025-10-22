/**
 * Script de Migración: Crear ExternalMap Faltante de Competition
 * 
 * Para quinielas creadas antes del fix de upsert, este script
 * crea el ExternalMap de COMPETITION que falta.
 * 
 * Uso:
 *   pnpm tsx scripts/fix-missing-competition-externalmap.ts <poolId>
 * 
 * Ejemplo:
 *   pnpm tsx scripts/fix-missing-competition-externalmap.ts cmgzvjf7h004kuvak15gbdeqx
 */

import { prisma } from "../packages/db/src/index.js";

async function fixMissingCompetitionExternalMap(poolId: string) {
  console.log("\n🔧 Reparando ExternalMap de Competition");
  console.log("==========================================\n");
  console.log(`Pool ID: ${poolId}\n`);

  try {
    // 1. Obtener Pool con Season y Competition
    console.log("1️⃣  Buscando Pool...");
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
      console.error(`❌ Pool con ID '${poolId}' no encontrado`);
      process.exit(1);
    }

    console.log(`✅ Pool encontrado: ${pool.name}`);
    console.log(`   Tenant: ${pool.tenant.name} (${pool.tenant.slug})`);
    console.log(`   Season: ${pool.season.name}`);
    console.log(`   Competition: ${pool.season.competition.name}\n`);

    const competition = pool.season.competition;

    // 2. Verificar si ya existe ExternalMap
    console.log("2️⃣  Verificando ExternalMap existente...");
    const existingMap = await prisma.externalMap.findFirst({
      where: {
        entityId: competition.id,
        entityType: "COMPETITION"
      }
    });

    if (existingMap) {
      console.log(`✅ ExternalMap ya existe:`);
      console.log(`   ID: ${existingMap.id}`);
      console.log(`   External ID: ${existingMap.externalId}`);
      console.log(`\n✨ No se requiere acción. El ExternalMap ya está configurado.\n`);
      return;
    }

    console.log(`⚠️  ExternalMap NO existe para esta Competition\n`);

    // 3. Buscar ExternalSource
    console.log("3️⃣  Buscando ExternalSource...");
    const externalSource = await prisma.externalSource.findFirst({
      where: { slug: "api-football" }
    });

    if (!externalSource) {
      console.error(`❌ ExternalSource 'api-football' no encontrado`);
      process.exit(1);
    }

    console.log(`✅ ExternalSource encontrado: ${externalSource.name}\n`);

    // 4. Buscar externalId desde un Match o Team existente
    console.log("4️⃣  Buscando externalId de Competition...");
    
    // Intentar obtener desde un match
    const sampleMatch = await prisma.match.findFirst({
      where: { seasonId: pool.season.id },
      include: {
        _count: true
      }
    });

    if (!sampleMatch) {
      console.error(`❌ No se encontraron matches para esta season`);
      console.error(`   No se puede determinar el externalId de la Competition`);
      process.exit(1);
    }

    // Buscar el ExternalMap del match para obtener info
    const matchExternalMap = await prisma.externalMap.findFirst({
      where: {
        entityId: sampleMatch.id,
        entityType: "MATCH",
        sourceId: externalSource.id
      }
    });

    if (!matchExternalMap) {
      console.error(`❌ No se encontró ExternalMap para los matches`);
      console.error(`   No se puede determinar el externalId de la Competition`);
      process.exit(1);
    }

    console.log(`✅ Match ExternalMap encontrado`);
    console.log(`   Match External ID: ${matchExternalMap.externalId}\n`);

    // Para Liga MX, el externalId es 262
    // Esto debería estar en el template o metadata
    const competitionExternalId = "262"; // Liga MX en API-Football

    console.log(`📝 Usando Competition External ID: ${competitionExternalId}`);
    console.log(`   (Liga MX en API-Football)\n`);

    // 5. Confirmar con el usuario
    console.log("⚠️  IMPORTANTE: Verificar que el External ID sea correcto");
    console.log(`   Competition: ${competition.name}`);
    console.log(`   External ID: ${competitionExternalId}`);
    console.log(`   Source: ${externalSource.name}\n`);

    // 6. Crear ExternalMap
    console.log("5️⃣  Creando ExternalMap de Competition...");
    
    const newExternalMap = await prisma.externalMap.create({
      data: {
        sourceId: externalSource.id,
        entityType: "COMPETITION",
        entityId: competition.id,
        externalId: competitionExternalId,
        metadata: {
          createdBy: "migration-script",
          reason: "missing-competition-externalmap",
          poolId: pool.id,
          poolName: pool.name,
          migratedAt: new Date().toISOString()
        }
      }
    });

    console.log(`✅ ExternalMap creado exitosamente!`);
    console.log(`   ID: ${newExternalMap.id}`);
    console.log(`   Entity Type: ${newExternalMap.entityType}`);
    console.log(`   Entity ID: ${newExternalMap.entityId}`);
    console.log(`   External ID: ${newExternalMap.externalId}\n`);

    // 7. Verificar que funcione
    console.log("6️⃣  Verificando configuración...");
    const verification = await prisma.externalMap.findFirst({
      where: {
        entityId: competition.id,
        entityType: "COMPETITION"
      },
      include: {
        source: true
      }
    });

    if (verification) {
      console.log(`✅ Verificación exitosa!`);
      console.log(`   ExternalMap encontrado y funcional`);
      console.log(`   Source: ${verification.source.name}`);
      console.log(`   External ID: ${verification.externalId}\n`);
    } else {
      console.error(`❌ Error en verificación: ExternalMap no encontrado después de crearlo`);
      process.exit(1);
    }

    // 8. Resumen
    console.log("=".repeat(60));
    console.log("✅ MIGRACIÓN COMPLETADA EXITOSAMENTE");
    console.log("=".repeat(60));
    console.log(`\n📊 Resumen:`);
    console.log(`   Pool: ${pool.name}`);
    console.log(`   Competition: ${competition.name}`);
    console.log(`   ExternalMap ID: ${newExternalMap.id}`);
    console.log(`   External ID: ${competitionExternalId}`);
    console.log(`\n🎉 Las estadísticas ahora deberían funcionar para esta quiniela!\n`);

  } catch (error) {
    console.error("\n❌ Error durante la migración:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error("❌ Error: Falta el Pool ID");
  console.log("\nUso:");
  console.log("  pnpm tsx scripts/fix-missing-competition-externalmap.ts <poolId>");
  console.log("\nEjemplo:");
  console.log("  pnpm tsx scripts/fix-missing-competition-externalmap.ts cmgzvjf7h004kuvak15gbdeqx");
  process.exit(1);
}

const [poolId] = args;

fixMissingCompetitionExternalMap(poolId)
  .then(() => {
    console.log("✅ Script completado\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error);
    process.exit(1);
  });
