"use client";

import Image from "next/image";
import { ThemeToggle } from "@qp/ui";

import { Link } from "@admin/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface AdminHeaderProps {
  brandName?: string;
  logoUrl?: string | null;
}

export function AdminHeader({ brandName = "Quinielas Admin", logoUrl }: AdminHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          {logoUrl ? (
            <div className="relative h-8 w-32">
              <Image
                src={logoUrl}
                alt={brandName}
                fill
                className={`object-contain p-0 transition-all duration-300 ${
                  mounted && theme === 'dark' ? 'invert brightness-0 dark:invert dark:brightness-100' : ''
                }`}
                priority
              />
            </div>
          ) : (
            <span className="text-lg font-semibold">{brandName}</span>
          )}
        </Link>
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground md:flex">
            <Link href="/pools" className="transition-colors hover:text-foreground">
              Quinielas
            </Link>
            <Link href="/access" className="transition-colors hover:text-foreground">
              Politicas de Acceso
            </Link>
            <Link href="/fixtures" className="transition-colors hover:text-foreground">
              Fixtures
            </Link>
            <Link href="/analytics" className="transition-colors hover:text-foreground">
              Analiticos
            </Link>
          </nav>
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
