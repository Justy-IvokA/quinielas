import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env file
config({ path: resolve(__dirname, "../.env") });

import { lockPredictionsJob } from "./jobs/lock-predictions";
import { syncFixturesJob } from "./jobs/sync-fixtures";
import { autoSyncFixturesJob } from "./jobs/auto-sync-fixtures";
import { updateLiveMatchesJob } from "./jobs/update-live-matches";
import { scoreFinalJob } from "./jobs/score-final";
import { leaderboardSnapshotJob } from "./jobs/leaderboard-snapshot";
import { prisma } from "@qp/db";

console.log("🚀 Iniciando Worker...");
console.log(`📊 Proveedor de deportes: ${process.env.SPORTS_PROVIDER || "mock"}`);
console.log(`🔑 API Key configurada: ${process.env.SPORTS_API_KEY ? "✅ Si" : "❌ No"}`);

// Default cron schedules
const DEFAULT_CRONS = {
  "sync:lock-predictions:cron": "* * * * *", // Every minute
  "sync:update-live-matches:cron": "*/5 * * * *", // Every 5 minutes
  "sync:score-final:cron": "*/5 * * * *", // Every 5 minutes (offset by 2 min in code)
  "sync:leaderboard-snapshot:cron": "*/10 * * * *", // Every 10 minutes
  "sync:auto-sync-fixtures:cron": "0 */6 * * *", // Every 6 hours
};

// Parse cron string to milliseconds (simplified - assumes fixed intervals)
function cronToMs(cron: string): number {
  const parts = cron.split(" ");
  const minute = parts[0];
  const hour = parts[1];

  // Handle common patterns
  if (minute === "*" && hour === "*") return 60 * 1000; // Every minute
  if (minute === "*/5") return 5 * 60 * 1000; // Every 5 minutes
  if (minute === "*/10") return 10 * 60 * 1000; // Every 10 minutes
  if (minute === "0" && hour === "*/6") return 6 * 60 * 60 * 1000; // Every 6 hours
  if (minute === "0" && hour === "*/12") return 12 * 60 * 60 * 1000; // Every 12 hours
  if (minute === "0" && hour === "*") return 60 * 60 * 1000; // Every hour
  if (minute === "0" && hour === "0") return 24 * 60 * 60 * 1000; // Daily

  // Default fallback
  return 60 * 1000;
}

function msToSecondsOrMinutes(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  return days > 0 ? `${days}d` : hours > 0 ? `${hours}h` : minutes > 0 ? `${minutes}min` : `${seconds}s`;
}

// Fetch sync settings from database
async function loadSyncSettings() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        scope: "GLOBAL",
        key: {
          startsWith: "sync:",
        },
      },
    });

    const cronSettings: Record<string, string> = { ...DEFAULT_CRONS };
    settings.forEach((setting) => {
      cronSettings[setting.key] = String(setting.value);
    });

    console.log("[Worker] Cargando configuraciones SYNC de la base de datos");
    return cronSettings;
  } catch (error) {
    console.warn("[Worker] Error al cargar configuraciones SYNC de la base de datos, usando defaults:", error);
    return DEFAULT_CRONS;
  }
}

let syncSettings: Record<string, string> = DEFAULT_CRONS;

