import { publicProcedure, router } from "../trpc";

export const authRouter = router({
  /**
   * Get current session
   */
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
});
