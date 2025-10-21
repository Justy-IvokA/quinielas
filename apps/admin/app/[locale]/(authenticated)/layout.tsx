import { redirect } from "next/navigation";
import { getServerAuthSession } from "@qp/auth";
import { authConfig } from "@qp/api/context";
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";
import { adminEnv } from "@admin/env";
import { AdminHeader } from "../../components/admin-header";
import { getOptimizedMediaUrl } from "@qp/utils/client";
import { BrandThemeInjector } from "../../components/brand-theme-injector";
import { BrandProvider } from "../../providers/brand-context";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Authenticated Layout
 * 
 * This layout wraps all authenticated routes and:
 * 1. Verifies the user has an active session
 * 2. Redirects to sign-in if not authenticated
 * 3. Renders the AdminHeader for all authenticated pages
 */
export default async function AuthenticatedLayout({
  children,
  params,
}: AuthenticatedLayoutProps) {
  const { locale } = await params;

  // Check authentication
  const session = await getServerAuthSession(authConfig);
  
  if (!session?.user) {
    // Redirect to sign-in if not authenticated
    redirect(`/${locale}/auth/signin`);
  }

  // Resolve brand from host for header
  const { headers } = await import("next/headers");
  const headersList = await headers();
  let host = headersList.get("host") || "localhost";
  if (host.includes(":")) {
    host = host.split(":")[0];
  }
  const { brand, tenant } = await resolveTenantAndBrandFromHost(host);
  // console.log("⚠ Brand 🔥: ", brand);
  // console.log("⚠ Tenant 🔥: ", tenant);
  
  // Add tenant relation to brand for BrandProvider
  const brandWithTenant = brand && tenant ? { ...brand, tenant } : null;
  
  // Get hero assets from brand theme with URL optimization
  const heroAssets = brand?.theme && typeof brand.theme === 'object' 
    ? (brand.theme as any).heroAssets 
    : null;
    
  // Convert Google Drive URLs to direct download links
  const optimizedAssetUrl = getOptimizedMediaUrl(heroAssets?.url);
  const optimizedFallbackUrl = getOptimizedMediaUrl(heroAssets?.fallbackImageUrl);
  const hasHeroMedia = optimizedAssetUrl;

  return (
    <BrandProvider brand={brandWithTenant} tenant={tenant}>
      {/* Inject brand theme dynamically on client */}
      {brand?.theme && <BrandThemeInjector brandTheme={brand.theme} />}
      {/* Hero background media (video or image) */}
      {hasHeroMedia && (
        <div className="pointer-events-none fixed inset-0 -z-10">
          {heroAssets?.kind === "video" ? (
            // Video background
            <video
              autoPlay = {heroAssets?.autoplay}
              loop = {heroAssets?.loop}
              muted = {heroAssets?.muted}
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
          {/* Gradient overlay for readability (Comentado por VEMG) */}
          {/* <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" /> */}
        </div>
      )}
      <AdminHeader 
        brandName={brand?.name || adminEnv.NEXT_PUBLIC_APP_NAME}
        logoUrl={brand?.theme && typeof brand.theme === 'object' && 'logo' in brand.theme ? (brand.theme as any).logo.url : null}
      />
      {children}
    </BrandProvider>
  );
}
