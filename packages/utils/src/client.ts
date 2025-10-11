/**
 * Client-safe utilities
 * These can be imported in "use client" components
 */

// Export media URL utilities (no Node.js dependencies)
export * from "./media-url";

// Export sports utilities (pure functions)
export * from "./sports";

// Re-export noop
export const noop = () => undefined;
