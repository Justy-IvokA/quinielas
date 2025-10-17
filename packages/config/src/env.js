export const createEnv = ({ schema, runtimeEnv, skipValidation = process.env.NODE_ENV === "test" }) => {
    if (skipValidation) {
        return schema.parse(runtimeEnv ?? process.env);
    }
    const parsed = schema.safeParse(runtimeEnv ?? process.env);
    if (!parsed.success) {
        const formatted = parsed.error.format();
        throw new Error(`❌ Invalid environment variables:\n${JSON.stringify(formatted, null, 2)}\n`);
    }
    return parsed.data;
};
//# sourceMappingURL=env.js.map