"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Activity,
  Database,
  RefreshCw,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Trash2
} from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toastSuccess,
  toastError
} from "@qp/ui";

import { trpc } from "@admin/trpc";

export function SyncDashboard() {
  const t = useTranslations("sync");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = trpc.sync.getStats.useQuery();
  const { data: activeSeasons, isLoading: isLoadingSeasons } = trpc.sync.getActiveSeasons.useQuery();

  const clearCacheMutation = trpc.sync.clearCache.useMutation({
    onSuccess: (data) => {
      toastSuccess(data.message);
      refetchStats();
    },
    onError: (error) => {
      toastError(error.message);
    }
  });

  const handleClearCache = (provider?: string) => {
    if (confirm(provider ? `¿Limpiar caché de ${provider}?` : "¿Limpiar todo el caché?")) {
      clearCacheMutation.mutate({ provider });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sincronización de Fixtures</h1>
          <p className="text-muted-foreground mt-1">
            Monitorea y controla la sincronización con proveedores externos
          </p>
        </div>
        <Button
          onClick={() => refetchStats()}
          variant="outline"
          size="sm"
          StartIcon={RefreshCw}
        >
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {!isLoadingStats && stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temporadas Activas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.seasons.active}</div>
              <p className="text-xs text-muted-foreground">
                de {stats.seasons.total} totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partidos Sincronizados</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.matches.synced}</div>
              <p className="text-xs text-muted-foreground">
                {stats.matches.percentage.toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.teams.total}</div>
              <p className="text-xs text-muted-foreground">
                en la base de datos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Caché</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cache.active}</div>
              <p className="text-xs text-muted-foreground">
                entradas activas ({stats.cache.expired} expiradas)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="mr-2 h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="seasons">
            <Calendar className="mr-2 h-4 w-4" />
            Temporadas Activas
          </TabsTrigger>
          <TabsTrigger value="sources">
            <Database className="mr-2 h-4 w-4" />
            Fuentes de Datos
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado General</CardTitle>
              <CardDescription>
                Información sobre el estado actual de la sincronización
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total de partidos</span>
                    <span className="text-2xl font-bold">{stats.matches.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Partidos sincronizados</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{stats.matches.synced}</span>
                      <Badge variant="success">
                        {stats.matches.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Caché activo</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{stats.cache.active} entradas</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearCache()}
                        disabled={clearCacheMutation.isPending}
                        StartIcon={Trash2}
                      >
                        Limpiar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Seasons Tab */}
        <TabsContent value="seasons" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Temporadas Activas</CardTitle>
              <CardDescription>
                Temporadas que están en curso o próximas a comenzar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSeasons ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : activeSeasons && activeSeasons.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Temporada</TableHead>
                      <TableHead>Competición</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead>Partidos</TableHead>
                      <TableHead>Fuente</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSeasons.map((season) => (
                      <TableRow key={season.id}>
                        <TableCell className="font-medium">
                          {season.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{season.competition.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {season.competition.sport}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {season.startsAt
                            ? new Date(season.startsAt).toLocaleDateString("es-MX", {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              })
                            : "Presente"}
                          {" - "}
                          {season.endsAt
                            ? new Date(season.endsAt).toLocaleDateString("es-MX", {
                                month: "short",
                                day: "numeric"
                              })
                            : "Presente"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{season.matchCount}</Badge>
                        </TableCell>
                        <TableCell>
                          {season.externalSource ? (
                            <Badge variant="default">{season.externalSource.name}</Badge>
                          ) : (
                            <Badge variant="warning">Sin fuente</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {season.canSync ? (
                            <Badge variant="success">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Listo
                            </Badge>
                          ) : (
                            <Badge variant="error">
                              <XCircle className="mr-1 h-3 w-3" />
                              No configurado
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No hay temporadas activas en este momento
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Sources Tab */}
        <TabsContent value="sources" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Fuentes de Datos</CardTitle>
              <CardDescription>
                Proveedores externos configurados y sus estadísticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : stats && stats.sources.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Mapeos</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.sources.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell className="font-medium">{source.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{source.slug}</Badge>
                        </TableCell>
                        <TableCell>{source.mappings} entidades</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleClearCache(source.slug)}
                            disabled={clearCacheMutation.isPending}
                            StartIcon={Trash2}
                          >
                            Limpiar caché
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Database className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No hay fuentes de datos configuradas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
