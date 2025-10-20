"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@admin/trpc";
import { toast } from "sonner";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@qp/ui";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  CheckCircle2,
  AlertCircle,
  Globe,
  Copy,
  ExternalLink
} from "lucide-react";

export default function BrandDomainsPage({
  params
}: {
  params: Promise<{ id: string; brandId: string }>;
}) {
  const router = useRouter();
  const { id: tenantId, brandId } = use(params);
  const [newDomain, setNewDomain] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: brand, isLoading, refetch } = trpc.superadmin.brands.get.useQuery({
    id: brandId
  });

  const addDomainMutation = trpc.superadmin.brands.addDomain.useMutation({
    onSuccess: () => {
      toast.success("Dominio agregado exitosamente");
      setNewDomain("");
      setIsAddOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Error al agregar dominio");
    }
  });

  const removeDomainMutation = trpc.superadmin.brands.removeDomain.useMutation({
    onSuccess: () => {
      toast.success("Dominio eliminado exitosamente");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar dominio");
    }
  });

  const handleAddDomain = () => {
    if (!newDomain.trim()) {
      toast.error("Ingresa un dominio válido");
      return;
    }

    addDomainMutation.mutate({
      brandId,
      domain: newDomain.trim().toLowerCase()
    });
  };

  const handleCopyDomain = (domain: string) => {
    navigator.clipboard.writeText(`https://${domain}`);
    toast.success("URL copiada al portapapeles");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Brand no encontrado</AlertDescription>
        </Alert>
      </div>
    );
  }

  const domains = Array.isArray(brand.domains) ? brand.domains : [];

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push(`/superadmin/tenants/${tenantId}`)}
        StartIcon={ArrowLeftIcon}
      >
        Volver a Tenant
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold">Configuración de Dominios</h1>
            <p className="text-muted-foreground">
              {brand.name} ({brand.tenant.name})
            </p>
          </div>
        </div>
      </div>

      {/* Instructions Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            Instrucciones de Configuración DNS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Para Dominios Personalizados:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Agrega el dominio en esta página</li>
              <li>
                En tu proveedor de DNS, crea un registro <Badge variant="outline">CNAME</Badge> o{" "}
                <Badge variant="outline">A</Badge>
              </li>
              <li>
                Apunta a: <code className="bg-muted px-2 py-1 rounded">tu-servidor.com</code> o IP
              </li>
              <li>Espera la propagación DNS (puede tardar hasta 48 horas)</li>
              <li>Verifica que el dominio resuelva correctamente</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Para Desarrollo Local:</h4>
            <p className="text-sm text-muted-foreground">
              Usa subdominios <code className="bg-muted px-2 py-1 rounded">*.localhost</code> y
              agrégalos al archivo <code className="bg-muted px-2 py-1 rounded">hosts</code>
            </p>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Nota:</strong> Si no configuras dominios personalizados, el sistema usará
              automáticamente el subdominio:{" "}
              <code className="bg-muted px-2 py-1 rounded">
                {brand.tenant.slug}.tudominio.com
              </code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Domains List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dominios Configurados</CardTitle>
              <CardDescription>
                {domains.length === 0
                  ? "No hay dominios configurados"
                  : `${domains.length} dominio(s) activo(s)`}
              </CardDescription>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button StartIcon={PlusIcon}>
                  Agregar Dominio
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Dominio</DialogTitle>
                  <DialogDescription>
                    Ingresa el dominio completo (ej: quinielas.miempresa.com)
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="domain">Dominio</Label>
                    <Input
                      id="domain"
                      placeholder="quinielas.miempresa.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddDomain();
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ejemplos válidos: miempresa.com, quinielas.miempresa.com, brand.localhost
                    </p>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Asegúrate de que el dominio apunte a tu servidor antes de agregarlo
                    </AlertDescription>
                  </Alert>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddOpen(false);
                      setNewDomain("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddDomain}
                    disabled={!newDomain.trim() || addDomainMutation.isPending}
                  >
                    {addDomainMutation.isPending ? "Agregando..." : "Agregar Dominio"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No hay dominios configurados para esta marca
              </p>
              <p className="text-sm text-muted-foreground">
                El sistema usará el subdominio predeterminado:{" "}
                <code className="bg-muted px-2 py-1 rounded">
                  {brand.tenant.slug}.tudominio.com
                </code>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map((domain, index) => (
                <div
                  key={domain}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm font-medium">{domain}</code>
                        {index === 0 && (
                          <Badge variant="default" className="text-xs">
                            Principal
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        https://{domain}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyDomain(domain)}
                      StartIcon={Copy}
                    />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://${domain}`, "_blank")}
                      StartIcon={ExternalLink}
                    />

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive" StartIcon={TrashIcon} />
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>¿Eliminar Dominio?</DialogTitle>
                          <DialogDescription>
                            ¿Estás seguro de que deseas eliminar el dominio{" "}
                            <code className="bg-muted px-2 py-1 rounded">{domain}</code>?
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline">Cancelar</Button>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              removeDomainMutation.mutate({
                                brandId,
                                domain
                              })
                            }
                            disabled={removeDomainMutation.isPending}
                          >
                            {removeDomainMutation.isPending ? "Eliminando..." : "Eliminar"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DNS Verification Status */}
      {domains.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Estado de Verificación DNS</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-sm">
                Los dominios están configurados en la base de datos. Asegúrate de que los registros
                DNS apunten correctamente a tu servidor.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
