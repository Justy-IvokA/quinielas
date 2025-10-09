import { describe, expect, it } from "vitest";

import { appRouter } from "../routers";
import { createContext } from "../context";

describe("health router", () => {
  it("returns ok true", async () => {
    const caller = appRouter.createCaller(await createContext());
    const result = await caller.health();
    expect(result).toEqual({ ok: true });
  });
});
