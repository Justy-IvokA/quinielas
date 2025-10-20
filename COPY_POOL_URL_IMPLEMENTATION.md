# Implementación del Botón de Copiar URL de Quiniela

## Resumen
Se implementó correctamente el botón para copiar la URL de cada quiniela en la lista de quinielas del panel de administración.

## Cambios Realizados

### 1. API Router (`packages/api/src/routers/pools/index.ts`)
**Modificación en `listByTenant` query:**
- ✅ Agregado `domains` al select del `brand`
- ✅ Agregado `accessPolicy` con `accessType` para determinar el tipo de URL

```typescript
include: {
  brand: { select: { name: true, slug: true, domains: true } },
  season: { select: { name: true, year: true } },
  accessPolicy: { select: { accessType: true } },
  _count: {
    select: {
      registrations: true,
      prizes: true
    }
  }
}
```

### 2. Componente PoolsList (`apps/admin/app/[locale]/(authenticated)/pools/components/pools-list.tsx`)

**Correcciones implementadas:**

#### a) Estado de copiado individual por pool
```typescript
// Antes (incorrecto - estado global)
const [copied, setCopied] = useState(false);

// Después (correcto - estado por pool)
const [copiedPoolId, setCopiedPoolId] = useState<string | null>(null);
```

#### b) Función handleCopyUrl dentro del map
```typescript
{pools.map((pool) => {
  const handleCopyUrl = async () => {
    if (!pool?.brand?.domains?.[0] || !pool.slug) {
      toastError("No se puede generar URL: falta dominio o slug");
      return;
    }

    const domain = pool.brand.domains[0];
    const url = `https://${domain}/${pool.slug}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedPoolId(pool.id);
      toastSuccess(t("actions.urlCopied"));
      setTimeout(() => setCopiedPoolId(null), 2000);
    } catch (error) {
      toastError("Error al copiar URL");
    }
  };

  const isCopied = copiedPoolId === pool.id;
  
  return (
    // ... card content
  );
})}
```

#### c) Botón con validación y feedback visual
```typescript
<Button
  variant="default"
  size="sm"
  StartIcon={isCopied ? CheckCircle : Copy}
  onClick={handleCopyUrl}
  disabled={!pool.slug || !pool.brand?.domains?.[0]}
>
  {pool?.accessPolicy?.accessType === "PUBLIC" 
    ? t("actions.copyPublicUrl") 
    : t("actions.copyUrl")}
</Button>
```

## Características Implementadas

### ✅ Funcionalidades
1. **Copia al portapapeles**: Usa la API nativa `navigator.clipboard.writeText()`
2. **Validación de datos**: Verifica que existan `domain` y `slug` antes de generar URL
3. **Feedback visual**: 
   - Icono cambia de `Copy` a `CheckCircle` durante 2 segundos
   - Toast de éxito al copiar
   - Toast de error si falla
4. **Estado individual**: Cada pool tiene su propio estado de copiado
5. **Deshabilitación inteligente**: El botón se deshabilita si falta slug o dominio
6. **Texto dinámico**: Muestra "Copiar URL pública" para pools públicos, "Copiar URL" para otros

### 🔧 Validaciones
- ✅ Verifica que `pool.brand.domains[0]` exista
- ✅ Verifica que `pool.slug` exista
- ✅ Manejo de errores con try/catch
- ✅ Mensajes de error descriptivos

### 🎨 UX
- ✅ Icono cambia al copiar (Copy → CheckCircle)
- ✅ Feedback temporal de 2 segundos
- ✅ Botón deshabilitado si no hay datos necesarios
- ✅ Texto contextual según tipo de acceso

## Formato de URL Generada
```
https://{domain}/{slug}
```

Ejemplo:
```
https://ivoka.quinielas.mx/mundial-2026
```

## Traducciones Utilizadas (ya existentes)
```json
{
  "pools": {
    "actions": {
      "copyUrl": "Copiar URL",
      "copyPublicUrl": "Copiar URL pública",
      "urlCopied": "URL copiada al portapapeles"
    }
  }
}
```

## Testing Recomendado

### Casos de prueba
1. ✅ Copiar URL de pool con dominio y slug válidos
2. ✅ Intentar copiar URL de pool sin dominio (debe mostrar error)
3. ✅ Intentar copiar URL de pool sin slug (botón deshabilitado)
4. ✅ Verificar que el icono cambia temporalmente
5. ✅ Verificar que el texto cambia según accessType (PUBLIC vs otros)
6. ✅ Copiar URLs de múltiples pools (estado individual)

### Comandos de verificación
```bash
# Verificar que el servidor admin esté corriendo
cd apps/admin
pnpm dev

# Navegar a /pools y probar el botón de copiar en cada tarjeta
```

## Notas Técnicas

### Dependencias del Brand
- Cada pool debe tener un `brand` asociado
- El brand debe tener al menos un dominio en el array `domains`
- El primer dominio (`domains[0]`) se usa para generar la URL

### Consideraciones de Seguridad
- La URL generada usa HTTPS por defecto
- No se expone información sensible en la URL
- El slug es público y seguro de compartir

## Próximos Pasos (Opcional)
- [ ] Agregar botón para compartir en redes sociales
- [ ] Generar QR code de la URL
- [ ] Copiar URL con parámetros UTM para tracking
- [ ] Preview de la URL antes de copiar
