# Build Production Script for Windows (PowerShell)
# Este script compila todo el proyecto para producción

Write-Host "🚀 Iniciando build de producción..." -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Ejecuta este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

# Paso 1: Limpiar builds anteriores
Write-Host "🧹 Limpiando builds anteriores..." -ForegroundColor Yellow
pnpm clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Advertencia: No se pudo limpiar completamente" -ForegroundColor Yellow
}

# Paso 2: Instalar dependencias
Write-Host ""
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Falló la instalación de dependencias" -ForegroundColor Red
    exit 1
}

# Paso 3: Generar Prisma Client
Write-Host ""
Write-Host "🗄️  Generando Prisma Client..." -ForegroundColor Yellow
pnpm --filter @qp/db prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Falló la generación de Prisma Client" -ForegroundColor Red
    exit 1
}

# Paso 4: Build de packages (en orden de dependencias)
Write-Host ""
Write-Host "🔨 Building packages..." -ForegroundColor Yellow

$packages = @(
    "@qp/db",
    "@qp/utils",
    "@qp/scoring",
    "@qp/auth",
    "@qp/branding",
    "@qp/api",
    "@qp/ui"
)

foreach ($package in $packages) {
    Write-Host "  Building $package..." -ForegroundColor Gray
    pnpm --filter $package build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: Falló el build de $package" -ForegroundColor Red
        exit 1
    }
}

# Paso 5: Build de aplicaciones
Write-Host ""
Write-Host "🌐 Building aplicaciones..." -ForegroundColor Yellow

$apps = @(
    "@qp/web",
    "@qp/admin",
    "@qp/worker"
)

foreach ($app in $apps) {
    Write-Host "  Building $app..." -ForegroundColor Gray
    pnpm --filter $app build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: Falló el build de $app" -ForegroundColor Red
        exit 1
    }
}

# Paso 6: Verificar tipos
Write-Host ""
Write-Host "📊 Verificando tipos..." -ForegroundColor Yellow
pnpm typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Falló la verificación de tipos" -ForegroundColor Red
    exit 1
}

# Paso 7: Resumen
Write-Host ""
Write-Host "✅ Build completado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Packages compilados:" -ForegroundColor Cyan
foreach ($package in $packages) {
    Write-Host "  ✓ $package" -ForegroundColor Green
}

Write-Host ""
Write-Host "🌐 Apps compiladas:" -ForegroundColor Cyan
foreach ($app in $apps) {
    Write-Host "  ✓ $app" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Todo listo para producción!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Verifica las variables de entorno (.env.production)" -ForegroundColor Gray
Write-Host "  2. Ejecuta las migraciones: pnpm --filter @qp/db prisma migrate deploy" -ForegroundColor Gray
Write-Host "  3. Despliega las aplicaciones según la guía en PRODUCTION_BUILD_GUIDE.md" -ForegroundColor Gray
Write-Host ""
