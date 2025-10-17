import type { EmailLocale } from "./types";

/**
 * Email translations structure
 */
interface EmailTranslations {
  invitation: {
    subject: string;
    title: string;
    greeting: string;
    body: string;
    button: string;
    expiresNote: string;
    linkNote: string;
    footer: string;
  };
  inviteCode: {
    subject: string;
    title: string;
    body: string;
    codeLabel: string;
    button: string;
    footer: string;
  };
  magicLink: {
    subject: string;
    title: string;
    greeting: string;
    body: string;
    button: string;
    expiresNote: string;
    securityNote: string;
    linkNote: string;
    footer: string;
  };
  common: {
    platformName: string;
    poweredBy: string;
  };
}

/**
 * Spanish (Mexico) translations
 */
const esMX: EmailTranslations = {
  invitation: {
    subject: "Invitación a {poolName}",
    title: "¡Estás invitado!",
    greeting: "Hola,",
    body: "Has sido invitado a unirte a <strong>{poolName}</strong>. Haz clic en el botón de abajo para aceptar tu invitación y comenzar a hacer tus pronósticos:",
    button: "Aceptar Invitación",
    expiresNote: "Esta invitación expira el {date}.",
    linkNote: "Si el botón no funciona, copia y pega este enlace en tu navegador:",
    footer: "Plataforma de Quinielas Deportivas"
  },
  inviteCode: {
    subject: "Tu código de invitación para {poolName}",
    title: "Tu Código de Invitación",
    body: "Usa este código para unirte a <strong>{poolName}</strong>:",
    codeLabel: "Código de Invitación",
    button: "Unirme a la Quiniela",
    footer: "Plataforma de Quinielas Deportivas"
  },
  magicLink: {
    subject: "Tu enlace de acceso",
    title: "Iniciar Sesión",
    greeting: "Hola,",
    body: "Haz clic en el botón de abajo para iniciar sesión en tu cuenta:",
    button: "Iniciar Sesión",
    expiresNote: "Este enlace expira en 24 horas.",
    securityNote: "Si no solicitaste este enlace, puedes ignorar este correo de forma segura.",
    linkNote: "Si el botón no funciona, copia y pega este enlace en tu navegador:",
    footer: "Plataforma de Quinielas Deportivas"
  },
  common: {
    platformName: "Quinielas",
    poweredBy: "Desarrollado por"
  }
};

/**
 * English (United States) translations
 */
const enUS: EmailTranslations = {
  invitation: {
    subject: "Invitation to {poolName}",
    title: "You're Invited!",
    greeting: "Hello,",
    body: "You've been invited to join <strong>{poolName}</strong>. Click the button below to accept your invitation and start making predictions:",
    button: "Accept Invitation",
    expiresNote: "This invitation expires on {date}.",
    linkNote: "If the button doesn't work, copy and paste this link into your browser:",
    footer: "Sports Prediction Platform"
  },
  inviteCode: {
    subject: "Your invite code for {poolName}",
    title: "Your Invite Code",
    body: "Use this code to join <strong>{poolName}</strong>:",
    codeLabel: "Invite Code",
    button: "Join Pool",
    footer: "Sports Prediction Platform"
  },
  magicLink: {
    subject: "Your sign-in link",
    title: "Sign In",
    greeting: "Hello,",
    body: "Click the button below to sign in to your account:",
    button: "Sign In",
    expiresNote: "This link expires in 24 hours.",
    securityNote: "If you didn't request this link, you can safely ignore this email.",
    linkNote: "If the button doesn't work, copy and paste this link into your browser:",
    footer: "Sports Prediction Platform"
  },
  common: {
    platformName: "Quinielas",
    poweredBy: "Powered by"
  }
};

/**
 * All translations by locale
 */
const translations: Record<EmailLocale, EmailTranslations> = {
  "es-MX": esMX,
  "en-US": enUS
};

/**
 * Get translations for a specific locale
 */
export function getEmailTranslations(locale: EmailLocale): EmailTranslations {
  return translations[locale] || translations["es-MX"]; // Default to Spanish
}

/**
 * Replace placeholders in a string
 */
export function replacePlaceholders(
  text: string,
  replacements: Record<string, string>
): string {
  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}
