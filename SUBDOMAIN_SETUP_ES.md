# 🚀 Configuración Rápida de Subdominios Locales

Guía paso a paso para habilitar y testear el sistema multi-tenant con subdominios en Windows.

## 📋 Resumen

Esta configuración te permite acceder a diferentes brands mediante subdominios:
- `http://cocacola.localhost:3000` → Brand Coca-Cola (tema rojo)
- `http://pepsi.localhost:3000` → Brand Pepsi (tema azul)
- `http://redbull.localhost:3000` → Brand Red Bull (tema oscuro)
- `http://localhost:3000` → Brand Ivoka (default)

---

## ⚡ Instalación Rápida (Opción Automática)

### Paso 1: Ejecutar Script de Configuración

Abre PowerShell **como Administrador** y ejecuta:

```powershell
cd c:\Users\victo\Documents\reactNextJS\quinielas
.\scripts\setup-local-hosts.ps1
```

Este script automáticamente:
- ✅ Agrega las entradas al archivo `hosts`
- ✅ Limpia el caché DNS
- ✅ Muestra los siguientes pasos

### Paso 2: Ejecutar Seed de Base de Datos

```powershell
pnpm db:seed
```

Esto creará:
- ✅ Tenant "Ivoka" con 4 brands
- ✅ Brands con temas personalizados
- ✅ Configuración de dominios locales

### Paso 3: Iniciar Servidor de Desarrollo

```powershell
pnpm dev
```

### Paso 4: Probar en el Navegador

Abre estas URLs en tu navegador:
- http://cocacola.localhost:3000/es-MX
- http://pepsi.localhost:3000/es-MX
- http://redbull.localhost:3000/es-MX
- http://localhost:3000/es-MX

Deberías ver **diferentes colores y temas** en cada subdominio.

---

## 🔧 Instalación Manual (Opción Alternativa)

Si prefieres configurar manualmente:

### Paso 1: Editar Archivo Hosts

1. Abre **Notepad como Administrador**
2. Abre el archivo: `C:\Windows\System32\drivers\etc\hosts`
3. Agrega al final:

```
# Quinielas WL - Multi-tenant local testing
127.0.0.1       cocacola.localhost
127.0.0.1       pepsi.localhost
127.0.0.1       redbull.localhost
127.0.0.1       ivoka.localhost
127.0.0.1       admin.localhost
```

4. Guarda el archivo (Ctrl + S)

### Paso 2: Limpiar Caché DNS

```powershell
ipconfig /flushdns
```

### Paso 3: Verificar Configuración

```powershell
ping cocacola.localhost
```

Deberías ver respuestas de `127.0.0.1`.

### Paso 4: Continuar con Seed y Dev Server

Sigue los pasos 2-4 de la instalación rápida.

---

## 🧪 Verificación del Sistema

### Verificar que el Middleware Funciona

1. Abre DevTools del navegador (F12)
2. Ve a la pestaña **Network**
3. Recarga la página
4. Busca el request principal
5. En los **Response Headers**, deberías ver:
   ```
   x-brand-slug: cocacola
   x-brand-hostname: cocacola.localhost:3000
   x-brand-is-subdomain: true
   ```

### Verificar que el Tema se Aplica

1. Abre DevTools del navegador (F12)
2. Ve a la pestaña **Elements**
3. Busca el tag `<style id="brand-theme">`
4. Deberías ver CSS variables como:
   ```css
   html:root {
     --primary: 0 100% 50%; /* Rojo para Coca-Cola */
     --background: 0 0% 100%;
     /* ... más variables */
   }
   ```

### Verificar Datos en Base de Datos

```powershell
# Conectar a la base de datos y verificar brands
pnpm db:studio
```

En Prisma Studio:
1. Ve a la tabla `Brand`
2. Verifica que existan los brands: `cocacola`, `pepsi`, `redbull`, `ivoka`
3. Verifica que cada uno tenga su array de `domains` configurado

---

## 🎨 Personalización de Themes

Los themes se definen en el seed (`packages/db/src/seed.ts`). Cada brand tiene:

```typescript
const cocaColaTheme = {
  colors: {
    primary: "0 100% 50%",      // Rojo Coca-Cola (HSL)
    secondary: "0 0% 13%",       // Gris oscuro
    background: "0 0% 100%",     // Blanco
    // ... más colores
  },
  logo: {
    url: "...",
    alt: "Coca-Cola Logo"
  },
  heroAssets: {
    kind: "image",
    url: "...",
    overlay: true
  }
}
```

Para cambiar un theme:
1. Edita el seed: `packages/db/src/seed.ts`
2. Modifica los valores HSL de colores
3. Re-ejecuta: `pnpm db:seed`
4. Recarga el navegador

---

## 🛠️ Comandos Útiles

### Ver Configuración Actual de Hosts

```powershell
.\scripts\setup-local-hosts.ps1 -Check
```

### Remover Configuración de Hosts

```powershell
.\scripts\setup-local-hosts.ps1 -Remove
```

### Resetear Base de Datos

```powershell
pnpm db:reset
pnpm db:seed
```

### Ver Logs del Servidor

Los logs mostrarán la resolución de brands:
```
[host-tenant] Resolving brand for: cocacola.localhost:3000
[host-tenant] Found brand: Coca-Cola (source: domain)
```

