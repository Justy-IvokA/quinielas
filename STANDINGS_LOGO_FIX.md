# 🎨 Fix: Competition Logo en Estadísticas

## 🎯 Problema Identificado

El campo `logoUrl` de la tabla `Competition` no se asignaba o actualizaba correctamente, causando que el frontend no pudiera mostrar el logo de la competición en la tabla de estadísticas.

---

## ✅ Soluciones Implementadas

### **1. Actualización Automática del Logo al Fetch Standings**

**Archivo**: `packages/api/src/services/standings.ts`

Cuando se obtienen estadísticas desde la API externa, ahora también se actualiza el `logoUrl` de la competición:

```typescript
// Fetch fresh data from API
const apiData = await fetchStandingsFromAPI(externalLeagueId, seasonYear);

// Update Competition logoUrl if available from API
if (apiData.response[0]?.league?.logo) {
  await prisma.competition.update({
    where: { id: competitionId },
    data: { logoUrl: apiData.response[0].league.logo },
  }).catch(err => {
    console.warn(`⚠️ Could not update competition logo: ${err.message}`);
  });
}
```

**Beneficios**:
- ✅ Logo se actualiza automáticamente al obtener standings
- ✅ Funciona tanto para worker como para refresh manual
- ✅ Manejo de errores con fallback silencioso
- ✅ No bloquea el flujo principal si falla

---

### **2. Logo Incluido en Response del Router**

**Archivo**: `packages/api/src/routers/standings.ts`

El endpoint `getByPoolSlug` ahora incluye el `logoUrl` en la respuesta:

```typescript
return {
  id: standings.id,
  competitionId: standings.competitionId,
  seasonYear: standings.seasonYear,
  data: standings.standingsData,
  lastFetchedAt: standings.lastFetchedAt,
  lastUpdatedAt: standings.lastUpdatedAt,
  isCached: !forceRefresh,
  pool: {
    id: pool.id,
    name: pool.name,
    slug: pool.slug,
  },
  competition: {
    id: pool.season.competition.id,
    name: pool.season.competition.name,
    slug: pool.season.competition.slug,
    logoUrl: pool.season.competition.logoUrl, // ← AGREGADO
  },
};
```

---

### **3. Verificación: Pool Wizard Ya Captura el Logo**

**Archivo**: `packages/api/src/routers/pool-wizard/index.ts`

El wizard de creación de pools **ya estaba capturando** el logo correctamente:

```typescript
if (!competition) {
  competition = await prisma.competition.create({
    data: {
      sportId: sport.id,
      slug: competitionData.name.toLowerCase().replace(/\s+/g, "-"),
      name: competitionData.name,
      logoUrl: competitionData.logoUrl, // ✅ Ya existía
      metadata: competitionData.meta || {}
    }
  });
}
```

---

## 🔄 Flujo Completo del Logo

### **Escenario 1: Nueva Competición (Pool Wizard)**

```
1. Usuario crea pool via wizard
   ↓
2. Wizard fetch datos de API-Football
   ↓
3. Competition.create({ logoUrl: competitionData.logoUrl })
   ↓
4. Logo guardado en DB ✅
```

### **Escenario 2: Primera Vez que se Obtienen Standings**

```
1. Usuario visita página de fixtures
   ↓
2. StandingsTable.tsx llama a getByPoolSlug
   ↓
3. No hay caché, fetch desde API
   ↓
4. API retorna standings con league.logo
   ↓
5. Service actualiza Competition.logoUrl ✅
   ↓
6. Logo guardado en DB y retornado al frontend
```

### **Escenario 3: Standings Cacheados**

```
1. Usuario visita página de fixtures
   ↓
2. StandingsTable.tsx llama a getByPoolSlug
   ↓
3. Hay caché válido (< 24h)
   ↓
4. Router incluye competition.logoUrl en response ✅
   ↓
5. Frontend recibe logo desde DB
```

### **Escenario 4: Worker Actualiza Standings**

```
1. Worker cron ejecuta refreshStaleStandings
   ↓
2. Para cada standing antiguo:
   ↓
3. Fetch desde API
   ↓
4. Actualiza Competition.logoUrl ✅
   ↓
5. Logo siempre actualizado
```

---

## 📊 Estructura de Datos

### **Competition Model**

```prisma
model Competition {
  id          String   @id @default(cuid())
  sportId     String
  slug        String
  name        String
  countryCode String?
  logoUrl     String?  // ← Logo de la competición
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  sport     Sport                    @relation(...)
  seasons   Season[]
  standings CompetitionStandings[]
}
```

### **API Response (API-Football)**

```json
{
  "response": [{
    "league": {
      "id": 39,
      "name": "Premier League",
      "country": "England",
      "logo": "https://media.api-sports.io/football/leagues/39.png", // ← Fuente
      "season": 2024,
      "standings": [...]
    }
  }]
}
```

### **tRPC Response (Frontend)**

