import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerAuthSession } from "@qp/auth";
import { authConfig } from "@qp/api/context";
import { prisma } from "@qp/db";
import { 
  Shield, 
  Mail, 
  Calendar, 
  Clock, 
  Building2, 
  Users, 
  Trophy,
  Activity,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qp/ui/components/card";
import { Badge } from "@qp/ui/components/badge";
import { Separator } from "@qp/ui/components/separator";
import { Avatar } from "@qp/ui/components/avatar";
import { BackButton } from "@admin/app/components/back-button";

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

// Role colors and labels
const roleConfig = {
  SUPERADMIN: {
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    textColor: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    label: "Super Administrador",
    description: "Acceso completo al sistema"
  },
  TENANT_ADMIN: {
    color: "bg-gradient-to-r from-blue-500 to-cyan-500",
    textColor: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    label: "Administrador de Tenant",
    description: "Gestión completa del tenant"
  },
  TENANT_EDITOR: {
    color: "bg-gradient-to-r from-green-500 to-emerald-500",
    textColor: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    label: "Editor",
    description: "Permisos de edición limitados"
  },
  PLAYER: {
    color: "bg-gradient-to-r from-orange-500 to-amber-500",
    textColor: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    label: "Jugador",
    description: "Participante en quinielas"
  }
} as const;

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  
  // Get session
  const session = await getServerAuthSession(authConfig);
  
  if (!session?.user) {
    redirect(`/${locale}/auth/signin`);
  }

  // Get user with all memberships and statistics
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        include: {
          tenant: {
            select: {
              id: true,
              slug: true,
              name: true,
              description: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      },
      registrations: {
        include: {
          pool: {
            select: {
              id: true,
              name: true,
              tenant: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      },
      predictions: {
        select: {
          id: true
        }
      },
      _count: {
        select: {
          memberships: true,
          registrations: true,
          predictions: true,
          prizeAwards: true
        }
      }
    }
  });

  if (!user) {
    redirect(`/${locale}/auth/signin`);
  }

  // Get highest role config
  const highestRole = session.user.highestRole || "PLAYER";
  const roleInfo = roleConfig[highestRole];

  // Format dates
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(date));
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Back Button */}
      <BackButton fallbackHref="/" />
      
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur opacity-40 group-hover:opacity-70 transition duration-500 animate-pulse" />
            <Avatar
              src={user.image || undefined}
              alt={user.name || user.email}
              fallback={(user.name?.[0] || user.email[0]).toUpperCase()}
              size="xl"
              className="relative border-4 border-background shadow-2xl"
            />
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                {user.name || "Usuario"}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
            </div>

            {/* Role Badge */}
            <div className="flex items-center gap-3">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${roleInfo.color} text-white shadow-lg`}>
                <Shield className="w-4 h-4" />
                <span className="font-semibold text-sm">{roleInfo.label}</span>
              </div>
              {user.emailVerified && (
                <Badge variant="outline" className="gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Email verificado
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">{roleInfo.description}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{user._count.memberships}</div>
              <div className="text-xs text-muted-foreground">Tenants</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">{user._count.registrations}</div>
              <div className="text-xs text-muted-foreground">Quinielas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Información de Cuenta
            </CardTitle>
            <CardDescription>Detalles de tu cuenta y actividad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Miembro desde</span>
                </div>
                <span className="text-sm font-medium">{formatDate(user.createdAt)}</span>
              </div>
              <Separator />
              
              <div className="flex items-start justify-between py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Último acceso</span>
                </div>
                <span className="text-sm font-medium">{formatDate(user.lastSignInAt)}</span>
              </div>
              <Separator />
              
              <div className="flex items-start justify-between py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Trophy className="w-4 h-4" />
                  <span>Predicciones</span>
                </div>
                <span className="text-sm font-medium">{user._count.predictions}</span>
              </div>
              <Separator />
              
              <div className="flex items-start justify-between py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Trophy className="w-4 h-4" />
                  <span>Premios ganados</span>
                </div>
                <span className="text-sm font-medium">{user._count.prizeAwards}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Estado de Verificación
            </CardTitle>
            <CardDescription>Seguridad y verificación de cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg ${user.emailVerified ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800'}`}>
              <div className="flex items-start gap-3">
                {user.emailVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold ${user.emailVerified ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
                    {user.emailVerified ? "Email Verificado" : "Email No Verificado"}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {user.emailVerified 
                      ? `Verificado el ${formatDate(user.emailVerified)}`
                      : "Por favor verifica tu email para acceso completo"
                    }
                  </p>
                </div>
              </div>
            </div>

            {user.phone && (
              <>
                <Separator />
                <div className={`p-4 rounded-lg ${user.phoneVerified ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-800'}`}>
                  <div className="flex items-start gap-3">
                    {user.phoneVerified ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-semibold ${user.phoneVerified ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        Teléfono {user.phoneVerified ? "Verificado" : "No Verificado"}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{user.phone}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tenant Memberships */}
      {user.memberships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Membresías de Tenants
            </CardTitle>
            <CardDescription>
              Tus roles en diferentes organizaciones ({user.memberships.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {user.memberships.map((membership) => {
                const memberRoleInfo = roleConfig[membership.role];
                return (
                  <div
                    key={membership.id}
                    className={`relative overflow-hidden rounded-lg border p-4 transition-all hover:shadow-lg ${memberRoleInfo.bgColor}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <h4 className="font-semibold">{membership.tenant.name}</h4>
                        </div>
                        {membership.tenant.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {membership.tenant.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={memberRoleInfo.textColor}>
                            <Shield className="w-3 h-3 mr-1" />
                            {memberRoleInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Registrations */}
      {user.registrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Quinielas Activas
            </CardTitle>
            <CardDescription>
              Quinielas en las que estás participando ({user.registrations.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user.registrations.slice(0, 5).map((registration) => (
                <div
                  key={registration.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Trophy className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{registration.pool.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {registration.pool.tenant.name}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Activo</Badge>
                </div>
              ))}
              {user.registrations.length > 5 && (
                <p className="text-center text-sm text-muted-foreground pt-2">
                  Y {user.registrations.length - 5} más...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
