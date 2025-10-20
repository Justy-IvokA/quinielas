# ✅ Implementación Personalizada de Estadísticas

## Fecha
19 de Octubre, 2025

## Resumen

Después de intentar usar los **widgets de API-Sports** (tanto v1 iframes como v3 web components) sin éxito, se implementó una **solución personalizada** usando la **API REST de API-Sports** directamente.

---

## 🎯 Problema Original

Los widgets de API-Sports **no funcionaban**:
- ✅ Script cargaba correctamente
- ✅ API key válida
- ✅ Custom elements en el DOM
- ❌ **No tenían Shadow DOM** (no renderizaban)

**Conclusión:** Los widgets de API-Sports v3 tienen problemas de compatibilidad con Next.js 15.5.4 o requieren configuración no documentada.

---

## 💡 Solución Implementada

### Componente Personalizado: `StandingsTable`

Características:
- ✅ Usa la **API REST de API-Sports** directamente
- ✅ Muestra **tabla de posiciones** con diseño profesional
- ✅ Toggle **ALL / HOME / AWAY** statistics
- ✅ **Indicadores de forma** (W/D/L) con colores
- ✅ **Goal difference** y **puntos**
- ✅ **Logos de equipos** y ligas
- ✅ **Responsive** y con buen diseño
- ✅ **Loading states** y **error handling**
- ✅ **Bilingüe** (es-MX / en-US)

---

## 📁 Archivos Creados/Modificados

### 1. **Nuevo Componente: `StandingsTable.tsx`**
```
apps/web/app/[locale]/(player)/pools/[slug]/fixtures/_components/StandingsTable.tsx
```

**Funcionalidad:**
- Fetch de standings desde API-Sports
- Renderizado de tabla con estadísticas
- Toggle entre ALL/HOME/AWAY
- Indicadores visuales de forma
- Manejo de errores y loading states

### 2. **Router API: `external-maps/index.ts`**
```
packages/api/src/routers/external-maps/index.ts
```

**Endpoints:**
- `getByEntity` - Obtiene mapeo externo por tipo y ID
- `listByType` - Lista todos los mapeos de un tipo

### 3. **Modificado: `StatsWidget.tsx`**
```
apps/web/app/[locale]/(player)/pools/[slug]/fixtures/_components/StatsWidget.tsx
```

**Cambios:**
- Eliminado código de web components
- Simplificado a wrapper de `StandingsTable`
- Agregados props `leagueId` y `season`

### 4. **Modificado: `FixturesView.tsx`**
```
apps/web/app/[locale]/(player)/pools/[slug]/fixtures/_components/FixturesView.tsx
```

**Cambios:**
- Query para obtener `externalMap`
- Pasar `leagueId` y `season` a `StatsWidget`
- Agregado `competition.id` a la interfaz

### 5. **Modificado: `routers/index.ts`**
```
packages/api/src/routers/index.ts
```

**Cambios:**
- Importar y registrar `externalMapsRouter`

---

## 🔧 Cómo Funciona

### Flujo de Datos

1. **Usuario navega a tab "Estadísticas"**
   ```
   FixturesView → Tab "stats"
   ```

2. **FixturesView obtiene el league ID**
   ```typescript
   const { data: externalMap } = trpc.externalMaps.getByEntity.useQuery({
     entityType: "COMPETITION",
     entityId: pool.season.competition.id
   });
   ```

3. **Pasa datos a StatsWidget**
   ```typescript
   <StatsWidget 
     leagueId={externalMap?.externalId}  // e.g., "39" (Premier League)
     season={pool.season.year.toString()} // e.g., "2025"
     locale={locale}
   />
   ```

4. **StatsWidget renderiza StandingsTable**
   ```typescript
   <StandingsTable
     leagueId={leagueId}
     season={season}
     locale={locale}
   />
   ```

5. **StandingsTable hace fetch a API-Sports**
   ```typescript
   fetch(
     `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${season}`,
     {
       headers: { "x-apisports-key": apiKey }
     }
   )
   ```

6. **Renderiza tabla con datos**
   - Tabla de posiciones
   - Estadísticas por equipo
   - Indicadores de forma
   - Toggle ALL/HOME/AWAY

---

## 📊 Estructura de Datos

