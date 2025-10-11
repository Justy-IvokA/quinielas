#!/usr/bin/env tsx
/**
 * Script de prueba para API-Football (API-Sports v3)
 * Verifica que la API key funciona correctamente
 * 
 * Uso:
 *   pnpm tsx scripts/test-api-football.ts
 * 
 * O con API key específica:
 *   SPORTS_API_KEY=tu-key pnpm tsx scripts/test-api-football.ts
 */

import { config } from "dotenv";

// Cargar variables de entorno
config({ path: ".env" });
config({ path: "apps/worker/.env" });

const API_KEY = process.env.SPORTS_API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

// Colores para consola
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(
  name: string,
  endpoint: string,
  params: Record<string, string>
): Promise<boolean> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  log(`\n🔍 Probando: ${name}`, "cyan");
  log(`   URL: ${url.toString()}`, "blue");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "x-apisports-key": API_KEY!
      }
    });

    log(`   Status: ${response.status} ${response.statusText}`, 
      response.ok ? "green" : "red"
    );

    if (!response.ok) {
      const text = await response.text();
      log(`   Error: ${text}`, "red");
      return false;
    }

    const data = await response.json();

    // Verificar estructura de respuesta
    if (!data.response) {
      log(`   ⚠️  Respuesta sin campo 'response'`, "yellow");
      log(`   Data: ${JSON.stringify(data, null, 2)}`, "yellow");
      return false;
    }

    log(`   ✅ Resultados: ${data.results}`, "green");
    log(`   ✅ Datos recibidos: ${data.response.length} items`, "green");

    // Mostrar primer resultado
    if (data.response.length > 0) {
      log(`   📋 Primer resultado:`, "blue");
      console.log(JSON.stringify(data.response[0], null, 2));
    }

    // Mostrar info de rate limit si está disponible
    const remaining = response.headers.get("x-ratelimit-requests-remaining");
    const limit = response.headers.get("x-ratelimit-requests-limit");
    if (remaining && limit) {
      log(`   📊 Rate Limit: ${remaining}/${limit} requests restantes`, "cyan");
    }

    return true;
  } catch (error) {
    log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`, "red");
    return false;
  }
}

async function main() {
  log("\n" + "=".repeat(60), "cyan");
  log("🧪 API-Football Test Script", "cyan");
  log("=".repeat(60), "cyan");

  // Verificar API key
  if (!API_KEY) {
    log("\n❌ ERROR: SPORTS_API_KEY no está configurada", "red");
    log("\nConfigura tu API key:", "yellow");
    log("  1. Obtén tu key en: https://dashboard.api-football.com/", "yellow");
    log("  2. Crea archivo .env con: SPORTS_API_KEY=tu-key", "yellow");
    log("  3. O ejecuta: SPORTS_API_KEY=tu-key pnpm tsx scripts/test-api-football.ts", "yellow");
    process.exit(1);
  }

  log(`\n✅ API Key encontrada: ${API_KEY.substring(0, 10)}...`, "green");
  log(`📡 Base URL: ${BASE_URL}`, "blue");

  const tests = [
    {
      name: "Status de la API",
      endpoint: "/status",
      params: {}
    },
    {
      name: "Timezone (verificar acceso básico)",
      endpoint: "/timezone",
      params: {}
    },
    {
      name: "World Cup 2026",
      endpoint: "/leagues",
      params: { id: "1", season: "2026" }
    },
    {
      name: "Equipos World Cup 2026",
      endpoint: "/teams",
      params: { league: "1", season: "2026" }
    },
    {
      name: "Fixtures World Cup 2026 (primeros 10)",
      endpoint: "/fixtures",
      params: { league: "1", season: "2026" }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const success = await testEndpoint(test.name, test.endpoint, test.params);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    
    // Esperar 1 segundo entre requests para no saturar
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Resumen
  log("\n" + "=".repeat(60), "cyan");
  log("📊 RESUMEN", "cyan");
  log("=".repeat(60), "cyan");
  log(`✅ Pruebas exitosas: ${passed}`, "green");
  log(`❌ Pruebas fallidas: ${failed}`, failed > 0 ? "red" : "green");

  if (failed === 0) {
    log("\n🎉 ¡Todas las pruebas pasaron! Tu API key funciona correctamente.", "green");
    log("\nPróximos pasos:", "cyan");
    log("  1. Configura SPORTS_PROVIDER=api-football en tus .env", "blue");
    log("  2. Ejecuta: pnpm tsx apps/worker/src/index.ts sync-fixtures", "blue");
  } else {
    log("\n⚠️  Algunas pruebas fallaron. Verifica:", "yellow");
    log("  1. Tu API key es válida", "yellow");
    log("  2. Tienes requests disponibles en tu plan", "yellow");
    log("  3. La URL base es correcta: https://v3.football.api-sports.io", "yellow");
  }

  log("\n" + "=".repeat(60) + "\n", "cyan");

  process.exit(failed > 0 ? 1 : 0);
}

// Ejecutar
main().catch((error) => {
  log(`\n❌ Error fatal: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
