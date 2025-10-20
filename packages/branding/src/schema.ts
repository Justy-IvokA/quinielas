import { z } from "zod";

/**
 * Validates hex color format (#RRGGBB or RRGGBB)
 */
const hexColorSchema = z.string().regex(/^#?[0-9A-Fa-f]{6}$/, "Invalid hex color format");

/**
 * Validates HSL color format (h s% l%)
 */
const hslColorSchema = z.string().regex(/^\d+\s+\d+%\s+\d+%$/, "Invalid HSL color format");

/**
 * Accepts either hex or HSL color format
 */
const colorSchema = z.union([hexColorSchema, hslColorSchema]);

/**
 * Validates URL format and prevents unsafe protocols
 */
const safeUrlSchema = z
  .string()
  .url()
  .refine(
    (url) => {
      const lower = url.toLowerCase();
      return lower.startsWith("https://") || lower.startsWith("http://");
    },
    { message: "Only HTTP(S) URLs are allowed" }
  )
  .refine(
    (url) => {
      const lower = url.toLowerCase();
      return !lower.startsWith("javascript:") && !lower.startsWith("data:");
    },
    { message: "Unsafe URL protocol detected" }
  );

/**
 * Optional safe URL (can be null or empty)
 */
const optionalSafeUrlSchema = z.union([safeUrlSchema, z.literal(""), z.null()]).optional();

/**
 * Brand theme colors schema
 */
export const brandColorsSchema = z.object({
  primary: colorSchema,
  secondary: colorSchema,
  background: colorSchema,
  foreground: colorSchema,
  accent: colorSchema,
  card: colorSchema.optional(),
  muted: colorSchema.optional(),
  border: colorSchema.optional(),
  input: colorSchema.optional(),
  ring: colorSchema.optional(),
  primaryForeground: colorSchema.optional(),
  secondaryForeground: colorSchema.optional(),
  accentForeground: colorSchema.optional(),
  mutedForeground: colorSchema.optional(),
  destructive: colorSchema.optional(),
  destructiveForeground: colorSchema.optional(),
  cardForeground: colorSchema.optional(),
  popover: colorSchema.optional(),
  popoverForeground: colorSchema.optional()
});

/**
 * Logo configuration schema
 */
export const logoSchema = z.object({
  url: safeUrlSchema,
  alt: z.string().optional()
});

/**
 * Logotype configuration schema (optional text-based logo)
 */
export const logotypeSchema = z.object({
  url: safeUrlSchema,
  alt: z.string().optional()
});

/**
 * Hero assets configuration schema
 */
export const heroAssetsSchema = z.object({
  kind: z.enum(["image", "video", "none"]),
  url: optionalSafeUrlSchema,
  alt: z.string().optional(), // For images
  poster: optionalSafeUrlSchema, // Video poster frame
  loop: z.boolean().optional().default(true),
  muted: z.boolean().optional().default(true),
  autoplay: z.boolean().optional().default(true),
  overlay: z.boolean().optional().default(false) // Apply gradient overlay
});

/**
 * Main card media configuration schema
 */
export const mainCardSchema = z.object({
  kind: z.enum(["image", "video", "none"]),
  url: optionalSafeUrlSchema,
  alt: z.string().optional(),
  poster: optionalSafeUrlSchema,
  loop: z.boolean().optional().default(true),
  muted: z.boolean().optional().default(true),
  autoplay: z.boolean().optional().default(false)
});

/**
 * Typography configuration schema
 */
export const typographySchema = z.object({
  fontFamily: z.string().min(1, "Font family is required"),
  headingsFamily: z.string().optional(),
  baseSize: z.string().optional().default("16px"),
  lineHeight: z.string().optional().default("1.5")
});

/**
 * Brand text content schema
 */
export const brandTextSchema = z.object({
  title: z.string().max(30, "El título no puede exceder 30 caracteres").optional(),
  description: z.string().max(255, "La descripción no puede exceder 255 caracteres").optional(),
  link: z.string().max(50, "El enlace no puede exceder 50 caracteres").optional(),
  slogan: z.string().max(75, "El eslogan no puede exceder 75 caracteres").optional(),
  paragraph: z.string().max(375, "El párrafo no puede exceder 375 caracteres").optional()
});

/**
 * Complete brand theme schema
 */
export const brandThemeSchema = z.object({
  colors: brandColorsSchema,
  logo: logoSchema,
  logotype: logotypeSchema.optional(),
  heroAssets: heroAssetsSchema,
  mainCard: mainCardSchema,
  typography: typographySchema,
  text: brandTextSchema.optional()
});

/**
 * Partial brand theme schema for updates (first level only)
 */
export const brandThemeUpdateSchema = brandThemeSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

/**
 * Deep partial brand theme schema for updates
 * Allows partial updates at all nesting levels (colors.primary, logo.url, etc.)
 */
export const brandThemeDeepUpdateSchema = z.object({
  colors: brandColorsSchema.partial().optional(),
  logo: logoSchema.partial().optional(),
  logotype: logotypeSchema.partial().optional(),
  heroAssets: heroAssetsSchema.partial().optional(),
  mainCard: mainCardSchema.partial().optional(),
  typography: typographySchema.partial().optional(),
  text: brandTextSchema.partial().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

/**
 * Media upload schema
 */
export const mediaUploadSchema = z.object({
  kind: z.enum(["logo", "logotype", "hero", "mainCard", "poster"]),
  contentType: z.enum([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "video/mp4",
    "video/webm"
  ]),
  size: z.number().positive(),
  filename: z.string().min(1)
});

/**
 * Type exports
 */
export type BrandColors = z.infer<typeof brandColorsSchema>;
export type Logo = z.infer<typeof logoSchema>;
export type Logotype = z.infer<typeof logotypeSchema>;
export type HeroAssets = z.infer<typeof heroAssetsSchema>;
export type MainCard = z.infer<typeof mainCardSchema>;
export type Typography = z.infer<typeof typographySchema>;
export type BrandText = z.infer<typeof brandTextSchema>;
export type BrandThemeInput = z.infer<typeof brandThemeSchema>;
export type BrandThemeUpdate = z.infer<typeof brandThemeUpdateSchema>;
export type MediaUpload = z.infer<typeof mediaUploadSchema>;

/**
 * Deep partial type helper for nested objects
 */
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

/**
 * Helper types with all fields optional (for editing)
 * This allows partial updates while maintaining type safety
 */
export type BrandColorsPartial = DeepPartial<BrandColors>;
export type LogoPartial = DeepPartial<Logo>;
export type LogotypePartial = DeepPartial<Logotype>;
export type HeroAssetsPartial = DeepPartial<HeroAssets>;
export type MainCardPartial = DeepPartial<MainCard>;
export type TypographyPartial = DeepPartial<Typography>;
export type BrandTextPartial = DeepPartial<BrandText>;

/**
 * Brand theme with deep partial support for editing
 */
export type BrandThemeInputPartial = DeepPartial<BrandThemeInput>;

/**
 * Default brand theme values
 */
export const defaultBrandTheme: BrandThemeInput = {
  colors: {
    primary: "221 83% 53%",
    secondary: "210 40% 96%",
    background: "0 0% 100%",
    foreground: "222 84% 5%",
    accent: "210 40% 96%",
    card: "0 0% 100%",
    muted: "210 40% 96%",
    border: "214 32% 91%",
    input: "214 32% 91%",
    ring: "221 83% 53%",
    primaryForeground: "210 40% 98%",
    secondaryForeground: "222 47% 11%",
    accentForeground: "222 47% 11%",
    mutedForeground: "215 16% 47%",
    destructive: "0 84% 60%",
    destructiveForeground: "210 40% 98%",
    cardForeground: "222 84% 5%",
    popover: "0 0% 100%",
    popoverForeground: "222 84% 5%"
  },
  logo: {
    url: "https://via.placeholder.com/256x256?text=Logo",
    alt: "Brand Logo"
  },
  heroAssets: {
    kind: "none",
    url: null,
    overlay: false,
    loop: true,
    muted: true,
    autoplay: true
  },
  mainCard: {
    kind: "none",
    url: null,
    loop: true,
    muted: true,
    autoplay: false
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    headingsFamily: "Inter, system-ui, sans-serif",
    baseSize: "16px",
    lineHeight: "1.5"
  },
  text: {
    title: "¡Únete Ahora!",
    description: "Completa tu registro para participar en esta quiniela exclusiva.",
    link: "",
    slogan: "Tu plataforma de quinielas deportivas",
    paragraph: "Participa, predice y gana. Únete a nuestra comunidad de apasionados del deporte."
  }
};
