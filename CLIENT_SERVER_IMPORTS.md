# Client/Server Import Guide

**Last Updated:** 2025-01-10  
**Purpose:** Evitar errores "Module not found: Can't resolve 'fs'" en componentes client

---

## 🚨 El Problema

Next.js 13+ con App Router separa código **client** y **server**:

- **Server Components** - Pueden usar Node.js APIs (`fs`, `crypto`, `nodemailer`, etc.)
- **Client Components** (`"use client"`) - Solo pueden usar APIs del navegador

**Error común:**
```
Module not found: Can't resolve 'fs'
```

**Causa:** Importar paquetes con dependencias de Node.js en componentes client.

---

## ✅ La Solución: Separar Imports

### **Estructura de `@qp/utils`:**

```
packages/utils/src/
├── index.ts          # Exports TODO (server + client)
├── client.ts         # Exports SOLO client-safe ✅
├── email/            # ❌ Server only (usa nodemailer)
├── media-url.ts      # ✅ Client safe
├── sports/           # ✅ Client safe
└── csv/              # ⚠️ Depende del uso
```

---

## 📦 Cómo Importar Correctamente

### **En Server Components (sin "use client"):**

```typescript
// ✅ Puede importar TODO
import { sendEmail, getOptimizedMediaUrl } from "@qp/utils";
```

### **En Client Components ("use client"):**

```typescript
// ✅ CORRECTO - Solo imports client-safe
import { getOptimizedMediaUrl } from "@qp/utils/client";

// ❌ INCORRECTO - Incluye código de servidor
import { getOptimizedMediaUrl } from "@qp/utils";
```

---

## 🔍 Identificar Componentes Client vs Server

### **Client Component:**
```typescript
"use client";  // ← Esta directiva

import { useState } from "react";
import { getOptimizedMediaUrl } from "@qp/utils/client"; // ✅

export function MyComponent() {
  const [state, setState] = useState();
  // ...
}
```

**Características:**
- Tiene `"use client"` al inicio
- Usa hooks de React (`useState`, `useEffect`, etc.)
- Usa APIs del navegador (`window`, `document`, etc.)
- Maneja eventos del usuario (`onClick`, `onChange`, etc.)

### **Server Component:**
```typescript
// Sin "use client" ← Es server por defecto

import { sendEmail } from "@qp/utils"; // ✅
import { prisma } from "@qp/db";

export async function MyComponent() {
  const data = await prisma.user.findMany();
  // ...
}
```

**Características:**
- NO tiene `"use client"`
- Puede ser `async`
- Accede directamente a la base de datos
- Usa Node.js APIs

---

## 📋 Checklist de Imports

### **`@qp/utils` - Qué Usar Dónde:**

| Función/Módulo | Client | Server | Import |
|----------------|--------|--------|--------|
| `getOptimizedMediaUrl()` | ✅ | ✅ | `@qp/utils/client` |
| `convertGoogleDriveUrl()` | ✅ | ✅ | `@qp/utils/client` |
| `isDirectMediaUrl()` | ✅ | ✅ | `@qp/utils/client` |
| `sendEmail()` | ❌ | ✅ | `@qp/utils` |
| `createSMTPTransport()` | ❌ | ✅ | `@qp/utils` |
| Sports utilities | ✅ | ✅ | `@qp/utils/client` o `@qp/utils/sports` |

### **Otros Paquetes:**

| Paquete | Client | Server | Notas |
|---------|--------|--------|-------|
| `@qp/db` | ❌ | ✅ | Prisma solo en servidor |
| `@qp/api` | ⚠️ | ✅ | tRPC routers solo en servidor |
| `@qp/ui` | ✅ | ✅ | Componentes React |
| `@qp/auth` | ⚠️ | ✅ | Config en servidor, hooks en cliente |
| `@qp/branding` | ✅ | ✅ | Pure functions |

---

## 🛠️ Cómo Migrar Código Existente

### **Paso 1: Identificar el Error**

```bash
Module not found: Can't resolve 'fs'

Import trace:
  nodemailer → @qp/utils → tu-componente.tsx
```

### **Paso 2: Verificar si es Client Component**

```typescript
// tu-componente.tsx
"use client";  // ← SÍ es client component
```

### **Paso 3: Cambiar el Import**

