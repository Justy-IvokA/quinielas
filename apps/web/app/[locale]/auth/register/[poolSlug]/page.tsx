import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authConfig } from "@qp/api/context";
import { createAuthInstance } from "@qp/auth";
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";
import { getCaptchaLevel } from "@qp/api/lib/settings";
import { prisma } from "@qp/db";
import { getOptimizedMediaUrl } from "@qp/utils/client";
import { BrandThemeInjector } from "../../../../components/brand-theme-injector";
import { PublicRegistrationForm } from "./_components/public-registration-form";
import { CodeRegistrationForm } from "./_components/code-registration-form";
import { EmailInviteRegistrationForm } from "./_components/email-invite-registration-form";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@qp/ui/components/alert";

interface RegisterPageProps {
  params: Promise<{
    locale: string;
    poolSlug: string;
  }>;
  searchParams: Promise<{
    code?: string;
    token?: string;
  }>;
}

async function RegisterContent({ params, searchParams }: RegisterPageProps) {
  const { locale, poolSlug } = await params;
  const { code, token } = await searchParams;

  // Check if already authenticated
  const auth = createAuthInstance(authConfig);
  const session = await auth();

  if (!session?.user) {
    // Not authenticated, redirect to signin with callback
    redirect(`/${locale}/auth/signin?callbackUrl=${encodeURIComponent(`/${locale}/auth/register/${poolSlug}${code ? `?code=${code}` : token ? `?token=${token}` : ""}`)}`);
  }

  // Resolve brand from host
  const headersList = await headers();
  let host = headersList.get("host") || "localhost";
  if (host.includes(":")) {
    host = host.split(":")[0];
  }
  const pathname = headersList.get("x-pathname") || "";
  
  const { tenant, brand } = await resolveTenantAndBrandFromHost(host, pathname);

  if (!tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Tenant no encontrado</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Find pool with access policy
  const pool = await prisma.pool.findFirst({
    where: {
      slug: poolSlug,
      tenantId: tenant.id
    },
    include: {
      accessPolicy: true,
      _count: {
        select: {
          registrations: true
        }
      }
    }
  });

  if (!pool) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Quiniela no encontrada</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!pool.isActive) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Esta quiniela ya no está aceptando registros</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if already registered
  const existingRegistration = await prisma.registration.findUnique({
    where: {
      userId_poolId: {
        userId: session.user.id,
        poolId: pool.id
      }
    }
  });

  if (existingRegistration) {
    // Already registered, redirect to pool fixtures
    redirect(`/${locale}/pools/${poolSlug}/fixtures`);
  }

  const accessType = pool.accessPolicy?.accessType || "PUBLIC";

  // Get captcha settings for public registration
  const captchaLevel = await getCaptchaLevel({ tenantId: tenant.id });
  const requireCaptcha = captchaLevel === "force";

  // Get hero assets from brand theme  
  const heroAssets = brand?.theme && typeof brand.theme === 'object' 
    ? (brand.theme as any)
    : null;
  
  const optimizedAssetUrl = getOptimizedMediaUrl(heroAssets?.assetUrl);
  const optimizedFallbackUrl = getOptimizedMediaUrl(heroAssets?.fallbackImageUrl);
  const hasHeroMedia = optimizedAssetUrl;

  // Determine which form to render
  const renderForm = () => {
    switch (accessType) {
      case "PUBLIC":
        return (
          <PublicRegistrationForm
            poolId={pool.id}
            poolName={pool.name}
            poolDescription={pool.description}
            poolSlug={pool.slug}
            userId={session.user.id}
            requireCaptcha={requireCaptcha}
            captchaProvider="hcaptcha"
            captchaSiteKey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY}
            maxRegistrations={pool.accessPolicy?.maxRegistrations}
            currentRegistrations={pool._count.registrations}
            registrationStartDate={pool.accessPolicy?.registrationStartDate}
            registrationEndDate={pool.accessPolicy?.registrationEndDate}
            termsUrl="/terms"
            privacyUrl="/privacy"
            brandName={brand?.name}
            brandLogo={brand?.theme && typeof brand.theme === 'object' ? (brand.theme as any).logo : null}
            heroAssets={heroAssets}
          />
        );

      case "CODE":
        return (
          <CodeRegistrationForm
            poolId={pool.id}
            poolName={pool.name}
            poolDescription={pool.description}
            poolSlug={pool.slug}
            userId={session.user.id}
            termsUrl="/terms"
            privacyUrl="/privacy"
            prefilledCode={code}
            brandName={brand?.name}
            brandLogo={brand?.theme && typeof brand.theme === 'object' ? (brand.theme as any).logo : null}
            heroAssets={heroAssets}
          />
        );

      case "EMAIL_INVITE":
        if (!token) {
          return (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Token de invitación requerido. Por favor, usa el enlace que recibiste en tu correo electrónico.
              </AlertDescription>
            </Alert>
          );
        }

        return (
          <EmailInviteRegistrationForm
            poolId={pool.id}
            poolName={pool.name}
            poolDescription={pool.description}
            poolSlug={pool.slug}
            userId={session.user.id}
            inviteToken={token}
            termsUrl="/legal/terms"
            privacyUrl="/legal/privacy"
            brandName={brand?.name}
            brandLogo={brand?.theme && typeof brand.theme === 'object' ? (brand.theme as any).logo : null}
            heroAssets={heroAssets}
          />
        );

      default:
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Tipo de acceso no soportado</AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <div className="relative isolate overflow-hidden min-h-screen">
      {/* Inject brand theme dynamically on client */}
      {brand?.theme && <BrandThemeInjector brandTheme={brand.theme} />}

      {/* Hero background media (video or image) */}
      {hasHeroMedia && (
        <div className="pointer-events-none fixed inset-0 -z-10">
          {heroAssets?.video ? (
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
        </div>
      )}

      
        {renderForm()}
        
      
    </div>
  );
}

export default function RegisterPage(props: RegisterPageProps) {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <RegisterContent {...props} />
    </Suspense>
  );
}
