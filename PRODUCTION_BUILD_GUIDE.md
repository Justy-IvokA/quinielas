# 🚀 Guía de Configuración para Producción

Esta guía explica cómo configurar el proyecto para producción, incluyendo la compilación de packages y el despliegue de las aplicaciones.

## 📋 Tabla de Contenidos

1. [Diferencias entre Desarrollo y Producción](#diferencias-entre-desarrollo-y-producción)
2. [Configuración de Packages para Producción](#configuración-de-packages-para-producción)
3. [Build de Producción](#build-de-producción)
4. [Variables de Entorno](#variables-de-entorno)
5. [Despliegue](#despliegue)
6. [Troubleshooting](#troubleshooting)

---

## 🔄 Diferencias entre Desarrollo y Producción

### Desarrollo (Actual)
- ✅ **Path Mappings**: Los packages importan directamente desde `src/`
- ✅ **Hot Reload**: Cambios instantáneos sin rebuild
- ✅ **TypeScript Directo**: No necesita compilación
- ⚠️ **No optimizado**: Archivos sin minificar

### Producción (Objetivo)
- ✅ **Código Compilado**: JavaScript optimizado en `dist/`
- ✅ **Minificado**: Archivos más pequeños
- ✅ **Type Declarations**: `.d.ts` para consumers
- ✅ **Tree Shaking**: Solo código usado

---

## 📦 Configuración de Packages para Producción

### 1. Actualizar `@qp/utils/package.json`

Cuando estés listo para producción, actualiza el archivo:

```json
{
  "name": "@qp/utils",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./client": {
      "types": "./dist/client.d.ts",
      "import": "./dist/client.js",
      "default": "./dist/client.js"
    },
    "./sports": {
      "types": "./dist/sports/index.d.ts",
      "import": "./dist/sports/index.js",
      "default": "./dist/sports/index.js"
    },
    "./storage/adapter": {
      "types": "./dist/storage/adapter.d.ts",
      "import": "./dist/storage/adapter.js",
      "default": "./dist/storage/adapter.js"
    },
    "./email": {
      "types": "./dist/email/index.d.ts",
      "import": "./dist/email/index.js",
      "default": "./dist/email/index.js"
    },
    "./csv/audit": {
      "types": "./dist/csv/audit.d.ts",
      "import": "./dist/csv/audit.js",
      "default": "./dist/csv/audit.js"
    }
  },
  "scripts": {
    "build": "tsc --build",
    "clean": "rimraf dist",
    "dev": "tsc --build --watch",
    "lint": "eslint .",
    "test": "vitest",
    "typecheck": "tsc --noEmit",
    "format": "prettier --check ."
  }
}
```

### 2. Actualizar `@qp/api/package.json`

```json
{
  "name": "@qp/api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./routers": {
      "types": "./dist/routers/index.d.ts",
      "import": "./dist/routers/index.js"
    },
    "./context": {
      "types": "./dist/context.d.ts",
      "import": "./dist/context.js"
    }
  },
  "scripts": {
    "build": "tsc --build",
    "clean": "rimraf dist",
    "dev": "tsc --build --watch",
    "lint": "eslint .",
    "test": "vitest",
    "typecheck": "tsc --noEmit",
    "format": "prettier --check ."
  }
}
```

### 3. Actualizar Otros Packages

Aplica el mismo patrón a:
- `@qp/db`
- `@qp/auth`
- `@qp/branding`
- `@qp/scoring`
- `@qp/ui`

---

## 🏗️ Build de Producción

### Paso 1: Limpiar Builds Anteriores

```bash
# Limpiar todos los packages
pnpm clean

# O limpiar uno específico
pnpm --filter @qp/utils clean
```

### Paso 2: Build de Packages

```bash
# Build de todos los packages (en orden de dependencias)
pnpm build

# O build individual
pnpm --filter @qp/db build
pnpm --filter @qp/utils build
pnpm --filter @qp/api build
```

### Paso 3: Build de Aplicaciones

```bash
# Build de la app web
pnpm --filter @qp/web build

# Build de la app admin
pnpm --filter @qp/admin build

# Build del worker
pnpm --filter @qp/worker build
```

### Paso 4: Verificar Builds

```bash
# Verificar que los archivos .d.ts existan
ls packages/utils/dist/*.d.ts
ls packages/api/dist/*.d.ts

# Verificar typecheck después del build
pnpm typecheck
```

---

## 🔐 Variables de Entorno

### Desarrollo vs Producción

Crea archivos `.env` separados:

```bash
# Desarrollo
.env.development
.env.development.local

# Producción
.env.production
.env.production.local
```

### Variables Críticas para Producción

**Apps (web/admin):**
```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="tu-secret-super-seguro"

# APIs Externas
NEXT_PUBLIC_SPORTS_API_KEY="tu-api-key"

# Storage
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
```

**Worker:**
```env
DATABASE_URL="postgresql://..."
SPORTS_API_KEY="..."
```

---

## 🚢 Despliegue

### Opción 1: Vercel (Recomendado para Next.js)

#### Web App
```bash
cd apps/web
vercel --prod
```

#### Admin App
```bash
cd apps/admin
vercel --prod
```

**Configuración en Vercel:**
1. Conecta tu repositorio
2. Configura las variables de entorno
3. Build Command: `pnpm build`
4. Output Directory: `.next`
5. Install Command: `pnpm install`

### Opción 2: Docker

Crea un `Dockerfile` en la raíz:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps ./apps

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build packages
RUN pnpm --filter @qp/db build
RUN pnpm --filter @qp/utils build
RUN pnpm --filter @qp/api build
RUN pnpm --filter @qp/auth build
RUN pnpm --filter @qp/branding build
RUN pnpm --filter @qp/scoring build
RUN pnpm --filter @qp/ui build

# Build app
ARG APP_NAME=web
RUN pnpm --filter @qp/${APP_NAME} build

# Production stage
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

ARG APP_NAME=web
ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/apps/${APP_NAME}/.next ./apps/${APP_NAME}/.next
COPY --from=builder /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public
COPY --from=builder /app/apps/${APP_NAME}/package.json ./apps/${APP_NAME}/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 3000

CMD ["pnpm", "--filter", "@qp/${APP_NAME}", "start"]
```

Build y run:
```bash
# Build web
docker build --build-arg APP_NAME=web -t quinielas-web .

# Build admin
docker build --build-arg APP_NAME=admin -t quinielas-admin .

# Run
docker run -p 3000:3000 --env-file .env.production quinielas-web
```

### Opción 3: Railway / Render

1. Conecta tu repositorio
2. Configura Build Command:
   ```bash
   pnpm install && pnpm build && pnpm --filter @qp/web build
   ```
3. Start Command:
   ```bash
   pnpm --filter @qp/web start
   ```

---

## 🔧 Script de Build Automatizado

Crea un script `scripts/build-production.sh`:

```bash
#!/bin/bash

echo "🧹 Limpiando builds anteriores..."
pnpm clean

echo "📦 Instalando dependencias..."
pnpm install --frozen-lockfile

echo "🗄️ Generando Prisma Client..."
pnpm --filter @qp/db prisma generate

echo "🔨 Building packages..."
pnpm --filter @qp/db build
pnpm --filter @qp/utils build
pnpm --filter @qp/scoring build
pnpm --filter @qp/auth build
pnpm --filter @qp/branding build
pnpm --filter @qp/api build
pnpm --filter @qp/ui build

echo "🌐 Building apps..."
pnpm --filter @qp/web build
pnpm --filter @qp/admin build
pnpm --filter @qp/worker build

echo "✅ Build completado!"
echo "📊 Verificando tipos..."
pnpm typecheck

echo "🎉 Todo listo para producción!"
```

Hazlo ejecutable:
```bash
chmod +x scripts/build-production.sh
```

Ejecútalo:
```bash
./scripts/build-production.sh
```

---

## 🐛 Troubleshooting

### Error: "Output file has not been built"

**Causa**: Los packages no están compilados a `dist/`

**Solución**:
```bash
pnpm --filter @qp/utils clean
pnpm --filter @qp/utils build
```

### Error: "Module not found"

**Causa**: Exports en `package.json` no coinciden con estructura de `dist/`

**Solución**: Verifica que los paths en `exports` existan:
```bash
ls packages/utils/dist/sports/index.js
ls packages/utils/dist/sports/index.d.ts
```

### Error: "Cannot find module '@qp/utils/sports'"

**Causa**: Falta el export en `package.json`

**Solución**: Agrega el export:
```json
"./sports": {
  "types": "./dist/sports/index.d.ts",
  "import": "./dist/sports/index.js"
}
```

### Build Lento

**Solución**: Usa Turbo cache:
```bash
# Primera vez
pnpm build

# Subsecuentes (usa cache)
pnpm build
```

---

## 📝 Checklist de Producción

Antes de desplegar, verifica:

- [ ] Todas las variables de entorno están configuradas
- [ ] `DATABASE_URL` apunta a producción
- [ ] `NEXTAUTH_SECRET` es único y seguro
- [ ] Migraciones de Prisma aplicadas: `pnpm --filter @qp/db prisma migrate deploy`
- [ ] Build exitoso: `pnpm build`
- [ ] Typecheck pasa: `pnpm typecheck`
- [ ] Tests pasan: `pnpm test`
- [ ] Archivos `.env.local` no están en git
- [ ] `.gitignore` incluye `dist/`, `.next/`, `node_modules/`

---

## 🎯 Resumen de Comandos

```bash
# Desarrollo (actual)
pnpm dev                    # Inicia apps en modo desarrollo
pnpm typecheck             # Verifica tipos

# Producción
pnpm build                 # Build completo
pnpm --filter @qp/web start    # Inicia web en producción
pnpm --filter @qp/admin start  # Inicia admin en producción

# Limpieza
pnpm clean                 # Limpia todos los builds
```

---

## 📚 Recursos Adicionales

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Turborepo Handbook](https://turbo.build/repo/docs/handbook)
- [PNPM Workspaces](https://pnpm.io/workspaces)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

---

**Nota**: Esta guía asume que estás usando la configuración actual de desarrollo con path mappings. Cuando estés listo para producción, sigue los pasos en orden y prueba en un ambiente de staging primero.
