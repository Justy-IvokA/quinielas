# Guía de Sincronización de Fixtures con API-Football

Esta guía te ayudará a configurar y usar la sincronización de fixtures desde API-Football.

---

## 📋 Requisitos Previos

1. ✅ API Key de API-Football (ya la tienes: `39deca48199d03194ef0438b86168eea`)
2. ✅ Base de datos configurada
3. ✅ Datos de seed creados (Season, Competition, ExternalSource)

---

## 🚀 Pasos de Configuración

### 1. Ejecutar el Script de Seed Actualizado

El script ahora crea el mapeo externo necesario para la competición:

```powershell
pnpm tsx scripts/seed-fixtures-demo.ts
```

**Salida esperada:**
```
✅ Fuente creada: API-Football (...)
✅ Deporte creado: Football
✅ Competición creada: FIFA World Cup
✅ Mapeo externo creado  ← NUEVO
✅ Temporada creada: World Cup 2026
✅ Equipos creados: 4
✅ Partidos creados: 3
```

---

### 2. Configurar Variables de Entorno

**En `apps/admin/.env.local`:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/quinielas"
SPORTS_API_KEY=39deca48199d03194ef0438b86168eea
```

---

### 3. Reiniciar el Servidor Admin

```powershell
# Limpiar caché
Remove-Item -Recurse -Force apps\admin\.next

# Reiniciar
pnpm --filter @qp/admin dev
```

---

## 🎯 Cómo Usar la Sincronización

### Desde el Admin Panel

1. **Navega a:** `http://localhost:3000/es-MX/fixtures`

2. **Verás:**
   - Selector de **Temporada**: "FIFA World Cup - 2026"
   - Selector de **Fuente de datos**: "API-Football (api-football)"
   - Botón **"Sincronizar ahora"**
   - Tabla con los 3 partidos de demostración

3. **Haz clic en "Sincronizar ahora"**

4. **El sistema hará:**
   - ✅ Consultar API-Football para World Cup 2026
   - ✅ Sincronizar todos los equipos participantes
   - ✅ Sincronizar todos los partidos (fixtures)
   - ✅ Crear mapeos externos para equipos y partidos
   - ✅ Actualizar la tabla con los partidos reales

---

## 📊 Qué Esperar

### Primera Sincronización

**Nota:** Como la World Cup 2026 aún no ha comenzado, API-Football puede tener:
- ✅ Lista de equipos participantes
- ⚠️ Pocos o ningún fixture publicado aún

**Respuesta típica:**
```
✅ Sincronización completada
   - Equipos sincronizados: 32
   - Partidos sincronizados: 0-64 (dependiendo de disponibilidad)
```

---

### Sincronizaciones Posteriores

Cada vez que ejecutes la sincronización:
- Se actualizarán los horarios de partidos
- Se agregarán nuevos partidos publicados
- Se actualizarán resultados de partidos finalizados
- **NO se duplicarán datos** (usa `upsert`)

---

## 🔧 Troubleshooting

### Error: "No external mapping found for competition"

**Causa:** Falta el mapeo externo de la competición.

**Solución:**
```powershell
# Ejecuta el seed actualizado
pnpm tsx scripts/seed-fixtures-demo.ts
```

---

### Error: "API key is required"

**Causa:** Variable de entorno `SPORTS_API_KEY` no configurada.

**Solución:**
```powershell
# En apps/admin/.env.local
SPORTS_API_KEY=39deca48199d03194ef0438b86168eea
```

---

### Error: "Rate limit exceeded"

**Causa:** Has excedido tu límite de requests diarios (7,500 para plan Pro).

**Solución:**
- Espera hasta mañana
- O usa el mock provider temporalmente:
  ```env
  # En el seed, cambia el slug a "mock"
  ```

---

### Sincronización devuelve 0 partidos

**Causa:** API-Football aún no tiene fixtures publicados para 2026.

**Solución:**
- Esto es normal para eventos futuros
- Los fixtures se publican más cerca de la fecha del evento
- Puedes probar con una temporada pasada (ej: 2022)

---

## 🧪 Probar con World Cup 2022

Si quieres ver datos reales inmediatamente, crea una temporada 2022:

```typescript
// En seed-fixtures-demo.ts, cambia:
year: 2022  // en lugar de 2026
```

Luego ejecuta el seed y sincroniza. Verás todos los 64 partidos del Mundial 2022.

---

## 📝 Logs de Sincronización

Durante la sincronización, verás logs en la consola del servidor:

```
[Sync] Fetching season data from api-football...
[API-Football] Fetching season for league 1, year 2026
[Sync] Received 32 teams and 64 matches
[Sync] Successfully synced 64 matches
```

---

## 🎉 Resultado Final

Después de una sincronización exitosa:

1. **Tabla de Fixtures actualizada** con partidos reales
2. **Equipos sincronizados** con logos y datos oficiales
3. **Mapeos externos creados** para futuras actualizaciones
4. **Datos listos** para crear quinielas y predicciones

---

## 🔄 Sincronización Automática (Opcional)

Para sincronizar automáticamente, puedes:

1. **Worker con Cron Job:**
   ```typescript
   // En apps/worker/src/jobs/sync-fixtures.ts
   // Ejecutar cada 6 horas
   ```

2. **Webhook de API-Football:**
   - Configurar webhook en dashboard
   - Recibir notificaciones de cambios
   - Sincronizar solo partidos actualizados

---

## 📚 Documentación Relacionada

- **API-Football Docs:** https://www.api-football.com/documentation-v3
- **API_FOOTBALL_CORRECTION.md** - Corrección crítica de endpoint
- **FIXTURES_QUICK_START.md** - Guía de inicio rápido
- **scripts/README.md** - Scripts de prueba disponibles

---

**Última actualización:** 2025-10-09
