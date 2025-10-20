# SUPERADMIN - Inicio Rápido ⚡

## ✅ Estado Actual

Las páginas de SUPERADMIN están ahora en la ubicación correcta:
```
apps/admin/app/[locale]/(authenticated)/superadmin/
```

## 🔑 Asignar Rol SUPERADMIN

Para ver las opciones de SUPERADMIN en el menú, ejecuta:

```bash
npx tsx scripts/set-superadmin.ts tu-email@ejemplo.com
```

Por ejemplo:
```bash
npx tsx scripts/set-superadmin.ts victor@innovatica.com.mx
```

## 🔄 Después de Asignar el Rol

1. **Cierra sesión** en la aplicación
2. **Vuelve a iniciar sesión**
3. Deberías ver:
   - En el navbar: enlace "Superadmin" con icono 👑
   - En el menú de usuario: sección SUPERADMIN con dos opciones

## 🎯 Rutas Disponibles

- `/superadmin/tenants` - Gestión de tenants
- `/superadmin/templates` - Pool templates
- `/superadmin/templates/new` - Crear template
- `/superadmin/templates/[id]/edit` - Editar template

## 🧹 Limpieza (Opcional)

Puedes eliminar la carpeta antigua que ya no se usa:
```
apps/admin/app/superadmin/  ← Esta ya no se necesita
```

## 📝 Verificación Rápida

1. Inicia sesión con tu usuario
2. Haz clic en tu avatar (esquina superior derecha)
3. Si ves la sección "SUPERADMIN" con las opciones, ¡todo está funcionando! ✅

## 🐛 Si no ves las opciones

1. Verifica que ejecutaste el script de asignación de rol
2. Cierra sesión y vuelve a iniciar sesión
3. Verifica en la base de datos:
   ```sql
   SELECT tm.role, u.email 
   FROM "TenantMember" tm
   JOIN "User" u ON tm."userId" = u.id
   WHERE u.email = 'tu-email@ejemplo.com';
   ```
   Debe mostrar `role = 'SUPERADMIN'`
