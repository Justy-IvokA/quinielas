import { createTRPCReact } from "@trpc/react-query";

import type { AppRouter } from "@qp/api";

export const trpc = createTRPCReact<AppRouter>();
