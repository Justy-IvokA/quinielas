"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@admin/trpc";
import { toast } from "sonner";
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Textarea,
  SportsLoader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge
} from "@qp/ui";
import { PlusIcon, SearchIcon, Building2Icon, MoreVerticalIcon, TrashIcon, EyeIcon, Globe } from "lucide-react";

export default function TenantsPage() {
  const t = useTranslations('superadmin.tenants');
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<{ id: string; name: string; pools: number } | null>(null);
  const [domainInput, setDomainInput] = useState("");
  const [domains, setDomains] = useState<string[]>([]);

  const { data, isLoading, refetch } = trpc.superadmin.tenants.list.useQuery({
    page,
    limit: 20,
    search: search || undefined
  });

  const createMutation = trpc.superadmin.tenants.create.useMutation({
    onSuccess: () => {
      toast.success(t('create.success'));
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(t('create.error', { message: error.message }));
    }
  });

  const deleteMutation = trpc.superadmin.tenants.delete.useMutation({
    onSuccess: () => {
      toast.success('Cliente eliminado exitosamente');
      setDeleteDialogOpen(false);
      setTenantToDelete(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar cliente');
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string || undefined;

    createMutation.mutate({
      name,
      slug,
      description,
      brands: [{
        name, // Usar mismo nombre del tenant
        slug, // Slug fijo para marca principal
        description, // Usar misma descripción del tenant
        domains: domains.length > 0 ? domains : [] // Usar dominios configurados o vacío
      }]
    });
  };

  return (
    <div className="container mx-auto py-8 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_40%)]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
          <p className="text-accent mt-1">
            {t('description')}
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button StartIcon={PlusIcon} className="text-foreground [text-shadow:_2px_2px_4px_rgb(0_0_0_/_40%)]">
              {t('createButton')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>{t('create.title')}</DialogTitle>
                <DialogDescription>
                  {t('create.description')}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">{t('create.form.name')}</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder={t('create.form.namePlaceholder')}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="slug">{t('create.form.slug')}</Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder={t('create.form.slugPlaceholder')}
                    pattern="[a-z0-9-]+"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('create.form.slugHelp')}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">{t('create.form.description')}</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder={t('create.form.descriptionPlaceholder')}
                  />
                </div>

                <div className="rounded-lg bg-muted/50 p-4 mt-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Se creará automáticamente una marca predeterminada con el mismo nombre y descripción del cliente.
                  </p>
                </div>

                {/* Domain Configuration */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-base font-semibold">Dominios (Opcional)</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Configura dominios personalizados o déjalos vacíos para usar subdominios automáticos
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="ejemplo.com o brand.localhost"
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (domainInput.trim() && !domains.includes(domainInput.trim())) {
                              setDomains([...domains, domainInput.trim().toLowerCase()]);
                              setDomainInput("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (domainInput.trim() && !domains.includes(domainInput.trim())) {
                            setDomains([...domains, domainInput.trim().toLowerCase()]);
                            setDomainInput("");
                          }
                        }}
                        disabled={!domainInput.trim()}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    {domains.length > 0 && (
                      <div className="space-y-2">
                        {domains.map((domain, index) => (
                          <div
                            key={domain}
                            className="flex items-center justify-between p-2 border rounded-lg bg-muted/30"
                          >
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono">{domain}</code>
                              {index === 0 && (
                                <Badge variant="default" className="text-xs">Principal</Badge>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDomains(domains.filter(d => d !== domain))}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {domains.length === 0 && (
                      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                        💡 Sin dominios configurados, se usará: <code className="font-mono">{`{slug}.tudominio.com`}</code>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setDomains([]);
                    setDomainInput("");
                  }}
                >
                  {t('create.form.cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {t('create.form.submit')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <SportsLoader size="md" text={t('loading')} />
        </div>
      ) : (
        <>
          <div className="border rounded-lg text-foreground">
            <Table>
              <TableHeader className="border-card/80 bg-card/70 p-4 shadow-sm backdrop-blur">
                <TableRow>
                  <TableHead className="text-secondary">{t('table.name')}</TableHead>
                  <TableHead className="text-secondary">{t('table.slug')}</TableHead>
                  <TableHead className="text-center text-secondary">{t('table.brands')}</TableHead>
                  <TableHead className="text-center text-secondary">{t('table.pools')}</TableHead>
                  <TableHead className="text-center text-secondary">{t('table.members')}</TableHead>
                  <TableHead className="text-secondary">{t('table.created')}</TableHead>
                  <TableHead className="text-right text-secondary">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="border-border/50 bg-card/40 p-4 shadow-sm backdrop-blur">
                {data?.tenants.map((tenant) => (
                  <TableRow
                    key={tenant.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/superadmin/tenants/${tenant.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2Icon className="h-4 w-4 text-muted-foreground" />
                        {tenant.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {tenant.slug}
                    </TableCell>
                    <TableCell className="text-center">
                      {tenant.brands?.length || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {tenant._count?.pools || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {tenant._count?.members || 0}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/superadmin/tenants/${tenant.id}`);
                            }}
                          >
                            <EyeIcon className="h-4 w-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // Ir al primer brand del tenant para configurar dominios
                              const firstBrand = tenant.brands?.[0];
                              if (firstBrand) {
                                router.push(`/superadmin/tenants/${tenant.id}/brands/${firstBrand.id}/domains`);
                              } else {
                                router.push(`/superadmin/tenants/${tenant.id}`);
                              }
                            }}
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            Configurar Dominios
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTenantToDelete({
                                id: tenant.id,
                                name: tenant.name,
                                pools: tenant._count?.pools || 0
                              });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                {t('pagination.page', { page: data.page, totalPages: data.totalPages, total: data.total })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  {t('pagination.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  {t('pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar Cliente?</DialogTitle>
            <DialogDescription>
              {tenantToDelete && (
                <div className="space-y-3 pt-2">
                  <p>
                    Estás a punto de eliminar el cliente <strong>{tenantToDelete.name}</strong>.
                  </p>
                  
                  {tenantToDelete.pools > 0 ? (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                      <p className="text-sm text-destructive font-medium">
                        ⚠️ No se puede eliminar este cliente
                      </p>
                      <p className="text-sm text-destructive/80 mt-1">
                        El cliente tiene {tenantToDelete.pools} quiniela(s) activa(s). 
                        Debes eliminar todas las quinielas antes de eliminar el cliente.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-sm text-muted-foreground">
                        Esta acción eliminará permanentemente:
                      </p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                        <li>El cliente y su configuración</li>
                        <li>Todas las marcas asociadas</li>
                        <li>Todos los miembros del tenant</li>
                        <li>Registros de auditoría relacionados</li>
                      </ul>
                      <p className="text-sm font-medium text-destructive mt-3">
                        Esta acción no se puede deshacer.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setTenantToDelete(null);
              }}
            >
              Cancelar
            </Button>
            {tenantToDelete && tenantToDelete.pools === 0 && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (tenantToDelete) {
                    deleteMutation.mutate({ id: tenantToDelete.id });
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar Cliente"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
