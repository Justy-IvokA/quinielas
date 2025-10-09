import { createEnv } from "@qp/config/env";
import { webEnvSchema } from "./schema";

export const webEnv = createEnv({
  schema: webEnvSchema
});
