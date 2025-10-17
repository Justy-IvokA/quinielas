# Script para reorganizar las rutas del admin en el grupo (authenticated)
# Ejecutar desde la raíz del proyecto

$basePath = "apps\admin\app\[locale]"
$authPath = "$basePath\(authenticated)"

Write-Host "🔄 Reorganizando rutas del admin..." -ForegroundColor Cyan

# Crear directorio (authenticated) si no existe
if (!(Test-Path $authPath)) {
    New-Item -ItemType Directory -Path $authPath -Force | Out-Null
    Write-Host "✅ Creado directorio (authenticated)" -ForegroundColor Green
}

# Lista de carpetas/archivos a mover (rutas autenticadas)
$itemsToMove = @(
    "page.tsx",
    "pools",
    "fixtures",
    "access",
    "analytics",
    "profile",
    "settings",
    "sync",
    "audit",
    "policies"
)

# Mover cada item
foreach ($item in $itemsToMove) {
    $sourcePath = Join-Path $basePath $item
    $destPath = Join-Path $authPath $item
    
    if (Test-Path $sourcePath) {
        # Verificar si ya existe en destino
        if (Test-Path $destPath) {
            Write-Host "⚠️  $item ya existe en (authenticated), omitiendo..." -ForegroundColor Yellow
        } else {
            Move-Item -Path $sourcePath -Destination $destPath -Force
            Write-Host "✅ Movido: $item" -ForegroundColor Green
        }
    } else {
        Write-Host "⏭️  $item no existe, omitiendo..." -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Reorganizacion completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Estructura final:" -ForegroundColor Cyan
Write-Host "  apps/admin/app/[locale]/" -ForegroundColor White
Write-Host "    (authenticated)/ - Rutas protegidas" -ForegroundColor Green
Write-Host "      layout.tsx - AdminHeader + auth check" -ForegroundColor Green
Write-Host "      page.tsx - Dashboard" -ForegroundColor Green
Write-Host "      pools/, fixtures/, etc." -ForegroundColor Green
Write-Host "    auth/ - Rutas publicas" -ForegroundColor Yellow
Write-Host "      signin/, error/" -ForegroundColor Yellow
Write-Host "    layout.tsx - Layout principal" -ForegroundColor White
Write-Host ""
Write-Host "Proximo paso: Reinicia el servidor con pnpm dev" -ForegroundColor Cyan
