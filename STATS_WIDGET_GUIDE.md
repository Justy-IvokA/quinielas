# Guía de Implementación: Widget de Estadísticas

## Resumen

Se ha implementado un tercer tabulador **"Estadísticas"** en la vista de fixtures (`/pools/[slug]/fixtures`) que embebe widgets de API-Football para proporcionar estadísticas en tiempo real y ayudar a los usuarios a tomar mejores decisiones en sus pronósticos.

## Características

El tabulador de Estadísticas incluye tres widgets principales:

1. **Marcadores en vivo** - Muestra los partidos en curso con marcadores actualizados en tiempo real
2. **Calendario de partidos** - Visualiza próximos partidos y resultados históricos
3. **Tabla de posiciones** - Muestra la clasificación actual de la competición

## Archivos Modificados/Creados

### Nuevos Archivos

- **`apps/web/app/[locale]/(player)/pools/[slug]/fixtures/_components/StatsWidget.tsx`**
  - Componente React que maneja la integración con los widgets de API-Football
  - Carga dinámicamente el script de widgets
  - Maneja la configuración de tema (dark) y lenguaje (es/en)
  - Muestra mensajes de error si la API key no está configurada

### Archivos Modificados

- **`apps/web/app/[locale]/(player)/pools/[slug]/fixtures/_components/FixturesView.tsx`**
  - Agregado tercer tab "Estadísticas"
  - Importado componente `StatsWidget`
  - Pasado props necesarios (seasonId, competitionName, locale)

- **`apps/web/messages/es-MX.json`**
  - Agregado `fixtures.tabs.stats: "Estadísticas"`
  - Agregada sección completa `fixtures.stats` con traducciones para:
    - Mensajes de configuración
    - Títulos de widgets
    - Instrucciones de setup

## Configuración Requerida

### 1. Obtener API Key de API-Football