```typescript
// ❌ Antes
import { getOptimizedMediaUrl } from "@qp/utils";

// ✅ Después
import { getOptimizedMediaUrl } from "@qp/utils/client";
```

### **Paso 4: Verificar**

```bash
pnpm dev
# Debería compilar sin errores
```

---

## 🧪 Testing

### **Verificar que Client Imports Funcionan:**

```typescript
// test-client.tsx
"use client";

import { getOptimizedMediaUrl } from "@qp/utils/client";

export function TestClient() {
  const url = getOptimizedMediaUrl("https://example.com/video.mp4");
  return <div>{url}</div>;
}
```

### **Verificar que Server Imports Funcionan:**

```typescript
// test-server.tsx (sin "use client")

import { sendEmail } from "@qp/utils";

export async function TestServer() {
  await sendEmail({
    to: "test@example.com",
    subject: "Test",
    html: "<p>Test</p>"
  });
  return <div>Email sent</div>;
}
```

---

## 📚 Ejemplos Reales

### **Ejemplo 1: Pool Landing (Client)**

```typescript
"use client";

import { getOptimizedMediaUrl } from "@qp/utils/client"; // ✅
import { Button } from "@qp/ui";

export function PoolLanding({ brand }) {
  const heroUrl = getOptimizedMediaUrl(brand.theme.heroAssets?.assetUrl);
  
  return (
    <div>
      <video src={heroUrl} />
    </div>
  );
}
```

### **Ejemplo 2: Home Page (Server)**

```typescript
// Sin "use client" - es server component

import { getOptimizedMediaUrl } from "@qp/utils/client"; // ✅ También funciona en server
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";

export default async function HomePage() {
  const { brand } = await resolveTenantAndBrandFromHost("localhost");
  const heroUrl = getOptimizedMediaUrl(brand?.theme?.heroAssets?.assetUrl);
  
  return <div>...</div>;
}
```

### **Ejemplo 3: Email Worker (Server Only)**

```typescript
// worker/src/jobs/send-invites.ts

import { sendEmail } from "@qp/utils"; // ✅ Solo en servidor
import { prisma } from "@qp/db";

export async function sendInvites() {
  const invites = await prisma.invitation.findMany();
  
  for (const invite of invites) {
    await sendEmail({
      to: invite.email,
      subject: "Invitación",
      html: `<p>Token: ${invite.token}</p>`
    });
  }
}
```

---

## 🐛 Troubleshooting

### **Error: "Module not found: Can't resolve 'fs'"**

**Solución:**
1. Verifica si el componente tiene `"use client"`
2. Cambia el import a `@qp/utils/client`

### **Error: "getOptimizedMediaUrl is not a function"**

**Solución:**
1. Verifica que `@qp/utils/client` existe
2. Reinicia el dev server: `pnpm dev`
3. Limpia cache: `rm -rf .next`

### **Error: "Cannot find module '@qp/utils/client'"**

**Solución:**
1. Verifica que `packages/utils/src/client.ts` existe
2. Verifica que `packages/utils/package.json` tiene el export:
   ```json
   "exports": {
     "./client": "./src/client.ts"
   }
   ```
3. Reinstala dependencias: `pnpm install`

---

## 📝 Reglas de Oro

1. ✅ **Client components** → `@qp/utils/client`
2. ✅ **Server components** → `@qp/utils` (puede usar ambos)
3. ❌ **NUNCA** importar `nodemailer` o `fs` en client
4. ⚠️ **Duda?** → Usa `@qp/utils/client` (más seguro)

---

## 🔄 Actualizar Código Existente

### **Script de Búsqueda:**

```bash
# Buscar componentes client que usan @qp/utils
grep -r '"use client"' apps/web --include="*.tsx" -A 20 | grep '@qp/utils"'
```

### **Reemplazar en Masa:**

```bash
# En componentes client, cambiar import
find apps/web -name "*.tsx" -exec sed -i 's/@qp\/utils"/@qp\/utils\/client"/g' {} \;
```

⚠️ **Cuidado:** Verifica manualmente que solo cambias en componentes client.

---

## 📖 Referencias

- [Next.js: Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js: Module not found](https://nextjs.org/docs/messages/module-not-found)
- [React: "use client" directive](https://react.dev/reference/react/use-client)

---

**¡Sigue estas reglas y evitarás errores de build! 🚀**
