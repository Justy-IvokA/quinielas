# Guía de Testing con Subdominios Locales en Windows

Esta guía te ayudará a configurar y testear el sistema multi-tenant usando subdominios locales en tu entorno de desarrollo Windows.

## 🎯 Objetivo

Permitir que diferentes brands/tenants sean accesibles mediante subdominios locales:
- `cocacola.localhost:3000` → Brand "Coca-Cola"
- `pepsi.localhost:3000` → Brand "Pepsi"
- `localhost:3000` → Brand por defecto o landing

## 📋 Paso 1: Configurar el archivo hosts de Windows

### Ubicación del archivo
El archivo hosts en Windows se encuentra en:
```
C:\Windows\System32\drivers\etc\hosts
```

### Editar como Administrador

1. **Abrir Notepad como Administrador:**
   - Presiona `Win + S` y busca "Notepad"
   - Click derecho → "Ejecutar como administrador"

2. **Abrir el archivo hosts:**
   - En Notepad: `Archivo` → `Abrir`
   - Navega a: `C:\Windows\System32\drivers\etc\`
   - Cambia el filtro de "Archivos de texto (*.txt)" a "Todos los archivos (*.*)"
   - Selecciona el archivo `hosts` y ábrelo

3. **Agregar las siguientes líneas al final del archivo:**

```
# Quinielas WL - Multi-tenant local testing
127.0.0.1       cocacola.localhost
127.0.0.1       pepsi.localhost
127.0.0.1       redbull.localhost
127.0.0.1       admin.localhost
```

4. **Guardar el archivo** (Ctrl + S)

### Verificar la configuración

Abre PowerShell y ejecuta:
```powershell
ping cocacola.localhost
```

Deberías ver respuestas de `127.0.0.1`.

## 📋 Paso 2: Configurar variables de entorno

Edita el archivo `.env` en la raíz del proyecto:

```env
# Dominio base para desarrollo
NEXT_PUBLIC_BASE_DOMAIN=localhost:3000

# Habilitar modo multi-tenant por subdominio
NEXT_PUBLIC_MULTITENANT_MODE=subdomain

# URL base para callbacks de Auth.js
NEXTAUTH_URL=http://localhost:3000
```

## 📋 Paso 3: Seed de datos de ejemplo

Ejecuta el seed para crear brands de ejemplo con sus dominios configurados:

```powershell
cd c:\Users\victo\Documents\reactNextJS\quinielas
pnpm db:seed
```

Esto creará:
- **Tenant:** "Demo Sports"
- **Brands:**
  - Coca-Cola (dominio: `cocacola.localhost`)
  - Pepsi (dominio: `pepsi.localhost`)
  - Red Bull (dominio: `redbull.localhost`)

## 📋 Paso 4: Iniciar el servidor de desarrollo

```powershell
cd c:\Users\victo\Documents\reactNextJS\quinielas
pnpm dev
```

El servidor iniciará en `http://localhost:3000`

## 🧪 Paso 5: Testear los subdominios

Abre tu navegador y visita:

### Brand Coca-Cola
```
http://cocacola.localhost:3000/es-MX
```
- Deberías ver el tema/branding de Coca-Cola
- Logo y colores personalizados

### Brand Pepsi
```
http://pepsi.localhost:3000/es-MX
```
- Deberías ver el tema/branding de Pepsi
- Logo y colores diferentes

### Brand Red Bull
```
http://redbull.localhost:3000/es-MX
```
- Deberías ver el tema/branding de Red Bull

### Dominio base (sin brand)
```
http://localhost:3000/es-MX
```
- Deberías ver el tema por defecto o una landing page

## 🔍 Verificación del middleware

El middleware debe:
1. Detectar el hostname (`cocacola.localhost`)
2. Extraer el subdominio (`cocacola`)
3. Buscar el Brand correspondiente en la base de datos
4. Inyectar el tema CSS en el HTML

Para verificar, abre las DevTools del navegador:
- **Elements tab:** Busca el tag `<style>` con las CSS variables del brand
- **Network tab:** Verifica que las requests incluyan el hostname correcto
- **Console:** Revisa si hay errores de resolución de brand

## 🎨 Estructura de datos en la DB

Cada `Brand` tiene:
```typescript
{
  id: "cuid",
  slug: "cocacola",
  name: "Coca-Cola",
  domains: ["cocacola.localhost"], // ← Importante
  theme: {
    tokens: {
      colors: {
        primary: "0 100% 50%", // HSL format
        // ... más colores
      }
    }
  }
}
```

## 🛠️ Troubleshooting

### El subdominio no resuelve
- Verifica que guardaste el archivo `hosts` correctamente
- Reinicia el navegador (cierra todas las ventanas)
- Limpia la caché DNS de Windows:
  ```powershell
  ipconfig /flushdns
  ```

### El tema no se aplica
- Verifica que el Brand existe en la DB con el dominio correcto
- Revisa los logs del servidor Next.js
- Inspecciona el HTML generado para ver si las CSS variables están presentes

### Error de CORS o Auth
- Asegúrate de que `NEXTAUTH_URL` incluya el protocolo correcto
- Verifica que las cookies se estén configurando para `.localhost`

### El puerto 3000 está ocupado
- Cambia el puerto en `apps/web/package.json`:
  ```json
  "dev": "next dev --port 3001"
  ```
- Actualiza las entradas en el archivo `hosts` si es necesario

## 📝 Notas adicionales

### Cookies y sesiones
Las cookies de Auth.js se configurarán para el dominio `.localhost`, permitiendo compartir sesiones entre subdominios si es necesario.

### HTTPS en local (opcional)
Para testing más realista con HTTPS:
1. Instala `mkcert`: https://github.com/FiloSottile/mkcert
2. Genera certificados para `*.localhost`
3. Configura Next.js para usar HTTPS

### Testing en dispositivos móviles (misma red)
Para testear desde un móvil en la misma red WiFi:
1. Encuentra tu IP local: `ipconfig` (busca IPv4)
2. Agrega entradas en el archivo hosts de tu PC:
   ```
   192.168.1.100  cocacola.localhost
   ```
3. En el móvil, configura el DNS para apuntar a tu PC (requiere configuración avanzada)

## ✅ Checklist de verificación

- [ ] Archivo `hosts` configurado y guardado
- [ ] DNS cache limpiado (`ipconfig /flushdns`)
- [ ] Variables de entorno configuradas en `.env`
- [ ] Seed ejecutado con brands de ejemplo
- [ ] Servidor de desarrollo corriendo en puerto 3000
- [ ] Subdominios resuelven correctamente (ping test)
- [ ] Navegador muestra diferentes temas por subdominio
- [ ] CSS variables se inyectan en el HTML
- [ ] No hay errores en la consola del navegador

## 🚀 Próximos pasos

Una vez que el testing local funcione:
1. Configurar dominios reales en producción
2. Implementar SSL/TLS con certificados válidos
3. Configurar DNS records (CNAME o A records)
4. Actualizar `NEXTAUTH_URL` por entorno
5. Implementar CDN para assets estáticos por brand
