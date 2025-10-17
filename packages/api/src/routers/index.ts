import { router } from "../trpc";
import { accessRouter } from "./access";
import { authRouter } from "./auth";
import { fixturesRouter } from "./fixtures";
import { healthProcedure } from "./health";
import { poolsRouter } from "./pools";
import { poolWizardRouter } from "./pool-wizard";
import { registrationRouter } from "./registration";
import { usersRouter } from "./users";
import { userRouter } from "./user";
import { predictionsRouter } from "./predictions";
import { leaderboardRouter } from "./leaderboard";
import { participantsRouter } from "./participants";
import { syncRouter } from "./sync";
import { prizesRouter } from "./prizes";
import { awardsRouter } from "./awards";
import { analyticsRouter } from "./analytics";
import { tenantRouter } from "./tenant";
import { settingsRouter } from "./settings";
import { policiesRouter } from "./policies";
import { consentRouter } from "./consent";
import { auditRouter } from "./audit";
import { brandingRouter } from "./branding";
import { userPoolsRouter } from "./userPools";

export const appRouter = router({
  health: healthProcedure,
  auth: authRouter,
  access: accessRouter,
  pools: poolsRouter,
  poolWizard: poolWizardRouter,
  registration: registrationRouter,
  fixtures: fixturesRouter,
  users: usersRouter,
  user: userRouter,
  predictions: predictionsRouter,
  leaderboard: leaderboardRouter,
  participants: participantsRouter,
  sync: syncRouter,
  prizes: prizesRouter,
  awards: awardsRouter,
  analytics: analyticsRouter,
  tenant: tenantRouter,
  settings: settingsRouter,
  policies: policiesRouter,
  consent: consentRouter,
  audit: auditRouter,
  branding: brandingRouter,
  userPools: userPoolsRouter,
});

export type AppRouter = typeof appRouter;

// Export for server-side usage
export { createContext } from "../context";
