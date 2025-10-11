# Scripts de Prueba y Utilidades

Este directorio contiene scripts útiles para probar y validar la configuración del proyecto.

---

## 🧪 Test API-Football

Scripts para verificar que tu API key de API-Football funciona correctamente.

### TypeScript (Recomendado)

**Uso:**
```bash
# Desde la raíz del proyecto
pnpm tsx scripts/test-api-football.ts

# O con API key específica
SPORTS_API_KEY=tu-key pnpm tsx scripts/test-api-football.ts
```

**Características:**
- ✅ Prueba 5 endpoints diferentes
- ✅ Muestra resultados detallados con colores
- ✅ Verifica rate limits
- ✅ Espera 1 segundo entre requests
- ✅ Resumen final de pruebas exitosas/fallidas

**Salida esperada:**
```
============================================================
🧪 API-Football Test Script
============================================================

✅ API Key encontrada: abc123def4...
📡 Base URL: https://v3.football.api-sports.io

🔍 Probando: Status de la API
   URL: https://v3.football.api-sports.io/status
   Status: 200 OK
   ✅ Resultados: 1
   ✅ Datos recibidos: 1 items
   📊 Rate Limit: 99/100 requests restantes

...

============================================================
📊 RESUMEN
============================================================
✅ Pruebas exitosas: 5
❌ Pruebas fallidas: 0

🎉 ¡Todas las pruebas pasaron! Tu API key funciona correctamente.
```

---

### Bash (Linux/Mac)

**Requisitos:**
- `curl`
- `jq` (para formatear JSON)

**Uso:**
```bash
# Hacer ejecutable
chmod +x scripts/test-api-football.sh

# Ejecutar
./scripts/test-api-football.sh YOUR_API_KEY

# O con variable de entorno
SPORTS_API_KEY=YOUR_KEY ./scripts/test-api-football.sh
```

**Características:**
- ✅ Prueba rápida con curl
- ✅ Formato JSON con jq
- ✅ Colores en terminal
- ✅ Muestra HTTP status codes

---

### PowerShell (Windows)

**Uso:**
```powershell
# Desde PowerShell
.\scripts\test-api-football.ps1 -ApiKey "YOUR_API_KEY"

# O con variable de entorno
$env:SPORTS_API_KEY="YOUR_KEY"
.\scripts\test-api-football.ps1
```

**Características:**
- ✅ Nativo de Windows
- ✅ Usa Invoke-RestMethod
- ✅ Colores en consola
- ✅ Formato JSON automático
- ✅ Manejo de errores detallado

---

## 📋 Endpoints Probados

Todos los scripts prueban los siguientes endpoints:

1. **Status** - `/status`
   - Verifica el estado de tu cuenta
   - Muestra requests disponibles

2. **Timezone** - `/timezone`
   - Prueba de acceso básico
   - Lista zonas horarias disponibles

3. **World Cup 2026** - `/leagues?id=1&season=2026`
   - Información de la competición
   - Fechas de inicio/fin

4. **Equipos** - `/teams?league=1&season=2026`
   - Lista de equipos participantes
   - Códigos y nombres

5. **Fixtures** - `/fixtures?league=1&season=2026`
   - Partidos programados
   - Fechas y estados

---

## 🔑 Obtener API Key

1. **Registrarse:**
   - URL: https://dashboard.api-football.com/register

2. **Obtener Key:**
   - Dashboard: https://dashboard.api-football.com/
   - Copiar tu API key

3. **Planes Disponibles:**
   | Plan | Requests/día | Precio |
   |------|--------------|--------|
   | Free | 100 | $0 |
   | Basic | 1,000 | $15/mes |
   | Pro | 10,000 | $35/mes |
   | Ultra | 100,000 | $75/mes |

---

## ⚠️ Troubleshooting

### Error: "API key no proporcionada"
**Solución:** Configura la variable de entorno `SPORTS_API_KEY` o pásala como argumento.

### Error: "401 Unauthorized"
**Solución:** 
- Verifica que tu API key sea correcta
- Asegúrate de usar la key de API-Sports (NO RapidAPI)

### Error: "429 Rate Limit Exceeded"
**Solución:**
- Has excedido tu límite diario
- Espera hasta mañana o actualiza tu plan
- Para desarrollo, usa `SPORTS_PROVIDER=mock`

### Error: "jq: command not found" (Bash)
**Solución:**
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

---

## 🎯 Próximos Pasos

Una vez que los tests pasen:

1. **Configurar .env:**
   ```env
   SPORTS_PROVIDER=api-football
   SPORTS_API_KEY=tu-key-aqui
   ```

2. **Sincronizar fixtures:**
   ```bash
   cd apps/worker
   pnpm tsx src/index.ts sync-fixtures \
     --seasonId=<season-id> \
     --competitionId=1 \
     --year=2026
   ```

3. **Verificar en base de datos:**
   ```sql
   SELECT COUNT(*) FROM "Match";
   SELECT COUNT(*) FROM "Team";
   ```

---

## 📚 Documentación Relacionada

- **API-Football Docs:** https://www.api-football.com/documentation-v3
- **API_FOOTBALL_CORRECTION.md** - Detalles de la corrección crítica
- **FIXTURES_QUICK_START.md** - Guía de inicio rápido
- **FIXTURES_IMPLEMENTATION.md** - Documentación técnica completa

---

**Última actualización:** 2025-10-09
