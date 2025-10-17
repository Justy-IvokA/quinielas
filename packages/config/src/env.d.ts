import { z } from "zod";
type RuntimeEnv = Record<string, string | undefined>;
interface CreateEnvOptions<T extends z.ZodRawShape> {
    schema: z.ZodObject<T>;
    runtimeEnv?: RuntimeEnv;
    skipValidation?: boolean;
}
export declare const createEnv: <T extends z.ZodRawShape>({ schema, runtimeEnv, skipValidation }: CreateEnvOptions<T>) => z.objectUtil.addQuestionMarks<z.baseObjectOutputType<T>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never;
export {};
//# sourceMappingURL=env.d.ts.map