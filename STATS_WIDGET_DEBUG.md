# 🔍 Guía de Debugging: Stats Widget

## Problema Resuelto

El componente `StatsWidget` no podía acceder a `SPORTS_API_KEY` porque las variables de entorno **sin el prefijo `NEXT_PUBLIC_`** no están disponibles en componentes cliente.

## ✅ Solución Implementada

Se cambió de `SPORTS_API_KEY` a `NEXT_PUBLIC_SPORTS_API_KEY` para que funcione en componentes cliente.

---

## 📋 Checklist de Configuración

### 1. Verificar el archivo `.env.local`

Tu archivo `apps/web/.env.local` debe contener:

```env
NEXT_PUBLIC_SPORTS_API_KEY=tu_api_key_de_api_football_aqui
```

**⚠️ IMPORTANTE:**
- El nombre DEBE ser exactamente `NEXT_PUBLIC_SPORTS_API_KEY`
- NO debe haber espacios alrededor del `=`
- NO debe tener comillas (a menos que la key las incluya)
- El archivo debe estar en `apps/web/.env.local` (NO en la raíz del monorepo)

### 2. Reiniciar el Servidor

Después de modificar `.env.local`, **DEBES reiniciar** el servidor:

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar:
pnpm dev
```

**Nota:** Next.js solo lee las variables de entorno al iniciar. Los cambios en `.env.local` NO se reflejan en caliente.

### 3. Limpiar Caché (Ya lo hiciste ✓)

Ya ejecutaste:
```bash
Remove-Item -Recurse -Force .\apps\web\.next
```

Esto es correcto y elimina el build cache.

---

## 🧪 Método de Debug

### Opción A: Usar el Componente de Debug (Recomendado)

1. **Importa el componente de debug** en tu página de fixtures:

```tsx
// En: apps/web/app/[locale]/(player)/pools/[slug]/fixtures/page.tsx
import { DebugEnv } from "./_components/debug-env";

export default async function FixturesPage() {
  // ... tu código existente
  
  return (
    <>
      <FixturesView {...props} />
      <DebugEnv /> {/* Agregar temporalmente */}
    </>
  );
}
```

2. **Abre la página en el navegador**
   - Verás un panel flotante en la esquina inferior derecha
   - Te mostrará si la variable está configurada
   - Muestra los primeros 10 caracteres de la key

3. **Remueve el componente** después de verificar

### Opción B: Consola del Navegador

1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Ejecuta:

```javascript
console.log('API Key:', process.env.NEXT_PUBLIC_SPORTS_API_KEY);
```

**Resultado esperado:**
- ✅ Si ves tu API key → Todo está bien
- ❌ Si ves `undefined` → Hay un problema de configuración

---

## 🚨 Problemas Comunes y Soluciones

### Problema 1: Variable sigue siendo `undefined`

**Causa:** El servidor no se reinició después de agregar la variable.

**Solución:**
```bash
# Detener el servidor completamente (Ctrl+C)
pnpm dev
```

### Problema 2: Error de sintaxis en `.env.local`

**Incorrecto:**
```env
NEXT_PUBLIC_SPORTS_API_KEY = "mi_key"  # ❌ Espacios y comillas
NEXT_PUBLIC_SPORTS_API_KEY='mi_key'    # ❌ Comillas simples
SPORTS_API_KEY=mi_key                  # ❌ Falta NEXT_PUBLIC_
```

**Correcto:**
```env
NEXT_PUBLIC_SPORTS_API_KEY=mi_key      # ✅
```

### Problema 3: Archivo en la ubicación incorrecta

**Incorrecto:**
```
quinielas/.env.local                   # ❌ Raíz del monorepo
quinielas/apps/.env.local              # ❌ Carpeta apps
```

**Correcto:**
```
quinielas/apps/web/.env.local          # ✅
```

### Problema 4: La key no es válida

**Verificar:**
1. Ve a https://dashboard.api-football.com
2. Copia la key exactamente como aparece
3. No debe tener espacios al inicio o final
4. Verifica que tu plan esté activo

### Problema 5: Error "Cannot use import statement outside a module"

**Causa:** El script de widgets intentaba cargarse como módulo ES6.

**Solución:** ✅ **YA RESUELTO** - El componente ahora usa iframes en lugar de cargar el script directamente, que es el método recomendado por API-Football.

---

## 🔐 Seguridad: ¿Por qué NEXT_PUBLIC_?

### ¿Es seguro exponer la API key con NEXT_PUBLIC_?

**SÍ, en este caso específico:**

1. **Los widgets de API-Football están diseñados para el cliente**
   - Se ejecutan en el navegador del usuario
   - No hay forma de ocultarlos completamente

2. **API-Football protege tu cuenta mediante:**
   - Rate limiting (límite de requests)
   - Restricciones de dominio
   - Monitoreo de uso anómalo

3. **Tu key NO permite:**
   - Modificar tu cuenta
   - Acceder a datos de pago
   - Realizar acciones destructivas

### ¿Cuándo NO usar NEXT_PUBLIC_?

- Claves de bases de datos
- Secrets de autenticación (JWT secrets)
- Claves de APIs de pago (Stripe secret key)
- Credenciales de servicios internos

---

## 📊 Verificación Final

Después de configurar todo, verifica:

### 1. En el Código
```typescript
// En StatsWidget.tsx, línea 36
const apiKey = process.env.NEXT_PUBLIC_SPORTS_API_KEY;
console.log('API Key loaded:', apiKey ? 'Yes ✓' : 'No ✗');
```

### 2. En el Navegador
- Abre la página de fixtures
- Abre DevTools → Console
- Busca el mensaje "API Key loaded: Yes ✓"
- NO deberías ver el warning: "Sports API key not configured"

### 3. En la UI
- El tab "Estadísticas" debe mostrar los widgets
- NO debe mostrar el mensaje de error amarillo
- Los widgets deben cargar datos (puede tardar unos segundos)

---

## 🎯 Comandos de Verificación Rápida

```bash
# 1. Verificar que el archivo existe
Test-Path .\apps\web\.env.local

