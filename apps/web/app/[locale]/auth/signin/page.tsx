import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authConfig } from "@qp/api/context";
import { createAuthInstance, getDefaultRedirectForRole } from "@qp/auth";
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";
import { getCaptchaLevel } from "@qp/api/lib/settings";
import { getOptimizedMediaUrl } from "@qp/utils/client";
import { BrandThemeInjector } from "../../../components/brand-theme-injector";
import { SignInForm } from "./_components/signin-form";
import { sanitizeCallbackUrl } from "./_lib/callback-safe";
import { parseAuthEnv } from "@qp/auth";

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
  const { locale } = await params;
  const { callbackUrl, error } = await searchParams;

  // Check if already authenticated
  const auth = createAuthInstance(authConfig);
  const session = await auth();

  if (session?.user) {
    // Check if profile is complete (has name)
    if (!session.user.name) {
      // Profile incomplete, redirect to complete-profile
      const completeProfileUrl = `/${locale}/auth/complete-profile${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;
      redirect(completeProfileUrl);
    }
    
    // Already logged in with complete profile, redirect to dashboard or callback
    const defaultRedirect = getDefaultRedirectForRole(session.user.highestRole, locale);
    const finalCallbackUrl = callbackUrl || defaultRedirect;
    redirect(finalCallbackUrl);
  }

  // Resolve brand from host
  const headersList = await headers();
  let host = headersList.get("host") || "localhost";
  if (host.includes(":")) {
    host = host.split(":")[0];
  }
  const pathname = headersList.get("x-pathname") || "";
  
  const { tenant, brand } = await resolveTenantAndBrandFromHost(host, pathname);
  const tenantId = tenant?.id || null;

  // Default redirect is dashboard for authenticated users
  const defaultRedirect = `/${locale}/dashboard`;

  // Sanitize callback URL
  const safeCallbackUrl = await sanitizeCallbackUrl(
    callbackUrl,
    tenantId,
    defaultRedirect
  );

  // Get captcha settings
  const captchaLevel = await getCaptchaLevel({ tenantId: tenantId || undefined });
  const requireCaptcha = captchaLevel === "force";

  // Get available providers
  const providers = await getAvailableProviders();

  // Get hero assets from brand theme with URL optimization
  const heroAssets = brand?.theme && typeof brand.theme === 'object' 
    ? (brand.theme as any).heroAssets 
    : null;
  
  // Convert Google Drive URLs to direct download links
  const optimizedAssetUrl = getOptimizedMediaUrl(heroAssets?.assetUrl);
  const optimizedFallbackUrl = getOptimizedMediaUrl(heroAssets?.fallbackImageUrl);
  const hasHeroMedia = optimizedAssetUrl;

  return (
    <div className="relative isolate overflow-hidden min-h-screen">
      {/* Inject brand theme dynamically on client */}
      {brand?.theme && <BrandThemeInjector brandTheme={brand.theme} />}

      {/* Hero background media (video or image) */}
      {hasHeroMedia && (
        <div className="pointer-events-none fixed inset-0 -z-10">
          {heroAssets?.video ? (
            // Video background
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              poster={optimizedFallbackUrl || undefined}
            >
              <source src={optimizedAssetUrl} type="video/mp4" />
            </video>
          ) : (
            // Image background
            <img
              src={optimizedAssetUrl}
              alt="Hero background"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
      )}

      {/* Animated background gradients - uses brand primary color */}
      {!hasHeroMedia && (
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary))/20%,_transparent_50%)]" />
          <div className="absolute inset-x-0 bottom-0 h-[600px] bg-[radial-gradient(ellipse_at_bottom,_hsl(var(--accent))/15%,_transparent_50%)]" />
          <div className="absolute right-0 top-1/4 h-96 w-96 bg-[radial-gradient(circle,_hsl(var(--primary))/15%,_transparent_70%)] blur-3xl" />
          <div className="absolute left-0 bottom-1/4 h-96 w-96 bg-[radial-gradient(circle,_hsl(var(--accent))/15%,_transparent_70%)] blur-3xl" />
        </div>
      )}

      <SignInForm
        callbackUrl={safeCallbackUrl}
        requireCaptcha={requireCaptcha}
        providers={providers}
        error={error}
      />
    </div>
  );
}

export default function SignInPage(props: SignInPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent {...props} />
    </Suspense>
  );
}
