/**
 * Example Page - i18n Usage Demonstration
 * 
 * This page demonstrates various i18n patterns and best practices.
 * You can access it at /es-MX/example or /en-US/example
 */

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Link } from "@web/i18n/navigation";

/**
 * Generate metadata with translations
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tExample = await getTranslations({ locale, namespace: "examplePage" });

  return {
    title: tExample("metadata.title", { appName: tCommon("appName") }),
    description: tExample("metadata.description"),
  };
}

/**
 * Server Component Example
 */
export default function ExamplePage() {
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const tExample = useTranslations("examplePage");

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">
            {tExample("heading.title", { appName: tCommon("appName") })}
          </h1>
          <p className="text-lg text-muted-foreground">
            {tExample("heading.intro")}
          </p>
        </div>

        {/* Basic Translation */}
        <section className="space-y-4 p-6 rounded-lg border bg-card">
          <h2 className="text-2xl font-semibold">
            {tExample("sections.basic.title")}
          </h2>
          <div className="space-y-2">
            <p>
              <strong>{tExample("sections.basic.loadingLabel")}</strong>{" "}
              {tCommon("loading")}
            </p>
            <p>
              <strong>{tExample("sections.basic.submitLabel")}</strong>{" "}
              {tCommon("submit")}
            </p>
            <p>
              <strong>{tExample("sections.basic.cancelLabel")}</strong>{" "}
              {tCommon("cancel")}
            </p>
          </div>
        </section>

        {/* Nested Translations */}
        <section className="space-y-4 p-6 rounded-lg border bg-card">
          <h2 className="text-2xl font-semibold">
            {tExample("sections.nested.title")}
          </h2>
          <div className="space-y-2">
            <p>
              <strong>{tExample("sections.nested.homeLabel")}</strong>{" "}
              {tNav("home")}
            </p>
            <p>
              <strong>{tExample("sections.nested.registerLabel")}</strong>{" "}
              {tNav("register")}
            </p>
            <p>
              <strong>{tExample("sections.nested.poolsLabel")}</strong>{" "}
              {tNav("pools")}
            </p>
          </div>
        </section>

        {/* Locale-Aware Navigation */}
        <section className="space-y-4 p-6 rounded-lg border bg-card">
          <h2 className="text-2xl font-semibold">
            {tExample("sections.navigation.title")}
          </h2>
          <p className="text-muted-foreground">
            {tExample("sections.navigation.description")}
          </p>
          <nav className="flex flex-wrap gap-4">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {tNav("home")}
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
            >
              {tNav("register")}
            </Link>
            <Link
              href="/pools"
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
            >
              {tNav("pools")}
            </Link>
          </nav>
        </section>

        {/* Client Component Example */}
        <section className="space-y-4 p-6 rounded-lg border bg-card">
          <h2 className="text-2xl font-semibold">
            {tExample("sections.client.title")}
          </h2>
          <p className="text-muted-foreground">
            {tExample("sections.client.description")}
          </p>
          <ClientExample />
        </section>

        {/* Code Examples */}
        <section className="space-y-4 p-6 rounded-lg border bg-card">
          <h2 className="text-2xl font-semibold">
            {tExample("sections.code.title")}
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                {tExample("sections.code.serverTitle")}
              </h3>
              <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                <code>{tExample("codeSnippets.server")}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">
                {tExample("sections.code.clientTitle")}
              </h3>
              <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                <code>{tExample("codeSnippets.client")}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">
                {tExample("sections.code.navigationTitle")}
              </h3>
              <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                <code>{tExample("codeSnippets.navigation")}</code>
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Client Component Example
 */
function ClientExample() {
  "use client";
  
  const tCommon = useTranslations("common");
  const tExample = useTranslations("examplePage");

  return (
    <div className="p-4 rounded-lg bg-muted">
      <p className="font-mono text-sm">
        {tExample("clientSnippet.label")} {tCommon("loading")}
      </p>
    </div>
  );
}
