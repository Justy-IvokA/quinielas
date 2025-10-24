# ✅ Worker: Actualización de Partidos en Vivo

## 🐛 Problema Detectado

Los partidos que ya terminaron (ej: 21 oct) seguían mostrando estado "En vivo" en lugar de mostrar el resultado final. Esto ocurría porque:

1. ❌ El job `autoSyncFixturesJob` se ejecutaba cada **6 horas** (demasiado lento)
2. ❌ No había un job específico para actualizar partidos en vivo con mayor frecuencia
3. ❌ Los resultados no se actualizaban hasta la siguiente sincronización completa

## ✅ Solución Implementada

### 1. Nuevo Job: `update-live-matches.ts`

Creado un job especializado que actualiza **solo los partidos relevantes**:

**Criterios de actualización:**
- ✅ Partidos con estado `LIVE` (en vivo)
- ✅ Partidos que terminaron en las últimas 2 horas (para capturar resultados finales)
- ✅ Partidos programados para hoy (para detectar cuando empiezan)

**Ventajas:**
- 🚀 Más rápido (solo actualiza partidos relevantes, no toda la temporada)
- 💰 Menos llamadas a la API externa
- ⚡ Resultados casi en tiempo real

### 2. Programación de Jobs Actualizada

```typescript
// Cada 1 minuto
- Lock predictions (bloquear predicciones cuando empieza el partido)

// Cada 5 minutos
- Update live matches (actualizar partidos en vivo) ← NUEVO
- Score finals (calcular puntuaciones) [offset 2min]

// Cada 10 minutos
- Leaderboard snapshots (guardar snapshots de tabla de posiciones)

// Cada 6 horas
- Auto fixtures sync (sincronización completa de fixtures)
```

### 3. Ejecución al Inicio

El worker ahora ejecuta automáticamente:
- `updateLiveMatchesJob` después de 10 segundos
- `autoSyncFixturesJob` después de 30 segundos

## 📊 Flujo de Actualización

```
┌─────────────────────────────────────────────────────────────┐
│  Partido Programado                                         │
│  Status: SCHEDULED                                          │
│  ↓ (kickoff time llega)                                     │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  updateLiveMatchesJob detecta partido de hoy                │
│  ↓ (cada 5 minutos)                                         │
│  Consulta API externa                                       │
│  ↓                                                           │
│  Actualiza: status → LIVE, scores, locked → true            │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  Durante el Partido                                         │
│  Status: LIVE                                               │
│  ↓ (cada 5 minutos)                                         │
│  updateLiveMatchesJob actualiza scores en vivo              │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  Partido Termina                                            │
│  ↓ (cada 5 minutos durante 2 horas)                         │
│  updateLiveMatchesJob actualiza:                            │
│    - status → FINISHED                                      │
│    - scores finales                                         │
│    - finishedAt timestamp                                   │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  Después de 2 horas                                         │
│  El partido ya no se actualiza (resultado final confirmado) │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Archivos Modificados

### Nuevos:
- `apps/worker/src/jobs/update-live-matches.ts` - Job de actualización de partidos en vivo

### Modificados:
- `apps/worker/src/index.ts` - Programación de jobs actualizada

## 🚀 Cómo Usar

### Reiniciar el Worker

```bash
# Detener el worker actual
Ctrl+C

# Iniciar el worker
pnpm --filter @qp/worker dev
```

### Verificar que Funciona

Revisa los logs del worker:

```
✅ Worker jobs scheduled successfully
  - Lock predictions: every 1 minute
  - Update live matches: every 5 minutes (+ on startup)
  - Score finals: every 5 minutes (offset 2min)
  - Leaderboard snapshots: every 10 minutes
  - Auto fixtures sync: every 6 hours (+ on startup)

[Worker] Running initial live matches update...
[UpdateLive] Starting live matches update...
[UpdateLive] Found X matches to update
[UpdateLive] ✅ Updated NEC vs CRU: 1-2 (FINISHED)
```

### Ejecutar Manualmente

Si necesitas actualizar inmediatamente:

```typescript
import { updateLiveMatchesJob } from '@qp/worker';

await updateLiveMatchesJob();
```

## 📈 Mejoras Futuras (Opcional)

1. **WebSockets**: Para actualizaciones en tiempo real sin polling
2. **Frecuencia adaptativa**: Aumentar frecuencia durante horarios de partido
3. **Notificaciones**: Alertas cuando un partido empieza o termina
4. **Cache inteligente**: Reducir llamadas a API usando cache de resultados

## 🎯 Resultado Esperado

Ahora los partidos deberían:
- ✅ Cambiar a "En vivo" cuando empiezan (máximo 5 min de retraso)
- ✅ Actualizar scores cada 5 minutos durante el partido
- ✅ Cambiar a "Finalizado" con resultado final cuando terminan
- ✅ Dejar de mostrar "En vivo" para partidos de días anteriores

## ⚠️ Notas Importantes

1. **API Rate Limits**: El job agrupa actualizaciones por season para minimizar llamadas
2. **Errores de API**: Si la API falla, el job continúa con los siguientes partidos
3. **Logs detallados**: Cada actualización se registra para debugging
4. **Pausa entre seasons**: 1 segundo de pausa para no saturar la API
