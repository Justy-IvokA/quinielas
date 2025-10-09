import { createEnv } from "@qp/config/env";
import { adminEnvSchema } from "./schema";

export const adminEnv = createEnv({
  schema: adminEnvSchema
});
