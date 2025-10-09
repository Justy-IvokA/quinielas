"use client";

import { Calendar, Lock, Trophy, Users } from "lucide-react";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton
} from "@qp/ui";

import { trpc } from "../../../../src/trpc/react";

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
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{pool.name}</CardTitle>
              <CardDescription className="mt-2 flex items-center gap-2">
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
            <p className="text-muted-foreground">{pool.description}</p>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-4">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{pool._count.registrations}</p>
                <p className="text-sm text-muted-foreground">Registros</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-4">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{pool.prizes.length}</p>
                <p className="text-sm text-muted-foreground">Premios</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-4">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{pool._count.predictions}</p>
                <p className="text-sm text-muted-foreground">Predicciones</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-4">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {pool.startDate ? new Date(pool.startDate).toLocaleDateString("es-MX", { month: "short", day: "numeric" }) : "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">Inicio</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reglas de puntuación</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Marcador exacto:</span>
              <span className="font-medium">{(pool.ruleSet as any)?.exactScore || 5} puntos</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Signo correcto (1X2):</span>
              <span className="font-medium">{(pool.ruleSet as any)?.correctSign || 3} puntos</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bonus diferencia de goles:</span>
              <span className="font-medium">+{(pool.ruleSet as any)?.goalDiffBonus || 1} punto</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Política de acceso</CardTitle>
          </CardHeader>
          <CardContent>
            {pool.accessPolicy ? (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo:</span>
                  <Badge>{pool.accessPolicy.accessType}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CAPTCHA:</span>
                  <span className="font-medium">{pool.accessPolicy.requireCaptcha ? "Sí" : "No"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Verificación email:</span>
                  <span className="font-medium">{pool.accessPolicy.requireEmailVerification ? "Sí" : "No"}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin política de acceso configurada</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
