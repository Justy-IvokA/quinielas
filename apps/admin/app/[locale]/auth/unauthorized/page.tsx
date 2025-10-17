"use client";

import { ShieldAlert } from "lucide-react";
import { Button } from "@qp/ui";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function UnauthorizedPage() {
  const [playerAppUrl, setPlayerAppUrl] = useState<string>("");
  
  useEffect(() => {
    // Build player app URL from current host
    const host = window.location.hostname;
    const playerAppPort = "3000"; // Player app port
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    // Extract brand slug from subdomain (e.g., "ivoka" from "ivoka.localhost")
    const brandSlug = host.split('.')[0];
    
    const url = brandSlug && brandSlug !== 'localhost'
      ? `${protocol}://${brandSlug}.localhost:${playerAppPort}/es-MX`
      : `${protocol}://localhost:${playerAppPort}/es-MX`;
    
    setPlayerAppUrl(url);
  }, []);
  
  const handleSignOut = async () => {
    // Sign out and redirect to signin page
    await signOut({ 
      callbackUrl: '/es-MX/auth/signin',
      redirect: true 
    });
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <ShieldAlert className="h-16 w-16 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Acceso Denegado
          </h1>
          <p className="text-muted-foreground">
            No tienes permisos para acceder al panel de administración.
          </p>
        </div>

        <div className="space-y-4 rounded-lg border bg-card p-6 text-left">
          <h2 className="font-semibold">¿Por qué veo esto?</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>
                El panel de administración está restringido a usuarios con roles de administrador.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>
                Tu cuenta actual tiene permisos de jugador, no de administrador.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>
                Si necesitas acceso administrativo, contacta al administrador de tu organización.
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {playerAppUrl && (
            <Button asChild>
              <a href={playerAppUrl}>
                Ir a la Aplicación de Jugadores
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={handleSignOut}>
            Iniciar Sesión con Otra Cuenta
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Roles permitidos: Superadmin, Admin de Tenant, Editor de Tenant
        </p>
      </div>
    </div>
  );
}