### API Response (API-Sports)

**Nota importante:** Los `standings` están **dentro** de `league`, no al mismo nivel.

```json
{
  "get": "standings",
  "parameters": {
    "league": "262",
    "season": "2025"
  },
  "errors": [],
  "results": 1,
  "paging": {
    "current": 1,
    "total": 1
  },
  "response": [
    {
      "league": {
        "id": 262,
        "name": "Liga MX",
        "country": "Mexico",
        "logo": "https://media.api-sports.io/football/leagues/262.png",
        "flag": "https://media.api-sports.io/flags/mx.svg",
        "season": 2025,
        "standings": [
          [
            {
              "rank": 1,
              "team": {
                "id": 2281,
                "name": "Toluca",
                "logo": "https://media.api-sports.io/football/teams/2281.png"
              },
              "points": 31,
              "goalsDiff": 23,
              "group": "Liga MX, Apertura 2025",
              "form": "WWWWW",
              "status": "same",
              "description": "Playoffs",
              "all": {
                "played": 13,
                "win": 10,
                "draw": 1,
                "lose": 2,
                "goals": {
                  "for": 39,
                  "against": 16
                }
              },
              "home": {
                "played": 7,
                "win": 5,
                "draw": 1,
                "lose": 1,
                "goals": {
                  "for": 23,
                  "against": 10
                }
              },
              "away": {
                "played": 6,
                "win": 5,
                "draw": 0,
                "lose": 1,
                "goals": {
                  "for": 16,
                  "against": 6
                }
              },
              "update": "2025-10-20T00:00:00+00:00"
            },
            {
              "rank": 2,
              "team": {
                "id": 2295,
                "name": "Cruz Azul",
                "logo": "https://media.api-sports.io/football/teams/2295.png"
              },
              "points": 28,
              "goalsDiff": 8,
              "group": "Liga MX, Apertura 2025",
              "form": "WDLDW",
              "status": "same",
              "description": "Playoffs",
              "all": {
                "played": 13,
                "win": 8,
                "draw": 4,
                "lose": 1,
                "goals": {
                  "for": 24,
                  "against": 16
                }
              },
              "home": {
                "played": 7,
                "win": 5,
                "draw": 2,
                "lose": 0,
                "goals": {
                  "for": 15,
                  "against": 8
                }
              },
              "away": {
                "played": 6,
                "win": 3,
                "draw": 2,
                "lose": 1,
                "goals": {
                  "for": 9,
                  "against": 8
                }
              },
              "update": "2025-10-20T00:00:00+00:00"
            }
          ]
        ]
      }
    }
  ]
}
```

**Estructura clave:**
- `response[0].league.standings` - Array de grupos (normalmente 1)
- `response[0].league.standings[0]` - Array de equipos
- Cada equipo tiene `all`, `home`, y `away` con estadísticas completas

### ExternalMap (Database)

```prisma
model ExternalMap {
  id          String
  sourceId    String  // "api-football"
  externalId  String  // "39" (league ID)
  entityType  String  // "COMPETITION"
  entityId    String  // Internal competition ID
}
```

---

## 🎨 Diseño Visual

