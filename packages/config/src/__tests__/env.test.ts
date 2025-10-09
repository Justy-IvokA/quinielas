import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createEnv } from "../env";

const schema = z.object({
  EXAMPLE_VALUE: z.string().min(1)
});

describe("createEnv", () => {
  it("parses environment variables when valid", () => {
    const env = createEnv({ schema, runtimeEnv: { EXAMPLE_VALUE: "demo" }, skipValidation: false });
    expect(env.EXAMPLE_VALUE).toBe("demo");
  });

  it("throws descriptive error when validation fails", () => {
    expect(() => createEnv({ schema, runtimeEnv: {}, skipValidation: false })).toThrowErrorMatchingInlineSnapshot(
      `"❌ Invalid environment variables:\n{\n  \"EXAMPLE_VALUE\": {\n    \"_errors\": [\n      \"Required\"\n    ]\n  }\n}\n"`
    );
  });
});
