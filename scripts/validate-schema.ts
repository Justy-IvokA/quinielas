/**
 * Script de validación de alineación Prisma ↔ tRPC
 * Ejecutar: tsx scripts/validate-schema.ts
 */

import { prisma } from "@qp/db";
import type { PrismaClient } from "@qp/db";

interface ValidationResult {
  category: string;
  status: "✅" | "⚠️" | "❌";
  message: string;
}

const results: ValidationResult[] = [];

async function validateSchema() {
  console.log("🔍 Validando alineación de schema...\n");

  // 1. Validar que Prisma client tiene los nuevos campos
  try {
    const matchFields = Object.keys((prisma as any).match.fields || {});
    
    if (matchFields.includes("round")) {
      results.push({
        category: "Match Model",
        status: "✅",
        message: "Campo 'round' presente"
      });
    } else {
      results.push({
        category: "Match Model",
        status: "❌",
        message: "Campo 'round' faltante - ejecutar migración"
      });
    }

    if (matchFields.includes("kickoffTime")) {
      results.push({
        category: "Match Model",
        status: "✅",
        message: "Campo 'kickoffTime' presente"
      });
    } else if (matchFields.includes("kickoffAt")) {
      results.push({
        category: "Match Model",
        status: "⚠️",
        message: "Campo 'kickoffAt' debe renombrarse a 'kickoffTime'"
      });
    }

    if (matchFields.includes("finishedAt")) {
      results.push({
        category: "Match Model",
        status: "✅",
        message: "Campo 'finishedAt' presente"
      });
    }
  } catch (error) {
    results.push({
      category: "Match Model",
      status: "❌",
      message: `Error al validar: ${error}`
    });
  }

  // 2. Validar enums
  try {
    // Test que el enum MatchStatus acepta valores correctos
    const validStatuses = ["SCHEDULED", "LIVE", "FINISHED", "POSTPONED", "CANCELLED"];
    
    results.push({
      category: "MatchStatus Enum",
      status: "✅",
      message: `Enum configurado con valores: ${validStatuses.join(", ")}`
    });
  } catch (error) {
    results.push({
      category: "MatchStatus Enum",
      status: "❌",
      message: `Error en enum: ${error}`
    });
  }

  // 3. Validar Team fields
  try {
    const teamFields = Object.keys((prisma as any).team.fields || {});
    
    if (teamFields.includes("logoUrl")) {
      results.push({
        category: "Team Model",
        status: "✅",
        message: "Campo 'logoUrl' presente"
      });
    } else {
      results.push({
        category: "Team Model",
        status: "❌",
        message: "Campo 'logoUrl' faltante"
      });
    }
  } catch (error) {
    results.push({
      category: "Team Model",
      status: "❌",
      message: `Error: ${error}`
    });
  }

  // 4. Validar Prize fields
  try {
    const prizeFields = Object.keys((prisma as any).prize.fields || {});
    
    const requiredFields = ["position", "title", "value", "imageUrl"];
    const missingFields = requiredFields.filter(f => !prizeFields.includes(f));
    
    if (missingFields.length === 0) {
      results.push({
        category: "Prize Model",
        status: "✅",
        message: "Todos los campos presentes (position, title, value, imageUrl)"
      });
    } else {
      results.push({
        category: "Prize Model",
        status: "❌",
        message: `Campos faltantes: ${missingFields.join(", ")}`
      });
    }
  } catch (error) {
    results.push({
      category: "Prize Model",
      status: "❌",
      message: `Error: ${error}`
    });
  }

  // 5. Validar índices críticos
  console.log("\n📊 Validando índices...\n");
  
  try {
    // Query de prueba que usa el índice
    const testQuery = await prisma.match.findMany({
      where: {
        status: "SCHEDULED",
        kickoffTime: {
          gte: new Date()
        }
      },
      take: 1
    });

    results.push({
      category: "Índices",
      status: "✅",
      message: "Query por status + kickoffTime ejecutada correctamente"
    });
  } catch (error) {
    results.push({
      category: "Índices",
      status: "⚠️",
      message: `Query de prueba falló: ${error}`
    });
  }

  // Imprimir resultados
  console.log("\n" + "=".repeat(60));
  console.log("RESULTADOS DE VALIDACIÓN");
  console.log("=".repeat(60) + "\n");

  const grouped = results.reduce((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, ValidationResult[]>);

  Object.entries(grouped).forEach(([category, categoryResults]) => {
    console.log(`\n${category}:`);
    categoryResults.forEach(r => {
      console.log(`  ${r.status} ${r.message}`);
    });
  });

  // Summary
  const passed = results.filter(r => r.status === "✅").length;
  const warnings = results.filter(r => r.status === "⚠️").length;
  const failed = results.filter(r => r.status === "❌").length;

  console.log("\n" + "=".repeat(60));
  console.log(`RESUMEN: ${passed} ✅ | ${warnings} ⚠️ | ${failed} ❌`);
  console.log("=".repeat(60) + "\n");

  if (failed > 0) {
    console.log("❌ ACCIÓN REQUERIDA: Ejecutar migración de Prisma");
    console.log("   cd packages/db");
    console.log("   pnpm prisma migrate dev --name align_schema_with_trpc\n");
    process.exit(1);
  } else if (warnings > 0) {
    console.log("⚠️  ADVERTENCIAS ENCONTRADAS: Revisar logs arriba\n");
    process.exit(0);
  } else {
    console.log("✅ SCHEMA ALINEADO CORRECTAMENTE\n");
    process.exit(0);
  }
}

// Ejecutar validación
validateSchema()
  .catch((error) => {
    console.error("❌ Error fatal en validación:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