```typescript
{
  id: "standing_id",
  competitionId: "comp_id",
  seasonYear: 2024,
  data: { /* standings data */ },
  lastFetchedAt: Date,
  lastUpdatedAt: Date,
  isCached: true,
  pool: {
    id: "pool_id",
    name: "Mi Quiniela",
    slug: "mi-quiniela"
  },
  competition: {
    id: "comp_id",
    name: "Premier League",
    slug: "premier-league",
    logoUrl: "https://media.api-sports.io/football/leagues/39.png" // ← Disponible
  }
}
```

---

## 🎨 Uso en Frontend

### **Opción 1: Logo de Competition (Recomendado)**

```tsx
export function StandingsTable({ locale }: StandingsTableProps) {
  const { data } = trpc.standings.getByPoolSlug.useQuery({
    poolSlug,
    tenantSlug,
  });

  return (
    <div>
      {/* Logo de la competición desde DB */}
      {data?.competition?.logoUrl && (
        <img
          src={data.competition.logoUrl}
          alt={data.competition.name}
          className="w-12 h-12 object-contain"
        />
      )}
      
      {/* Fallback: Logo desde standings data */}
      {!data?.competition?.logoUrl && data?.data?.league?.logo && (
        <img
          src={data.data.league.logo}
          alt={data.data.league.name}
          className="w-12 h-12 object-contain"
        />
      )}
    </div>
  );
}
```

### **Opción 2: Logo desde Standings Data (Actual)**

El componente actual ya usa `standings.league.logo` que viene en `data.data`:

```tsx
{standings.league.logo && (
  <img
    src={standings.league.logo}
    alt={standings.league.name}
    className="w-12 h-12 object-contain"
  />
)}
```

**Esto seguirá funcionando** porque `standingsData` contiene la respuesta completa de la API.

---

## 🔍 Verificación

### **Test 1: Verificar Logo en DB**

```sql
-- Ver competiciones con logo
SELECT "id", "name", "slug", "logoUrl" 
FROM "Competition" 
WHERE "logoUrl" IS NOT NULL;

-- Ver competiciones SIN logo
SELECT "id", "name", "slug", "logoUrl" 
FROM "Competition" 
WHERE "logoUrl" IS NULL;
```

### **Test 2: Forzar Actualización de Logo**

```bash
# Opción A: Via worker
cd apps/worker
pnpm tsx src/jobs/refresh-standings.ts

# Opción B: Via botón refresh en UI
# 1. Ir a /pools/[slug]/fixtures
# 2. Presionar botón "Refresh"
# 3. Verificar que Competition.logoUrl se actualizó
```

### **Test 3: Verificar Response en Frontend**

```typescript
// En StandingsTable.tsx, agregar console.log temporal
const { data } = trpc.standings.getByPoolSlug.useQuery({...});

console.log('Competition Logo:', data?.competition?.logoUrl);
console.log('Standings Logo:', data?.data?.league?.logo);
```

---

## 🐛 Troubleshooting

### Problema: Logo no aparece en frontend

**Diagnóstico**:
```sql
-- 1. Verificar si existe en DB
SELECT "logoUrl" FROM "Competition" WHERE "id" = 'xxx';

-- 2. Verificar si existe en standings cache
SELECT "standingsData"->'league'->>'logo' 
FROM "CompetitionStandings" 
WHERE "competitionId" = 'xxx';
```

**Solución**:
```bash
# Forzar refresh para actualizar logo
# El servicio actualizará Competition.logoUrl automáticamente
```

### Problema: Logo se actualiza pero no se ve

**Causa**: Caché del navegador

**Solución**:
```typescript
// Agregar timestamp a la URL del logo
<img 
  src={`${logoUrl}?t=${Date.now()}`} 
  alt={name}
/>
```

### Problema: Logo NULL en Competition pero existe en API

**Causa**: Competition creada antes de este fix

**Solución**:
```bash
# Ejecutar worker para actualizar todos los logos
cd apps/worker
pnpm tsx src/jobs/refresh-standings.ts
```

---

## 📝 Migraciones Necesarias

**No se requiere migración de schema** porque el campo `logoUrl` ya existe en el modelo `Competition`.

Si necesitas poblar logos faltantes:

```sql
-- Script para identificar competiciones sin logo
SELECT c."id", c."name", c."slug"
FROM "Competition" c
WHERE c."logoUrl" IS NULL
  AND EXISTS (
    SELECT 1 FROM "CompetitionStandings" cs 
    WHERE cs."competitionId" = c."id"
  );
```

Luego ejecutar el worker para actualizarlos automáticamente.

---

## ✅ Resultado Final

Con estos cambios:

1. ✅ **Pool Wizard**: Captura logo al crear competición
2. ✅ **Standings Service**: Actualiza logo al fetch desde API
3. ✅ **Router**: Incluye logo en response
4. ✅ **Worker**: Mantiene logos actualizados
5. ✅ **Frontend**: Tiene acceso al logo en dos lugares:
   - `data.competition.logoUrl` (desde DB)
   - `data.data.league.logo` (desde standings cache)

El logo estará **siempre disponible** para el frontend. 🎨✨
