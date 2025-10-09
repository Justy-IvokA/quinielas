"use client";

import { ThemeToggle } from "@qp/ui";

import { Link } from "@admin/navigation";
import { LocaleSwitcher } from "./locale-switcher";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-lg font-semibold transition-colors hover:text-primary">
          Quinielas Admin
        </Link>
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground md:flex">
            <Link href="/pools" className="transition-colors hover:text-foreground">
              Pools
            </Link>
            <Link href="/access" className="transition-colors hover:text-foreground">
              Acceso
            </Link>
            <Link href="/fixtures" className="transition-colors hover:text-foreground">
              Fixtures
            </Link>
            <Link href="/analytics" className="transition-colors hover:text-foreground">
              Analytics
            </Link>
          </nav>
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
