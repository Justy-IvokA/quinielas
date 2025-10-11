import { getTranslations } from "next-intl/server";

import { SyncDashboard } from "./components/sync-dashboard";

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "sync" });

  return {
    title: t("title"),
    description: t("description")
  };
}

export default function SyncPage() {
  return (
    <div className="container mx-auto py-8">
      <SyncDashboard />
    </div>
  );
}
