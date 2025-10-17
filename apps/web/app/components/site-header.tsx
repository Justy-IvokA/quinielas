"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { 
  Menu, 
  X, 
  Home, 
  Trophy, 
  UserPlus, 
  Palette, 
  Globe2,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  ListChecks,
  Save,
  Loader2
} from "lucide-react";
import { useTheme } from "next-themes";

import { Link } from "@web/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import { Avatar } from "@qp/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@qp/ui/components/dropdown-menu";
import { Input } from "@qp/ui/components/input";
import { trpc } from "@web/trpc/react";
import { toast } from "sonner";

type MenuPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface SiteHeaderProps {
  position?: MenuPosition;
  brandName?: string;
  logoUrl?: string | null;
}

export function SiteHeader({ 
  position = "top-right",
  brandName = "Quinielas",
  logoUrl
}: SiteHeaderProps) {
  const t = useTranslations("nav");
  const { data: session, status, update: updateSession } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Profile edit state
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  
  // Get user profile with changes counter
  const { data: userProfile, refetch: refetchProfile } = trpc.user.getProfile.useQuery(
    undefined,
    {
      enabled: status === "authenticated",
      refetchOnWindowFocus: false,
    }
  );
  
  // Calculate remaining changes from metadata
  const profileChangesUsed = userProfile?.metadata?.limits?.profileChanges?.used ?? 0;
  const profileChangesMax = userProfile?.metadata?.limits?.profileChanges?.max ?? 3;
  const remainingChanges = profileChangesMax - profileChangesUsed;
  const hasReachedLimit = remainingChanges <= 0;
  
  // tRPC mutation
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async (data) => {
      const changesUsed = data.metadata?.limits?.profileChanges?.used ?? 0;
      const changesMax = data.metadata?.limits?.profileChanges?.max ?? 3;
      const remaining = changesMax - changesUsed;
      
      toast.success(`Perfil actualizado correctamente. Te quedan ${remaining} cambios.`);
      
      // Update session with new data
      await updateSession({
        user: {
          ...session?.user,
          name: data.name,
          email: session?.user?.email || data.email,
          image: session?.user?.image,
        },
      });
      
      // Refetch profile to update counter
      await refetchProfile();
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar el perfil");
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Initialize edit fields when profile loads
  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.name || "");
      setEditPhone(userProfile.phone || "");
    }
  }, [userProfile]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-6 left-6";
      case "top-right":
        return "top-6 right-6";
      case "bottom-left":
        return "bottom-6 left-6";
      case "bottom-right":
        return "bottom-6 right-6";
      default:
        return "top-6 right-6";
    }
  };

  const getOverlaySlideClasses = () => {
    const baseClasses = "fixed inset-0 z-50 transition-all duration-500 ease-out";
    if (!isOpen) return `${baseClasses} opacity-0 pointer-events-none`;
    return `${baseClasses} opacity-100`;
  };

  const getMenuSlideClasses = () => {
    const baseClasses = "fixed z-50 transition-all duration-500 ease-out";
    const sizeClasses = "w-full max-w-md h-full";
    
    switch (position) {
      case "top-left":
      case "bottom-left":
        return `${baseClasses} ${sizeClasses} left-0 top-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`;
      case "top-right":
      case "bottom-right":
      default:
        return `${baseClasses} ${sizeClasses} right-0 top-0 ${isOpen ? "translate-x-0" : "translate-x-full"}`;
    }
  };

  // Navigation items based on authentication status
  const getNavItems = () => {
    // If not authenticated, show only public pages
    if (status !== "authenticated" || !session?.user) {
      return [
        { href: "/", label: t("home") || "Inicio", icon: Home },
        { href: "/auth/signin", label: t("signin") || "Regístrate", icon: UserPlus },
      ];
    }

    // If authenticated, show user modules
    return [
      { href: "/", label: t("home") || "Inicio", icon: Home },
      { href: "/dashboard", label: t("dashboard") || "Dashboard", icon: LayoutDashboard },
    ];
  };

  const navItems = getNavItems();

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <>

      {/* Floating Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${getPositionClasses()} z-[60] group`}
        aria-label="Toggle menu"
      >
        {/* Animated gradient background */}
        <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition duration-500 animate-pulse" />
        
        {/* Button container */}
        <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-110 active:scale-95">
          {isOpen ? (
            <X className="w-4 h-4 text-primary-foreground transition-transform duration-300 md:w-6 md:h-6 rotate-90" />
          ) : (
            <Menu className="w-4 h-4 text-primary-foreground transition-transform duration-300 md:w-6 md:h-6" />
          )}
        </div>

        {/* Pulse ring effect */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" />
        )}
      </button>

      {/* Backdrop Overlay */}
      <div
        className={getOverlaySlideClasses()}
        onClick={() => setIsOpen(false)}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      </div>

      {/* Sliding Menu Panel */}
      <div className={getMenuSlideClasses()}>
        {/* Gradient background with glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5 backdrop-blur-2xl border-l border-primary/20" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl" />

        {/* Menu Content */}
        <div className="relative h-full flex flex-col p-8 overflow-y-auto">
          {/* Header with brand logo */}
          <div className="mb-12">
            {logoUrl ? (
              <Link href="/" onClick={() => setIsOpen(false)} className="block group">
                <div className="relative mt-14 w-full h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 p-4 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
                  <Image
                    src={logoUrl}
                    alt={brandName}
                    fill
                    className={`object-contain p-2 transition-all duration-300 ${
                      mounted && theme === 'dark' ? 'invert brightness-0 dark:invert dark:brightness-100' : ''
                    }`}
                    priority
                  />
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    {brandName}
                  </h2>
                  <p className="text-xs text-muted-foreground">Navegación y ajustes</p>
                </div>
              </div>
            )}
          </div>

          {/* Authentication Section */}
          {mounted && (
            <div className="mb-8">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-8 h-px bg-gradient-to-r from-primary to-transparent" />
                <User className="w-3 h-3" />
                Cuenta
              </div>
              {status === "authenticated" && session?.user ? (
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar
                      src={session.user.image || undefined}
                      alt={session.user.name || session.user.email || "User"}
                      fallback={(session.user.name?.[0] || session.user.email?.[0] || "U").toUpperCase()}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session.user.name || "Usuario"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  
                  {/* Profile Edit Form */}
                  <div className="space-y-3 mb-3">
                    {/* Changes Counter */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-xs font-medium text-muted-foreground">
                        Cambios restantes
                      </span>
                      <span className={`text-xs font-bold ${
                        remainingChanges === 0 
                          ? "text-destructive" 
                          : remainingChanges === 1 
                          ? "text-warning" 
                          : "text-primary"
                      }`}>
                        {remainingChanges} / {profileChangesMax}
                      </span>
                    </div>
                    
                    {hasReachedLimit && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-xs text-destructive font-medium">
                          Has alcanzado el límite de cambios. Contacta al soporte si necesitas más modificaciones.
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Nombre
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Tu nombre"
                          className="flex-1 h-9 text-sm"
                          disabled={updateProfile.isPending || hasReachedLimit}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Teléfono (opcional)
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="+525512345678"
                          className="flex-1 h-9 text-sm"
                          disabled={updateProfile.isPending || hasReachedLimit}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Formato internacional: +52 para México
                      </p>
                    </div>
                    
                    {/* Save Button */}
                    <button
                      onClick={() => {
                        updateProfile.mutate({
                          name: editName || undefined,
                          phone: editPhone || null,
                        });
                      }}
                      disabled={updateProfile.isPending || (!editName && !editPhone) || hasReachedLimit}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updateProfile.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Guardar cambios
                        </>
                      )}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              ) : status === "loading" ? (
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded animate-pulse" />
                      <div className="h-2 bg-muted rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  onClick={() => setIsOpen(false)}
                  className="block w-full p-4 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground text-center font-medium hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2 mb-8">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <div className="w-8 h-px bg-gradient-to-r from-primary to-transparent" />
              Navegación
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="group flex items-center gap-4 p-1 rounded-xl hover:bg-primary/10 transition-all duration-300 hover:translate-x-2"
                >
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-base font-medium group-hover:text-primary transition-colors">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Theme Selector */}
          <div className="mb-8">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-8 h-px bg-gradient-to-r from-accent to-transparent" />
              <Palette className="w-3 h-3" />
              Tema
            </div>
            <div className="grid grid-cols-3 gap-3">
              {mounted && themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`relative group flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                        : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-30" />
                    )}
                    <Icon className={`relative w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`relative text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Selector */}
          <div className="mb-8">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-8 h-px bg-gradient-to-r from-primary to-transparent" />
              <Globe2 className="w-3 h-3" />
              Idioma
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
              <LocaleSwitcher />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 border-t border-border/50">
            <p className="text-xs text-center text-muted-foreground">
              Quinielas
            </p>
            <p className="text-xs text-center text-muted-foreground/60 mt-1">
              © 2025 · Powered by Innotecnia
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