1. Visita [https://www.api-football.com](https://www.api-football.com)
2. Crea una cuenta gratuita
3. Ve a tu dashboard y copia tu API key
4. El plan gratuito incluye:
   - 100 requests/día
   - Acceso a widgets (sin límite)
   - Datos en tiempo real

### 2. Configurar Variable de Entorno

Agrega la siguiente variable de entorno en tu archivo `.env` o `.env.local`:

```env
NEXT_PUBLIC_API_FOOTBALL_KEY=tu_api_key_aqui
```

**Importante:** 
- La variable debe tener el prefijo `NEXT_PUBLIC_` para estar disponible en el cliente
- Esta es una excepción a la regla de no exponer API keys, ya que los widgets de API-Football están diseñados para uso en el cliente
- API-Football protege el uso mediante rate limiting y restricciones de dominio

### 3. Reiniciar el Servidor

Después de agregar la variable de entorno:

```bash
pnpm dev
```

## Uso

1. Navega a cualquier pool: `/[brand]/pools/[slug]/fixtures`
2. Verás tres tabs: **Partidos**, **Tabla de posiciones**, y **Estadísticas**
3. Haz clic en el tab **Estadísticas**
4. Los widgets se cargarán automáticamente mostrando:
   - Marcadores en vivo de la competición
   - Calendario completo de partidos
   - Tabla de posiciones actualizada

## Personalización de Widgets

Los widgets se pueden personalizar editando el componente `StatsWidget.tsx`:

### Configuración Global

```typescript
window.SportsWidgets.init({
  apiKey: apiKey,
  theme: "dark",        // "light" | "dark"
  language: locale,     // "es" | "en" | "fr" | etc.
});
```

### Configuración por Widget

Cada widget acepta atributos `data-*`:

```tsx
<div 
  data-widget="livescore"
  data-sport="football"
  data-theme="dark"
  data-league="39"      // ID de la liga (opcional)
  data-season="2024"    // Temporada (opcional)
/>
```

### IDs de Ligas Comunes

- **39** - Premier League
- **140** - La Liga (España)
- **135** - Serie A (Italia)
- **78** - Bundesliga
- **61** - Ligue 1 (Francia)
- **1** - World Cup

Para obtener más IDs de ligas, consulta la [documentación de API-Football](https://www.api-football.com/documentation-v3#tag/Leagues).

## Widgets Disponibles

Según la documentación de API-Football, puedes agregar los siguientes widgets adicionales:

1. **`livescore`** - Marcadores en vivo ✅ (implementado)
2. **`fixtures`** - Calendario de partidos ✅ (implementado)
3. **`standings`** - Tabla de posiciones ✅ (implementado)
4. **`fixture`** - Detalles de un partido específico
5. **`h2h`** - Historial entre dos equipos (Head to Head)
6. **`team`** - Información y estadísticas de un equipo
7. **`player`** - Estadísticas de un jugador
8. **`odds`** - Cuotas de apuestas (si aplica)

## Mapeo de Competiciones

Para vincular correctamente los widgets con las competiciones de tu pool, necesitarás:

1. Obtener el ID de la liga en API-Football
2. Almacenar este ID en tu tabla `ExternalMap` con:
   - `externalId`: ID de API-Football
   - `entityType`: "COMPETITION"
   - `entityId`: ID de tu competición local
   - `sourceId`: ID de tu ExternalSource para API-Football

Ejemplo de query para crear el mapeo:

```sql
INSERT INTO "ExternalMap" ("externalId", "entityType", "entityId", "sourceId")
VALUES ('39', 'COMPETITION', 'tu-competition-id', 'tu-source-id');
```

## Mejoras Futuras

### Corto Plazo
- [ ] Mapear automáticamente competiciones locales con IDs de API-Football
- [ ] Agregar widget de H2H (head-to-head) para partidos específicos
- [ ] Cachear configuración de widgets para mejorar rendimiento

### Mediano Plazo
- [ ] Widget de estadísticas de equipo en páginas de detalle
- [ ] Integrar estadísticas de jugadores
- [ ] Agregar filtros por jornada/round

### Largo Plazo
- [ ] Sistema de recomendaciones basado en estadísticas
- [ ] Análisis predictivo usando datos históricos
- [ ] Dashboard de insights para administradores

## Troubleshooting

### Los widgets no se cargan

1. **Verifica la API key:**
   ```bash
   echo $NEXT_PUBLIC_API_FOOTBALL_KEY
   ```

2. **Revisa la consola del navegador:**
   - Abre DevTools (F12)
   - Busca errores relacionados con `SportsWidgets` o `api-sports.io`

3. **Verifica que el script se cargó:**
   ```javascript
   console.log(window.SportsWidgets); // Debe mostrar un objeto
   ```

### Error de CORS

Los widgets de API-Football están diseñados para funcionar en el cliente sin problemas de CORS. Si encuentras este error:

1. Verifica que estás usando `NEXT_PUBLIC_` en el nombre de la variable
2. Asegúrate de que el dominio esté registrado en tu cuenta de API-Football

### Widgets muestran "Loading..." indefinidamente

1. Verifica tu cuota de requests en el dashboard de API-Football
2. Asegúrate de que los IDs de liga/temporada son correctos
3. Revisa que tu plan incluye acceso a widgets

## Referencias

- [Documentación de Widgets API-Football](https://api-sports.io/documentation/widgets/v3)
- [API-Football Homepage](https://www.api-football.com)
- [Widgets Demo](https://www.api-football.com/widgets)
- [Documentación API REST](https://www.api-football.com/documentation-v3)

## Soporte

Para problemas específicos de los widgets, contacta:
- Soporte de API-Football: [https://www.api-football.com/contact](https://www.api-football.com/contact)
- Documentación del proyecto: Ver otros archivos `*.md` en la raíz

---

**Última actualización:** Octubre 2025  
**Versión de widgets:** 2.0.3  
**Autor:** Implementado para Quinielas WL (Multi-tenant)
