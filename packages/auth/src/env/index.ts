import { createEnv } from "@qp/config/env";
import { authEnvSchema } from "./schema";

export const authEnv = createEnv({
  schema: authEnvSchema
});
