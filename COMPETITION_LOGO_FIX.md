# 🔧 Fix: Competition Logo URL Not Assigned

## 🐛 Problema

Al crear una `Competition` durante la provisión de un template, el campo `logoUrl` no se estaba asignando, aunque la API-Football retornaba el logo.

## ✅ Solución Implementada

**Archivo:** `packages/api/src/services/templateProvision.service.ts`

**Líneas 228-246:**

### Antes (INCORRECTO)
```typescript
if (!competition) {
  competition = await prisma.competition.create({
    data: {
      sportId: sport.id,
      slug: competitionSlug,
      name: competitionName
      // ❌ logoUrl NO se asignaba
    }
  });
}
```

### Después (CORRECTO)
```typescript
if (!competition) {
  competition = await prisma.competition.create({
    data: {
      sportId: sport.id,
      slug: competitionSlug,
      name: competitionName,
      logoUrl: seasonData.competitionLogoUrl || undefined  // ✅ Asigna logo
    }
  });
} else if (!competition.logoUrl && seasonData.competitionLogoUrl) {
  // ✅ Si competition existe pero NO tiene logo, actualiza
  competition = await prisma.competition.update({
    where: { id: competition.id },
    data: {
      logoUrl: seasonData.competitionLogoUrl
    }
  });
}
```

## 🎯 Cambios

### 1. Crear Competition con Logo
- Cuando se crea una nueva `Competition`, ahora incluye `logoUrl` del `seasonData`
- Usa `seasonData.competitionLogoUrl` que viene de la API-Football

### 2. Actualizar Competition Existente
- Si la `Competition` ya existe pero NO tiene `logoUrl`
- Y la API retorna `competitionLogoUrl`
- Entonces actualiza la `Competition` con el logo

## 📊 Flujo Completo

```
1. Obtener datos de API-Football
   └─ seasonData.competitionLogoUrl = "https://api-football.com/logo.png"

2. Buscar Competition existente
   ├─ Si NO existe → Crear con logoUrl
   └─ Si existe pero sin logo → Actualizar con logoUrl

3. Resultado
   └─ Competition.logoUrl = "https://api-football.com/logo.png"
```

## ✅ Verificación

Después de provisionar un template:

```sql
-- Verificar que Competition tiene logo
SELECT id, name, logoUrl
FROM Competition
WHERE slug = 'liga-mx';

-- Esperado:
-- id: comp-xxx
-- name: Liga MX
-- logoUrl: https://api-football.com/logo.png
```

## 🎨 Impacto Visual

### Antes
- Pool cards sin logo de competencia
- Falta de información visual

### Después
- Pool cards muestran logo de competencia
- Mejor UX e identificación visual
- Consistencia con datos de API

## 📝 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `packages/api/src/services/templateProvision.service.ts` | Líneas 235, 238-245: Asignar y actualizar logoUrl |

## 🚀 Resultado

```
✅ Competition.logoUrl se asigna correctamente
✅ Reutiliza logo si competition ya existe
✅ Pool cards muestran logo de competencia
✅ Mejor experiencia visual
```

**Estado:** 🟢 COMPLETAMENTE RESUELTO
