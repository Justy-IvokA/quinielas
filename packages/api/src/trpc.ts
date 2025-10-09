import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { AppContext } from "./context";

const t = initTRPC.context<AppContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause
      }
    };
  }
});

export const router = t.router;
export const procedure = t.procedure;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Re-export createCallerFactory for testing
export const createCallerFactory = t.createCallerFactory;