### Tabla de Posiciones

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Liga MX                                              │
│        Mexico • Season 2025                                 │
├─────────────────────────────────────────────────────────────┤
│ [TODO] [LOCAL] [VISITANTE]                                  │
├─────────────────────────────────────────────────────────────┤
│ # | Equipo            | PJ | G | E | P | +/- | Pts | Forma │
├───┼───────────────────┼────┼───┼───┼───┼─────┼─────┼───────┤
│ 1 | [🔴] Toluca       | 13 | 10| 1 | 2 | +23 | 31  | VVVVV │
│ 2 | [🔵] Cruz Azul    | 13 | 8 | 4 | 1 | +8  | 28  | VEDV  │
│ 3 | [🟡] América      | 13 | 8 | 3 | 2 | +14 | 27  | DVVVE │
└─────────────────────────────────────────────────────────────┘
```

### Indicadores de Forma (Español)

- 🟢 **V** (Victoria / Win) - Verde
- 🟡 **E** (Empate / Draw) - Amarillo
- 🔴 **D** (Derrota / Loss) - Rojo

### Indicadores de Forma (Inglés)

- 🟢 **W** (Win) - Verde
- 🟡 **D** (Draw) - Amarillo
- 🔴 **L** (Loss) - Rojo

---

## 🔐 Requisitos

### 1. API Key de API-Sports

```env
NEXT_PUBLIC_SPORTS_API_KEY=tu-api-key-aqui
```

### 2. ExternalMap en Base de Datos

La competición debe tener un mapeo a API-Sports:

```sql
INSERT INTO ExternalMap (
  sourceId,
  externalId,
  entityType,
  entityId
) VALUES (
  'api-football',
  '39',              -- Premier League ID
  'COMPETITION',
  'cuid-interno'     -- ID interno de la competición
);
```

---

## 🧪 Testing

### Verificar que Funciona

1. **Navegar a una quiniela:**
   ```
   http://localhost:3000/pools/[slug]/fixtures
   ```

2. **Hacer clic en tab "Estadísticas"**

3. **Verificar que se muestra:**
   - ✅ Tabla de posiciones
   - ✅ Logos de equipos
   - ✅ Estadísticas correctas
   - ✅ Botones ALL/HOME/AWAY funcionan
   - ✅ Indicadores de forma (W/D/L)

### Si No Funciona

**Verificar en consola:**

```javascript
// 1. Verificar API key
console.log(process.env.NEXT_PUBLIC_SPORTS_API_KEY);

// 2. Verificar external map
const map = await fetch('/api/trpc/externalMaps.getByEntity?input=...');
console.log(await map.json());

// 3. Verificar API response
const standings = await fetch(
  'https://v3.football.api-sports.io/standings?league=39&season=2025',
  { headers: { 'x-apisports-key': 'YOUR_KEY' } }
);
console.log(await standings.json());
```

---

## 📈 Mejoras Futuras

### Corto Plazo

1. **Caché de datos** - Evitar requests repetidos
2. **Más estadísticas** - Top scorers, assists, cards
3. **Filtros** - Por grupo (Champions League)
4. **Animaciones** - Transiciones suaves

### Mediano Plazo

1. **Partidos en vivo** - Widget de live matches
2. **Calendario** - Próximos partidos
3. **H2H** - Head to head entre equipos
4. **Predicciones** - Integrar con sistema de predicciones

### Largo Plazo

1. **Gráficas** - Evolución de posiciones
2. **Comparativas** - Entre equipos
3. **Estadísticas avanzadas** - xG, posesión, etc.
4. **Notificaciones** - Cambios en tabla

---

## 🔧 Problemas Encontrados y Soluciones

### 1. Estructura de Datos Incorrecta

**Problema:** Inicialmente se esperaba que `standings` estuviera al mismo nivel que `league`:
```typescript
interface StandingsGroup {
  league: { ... };
  standings: Team[][];  // ❌ Incorrecto
}
```

**Solución:** Los `standings` están **dentro** de `league`:
```typescript
interface StandingsGroup {
  league: {
    ...
    standings: Team[][];  // ✅ Correcto
  };
}
```

### 2. ExternalSource Unique Constraint

**Problema:** El script intentaba hacer `upsert` con `where: { name: "api-football" }` pero el campo único es `slug`.

**Solución:** Cambiar a `where: { slug: "api-football" }`.

### 3. Context Property Name

**Problema:** El código usaba `ctx.db` pero el contexto usa `ctx.prisma`.

**Solución:** Cambiar todas las referencias de `ctx.db` a `ctx.prisma`.

### 4. EntityType Case Sensitivity

**Problema:** Se buscaba con `entityType: "competition"` (minúsculas) pero en la BD está como `"COMPETITION"` (mayúsculas).

**Solución:** Usar siempre `"COMPETITION"` en mayúsculas.

### 5. Temporada 2025 sin Datos

**Problema inicial:** Se pensaba que 2025 no tenía datos, pero sí los tiene (Apertura 2025 en curso).

**Resultado:** La API devuelve datos correctamente para Liga MX 2025.

---

## 🐛 Troubleshooting

### Error: "No data available"

**Causa:** League ID o season incorrectos

**Solución:**
```typescript
// Verificar que externalMap tiene datos
console.log(externalMap?.externalId); // Debe ser un número como "39"
console.log(pool.season.year); // Debe ser un año como 2025
```

### Error: "API key required"

**Causa:** `NEXT_PUBLIC_SPORTS_API_KEY` no configurada

**Solución:**
```bash
# Agregar a .env.local
NEXT_PUBLIC_SPORTS_API_KEY=tu-api-key-aqui

