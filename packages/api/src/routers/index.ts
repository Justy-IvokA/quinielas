import { router } from "../trpc";
import { accessRouter } from "./access";
import { authRouter } from "./auth";
import { fixturesRouter } from "./fixtures";
import { healthProcedure } from "./health";
import { poolsRouter } from "./pools";
import { registrationRouter } from "./registration";
import { usersRouter } from "./users";
import { predictionsRouter } from "./predictions";
import { leaderboardRouter } from "./leaderboard";
import { syncRouter } from "./sync";
import { prizesRouter } from "./prizes";
import { awardsRouter } from "./awards";
import { analyticsRouter } from "./analytics";
import { tenantRouter } from "./tenant";
import { settingsRouter } from "./settings";
import { policiesRouter } from "./policies";
import { consentRouter } from "./consent";
import { auditRouter } from "./audit";

export const appRouter = router({
  health: healthProcedure,
  auth: authRouter,
  access: accessRouter,
  pools: poolsRouter,
  registration: registrationRouter,
  fixtures: fixturesRouter,
  users: usersRouter,
  predictions: predictionsRouter,
  leaderboard: leaderboardRouter,
  sync: syncRouter,
  prizes: prizesRouter,
  awards: awardsRouter,
  analytics: analyticsRouter,
  tenant: tenantRouter,
  settings: settingsRouter,
  policies: policiesRouter,
  consent: consentRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;

// Export for server-side usage
export { createContext } from "../context";
