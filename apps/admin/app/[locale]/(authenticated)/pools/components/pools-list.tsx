"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Calendar, Copy, CheckCircle, Edit, Eye, Trash2, Users, Mail, Ticket, Globe } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
  SportsLoader,
  toastError,
  toastSuccess
} from "@qp/ui";
import { trpc } from "@admin/trpc";
import { Link } from "@admin/navigation";

export function PoolsList() {
  const t = useTranslations("pools");
  const utils = trpc.useUtils();
  const [copiedPoolId, setCopiedPoolId] = useState<string | null>(null);
  const { data: pools, isLoading } = trpc.pools.listByTenant.useQuery({
    includeInactive: true
  });

  const deleteMutation = trpc.pools.delete.useMutation({
    onSuccess: () => {
      toastSuccess(t("actions.deleteSuccess"));
      utils.pools.listByTenant.invalidate({ includeInactive: true });
    },
    onError: (error) => {
      toastError(t("actions.deleteError", { message: error.message }));
    }
  });

  const handleDelete = (id: string, name: string) => {
    const confirmMessage = t("actions.deleteConfirm", { name }) + 
      "\n\n⚠️ ADVERTENCIA: Esto eliminará TODOS los registros, predicciones y datos relacionados.";
    
    if (confirm(confirmMessage)) {
      deleteMutation.mutate({ id, force: true }); // force=true para testing/desarrollo
    }
  };
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <SportsLoader size="sm" text="Cargando quiniela" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!pools || pools.length === 0) {
    return (
      <EmptyState
        title={t("empty.title")}
        description={t("empty.description")}
        action={{
          label: t("empty.cta"),
          onClick: () => (window.location.href = "/pools/new")
        }}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pools.map((pool) => {
        const handleCopyUrl = async () => {
          if (!pool?.brand?.domains?.[0] || !pool.slug) {
            toastError("No se puede generar URL: falta dominio o slug");
            return;
          }

          const domain = pool.brand.domains[0];
          const url = `${domain}/es-MX/auth/register/${pool.slug}`;

          try {
            await navigator.clipboard.writeText(url);
            setCopiedPoolId(pool.id);
            toastSuccess(t("actions.urlCopied"));
            setTimeout(() => setCopiedPoolId(null), 2000);
          } catch (error) {
            toastError("Error al copiar URL");
          }
        };

        const isCopied = copiedPoolId === pool.id;
        const accessType = pool.accessPolicy?.accessType || "PUBLIC";
        
        // Determinar icono y label del tipo de acceso
        const accessTypeConfig = {
          PUBLIC: { icon: Globe, label: "Público", variant: "default" as const },
          CODE: { icon: Ticket, label: "Código", variant: "secondary" as const },
          EMAIL_INVITE: { icon: Mail, label: "Invitación", variant: "purple" as const }
        };
        
        const accessConfig = accessTypeConfig[accessType as keyof typeof accessTypeConfig] || accessTypeConfig.PUBLIC;
        const AccessIcon = accessConfig.icon;

        return (
        <Card key={pool.id} className="group relative overflow-hidden border-border/70 bg-card/60 backdrop-blur shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 pointer-events-none" />
          
          <CardHeader className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {pool.season?.competition?.logoUrl && (
                    <Image
                      src={pool.season.competition.logoUrl}
                      alt={pool.season.competition.name}
                      width={50}
                      height={50}
                      className="inline-block"
                    />
                  )}
                  <div className="flex flex-col">
                    <CardTitle className="line-clamp-1">{pool.name}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-2">
                      <span>{pool.season.name}</span>
                      <span>·</span>
                      <span>{pool.season.year ?? t("status.noBrand")}</span>
                    </CardDescription>
                  </div>
                </div>
              </div>
              <Badge variant={pool.isActive ? "default" : "gray"}>
                {pool.isActive ? t("status.active") : t("status.inactive")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="relative flex flex-col gap-4">
            {pool.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">{pool.description}</p>
            )}

            {/* Tipo de Acceso */}
            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 backdrop-blur px-3 py-2">
              <AccessIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Acceso: {accessConfig.label}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{t("stats.registrations", { count: pool._count.registrations })}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{t("stats.prizes", { count: pool._count.prizes })}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-border/50 pt-4">
              {/* Botón de configuración de acceso (solo para CODE y EMAIL_INVITE) */}
              {accessType !== "PUBLIC" && (
                <Button 
                  asChild 
                  size="sm" 
                  variant="secondary" 
                  className="w-full"
                  StartIcon={accessType === "CODE" ? Ticket : Mail}
                >
                  <Link href={`/pools/${pool.id}/${accessType === "CODE" ? "codes" : "invitations"}`}>
                    {accessType === "CODE" ? "Gestionar Códigos" : "Gestionar Invitaciones"}
                  </Link>
                </Button>
              )}
              
              <div className="flex gap-2">
                <Button asChild size="sm" variant="default" className="flex-1" StartIcon={Eye}>
                  <Link href={`/pools/${pool.id}`}>
                    {t("actions.view")}
                  </Link>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  StartIcon={isCopied ? CheckCircle : Copy}
                  onClick={handleCopyUrl}
                  disabled={!pool.slug || !pool.brand?.domains?.[0]}
                >
                  {accessType === "PUBLIC" ? t("actions.copyPublicUrl") : t("actions.copyUrl")}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1" StartIcon={Edit}>
                  <Link href={`/pools/${pool.id}/edit`}>
                    {t("actions.edit")}
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(pool.id, pool.name)}
                  loading={deleteMutation.isPending}
                  className="flex-1"
                  StartIcon={Trash2}
                >
                  {t("actions.delete")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
