import type { SportsProvider } from "./provider";
import { MockSportsProvider } from "./mock";
import { APIFootballProvider } from "./api-football";

export * from "./provider";
export * from "./extended-provider";
export * from "./mock";
export * from "./api-football";
export * from "./cache";

/**
 * Get sports provider based on configuration
 */
export function getSportsProvider(config: {
  provider: "mock" | "api-football" | "sportmonks";
  apiKey?: string;
}): SportsProvider {
  switch (config.provider) {
    case "api-football":
      if (!config.apiKey) {
        throw new Error("API key is required for api-football provider");
      }
      return new APIFootballProvider({ apiKey: config.apiKey });

    case "sportmonks":
      // TODO: Implement SportMonks provider
      throw new Error("SportMonks provider not yet implemented");

    case "mock":
    default:
      return new MockSportsProvider();
  }
}
