# Setup Instructions - Auth & SUPERADMIN

## ✅ Completado

1. ✅ Auth.js configurado con Prisma adapter
2. ✅ RBAC middleware implementado
3. ✅ Tenant router (SUPERADMIN only)
4. ✅ Admin UI con guards y páginas de gestión
5. ✅ Tests unitarios e integración
6. ✅ Variables de entorno configuradas

## 📋 Pasos Pendientes

### 1. Instalar Dependencias

```powershell
# En la raíz del proyecto
pnpm install
```

### 2. Generar Cliente Prisma

```powershell
cd packages/db
pnpm prisma generate
```

### 3. Crear Migración de Base de Datos

```powershell
cd packages/db
pnpm prisma migrate dev --name add-auth-tables
```

Esto creará las tablas necesarias para Auth.js:
- `Account` (cuentas OAuth)
- `Session` (sesiones de usuario)
- `VerificationToken` (tokens de magic link)

### 4. Ejecutar Seed

```powershell
cd packages/db
pnpm seed
```

Esto creará:
- Usuario SUPERADMIN: `vemancera@gmail.com`
- Tenant de Innotecnia
- Tenant demo con datos de prueba

### 5. Verificar Configuración

Revisa que los archivos `.env` tengan:

**apps/admin/.env**
```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="tu-secret-de-32-chars"
AUTH_URL="http://localhost:3001"  # Puerto del admin app

# Email Provider
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="tu-email@gmail.com"
EMAIL_SERVER_PASSWORD="tu-app-password"
EMAIL_FROM="noreply@tudominio.com"
```

**apps/web/.env**
```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="mismo-secret-que-admin"
AUTH_URL="http://localhost:3000"

# Email Provider (mismo que admin)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="tu-email@gmail.com"
EMAIL_SERVER_PASSWORD="tu-app-password"
EMAIL_FROM="noreply@tudominio.com"
```

### 6. Iniciar Aplicaciones

```powershell
# Terminal 1 - Admin App
cd apps/admin
pnpm dev

# Terminal 2 - Web App
cd apps/web
pnpm dev
```

### 7. Probar Autenticación

1. Abre el navegador en `http://localhost:3001` (admin)
2. Navega a `/auth/signin`
3. Ingresa: `vemancera@gmail.com`
4. Revisa tu email para el magic link
5. Haz clic en el link para autenticarte

### 8. Acceder a Gestión de Tenants

Una vez autenticado como SUPERADMIN:
1. Navega a `/superadmin/tenants`
2. Verás la lista de tenants
3. Puedes crear, editar, eliminar tenants
4. Gestionar miembros y roles

## 🧪 Ejecutar Tests

```powershell
# Tests de RBAC
cd packages/api
pnpm test src/lib/rbac.test.ts

# Tests de Tenant Router
pnpm test src/routers/tenant.test.ts
```

## 🔧 Troubleshooting

### Error: "openssl no reconocido"

En Windows, usa PowerShell para generar AUTH_SECRET:

```powershell
# Opción 1: Usar .NET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Opción 2: Generar online
# Visita: https://generate-secret.vercel.app/32
```

### Error: "Cannot find module '@qp/auth'"

```powershell
pnpm install
cd packages/auth
pnpm build
```

### Error: "Prisma Client not generated"

```powershell
cd packages/db
pnpm prisma generate
```

### Magic Link no llega

1. Verifica credenciales SMTP en `.env`
2. Si usas Gmail, necesitas una "App Password":
   - Ve a Google Account → Security
   - Habilita 2FA
   - Genera App Password
   - Usa ese password en `EMAIL_SERVER_PASSWORD`

3. Revisa logs del servidor para errores de email

### Error: "UNAUTHORIZED" en tRPC

- Verifica que estés autenticado
- Revisa que `AUTH_SECRET` sea el mismo en todos los `.env`
- Limpia cookies del navegador y vuelve a autenticar

### Error: "FORBIDDEN" en /superadmin/tenants

- Verifica que el usuario tenga rol SUPERADMIN
- Ejecuta el seed nuevamente para crear el SUPERADMIN
- Revisa en la base de datos:
  ```sql
  SELECT u.email, tm.role 
  FROM "User" u 
  JOIN "TenantMember" tm ON u.id = tm."userId" 
  WHERE u.email = 'vemancera@gmail.com';
  ```

## 📚 Documentación Adicional

- **Guía completa**: Ver `AUTH_SUPERADMIN_GUIDE.md`
- **Arquitectura Auth**: Ver `AUTH_ARCHITECTURE.md`
- **Reglas del proyecto**: Ver `.windsurfrules`

## 🎯 Próximos Pasos

Después de completar el setup:

1. **Configurar OAuth** (opcional)
   - Google OAuth para sign-in más rápido
   - Microsoft OAuth para empresas

2. **Personalizar UI**
   - Página de sign-in branded
   - Email templates personalizados

3. **Agregar Audit Logs**
   - Registrar acciones de SUPERADMIN
   - Tracking de cambios en tenants

4. **Implementar Rate Limiting**
   - Proteger endpoints de autenticación
   - Prevenir abuse de magic links

## ✅ Checklist Final

- [ ] Dependencias instaladas (`pnpm install`)
- [ ] Prisma client generado
- [ ] Migración aplicada (tablas Auth.js creadas)
- [ ] Seed ejecutado (SUPERADMIN creado)
- [ ] Variables de entorno configuradas
- [ ] Apps corriendo (admin y web)
- [ ] Autenticación probada
- [ ] Acceso a /superadmin/tenants verificado
- [ ] Tests pasando

## 🆘 Soporte

Si encuentras problemas:
1. Revisa esta guía completa
2. Consulta `AUTH_SUPERADMIN_GUIDE.md`
3. Verifica logs del servidor
4. Revisa tests para ejemplos de uso