---

## 🐛 Troubleshooting

### El subdominio no resuelve (ERR_NAME_NOT_RESOLVED)

**Solución:**
```powershell
# 1. Verificar que el archivo hosts se guardó correctamente
notepad C:\Windows\System32\drivers\etc\hosts

# 2. Limpiar caché DNS
ipconfig /flushdns

# 3. Reiniciar navegador (cerrar TODAS las ventanas)

# 4. Verificar con ping
ping cocacola.localhost
```

### El tema no cambia entre subdominios

**Solución:**
```powershell
# 1. Verificar que el seed se ejecutó
pnpm db:studio
# Revisar tabla Brand → campo domains

# 2. Verificar logs del servidor
# Deberías ver: "Found brand: Coca-Cola (source: domain)"

# 3. Limpiar caché del navegador (Ctrl + Shift + Delete)

# 4. Hard refresh (Ctrl + F5)
```

### Error: "Brand context required but not found"

**Solución:**
```powershell
# 1. Verificar que el brand existe en la DB
pnpm db:studio

# 2. Verificar que el dominio está en el array domains
# En Prisma Studio: Brand → domains → ["cocacola.localhost"]

# 3. Re-ejecutar seed si es necesario
pnpm db:seed
```

### El puerto 3000 está ocupado

**Solución:**
```powershell
# Opción 1: Matar el proceso en el puerto 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Opción 2: Cambiar el puerto en package.json
# apps/web/package.json → "dev": "next dev --port 3001"
```

### Cookies o Auth no funcionan entre subdominios

**Verificar configuración de Auth.js:**
```env
# .env
NEXTAUTH_URL=http://localhost:3000
# Las cookies se configuran para .localhost automáticamente
```

---

## 📊 Arquitectura del Sistema

### Flujo de Resolución de Brand

```
1. Request → http://cocacola.localhost:3000/es-MX
                    ↓
2. Middleware (middleware.ts)
   - Extrae hostname: "cocacola.localhost:3000"
   - Parsea subdomain: "cocacola"
   - Agrega headers: x-brand-slug, x-brand-hostname
                    ↓
3. Layout (app/[locale]/layout.tsx)
   - Lee headers con getCurrentBrand()
   - Busca Brand en DB por domain
   - Extrae theme JSON
                    ↓
4. BrandThemeInjector
   - Convierte theme a CSS variables
   - Inyecta <style> en HTML
                    ↓
5. Render con tema aplicado ✅
```

### Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `apps/web/middleware.ts` | Detecta subdomain y agrega headers |
| `packages/branding/src/domainResolver.ts` | Parsea hostname y extrae subdomain |
| `apps/web/src/lib/brandContext.ts` | Obtiene brand desde headers |
| `packages/api/src/lib/host-tenant.ts` | Resuelve tenant/brand por dominio |
| `apps/web/app/[locale]/layout.tsx` | Aplica theme en el HTML |
| `packages/db/src/seed.ts` | Crea brands de ejemplo |

---

## 🚀 Próximos Pasos

Una vez que funcione en local:

### Para Producción

1. **Configurar DNS Records:**
   ```
   cocacola.tudominio.com → CNAME → tudominio.com
   pepsi.tudominio.com → CNAME → tudominio.com
   ```

2. **Actualizar Brand Domains en DB:**
   ```typescript
   domains: ["cocacola.tudominio.com"]
   ```

3. **Configurar SSL/TLS:**
   - Certificado wildcard: `*.tudominio.com`
   - O certificados individuales por subdomain

4. **Variables de Entorno:**
   ```env
   NEXT_PUBLIC_BASE_DOMAIN=tudominio.com
   NEXTAUTH_URL=https://tudominio.com
   ```

### Testing Avanzado

- **Playwright Tests:** Testear cada subdomain
- **Visual Regression:** Comparar screenshots de themes
- **Performance:** Medir tiempo de resolución de brand
- **SEO:** Verificar meta tags por brand

---

## ✅ Checklist Final

Antes de considerar completa la configuración:

- [ ] Archivo `hosts` configurado correctamente
- [ ] DNS cache limpiado (`ipconfig /flushdns`)
- [ ] Seed ejecutado (`pnpm db:seed`)
- [ ] Brands visibles en Prisma Studio
- [ ] Servidor corriendo (`pnpm dev`)
- [ ] Subdominios resuelven (ping test)
- [ ] Diferentes temas visibles en navegador
- [ ] Headers `x-brand-*` presentes en DevTools
- [ ] CSS variables inyectadas en `<style>`
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs del servidor

---

## 📚 Referencias

- **Guía Detallada:** `SUBDOMAIN_TESTING_GUIDE.md`
- **Arquitectura Auth:** `AUTH_ARCHITECTURE.md`
- **Branding Manager:** `BRANDING_MANAGER_IMPLEMENTATION.md`
- **Prisma Schema:** `packages/db/prisma/schema.prisma`
- **.windsurfrules:** Reglas del proyecto

---

## 💬 Soporte

Si encuentras problemas:

1. Revisa los logs del servidor Next.js
2. Verifica la tabla `Brand` en Prisma Studio
3. Inspecciona los headers en DevTools
4. Consulta la sección de Troubleshooting arriba

**¡Listo para testear multi-tenant con subdominios! 🎉**
