# 🗄️ Configuración de Base de Datos PostgreSQL

## ✅ Tu Base de Datos Está Lista

Tu servidor PostgreSQL ya está configurado y listo para usar en producción.

### Credenciales de Conexión

```
Host: 216.238.75.97
Port: 5432
Database: quinielas
User: admin
Password: ********** (usa tu contraseña real)
Schema: public
```

### Connection String (DATABASE_URL)

```
postgresql://admin:TU_PASSWORD@216.238.75.97:5432/quinielas?schema=public
```

**⚠️ IMPORTANTE**: Reemplaza `TU_PASSWORD` con tu contraseña real al configurar.

---

## 🚀 Pasos para Configurar

### 1. Aplicar Migraciones

```powershell
# Configura la DATABASE_URL (reemplaza TU_PASSWORD con tu contraseña real)
$env:DATABASE_URL="postgresql://admin:TU_PASSWORD@216.238.75.97:5432/quinielas?schema=public"

# Genera el cliente de Prisma
pnpm db:generate

# Aplica el schema a la base de datos
pnpm db:push

# (Opcional) Ejecuta el seed para datos de prueba
pnpm seed
```

### 2. Verificar Conexión

```powershell
# Abre Prisma Studio para ver tu base de datos
pnpm --filter @qp/db exec prisma studio
```

Esto abrirá una interfaz web en `http://localhost:5555` donde podrás ver todas tus tablas y datos.

---

## 🔐 Seguridad

### Firewall y Acceso

Para que Cloudflare pueda conectarse a tu base de datos:

1. **Puerto 5432** debe estar abierto para conexiones externas
2. **Firewall** debe permitir conexiones desde IPs de Cloudflare
3. Cloudflare usa **IPs dinámicas**, considera:
   - Permitir todas las IPs (menos seguro pero más simple)
   - O usar una lista de IPs de Cloudflare: https://www.cloudflare.com/ips/

### Recomendaciones de Seguridad

- ✅ Usa SSL/TLS para conexiones (agrega `?sslmode=require` si tu servidor lo soporta)
- ✅ Cambia la contraseña por defecto después del deployment
- ✅ Crea un usuario específico para la aplicación con permisos limitados
- ✅ Habilita logs de auditoría en PostgreSQL
- ✅ Configura backups automáticos

---

## 📊 Monitoreo

### Herramientas Recomendadas

1. **pgAdmin** - Interfaz gráfica completa
   - Descarga: https://www.pgadmin.org/

2. **DBeaver** - Cliente universal de bases de datos
   - Descarga: https://dbeaver.io/

3. **Prisma Studio** - Incluido en tu proyecto
   ```powershell
   pnpm --filter @qp/db exec prisma studio
   ```

### Métricas a Monitorear

- **Storage usage** - Espacio usado en disco
- **Active connections** - Conexiones activas
- **Query performance** - Queries lentas
- **Error logs** - Errores de conexión o queries
- **Backup status** - Estado de backups

---

## 🔄 Backups

### Configurar Backups Automáticos

```bash
# Backup manual (desde tu servidor)
pg_dump -h 216.238.75.97 -U admin -d quinielas > backup_$(date +%Y%m%d).sql

# Restaurar desde backup
psql -h 216.238.75.97 -U admin -d quinielas < backup_20250121.sql
```

### Recomendaciones

- ✅ Backups diarios automáticos
- ✅ Retención de al menos 7 días
- ✅ Backups en ubicación diferente al servidor principal
- ✅ Probar restauración periódicamente

---

## 🌍 Ambientes (Dev/Staging/Production)

### Opción 1: Schemas Separados (Recomendado)

```sql
-- Crear schema para desarrollo
CREATE SCHEMA dev;

-- Crear schema para staging
CREATE SCHEMA staging;

-- Production usa el schema 'public' (default)
```

Luego en tu `.env`:
```bash
# Development
DATABASE_URL="postgresql://admin:TU_PASSWORD@216.238.75.97:5432/quinielas?schema=dev"

# Staging
DATABASE_URL="postgresql://admin:TU_PASSWORD@216.238.75.97:5432/quinielas?schema=staging"

# Production
DATABASE_URL="postgresql://admin:TU_PASSWORD@216.238.75.97:5432/quinielas?schema=public"
```

### Opción 2: Bases de Datos Separadas

```sql
-- Crear bases de datos adicionales
CREATE DATABASE quinielas_dev;
CREATE DATABASE quinielas_staging;
```

---

## 🐛 Troubleshooting

### Error: "Connection refused"

**Causa**: El puerto 5432 no está abierto o el firewall bloquea la conexión.

**Solución**:
```bash
# Verifica que PostgreSQL esté corriendo
systemctl status postgresql

# Verifica que el puerto esté abierto
netstat -an | grep 5432

# Verifica el firewall (ejemplo con ufw)
sudo ufw allow 5432/tcp
```

### Error: "Authentication failed"

**Causa**: Credenciales incorrectas o usuario no tiene permisos.

**Solución**:
```sql
-- Verifica el usuario
SELECT * FROM pg_user WHERE usename = 'admin';

-- Otorga permisos si es necesario
GRANT ALL PRIVILEGES ON DATABASE quinielas TO admin;
```

### Error: "Too many connections"

**Causa**: Se alcanzó el límite de conexiones simultáneas.

**Solución**:
```sql
-- Ver conexiones activas
SELECT count(*) FROM pg_stat_activity;

-- Aumentar el límite (requiere reinicio)
-- En postgresql.conf:
max_connections = 200

-- O terminar conexiones inactivas
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND state_change < current_timestamp - INTERVAL '5 minutes';
```

### Error: "Slow queries"

**Causa**: Falta de índices o queries no optimizadas.

**Solución**:
```sql
-- Ver queries lentas
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Agregar índices en Prisma schema
model Match {
  id Int @id @default(autoincrement())
  kickoff DateTime
  
  @@index([kickoff]) // Agrega índice
}
```

---

## 📝 Variables de Entorno

### Para Cloudflare Pages (Web & Admin)

En Cloudflare Dashboard → Pages → Settings → Environment variables:

```bash
DATABASE_URL=postgresql://admin:TU_PASSWORD@216.238.75.97:5432/quinielas?schema=public
```

### Para Cloudflare Worker

```powershell
# Configura como secret (más seguro)
cd apps/worker
npx wrangler secret put DATABASE_URL

# Cuando te lo pida, pega tu connection string completo con tu contraseña real:
postgresql://admin:TU_PASSWORD@216.238.75.97:5432/quinielas?schema=public
```

---

## ✅ Checklist de Configuración

- [ ] Migraciones aplicadas (`pnpm db:push`)
- [ ] Cliente de Prisma generado (`pnpm db:generate`)
- [ ] Seed ejecutado (opcional)
- [ ] Conexión verificada con Prisma Studio
- [ ] Puerto 5432 abierto en firewall
- [ ] Conexiones externas permitidas
- [ ] Variables de entorno configuradas en Cloudflare
- [ ] Backups configurados
- [ ] Monitoreo configurado

---

## 🎉 ¡Listo!

Tu base de datos PostgreSQL está configurada y lista para usar con tu aplicación en Cloudflare.

**Próximo paso**: Continúa con el deployment siguiendo `NEXT_STEPS.md`
