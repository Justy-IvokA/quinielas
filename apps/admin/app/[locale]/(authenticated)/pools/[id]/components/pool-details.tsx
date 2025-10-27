"use client";

import { Calendar, Lock, Trophy, Users } from "lucide-react";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  SportsLoader
} from "@qp/ui";

import { trpc } from "@admin/trpc";

interface PoolDetailsProps {
  poolId: string;
}

export function PoolDetails({ poolId }: PoolDetailsProps) {
  const { data: pool, isLoading } = trpc.pools.getById.useQuery({ id: poolId });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
              <SportsLoader size="sm" text="Cargando detalles" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!pool) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Pool no encontrado
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl text-primary">{pool.name}</CardTitle>
              <CardDescription className="mt-0 flex items-center gap-2">
                <span>{pool.brand?.name || "Sin marca"}</span>
                <span>·</span>
                <span>{pool.season.name}</span>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={pool.isActive ? "default" : "gray"}>
                {pool.isActive ? "Activo" : "Inactivo"}
              </Badge>
              {pool.isPublic && <Badge variant="outline">Público</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {pool.description && (
            <p className="text-foreground">{pool.description}</p>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-4">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{pool._count.registrations}</p>
                <p className="text-sm text-foreground">Registros</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-4">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{pool.prizes.length}</p>
                <p className="text-sm text-foreground">Premios</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-4">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{pool._count.predictions}</p>
                <p className="text-sm text-foreground">Predicciones</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-4">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {pool.startDate ? new Date(pool.startDate).toLocaleDateString("es-MX", { month: "short", day: "numeric" }) : "N/A"}
                </p>
                <p className="text-sm text-foreground">Inicio</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card variant="glass">
          <CardHeader className="mb-2">
            <CardTitle className="text-secondary">Reglas de puntuación</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-0">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">Marcador exacto:</span>
              <span className="font-medium">{(pool.ruleSet as any)?.exactScore || 5} puntos</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-foreground">Signo correcto (1X2):</span>
              <span className="font-medium">{(pool.ruleSet as any)?.correctSign || 3} puntos</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-foreground">Bonus diferencia de goles:</span>
              <span className="font-medium">+{(pool.ruleSet as any)?.goalDiffBonus || 1} punto</span>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="mb-2">
            <CardTitle className="text-secondary">Política de acceso</CardTitle>
          </CardHeader>
          <CardContent>
            {pool.accessPolicy ? (
              <div className="flex flex-col gap-0">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">Tipo:</span>
                  <Badge>{pool.accessPolicy.accessType}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">CAPTCHA:</span>
                  <span className="font-medium">{pool.accessPolicy.requireCaptcha ? "Sí" : "No"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">Verificación email:</span>
                  <span className="font-medium">{pool.accessPolicy.requireEmailVerification ? "Sí" : "No"}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground">Sin política de acceso configurada</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
