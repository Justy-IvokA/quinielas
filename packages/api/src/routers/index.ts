import { router } from "../trpc";
import { accessRouter } from "./access";
import { fixturesRouter } from "./fixtures";
import { healthProcedure } from "./health";
import { poolsRouter } from "./pools";
import { registrationRouter } from "./registration";
import { usersRouter } from "./users";

export const appRouter = router({
  health: healthProcedure,
  access: accessRouter,
  pools: poolsRouter,
  registration: registrationRouter,
  fixtures: fixturesRouter,
  users: usersRouter
});

export type AppRouter = typeof appRouter;

// Export for server-side usage
export { createContext } from "../context";
