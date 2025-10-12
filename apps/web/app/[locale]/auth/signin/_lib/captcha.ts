/**
 * Captcha adapter for hCaptcha/Turnstile
 * Stub implementation - integrate with actual provider when needed
 */

export type CaptchaProvider = "hcaptcha" | "turnstile" | "none";

export interface CaptchaConfig {
  provider: CaptchaProvider;
  siteKey?: string;
  secretKey?: string;
}

/**
 * Verify captcha token with provider
 * @param token - Captcha response token
 * @param config - Captcha configuration
 * @returns true if valid, false otherwise
 */
export async function verifyCaptcha(
  token: string | null | undefined,
  config: CaptchaConfig
): Promise<boolean> {
  if (config.provider === "none" || !token) {
    return false;
  }

  // Stub: In production, verify with actual provider API
  // hCaptcha: https://docs.hcaptcha.com/#verify-the-user-response-server-side
  // Turnstile: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

  if (process.env.NODE_ENV === "development") {
    // Accept any token in development
    return true;
  }

  try {
    if (config.provider === "hcaptcha" && config.secretKey) {
      const response = await fetch("https://hcaptcha.com/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: config.secretKey,
          response: token,
        }),
      });

      const data = await response.json();
      return data.success === true;
    }

    if (config.provider === "turnstile" && config.secretKey) {
      const response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: config.secretKey,
            response: token,
          }),
        }
      );

      const data = await response.json();
      return data.success === true;
    }

    return false;
  } catch (error) {
    console.error("[captcha] Verification error:", error);
    return false;
  }
}

/**
 * Get captcha configuration from environment
 */
export function getCaptchaConfig(): CaptchaConfig {
  const provider = (process.env.CAPTCHA_PROVIDER || "none") as CaptchaProvider;

  return {
    provider,
    siteKey: process.env.CAPTCHA_SITE_KEY,
    secretKey: process.env.CAPTCHA_SECRET_KEY,
  };
}
