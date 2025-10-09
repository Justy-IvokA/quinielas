/**
 * Root Layout
 * 
 * This layout is only used for the root path (/).
 * All actual pages are under /[locale]/* and use the locale-specific layout.
 * 
 * This file is required by Next.js but should not render anything
 * as the middleware will redirect to the appropriate locale.
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