# Reiniciar servidor
pnpm dev
```

### Error: "Daily quota exceeded"

**Causa:** Has alcanzado el límite de requests de tu plan

**Solución:**
1. Esperar 24 horas
2. Implementar caché
3. Upgrade de plan

### Tabla vacía pero sin errores

**Causa:** La liga no tiene datos para esa temporada

**Solución:**
- Verificar que la temporada existe en API-Sports
- Probar con otra liga/temporada conocida (e.g., Premier League 2024)

---

## 📚 Referencias

- **API-Sports Docs:** https://api-sports.io/documentation/football/v3
- **Endpoint Standings:** https://api-sports.io/documentation/football/v3#tag/Standings
- **Prisma Schema:** `packages/db/prisma/schema.prisma`
- **tRPC Routers:** `packages/api/src/routers/`

---

## ✅ Checklist de Implementación

- [x] Crear componente `StandingsTable`
- [x] Crear router `externalMaps`
- [x] Modificar `StatsWidget` para usar nuevo componente
- [x] Modificar `FixturesView` para pasar datos
- [x] Registrar router en `appRouter`
- [x] Corregir estructura de datos (standings dentro de league)
- [x] Crear script `link-competition-to-api-sports.ts`
- [x] Vincular Liga MX (ID 262) a competición
- [x] Verificar funcionamiento con datos reales
- [x] Localizar indicadores de forma (V/E/D en español)
- [x] Ajustar diseño visual (fondo, columnas)
- [x] Documentar implementación
- [ ] Agregar tests unitarios
- [ ] Agregar tests E2E
- [ ] Implementar caché
- [ ] Optimizar rendimiento
- [ ] Remover console.logs de debug

---

## 🎉 Resultado Final

**Antes:**
- ❌ Widgets no renderizaban
- ❌ Dependencia de scripts externos
- ❌ Difícil de debuggear
- ❌ Sin control sobre diseño

**Después:**
- ✅ Tabla funcional y responsive
- ✅ Control total sobre datos y diseño
- ✅ Fácil de mantener y extender
- ✅ Mejor rendimiento
- ✅ Más confiable

---

**Implementado por:** Cascade AI  
**Fecha:** 19 de Octubre, 2025  
**Método:** API REST directa  
**Status:** ✅ **FUNCIONANDO**

---

## 📝 Notas Finales

### Estado Actual (19 Oct 2025, 7:50 PM)

✅ **Completamente funcional** con:
- Tabla de posiciones de Liga MX Apertura 2025
- 18 equipos con estadísticas completas
- Toluca en primer lugar (31 pts)
- Toggle ALL/HOME/AWAY funcionando
- Indicadores de forma localizados (V/E/D)
- Logos de equipos y liga
- Diseño responsive y profesional

### Ajustes de Diseño Realizados

1. **Fondo:** Cambiado de `bg-white/5` a `bg-black/65` para mejor contraste
2. **Columnas:** Ajustadas para dar más espacio a la columna de Forma
   - Equipo: `col-span-4` → `col-span-3`
   - Forma: `col-span-1` → `col-span-2`
3. **Localización:** Indicadores en español (V/E/D) en lugar de (W/D/L)

### Console Logs Activos

Los siguientes logs están activos para debugging:
- `🔍 External Map Debug` en `FixturesView`
- `📊 StandingsTable Props` en `StandingsTable`
- `🌐 Fetching standings from` en `StandingsTable`
- `📥 API Response` en `StandingsTable`

**Recomendación:** Remover estos logs antes de producción.

### Próximos Pasos Sugeridos

1. **Caché:** Implementar caché de 5-10 minutos para reducir llamadas a la API
2. **Error Handling:** Mejorar mensajes de error para usuarios finales
3. **Loading States:** Agregar skeletons más detallados
4. **Tests:** Agregar tests unitarios y E2E
5. **Optimización:** Lazy loading de imágenes de equipos
