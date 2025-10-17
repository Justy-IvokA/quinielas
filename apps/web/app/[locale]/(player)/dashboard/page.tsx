import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { authConfig } from "@qp/api/context";
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";
import { getServerAuthSession } from "@qp/auth";

import { DashboardView } from "./_components/DashboardView";

interface DashboardPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });

  return {
    title: t("title"),
    description: t("subtitle")
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;

  // Resolve tenant/brand from host
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const pathname = headersList.get("x-pathname") || "";

  const { tenant, brand } = await resolveTenantAndBrandFromHost(host, pathname);

  if (!tenant) {
    redirect(`/${locale}`);
  }

  // Get session - require authentication
  const session = await getServerAuthSession(authConfig);

  if (!session?.user) {
    // Redirect to signin with callback
    const callbackUrl = encodeURIComponent(`/${locale}/dashboard`);
    redirect(`/${locale}/auth/signin?callbackUrl=${callbackUrl}`);
  }

  return (
    <DashboardView
      locale={locale}
      tenant={tenant}
      brand={brand}
      user={session.user}
    />
  );
}
