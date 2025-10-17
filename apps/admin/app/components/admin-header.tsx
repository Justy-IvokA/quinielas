"use client";

import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User, Settings, Shield } from "lucide-react";
import { ThemeToggle, Avatar, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@qp/ui";

import { Link } from "@admin/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface AdminHeaderProps {
  brandName?: string;
  logoUrl?: string | null;
}

export function AdminHeader({ brandName = "Quinielas Admin", logoUrl }: AdminHeaderProps) {
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full rounded-2xl border border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-4">
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
            <Link href="/branding" className="transition-colors hover:text-foreground">
              Personalización
            </Link>
          </nav>
          <LocaleSwitcher />
          <ThemeToggle />
          
          {/* User Avatar Menu */}
          {mounted && status === "authenticated" && session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
                  aria-label="User menu"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-0 group-hover:opacity-40 transition duration-300" />
                  <Avatar
                    src={session.user.image || undefined}
                    alt={session.user.name || session.user.email || "User"}
                    fallback={(session.user.name?.[0] || session.user.email?.[0] || "A").toUpperCase()}
                    size="sm"
                    className="border-2 border-border hover:border-primary/40 transition-all duration-300 cursor-pointer relative"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name || "Administrador"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                    {session.user.highestRole && (
                      <div className="flex items-center gap-1 mt-1">
                        <Shield className="h-3 w-3 text-primary" />
                        <span className="text-xs font-medium text-primary">
                          {session.user.highestRole}
                        </span>
                      </div>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
