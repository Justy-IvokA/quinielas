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
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "common" });

  return {
    title: `${t("appName")} - Example Page`,
    description: "Demonstration of i18n usage patterns",
  };
}

/**
 * Server Component Example
 */
export default function ExamplePage() {
  const t = useTranslations("common");
  const tNav = useTranslations("nav");

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">
            {t("appName")} - i18n Example
          </h1>
          <p className="text-lg text-muted-foreground">
            This page demonstrates how to use translations in your components.
          </p>
        </div>

        {/* Basic Translation */}
        <section className="space-y-4 p-6 rounded-lg border bg-card">
          <h2 className="text-2xl font-semibold">Basic Translation</h2>
          <div className="space-y-2">
            <p>
              <strong>Loading text:</strong> {t("loading")}
            </p>
            <p>
              <strong>Submit button:</strong> {t("submit")}
            </p>
            <p>
              <strong>Cancel button:</strong> {t("cancel")}
            </p>
          </div>
        </section>

        {/* Nested Translations */}
        <section className="space-y-4 p-6 rounded-lg border bg-card">
          <h2 className="text-2xl font-semibold">Nested Translations</h2>
          <div className="space-y-2">
            <p>
              <strong>Home:</strong> {tNav("home")}
            </p>
            <p>
              <strong>Register:</strong> {tNav("register")}
            </p>
            <p>
              <strong>Pools:</strong> {tNav("pools")}
            </p>
          </div>
        </section>

        {/* Locale-Aware Navigation */}
        <section className="space-y-4 p-6 rounded-lg border bg-card">
          <h2 className="text-2xl font-semibold">Locale-Aware Navigation</h2>
          <p className="text-muted-foreground">
            These links automatically include the current locale prefix:
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
          <h2 className="text-2xl font-semibold">Client Component</h2>
          <p className="text-muted-foreground">
            See the LocaleSwitcher in the header for a client component example.
          </p>
          <ClientExample />
        </section>

        {/* Code Examples */}
        <section className="space-y-4 p-6 rounded-lg border bg-card">
          <h2 className="text-2xl font-semibold">Code Examples</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Server Component:</h3>
              <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                <code>{`import { useTranslations } from "next-intl";

export default function MyPage() {
  const t = useTranslations("common");
  return <h1>{t("appName")}</h1>;
}`}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Client Component:</h3>
              <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                <code>{`"use client";

import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("common");
  return <button>{t("submit")}</button>;
}`}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Navigation:</h3>
              <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                <code>{`import { Link } from "@/i18n/navigation";

// Automatically adds locale prefix
<Link href="/register">Register</Link>`}</code>
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
  
  const t = useTranslations("common");

  return (
    <div className="p-4 rounded-lg bg-muted">
      <p className="font-mono text-sm">
        Client component text: {t("loading")}
      </p>
    </div>
  );
}
