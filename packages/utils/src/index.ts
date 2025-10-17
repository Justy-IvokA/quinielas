export const noop = () => undefined;

// Export email utilities (SERVER ONLY - uses nodemailer)
export * from "./email";

// Export sports utilities
export * from "./sports";

// Export CSV utilities
export * from "./csv";

// Export media URL utilities (CLIENT SAFE)
export * from "./media-url";

// Export storage utilities (SERVER ONLY)
export * from "./storage/adapter";

// Export slug utilities (CLIENT SAFE)
export * from "./lib/slug";