# 2. Ver contenido (sin mostrar la key completa)
Get-Content .\apps\web\.env.local | Select-String "NEXT_PUBLIC_SPORTS_API_KEY"

# 3. Limpiar caché y reiniciar
Remove-Item -Recurse -Force .\apps\web\.next
pnpm dev
```

---

## 📞 Si Aún No Funciona

### Paso 1: Verificar la estructura del archivo

Crea un nuevo archivo de prueba:

```bash
# En PowerShell, desde la raíz del proyecto:
@"
NEXT_PUBLIC_SPORTS_API_KEY=test_key_12345
"@ | Out-File -FilePath .\apps\web\.env.local -Encoding utf8
```

### Paso 2: Verificar en runtime

Agrega esto temporalmente en `StatsWidget.tsx` después de la línea 36:

```typescript
const apiKey = process.env.NEXT_PUBLIC_SPORTS_API_KEY;
console.log('=== DEBUG ENV ===');
console.log('API Key:', apiKey);
console.log('Type:', typeof apiKey);
console.log('Length:', apiKey?.length);
console.log('All NEXT_PUBLIC vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')));
console.log('=================');
```

### Paso 3: Verificar el build

```bash
# Hacer un build de producción para verificar
cd apps/web
pnpm build

# Buscar la variable en el output
# Deberías ver referencias a NEXT_PUBLIC_SPORTS_API_KEY
```

---

## ✅ Checklist Final

- [ ] Archivo `.env.local` en `apps/web/.env.local`
- [ ] Variable llamada exactamente `NEXT_PUBLIC_SPORTS_API_KEY`
- [ ] Sin espacios alrededor del `=`
- [ ] Sin comillas (a menos que la key las incluya)
- [ ] Servidor reiniciado después de crear/modificar `.env.local`
- [ ] Caché limpiado (`.next` eliminado)
- [ ] Navegador refrescado (Ctrl+F5)
- [ ] Console del navegador no muestra errores
- [ ] Componente de debug muestra "✓ Set"

---

## 📚 Referencias

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [API-Football Dashboard](https://dashboard.api-football.com)
- [Widgets Documentation](https://api-sports.io/documentation/widgets/v3)

---

**Última actualización:** Octubre 2025  
**Archivo modificado:** `StatsWidget.tsx`  
**Variable correcta:** `NEXT_PUBLIC_SPORTS_API_KEY`
