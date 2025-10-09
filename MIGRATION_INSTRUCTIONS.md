# Instrucciones de Migración - Campo Teléfono en Registro

**Fecha:** 2025-10-09  
**Migración:** `add_phone_to_registration`

---

## ⚠️ Problema Detectado

El comando `prisma migrate dev` requiere permisos para crear una "shadow database" temporal, pero el usuario actual de PostgreSQL no tiene estos permisos.

**Error:**
```
Error: P3014
Prisma Migrate could not create the shadow database.
ERROR: se ha denegado el permiso para crear la base de datos
```

---

## 🔧 Soluciones Disponibles

### Opción 1: Aplicar Migración SQL Manualmente (Recomendado para desarrollo)

#### Paso 1: Conectar a PostgreSQL
```bash
psql -U postgres -d quinielas
# O usar tu cliente SQL favorito (DBeaver, pgAdmin, etc.)
```

#### Paso 2: Ejecutar el script SQL
```sql
-- Add phone column (optional, E.164 format)
ALTER TABLE "Registration" 
ADD COLUMN "phone" TEXT;

-- Add phoneVerified column (default false)
ALTER TABLE "Registration" 
ADD COLUMN "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN "Registration"."phone" IS 'Phone number in E.164 format (e.g., +525512345678)';
COMMENT ON COLUMN "Registration"."phoneVerified" IS 'Whether the phone number has been verified via SMS/WhatsApp';
```

**Archivo SQL disponible en:**
`packages/db/migrations/add_phone_to_registration.sql`

#### Paso 3: Regenerar cliente Prisma
```bash
cd packages/db

# Cerrar cualquier proceso que use Prisma (dev servers, etc.)
# Luego ejecutar:
pnpm prisma generate
```

Si el comando anterior falla con error `EPERM`, ejecutar:
```powershell
# En PowerShell como Administrador
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
cd C:\Users\victo\Documents\reactNextJS\quinielas\packages\db
pnpm prisma generate
```

---

### Opción 2: Otorgar Permisos de Superusuario (Producción NO recomendado)

```sql
-- Conectar como superusuario (postgres)
psql -U postgres

-- Otorgar permisos de crear base de datos
ALTER USER tu_usuario CREATEDB;

-- Verificar
\du
```

Luego ejecutar:
```bash
cd packages/db
pnpm prisma migrate dev --name add_phone_to_registration
```

---

### Opción 3: Usar Variable de Entorno para Shadow Database

Agregar en `packages/db/prisma/.env`:

```env
# Usar el mismo schema para shadow database
SHADOW_DATABASE_URL="postgresql://usuario:password@localhost:5432/quinielas?schema=shadow"
```

Crear el schema manualmente:
```sql
CREATE SCHEMA IF NOT EXISTS shadow;
```

Luego ejecutar:
```bash
cd packages/db
pnpm prisma migrate dev --name add_phone_to_registration
```

---

## ✅ Verificación Post-Migración

### 1. Verificar columnas en la base de datos
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'Registration'
  AND column_name IN ('phone', 'phoneVerified');
```

**Resultado esperado:**
```
 column_name  | data_type | is_nullable | column_default
--------------+-----------+-------------+----------------
 phone        | text      | YES         | NULL
 phoneVerified| boolean   | NO          | false
```

### 2. Verificar que Prisma Client se regeneró
```bash
cd packages/db
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); console.log('phone' in p.registration.fields ? '✅ OK' : '❌ FAIL');"
```

### 3. Verificar TypeScript en API
```bash
cd packages/api
pnpm tsc --noEmit
```

**Debe salir sin errores.**

### 4. Verificar TypeScript en Web App
```bash
cd apps/web
pnpm tsc --noEmit
```

**Debe salir sin errores.**

---

## 🧪 Testing Manual

### Test 1: Registro sin teléfono
1. Ir a `/register?pool=demo-pool-id`
2. Llenar solo nombre y email
3. Dejar teléfono vacío
4. Submit → **Debe funcionar**

### Test 2: Registro con teléfono válido
1. Ir a `/register?pool=demo-pool-id`
2. Llenar nombre, email y teléfono: `+525512345678`
3. Submit → **Debe funcionar**
4. Verificar en DB:
   ```sql
   SELECT displayName, email, phone, "phoneVerified" 
   FROM "Registration" 
   ORDER BY "joinedAt" DESC 
   LIMIT 1;
   ```
   **Esperado:** `phoneVerified = false`

### Test 3: Registro con teléfono inválido
1. Ir a `/register?pool=demo-pool-id`
2. Llenar nombre, email y teléfono: `5512345678` (sin +)
3. Submit → **Debe mostrar error de validación**

### Test 4: Registro con código + teléfono
1. Ir a `/register?pool=demo-pool-id&code=ABC12345`
2. Llenar todos los campos incluyendo teléfono
3. Submit → **Debe funcionar**

### Test 5: Registro email invite + teléfono
1. Ir a `/register?pool=demo-pool-id&token=...`
2. Llenar nombre y teléfono
3. Submit → **Debe funcionar**

---

## 🚨 Rollback (Si algo sale mal)

### Revertir cambios en la base de datos
```sql
-- Eliminar columnas agregadas
ALTER TABLE "Registration" DROP COLUMN IF EXISTS "phone";
ALTER TABLE "Registration" DROP COLUMN IF EXISTS "phoneVerified";
```

### Revertir cambios en el código
```bash
git checkout HEAD -- packages/db/prisma/schema.prisma
git checkout HEAD -- packages/api/src/routers/registration/
git checkout HEAD -- apps/web/app/register/components/
```

---

## 📊 Estado Actual

### ✅ Completado
- [x] Schema Prisma actualizado
- [x] Schemas tRPC actualizados con validación E.164
- [x] Routers de registro actualizados (3 mutations)
- [x] Formularios frontend actualizados (3 componentes)
- [x] Validación TypeScript sin errores
- [x] Script SQL de migración creado

### ⏳ Pendiente
- [ ] Ejecutar migración en base de datos
- [ ] Regenerar cliente Prisma
- [ ] Testing manual de los 5 casos
- [ ] Rebuild de turbo cache
- [ ] Deploy a staging/producción

---

## 🔗 Archivos Relacionados

- **Migración SQL:** `packages/db/migrations/add_phone_to_registration.sql`
- **Documentación:** `PHONE_REGISTRATION_IMPLEMENTATION.md`
- **Guía de notificaciones:** `PHONE_NOTIFICATIONS_GUIDE.md`

---

## 💡 Recomendación

Para desarrollo local, **usar Opción 1** (migración manual SQL) es más rápido y seguro.

Para producción, configurar correctamente las credenciales de base de datos con permisos adecuados y usar `prisma migrate deploy`.

---

**Siguiente paso:** Ejecutar el script SQL en tu base de datos PostgreSQL.

```bash
# Opción A: Desde psql
psql -U postgres -d quinielas -f packages/db/migrations/add_phone_to_registration.sql

# Opción B: Copiar y pegar en tu cliente SQL favorito
cat packages/db/migrations/add_phone_to_registration.sql
```
