/**
 * Brand theme colors for email templates
 */
export interface EmailBrandColors {
  /** Primary brand color (hex) */
  primary: string;
  /** Primary foreground color (hex) */
  primaryForeground: string;
  /** Background color (hex) */
  background: string;
  /** Foreground/text color (hex) */
  foreground: string;
  /** Muted background color (hex) */
  muted: string;
  /** Border color (hex) */
  border: string;
}

/**
 * Brand information for email templates
 */
export interface EmailBrandInfo {
  /** Brand name */
  name: string;
  /** Brand logo URL (optional) */
  logoUrl?: string;
  /** Brand theme colors */
  colors: EmailBrandColors;
}

/**
 * Supported locales for email templates
 */
export type EmailLocale = "es-MX" | "en-US";

/**
 * Base parameters for all email templates
 */
export interface BaseEmailParams {
  /** Brand information */
  brand: EmailBrandInfo;
  /** Locale for translations */
  locale: EmailLocale;
}

/**
 * Parameters for invitation email template
 */
export interface InvitationEmailParams extends BaseEmailParams {
  /** Pool name */
  poolName: string;
  /** Invitation URL with token */
  inviteUrl: string;
  /** Expiration date */
  expiresAt: Date;
}

/**
 * Parameters for invite code email template
 */
export interface InviteCodeEmailParams extends BaseEmailParams {
  /** Pool name */
  poolName: string;
  /** Invite code */
  code: string;
  /** Pool URL */
  poolUrl: string;
}

/**
 * Parameters for magic link email template
 */
export interface MagicLinkEmailParams extends BaseEmailParams {
  /** Magic link URL */
  url: string;
  /** User's email */
  email: string;
}

/**
 * Email template result
 */
export interface EmailTemplate {
  /** Email subject */
  subject: string;
  /** HTML body */
  html: string;
  /** Plain text body */
  text: string;
}
