import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@qp/db";
import { authConfig } from "@qp/api/context";
import { createAuthInstance } from "@qp/auth";
import { applyBrandTheme, resolveTheme } from "@qp/branding";
import { getCaptchaLevel } from "@qp/api/lib/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qp/ui/components/card";
import { Separator } from "@qp/ui/components/separator";
import { EmailForm } from "./_components/email-form";
import { OAuthButtons } from "./_components/oauth-buttons";
import { sanitizeCallbackUrl } from "./_lib/callback-safe";
import { parseAuthEnv } from "@qp/auth";

interface SignInPageProps {
  params: {
    locale: string;
  };
  searchParams: {
    callbackUrl?: string;
    error?: string;
  };
}

async function getTenantFromHost(): Promise<{ tenantId: string | null; brandTheme: string }> {
  // In a real implementation, resolve from headers
  // For now, use a default or demo tenant
  const tenant = await prisma.tenant.findFirst({
    where: { slug: "demo" },
    include: {
      brands: {
        take: 1,
        select: {
          id: true,
          theme: true,
        },
      },
    },
  });

  if (!tenant) {
    return { tenantId: null, brandTheme: "" };
  }

  const brandTheme = tenant.brands[0]?.theme
    ? applyBrandTheme(resolveTheme(tenant.brands[0].theme as any))
    : applyBrandTheme(null);

  return {
    tenantId: tenant.id,
    brandTheme,
  };
}

async function getAvailableProviders(): Promise<string[]> {
  const env = parseAuthEnv();
  const providers: string[] = [];

  // Email is always available if configured
  if (env.EMAIL_SERVER_HOST && env.EMAIL_FROM) {
    providers.push("email");
  }

  // OAuth providers
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push("google");
  }

  if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
    providers.push("azure-ad");
  }

  return providers;
}

async function SignInContent({ params, searchParams }: SignInPageProps) {
  const t = await getTranslations("auth.signin");
  const { locale } = await params;
  const { callbackUrl, error } = await searchParams;

  // Check if already authenticated
  const auth = createAuthInstance(authConfig);
  const session = await auth();

  if (session?.user) {
    // Already logged in, redirect to dashboard or callback
    const finalCallbackUrl = callbackUrl || `/${locale}`;
    redirect(finalCallbackUrl);
  }

  // Get tenant and branding
  const { tenantId, brandTheme } = await getTenantFromHost();

  // Sanitize callback URL
  const safeCallbackUrl = await sanitizeCallbackUrl(
    callbackUrl,
    tenantId,
    `/${locale}`
  );

  // Get captcha settings
  const captchaLevel = await getCaptchaLevel({ tenantId: tenantId || undefined });
  const requireCaptcha = captchaLevel === "force";

  // Get available providers
  const providers = await getAvailableProviders();
  const oauthProviders = providers.filter((p) => p !== "email");
  const hasEmail = providers.includes("email");

  return (
    <>
      {/* Inject brand theme */}
      {brandTheme && (
        <style dangerouslySetInnerHTML={{ __html: brandTheme }} />
      )}

      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Email Magic Link Form */}
            {hasEmail && (
              <EmailForm
                callbackUrl={safeCallbackUrl}
                requireCaptcha={requireCaptcha}
              />
            )}

            {/* Divider */}
            {hasEmail && oauthProviders.length > 0 && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t("orContinueWith")}
                  </span>
                </div>
              </div>
            )}

            {/* OAuth Buttons */}
            <OAuthButtons
              callbackUrl={safeCallbackUrl}
              providers={oauthProviders}
            />

            {/* Legal Notice */}
            <p className="text-center text-xs text-muted-foreground">
              {t.rich("legal", {
                terms: (chunks) => (
                  <a
                    href="/terms"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {t("termsLink")}
                  </a>
                ),
                privacy: (chunks) => (
                  <a
                    href="/privacy"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {t("privacyLink")}
                  </a>
                ),
              })}
            </p>

            {/* Error Display */}
            {error && (
              <div
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function SignInPage(props: SignInPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent {...props} />
    </Suspense>
  );
}
