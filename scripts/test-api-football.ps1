# Script de prueba para API-Football (PowerShell)
# Uso: .\scripts\test-api-football.ps1 -ApiKey "YOUR_API_KEY"
# O:   $env:SPORTS_API_KEY="YOUR_KEY"; .\scripts\test-api-football.ps1

param(
    [string]$ApiKey = $env:SPORTS_API_KEY
)

$BaseUrl = "https://v3.football.api-sports.io"

# Función para hacer requests
function Invoke-ApiFootballRequest {
    param(
        [string]$Endpoint,
        [hashtable]$Params = @{}
    )

    $uri = "$BaseUrl$Endpoint"
    if ($Params.Count -gt 0) {
        $queryString = ($Params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
        $uri = "$uri`?$queryString"
    }

    $headers = @{
        "x-apisports-key" = $ApiKey
    }

    try {
        $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
        return @{
            Success = $true
            Data = $response
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
            StatusCode = $_.Exception.Response.StatusCode.value__
        }
    }
}

# Banner
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🧪 API-Football Test Script (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verificar API key
if ([string]::IsNullOrEmpty($ApiKey)) {
    Write-Host "❌ ERROR: API key no proporcionada`n" -ForegroundColor Red
    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "  .\scripts\test-api-football.ps1 -ApiKey `"YOUR_API_KEY`"" -ForegroundColor Blue
    Write-Host "  `$env:SPORTS_API_KEY=`"YOUR_KEY`"; .\scripts\test-api-football.ps1`n" -ForegroundColor Blue
    Write-Host "Obtén tu API key en:" -ForegroundColor Yellow
    Write-Host "  https://dashboard.api-football.com/`n" -ForegroundColor Blue
    exit 1
}

Write-Host "✅ API Key: $($ApiKey.Substring(0, [Math]::Min(10, $ApiKey.Length)))..." -ForegroundColor Green
Write-Host "📡 Base URL: $BaseUrl`n" -ForegroundColor Blue

$passed = 0
$failed = 0

# Test 1: Status
Write-Host "🔍 Test 1: Status de la API" -ForegroundColor Cyan
$result = Invoke-ApiFootballRequest -Endpoint "/status"
if ($result.Success) {
    Write-Host "  ✅ Status: OK" -ForegroundColor Green
    Write-Host "  📊 Account:" -ForegroundColor Blue
    $result.Data.response | ConvertTo-Json -Depth 3
    $passed++
}
else {
    Write-Host "  ❌ Error: $($result.Error)" -ForegroundColor Red
    Write-Host "  Status Code: $($result.StatusCode)" -ForegroundColor Red
    $failed++
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Test 2: Timezone
Write-Host "🔍 Test 2: Timezone (acceso básico)" -ForegroundColor Cyan
$result = Invoke-ApiFootballRequest -Endpoint "/timezone"
if ($result.Success) {
    Write-Host "  ✅ Resultados: $($result.Data.results)" -ForegroundColor Green
    Write-Host "  📋 Primeras 5 zonas horarias:" -ForegroundColor Blue
    $result.Data.response[0..4] | ForEach-Object { Write-Host "    - $_" -ForegroundColor Gray }
    $passed++
}
else {
    Write-Host "  ❌ Error: $($result.Error)" -ForegroundColor Red
    $failed++
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Test 3: World Cup 2026
Write-Host "🔍 Test 3: World Cup 2026" -ForegroundColor Cyan
$result = Invoke-ApiFootballRequest -Endpoint "/leagues" -Params @{ id = "1"; season = "2026" }
if ($result.Success) {
    Write-Host "  ✅ Resultados: $($result.Data.results)" -ForegroundColor Green
    if ($result.Data.response.Count -gt 0) {
        $league = $result.Data.response[0]
        Write-Host "  📋 Liga: $($league.league.name)" -ForegroundColor Blue
        Write-Host "  🌍 País: $($league.country.name)" -ForegroundColor Blue
        Write-Host "  📅 Temporada: $($league.seasons[0].year)" -ForegroundColor Blue
        Write-Host "  🗓️  Inicio: $($league.seasons[0].start)" -ForegroundColor Blue
        Write-Host "  🗓️  Fin: $($league.seasons[0].end)" -ForegroundColor Blue
    }
    $passed++
}
else {
    Write-Host "  ❌ Error: $($result.Error)" -ForegroundColor Red
    $failed++
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Test 4: Equipos
Write-Host "🔍 Test 4: Equipos World Cup 2026" -ForegroundColor Cyan
$result = Invoke-ApiFootballRequest -Endpoint "/teams" -Params @{ league = "1"; season = "2026" }
if ($result.Success) {
    Write-Host "  ✅ Total equipos: $($result.Data.results)" -ForegroundColor Green
    Write-Host "  📋 Primeros 5 equipos:" -ForegroundColor Blue
    $result.Data.response[0..4] | ForEach-Object {
        Write-Host "    - [$($_.team.code)] $($_.team.name)" -ForegroundColor Gray
    }
    $passed++
}
else {
    Write-Host "  ❌ Error: $($result.Error)" -ForegroundColor Red
    $failed++
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Test 5: Fixtures
Write-Host "🔍 Test 5: Fixtures World Cup 2026" -ForegroundColor Cyan
$result = Invoke-ApiFootballRequest -Endpoint "/fixtures" -Params @{ league = "1"; season = "2026" }
if ($result.Success) {
    Write-Host "  ✅ Total partidos: $($result.Data.results)" -ForegroundColor Green
    Write-Host "  📋 Primeros 3 partidos:" -ForegroundColor Blue
    $result.Data.response[0..2] | ForEach-Object {
        $date = ([DateTime]$_.fixture.date).ToString("yyyy-MM-dd HH:mm")
        Write-Host "    - $date | $($_.teams.home.name) vs $($_.teams.away.name) [$($_.fixture.status.short)]" -ForegroundColor Gray
    }
    $passed++
}
else {
    Write-Host "  ❌ Error: $($result.Error)" -ForegroundColor Red
    $failed++
}

# Resumen
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📊 RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Pruebas exitosas: $passed" -ForegroundColor Green
Write-Host "❌ Pruebas fallidas: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })

if ($failed -eq 0) {
    Write-Host "`n🎉 ¡Todas las pruebas pasaron! Tu API key funciona correctamente." -ForegroundColor Green
    Write-Host "`nPróximos pasos:" -ForegroundColor Cyan
    Write-Host "  1. Configura SPORTS_PROVIDER=api-football en tus .env" -ForegroundColor Blue
    Write-Host "  2. Ejecuta: pnpm tsx apps/worker/src/index.ts sync-fixtures" -ForegroundColor Blue
}
else {
    Write-Host "`n⚠️  Algunas pruebas fallaron. Verifica:" -ForegroundColor Yellow
    Write-Host "  1. Tu API key es valida" -ForegroundColor Yellow
    Write-Host "  2. Tienes requests disponibles en tu plan" -ForegroundColor Yellow
    Write-Host "  3. La URL base es correcta: https://v3.football.api-sports.io" -ForegroundColor Yellow
}

Write-Host "`n========================================`n" -ForegroundColor Cyan

exit $(if ($failed -gt 0) { 1 } else { 0 })
