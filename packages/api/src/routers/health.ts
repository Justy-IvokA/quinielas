import { publicProcedure } from "../trpc";

export const healthProcedure = publicProcedure.query(() => ({ ok: true }));
