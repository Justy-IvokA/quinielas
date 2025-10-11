"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  Sparkles
} from "lucide-react";
import { useTheme } from "next-themes";

import { Link } from "@web/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";

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
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const navItems = [
    { href: "/", label: t("home") || "Inicio", icon: Home },
    { href: "/pools", label: t("pools") || "Quinielas", icon: Trophy },
    { href: "/register", label: t("register") || "Registrarse", icon: UserPlus },
  ];

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
                  className="group flex items-center gap-4 p-4 rounded-xl hover:bg-primary/10 transition-all duration-300 hover:translate-x-2"
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
              Quinielas White-Label Platform
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
