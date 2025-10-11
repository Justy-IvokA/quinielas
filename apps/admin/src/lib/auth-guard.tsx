"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "../trpc/react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "SUPERADMIN" | "TENANT_ADMIN" | "TENANT_EDITOR";
  redirectTo?: string;
}

/**
 * Client-side auth guard component
 * Redirects unauthenticated users or users without required role
 */
export function AuthGuard({ children, requiredRole, redirectTo = "/auth/signin" }: AuthGuardProps) {
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      toast.error("Debes iniciar sesión para acceder");
      router.push(redirectTo);
      return;
    }

    if (requiredRole && session.user.highestRole !== requiredRole) {
      toast.error(`No tienes permisos para acceder. Se requiere rol: ${requiredRole}`);
      router.push("/dashboard");
    }
  }, [session, isLoading, requiredRole, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (requiredRole && session.user.highestRole !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Superadmin guard - only allows SUPERADMIN role
 */
export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="SUPERADMIN" redirectTo="/dashboard">
      {children}
    </AuthGuard>
  );
}
