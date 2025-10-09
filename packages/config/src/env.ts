import { z } from "zod";

type RuntimeEnv = Record<string, string | undefined>;

interface CreateEnvOptions<T extends z.ZodRawShape> {
  schema: z.ZodObject<T>;
  runtimeEnv?: RuntimeEnv;
  skipValidation?: boolean;
}

export const createEnv = <T extends z.ZodRawShape>({
  schema,
  runtimeEnv,
  skipValidation = process.env.NODE_ENV === "test"
}: CreateEnvOptions<T>) => {
  if (skipValidation) {
    return schema.parse(runtimeEnv ?? process.env);
  }

  const parsed = schema.safeParse(runtimeEnv ?? process.env);

  if (!parsed.success) {
    const formatted = parsed.error.format();
    throw new Error(
      `❌ Invalid environment variables:\n${JSON.stringify(formatted, null, 2)}\n`
    );
  }

  return parsed.data;
};
