"use client";

import { useEffect, useState } from "react";
import { cn } from "../lib/cn";

interface SportsLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32"
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg"
};

export function SportsLoader({ size = "md", text, className }: SportsLoaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Detect theme from document class or media query
    const checkTheme = () => {
      const htmlElement = document.documentElement;
      const hasDarkClass = htmlElement.classList.contains('dark');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(hasDarkClass || (!htmlElement.classList.contains('light') && prefersDark));
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Watch for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => checkTheme();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Dynamic colors based on theme
  const ballColor = isDark ? '#f1f5f9' : '#ffffff'; // slate-100 for dark, white for light
  const ballStroke = isDark ? '#cbd5e1' : '#1e293b'; // slate-300 for dark, slate-800 for light
  const patternColor = isDark ? '#334155' : '#1e293b'; // slate-700 for dark, slate-800 for light
  const shineColor = isDark ? '#f8fafc' : '#ffffff'; // slate-50 for dark, white for light

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      {/* Soccer Ball Animation */}
      <div className="relative">
        {/* Rotating field lines */}
        <div className={cn("absolute inset-0 animate-spin-slow", sizeClasses[size])}>
          <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          </svg>
        </div>

        {/* Soccer Ball */}
        <div className={cn("relative animate-bounce-slow", sizeClasses[size])}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
            {/* Ball shadow */}
            <ellipse cx="50" cy="90" rx="20" ry="5" fill="currentColor" opacity="0.2" className="animate-pulse" />
            
            {/* Ball body with theme-aware colors */}
            <circle cx="50" cy="50" r="40" fill={ballColor} stroke={ballStroke} strokeWidth="2" />
            
            {/* Pentagon pattern */}
            <path
              d="M50,15 L35,25 L40,42 L60,42 L65,25 Z"
              fill={patternColor}
              className="animate-pulse-slow"
            />
            
            {/* Hexagons */}
            <path
              d="M35,25 L20,30 L15,45 L25,55 L40,42 Z"
              fill="none"
              stroke={patternColor}
              strokeWidth="1.5"
            />
            <path
              d="M65,25 L80,30 L85,45 L75,55 L60,42 Z"
              fill="none"
              stroke={patternColor}
              strokeWidth="1.5"
            />
            <path
              d="M40,42 L25,55 L30,70 L50,75 L60,42 Z"
              fill="none"
              stroke={patternColor}
              strokeWidth="1.5"
            />
            <path
              d="M60,42 L75,55 L70,70 L50,75 Z"
              fill="none"
              stroke={patternColor}
              strokeWidth="1.5"
            />
            
            {/* Shine effect */}
            <circle cx="40" cy="35" r="8" fill={shineColor} opacity="0.6" className="animate-pulse" />
            <circle cx="38" cy="33" r="4" fill={shineColor} opacity="0.8" />
          </svg>
        </div>

        {/* Orbiting particles */}
        <div className="absolute inset-0 animate-spin">
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full -translate-x-1/2 animate-pulse" />
        </div>
        <div className="absolute inset-0 animate-spin-reverse" style={{ animationDelay: '0.5s' }}>
          <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-accent rounded-full -translate-x-1/2 animate-pulse" />
        </div>
        <div className="absolute inset-0 animate-spin-slow" style={{ animationDelay: '1s' }}>
          <div className="absolute top-1/2 right-0 w-2 h-2 bg-secondary rounded-full -translate-y-1/2 animate-pulse" />
        </div>
      </div>

      {/* Loading text */}
      {text && (
        <div className="flex items-center gap-1">
          <span className={cn("font-semibold text-foreground animate-pulse", textSizeClasses[size])}>
            {text}
          </span>
          <span className={cn("font-bold animate-bounce", textSizeClasses[size])} style={{ animationDelay: '0s' }}>.</span>
          <span className={cn("font-bold animate-bounce", textSizeClasses[size])} style={{ animationDelay: '0.2s' }}>.</span>
          <span className={cn("font-bold animate-bounce", textSizeClasses[size])} style={{ animationDelay: '0.4s' }}>.</span>
        </div>
      )}

      {/* Custom animations */}
      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 2s linear infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Full page loader variant
interface FullPageLoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function FullPageLoader({ text = "Cargando", size = "lg" }: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <SportsLoader size={size} text={text} />
    </div>
  );
}

// Inline loader variant for buttons
export function InlineLoader({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center", className)}>
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}
