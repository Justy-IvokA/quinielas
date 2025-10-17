import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { authConfig } from "@qp/api/context";
import { createAuthInstance, getDefaultRedirectForRole } from "@qp/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qp/ui/components/card";
import { Separator } from "@qp/ui/components/separator";
import { EmailForm } from "./_components/email-form";
import { OAuthButtons } from "./_components/oauth-buttons";
import { sanitizeCallbackUrl } from "./_lib/callback-safe";
import { parseAuthEnv } from "@qp/auth";
import { Shield } from "lucide-react";

interface SignInPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
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
    // Already logged in, redirect based on role
    const defaultRedirect = getDefaultRedirectForRole(session.user.highestRole, locale);
    const finalCallbackUrl = callbackUrl || defaultRedirect;
    redirect(finalCallbackUrl);
  }

  // Sanitize callback URL (admin doesn't need tenant context for validation)
  const safeCallbackUrl = await sanitizeCallbackUrl(
    callbackUrl,
    null,
    `/${locale}/`
  );

  // Get available providers
  const providers = await getAvailableProviders();
  const oauthProviders = providers.filter((p) => p !== "email");
  const hasEmail = providers.includes("email");

  // Admin always requires captcha off for convenience (can be changed)
  const requireCaptcha = false;

  return (
    <>
      {/* Animated background gradients - uses brand primary color */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary))/20%,_transparent_50%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[600px] bg-[radial-gradient(ellipse_at_bottom,_hsl(var(--accent))/15%,_transparent_50%)]" />
        <div className="absolute right-0 top-1/4 h-96 w-96 bg-[radial-gradient(circle,_hsl(var(--primary))/15%,_transparent_70%)] blur-3xl" />
        <div className="absolute left-0 bottom-1/4 h-96 w-96 bg-[radial-gradient(circle,_hsl(var(--accent))/15%,_transparent_70%)] blur-3xl" />
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card variant="glass" className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
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
