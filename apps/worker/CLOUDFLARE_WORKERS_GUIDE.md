# 🔧 Cloudflare Workers - Guía de Configuración

## ⚠️ Problema Actual

El worker usa dependencias que **NO son compatibles** con Cloudflare Workers:

- ❌ **Prisma** - Requiere acceso al sistema de archivos
- ❌ **@google-cloud/storage** - Usa módulos nativos de Node.js
- ❌ **Firebase Admin** - Usa módulos nativos de Node.js
- ❌ **Nodemailer** - Usa módulos nativos de Node.js

## 🎯 Soluciones

### Opción 1: Usar Node.js Worker (Recomendado para MVP)

**Ventajas:**
- ✅ Funciona con todas las dependencias actuales
- ✅ No requiere cambios en el código
- ✅ Más fácil de desarrollar y debuggear

**Despliegue:**
- Railway
- Render
- Fly.io
- DigitalOcean App Platform
- AWS ECS/Fargate

**Scripts:**
```bash
# Desarrollo local
pnpm --filter @qp/worker dev

# Producción
pnpm --filter @qp/worker build
pnpm --filter @qp/worker start
```

### Opción 2: Adaptar para Cloudflare Workers

**Requiere cambios significativos:**

#### 1. Reemplazar Prisma con Prisma Data Proxy o D1

**Prisma Data Proxy:**
```typescript
// En lugar de:
import { prisma } from "@qp/db";

// Usa:
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient({
  datasourceUrl: env.DATABASE_URL,
}).$extends(withAccelerate())
```

**O usa Cloudflare D1:**
```typescript
// Migrar de PostgreSQL a D1 (SQLite)
export default {
  async fetch(request, env) {
    const result = await env.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(userId).first();
  }
}
```

#### 2. Reemplazar Storage

**En lugar de @google-cloud/storage, usa:**
```typescript
// Cloudflare R2
export default {
  async fetch(request, env) {
    const object = await env.MY_BUCKET.get(key);
  }
}
```

#### 3. Reemplazar Email

**En lugar de Nodemailer, usa:**
```typescript
// Mailchannels (gratis con Cloudflare Workers)
await fetch('https://api.mailchannels.net/tx/v1/send', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: 'user@example.com' }] }],
    from: { email: 'noreply@yourdomain.com' },
    subject: 'Hello',
    content: [{ type: 'text/plain', value: 'Hello world' }]
  })
});

// O usa Resend API
```

#### 4. Actualizar wrangler.toml

```toml
name = "quinielas-worker"
main = "src/cloudflare-worker.ts"
compatibility_date = "2025-01-21"
compatibility_flags = ["nodejs_compat"]

# Bindings
[[d1_databases]]
binding = "DB"
database_name = "quinielas-prod"
database_id = "your-database-id"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "quinielas-assets"

[vars]
NODE_ENV = "production"
```

### Opción 3: Arquitectura Híbrida (Recomendado para Producción)

**Separar responsabilidades:**

1. **Cloudflare Workers** - Para endpoints HTTP ligeros:
   - Webhooks
   - APIs públicas simples
   - Edge functions

2. **Node.js Worker** - Para jobs pesados:
   - Fixtures sync (Prisma + API calls)
   - Scoring computation (Prisma + complex logic)
   - Email batches (Nodemailer)
   - Background jobs

**Estructura:**
```
apps/
  worker/           # Node.js worker (actual)
  worker-edge/      # Cloudflare Workers (nuevo)
```

## 📝 Scripts Actuales

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",           // Desarrollo local con Node.js
    "dev:wrangler": "wrangler dev",            // Desarrollo con Cloudflare Workers
    "build": "tsc --build",                    // Build para Node.js
    "build:wrangler": "wrangler deploy --dry-run", // Test build para Cloudflare
    "deploy": "wrangler deploy",               // Deploy a Cloudflare
    "start": "node dist/index.js",             // Producción Node.js
    "run": "tsx src/runner.ts"                 // Run manual de jobs
  }
}
```

## 🚀 Recomendación

Para el MVP y desarrollo actual:

1. **Usa `pnpm dev`** (Node.js) para desarrollo local
2. **Despliega a Railway/Render** para producción
3. **Considera Cloudflare Workers** solo para:
   - Webhooks simples
   - Edge functions específicas
   - Después de refactorizar el código

## 📋 Pasos para Cloudflare Workers (Si decides hacerlo)

### 1. Crear worker separado para Cloudflare

```bash
# Crear nuevo worker
mkdir apps/worker-edge
cd apps/worker-edge
pnpm init
```

### 2. Instalar dependencias compatibles

```bash
pnpm add @prisma/client@latest @prisma/extension-accelerate
pnpm add -D wrangler
```

### 3. Configurar Prisma Data Proxy

```bash
# En Prisma Cloud
npx prisma generate --data-proxy

# Obtén la connection string
# DATABASE_URL="prisma://..."
```

### 4. Crear worker.ts

```typescript
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

export interface Env {
  DATABASE_URL: string
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const prisma = new PrismaClient({
      datasourceUrl: env.DATABASE_URL,
    }).$extends(withAccelerate())

    // Tu lógica aquí
    const matches = await prisma.match.findMany({
      where: { status: 'SCHEDULED' }
    })

    console.log(`Found ${matches.length} scheduled matches`)
  }
}
```

### 5. Deploy

```bash
# Set secrets
wrangler secret put DATABASE_URL

# Deploy
wrangler deploy
```

## 🐛 Troubleshooting

### Error: "Could not resolve 'url'"

**Causa:** Cloudflare Workers no tiene módulos nativos de Node.js

**Solución:** Agrega a `wrangler.toml`:
```toml
compatibility_flags = ["nodejs_compat"]
```

### Error: "Prisma Client not found"

**Causa:** Prisma normal no funciona en Workers

**Solución:** Usa Prisma Data Proxy o D1

### Error: "Module not found @google-cloud/storage"

**Causa:** Google Cloud SDK no es compatible

**Solución:** Usa Cloudflare R2

## 📚 Recursos

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Prisma Accelerate](https://www.prisma.io/docs/accelerate)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [MailChannels](https://mailchannels.zendesk.com/hc/en-us/articles/4565898358413-Sending-Email-from-Cloudflare-Workers-using-MailChannels-Send-API)

---

**Conclusión:** Para el desarrollo actual, usa `pnpm dev` (Node.js). Para Cloudflare Workers, necesitarás refactorizar significativamente o crear un worker separado más simple.
