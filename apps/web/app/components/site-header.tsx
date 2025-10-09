"use client";

import Link from "next/link";
import { ThemeToggle } from "@qp/ui";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold text-xl">Quinielas</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-2">
            <Link
              href="/register"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Registro
            </Link>
            <Link
              href="/pools"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pools
            </Link>
          </nav>
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