// Initialize worker with settings from database
async function initializeWorker() {
  console.log("[Worker] Inicializando con configuraciones SYNC de la base de datos...");
  syncSettings = await loadSyncSettings();

  // Schedule lock predictions job
  const lockPredictionsMs = cronToMs(syncSettings["sync:lock-predictions:cron"]);
  console.log(`[Worker] Bloqueo de predicciones cada ${msToSecondsOrMinutes(lockPredictionsMs)}`);
  setInterval(async () => {
    try {
      await lockPredictionsJob();
    } catch (error) {
      console.error("[Worker] Error en bloqueo de predicciones:", error);
    }
  }, lockPredictionsMs);

  // Schedule live matches update job
  const updateLiveMatchesMs = cronToMs(syncSettings["sync:update-live-matches:cron"]);
  console.log(`[Worker] Actualización de partidos en vivo cada ${msToSecondsOrMinutes(updateLiveMatchesMs)}`);
  setInterval(async () => {
    try {
      await updateLiveMatchesJob();
    } catch (error) {
      console.error("[Worker] Error en actualización de partidos en vivo:", error);
    }
  }, updateLiveMatchesMs);

  // Schedule scoring job (offset by 2 minutes)
  const scoreFinalMs = cronToMs(syncSettings["sync:score-final:cron"]);
  console.log(`[Worker] Puntuación final cada ${msToSecondsOrMinutes(scoreFinalMs)} (offset 2min)`);
  setTimeout(() => {
    setInterval(async () => {
      try {
        await scoreFinalJob();
      } catch (error) {
        console.error("[Worker] Error en puntuación final:", error);
      }
    }, scoreFinalMs);
  }, 2 * 60 * 1000);

  // Schedule leaderboard snapshot job
  const leaderboardSnapshotMs = cronToMs(syncSettings["sync:leaderboard-snapshot:cron"]);
  console.log(`[Worker] Captura de tablas cada ${msToSecondsOrMinutes(leaderboardSnapshotMs)}`);
  setInterval(async () => {
    try {
      await leaderboardSnapshotJob();
    } catch (error) {
      console.error("[Worker] Error en captura de tablas:", error);
    }
  }, leaderboardSnapshotMs);

  // Schedule auto fixtures sync job
  const autoSyncFixturesMs = cronToMs(syncSettings["sync:auto-sync-fixtures:cron"]);
  console.log(`[Worker] Sincronización de partidos cada ${msToSecondsOrMinutes(autoSyncFixturesMs)}`);
  setInterval(async () => {
    try {
      await autoSyncFixturesJob();
    } catch (error) {
      console.error("[Worker] Error en sincronización de partidos:", error);
    }
  }, autoSyncFixturesMs);

  // Run initial updates on startup
  setTimeout(async () => {
    try {
      console.log("[Worker] Ejecutando actualización inicial de partidos en vivo...");
      await updateLiveMatchesJob();
    } catch (error) {
      console.error("[Worker] Error en actualización inicial de partidos en vivo:", error);
    }
  }, 10 * 1000);

  setTimeout(async () => {
    try {
      console.log("[Worker] Ejecutando puntuación inicial...");
      await scoreFinalJob();
    } catch (error) {
      console.error("[Worker] Error en puntuación inicial:", error);
    }
  }, 15 * 1000);

  setTimeout(async () => {
    try {
      console.log("[Worker] Ejecutando sincronización inicial de partidos...");
      await autoSyncFixturesJob();
    } catch (error) {
      console.error("[Worker] Error en sincronización inicial de partidos:", error);
    }
  }, 30 * 1000);

  console.log("✅ Worker jobs agendados correctamente");
  console.log(`  - Bloqueo de predicciones: cada ${msToSecondsOrMinutes(lockPredictionsMs)}`);
  console.log(`  - Actualización de partidos en vivo: cada ${msToSecondsOrMinutes(updateLiveMatchesMs)} (+ al arranque)`);
  console.log(`  - Puntuación final: cada ${msToSecondsOrMinutes(scoreFinalMs)} (+ al arranque, 2min)`);
  console.log(`  - Captura de tablas: cada ${msToSecondsOrMinutes(leaderboardSnapshotMs)}`);
  console.log(`  - Sincronización de partidos: cada ${msToSecondsOrMinutes(autoSyncFixturesMs)} (+ al arranque)`);
}

// Start the worker
initializeWorker().catch((error) => {
  console.error("[Worker] ❌ Error al iniciar:", error);
  console.warn("[Worker] ⚠️ Continuará con los cron por defecto");
  // Don't exit - worker will continue with DEFAULT_CRONS
});

// Keep process alive
process.on("SIGINT", () => {
  console.log("👋 Cerrando Worker...");
  process.exit(0);
});

// Export jobs for manual triggering
export { 
  lockPredictionsJob, 
  syncFixturesJob, 
  updateLiveMatchesJob,
  scoreFinalJob, 
  leaderboardSnapshotJob 
};
