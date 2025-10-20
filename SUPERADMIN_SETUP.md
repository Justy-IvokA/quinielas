# Configuración SUPERADMIN - Guía Rápida

## ✅ Cambios Realizados

He agregado las opciones de SUPERADMIN al navbar y menú de usuario:

1. **Navbar** (visible solo para SUPERADMIN):
   - Nuevo enlace "Superadmin" con icono de corona (Crown)
   - Aparece entre "Personalización" y el selector de idioma

2. **Menú de Usuario** (dropdown del avatar):
   - Nueva sección "SUPERADMIN" con separador
   - "Gestión de Tenants" → `/superadmin/tenants`
   - "Pool Templates" → `/superadmin/templates`

## 🔑 Asignar Rol SUPERADMIN

Para ver las opciones de SUPERADMIN, tu usuario necesita tener el rol `SUPERADMIN` en la tabla `TenantMember`.

### Opción 1: Script Automático (Recomendado)

Ejecuta el siguiente comando reemplazando el email con el tuyo:

```bash
npx tsx scripts/set-superadmin.ts tu-email@ejemplo.com
```

Por ejemplo:
```bash
npx tsx scripts/set-superadmin.ts victor@innovatica.com.mx
```

### Opción 2: Manualmente en la Base de Datos

Si prefieres hacerlo manualmente, ejecuta este SQL:

```sql
-- 1. Encuentra tu userId
SELECT id, email, name FROM "User" WHERE email = 'tu-email@ejemplo.com';

-- 2. Encuentra los tenantIds
SELECT id, name, slug FROM "Tenant";

-- 3. Actualiza o crea el TenantMember con rol SUPERADMIN
-- Si ya existe:
UPDATE "TenantMember" 
SET role = 'SUPERADMIN' 
WHERE "userId" = 'tu-user-id' 
  AND "tenantId" = 'tu-tenant-id';

-- Si no existe:
INSERT INTO "TenantMember" (id, "tenantId", "userId", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),  -- o usa un generador de CUID
  'tu-tenant-id',
  'tu-user-id',
  'SUPERADMIN',
  NOW(),
  NOW()
);
```

### Opción 3: Usando Prisma Studio

```bash
cd packages/db
pnpm prisma studio
```

1. Abre la tabla `TenantMember`
2. Busca tu registro (por userId)
3. Cambia el campo `role` a `SUPERADMIN`
4. Guarda

## 🔄 Después de Asignar el Rol

1. **Cierra sesión** en la aplicación
2. **Vuelve a iniciar sesión**
3. Deberías ver:
   - En el navbar: enlace "Superadmin" con icono de corona
   - En el menú de usuario (avatar): sección SUPERADMIN con dos opciones
   - El badge "SUPERADMIN" debajo de tu email en el menú

## 🎯 Rutas Disponibles

Una vez que tengas el rol SUPERADMIN:

- `/superadmin/tenants` - Lista de todos los tenants
- `/superadmin/tenants/[id]` - Detalle de un tenant
- `/superadmin/templates` - Lista de templates
- `/superadmin/templates/new` - Crear nuevo template
- `/superadmin/templates/[id]/edit` - Editar template

## 🛡️ Seguridad

- Todas las rutas `/superadmin/*` están protegidas por `SuperAdminGuard`
- Solo usuarios con rol `SUPERADMIN` pueden acceder
- Todos los endpoints tRPC `superadmin.*` requieren el rol SUPERADMIN
- Si intentas acceder sin el rol, serás redirigido con error 403

## 📝 Verificación

Para verificar que todo funciona:

1. Inicia sesión con tu usuario SUPERADMIN
2. Haz clic en tu avatar (esquina superior derecha)
3. Deberías ver:
   ```
   Tu Nombre
   tu-email@ejemplo.com
   🛡️ SUPERADMIN
   ───────────────
   👤 Perfil
   ⚙️ Configuración
   ───────────────
   SUPERADMIN
   👥 Gestión de Tenants
   📄 Pool Templates
   ───────────────
   🚪 Cerrar sesión
   ```

## 🐛 Troubleshooting

### No veo las opciones de SUPERADMIN

1. Verifica que tu usuario tenga el rol en la base de datos:
   ```sql
   SELECT tm.role, t.name as tenant, u.email 
   FROM "TenantMember" tm
   JOIN "Tenant" t ON tm."tenantId" = t.id
   JOIN "User" u ON tm."userId" = u.id
   WHERE u.email = 'tu-email@ejemplo.com';
   ```

2. Cierra sesión y vuelve a iniciar sesión

3. Verifica en el navegador (DevTools → Application → Cookies) que la sesión se actualizó

### Error 403 al acceder a /superadmin

- Asegúrate de que el rol esté correctamente asignado
- Verifica que `SuperAdminGuard` esté funcionando
- Revisa los logs del servidor

## 📚 Documentación Completa

Para más detalles sobre la implementación completa, consulta:
- `SUPERADMIN_IMPLEMENTATION.md` - Documentación técnica completa
