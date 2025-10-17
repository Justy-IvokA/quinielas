import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerAuthSession } from "@qp/auth";
import { authConfig } from "@qp/api/context";

import { BackButton } from "@admin/app/components/back-button";
import { PoolEditorTabs } from "./_components/pool-editor-tabs";
import { HeaderActions } from "./_components/header-actions";

export const metadata: Metadata = {
  title: "Editar Pool"
};

interface PoolEditPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function PoolEditPage({ params }: PoolEditPageProps) {
  const { locale, id } = await params;
  const t = await getTranslations();
  
  // Auth check: require TENANT_ADMIN or SUPERADMIN
  const session = await getServerAuthSession(authConfig);
  
  if (!session?.user) {
    redirect(`/${locale}/auth/signin`);
  }

  const userRole = session.user.highestRole;
  
  if (!userRole || !["TENANT_ADMIN", "SUPERADMIN"].includes(userRole)) {
    // Redirect with error toast (handled client-side via query param)
    redirect(`/${locale}/pools/${id}?error=unauthorized`);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton fallbackHref={`/${locale}/pools/${id}`} />
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">{t("pools.edit.title")}</h1>
          </div>
        </div>
        <HeaderActions poolId={id} />
      </header>

      <PoolEditorTabs poolId={id} />
    </div>
  );
}
