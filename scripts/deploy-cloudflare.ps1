# ============================================
# Script de Deployment para Cloudflare
# Quinielas WL - Multi-tenant Platform
# ============================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("web", "admin", "worker", "all")]
    [string]$Target = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory=$false)]
    [switch]$Production
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Cloudflare Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Función para verificar comandos
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Verificar dependencias
Write-Host "📋 Verificando dependencias..." -ForegroundColor Yellow

if (-not (Test-Command "pnpm")) {
    Write-Host "❌ Error: pnpm no está instalado" -ForegroundColor Red
    Write-Host "   Instala con: npm install -g pnpm" -ForegroundColor Gray
    exit 1
}

if (-not (Test-Command "npx")) {
    Write-Host "❌ Error: npx no está disponible" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencias verificadas" -ForegroundColor Green
Write-Host ""

# Función para deploy de Web App
function Deploy-WebApp {
    Write-Host "📱 Desplegando Web App..." -ForegroundColor Cyan
    
    Set-Location "apps/web"
    
    if (-not $SkipBuild) {
        Write-Host "   Building Next.js..." -ForegroundColor Gray
        pnpm build
        
        Write-Host "   Building for Cloudflare Pages..." -ForegroundColor Gray
        pnpm pages:build
    }
    
    Write-Host "   Deploying to Cloudflare..." -ForegroundColor Gray
    if ($Production) {
        pnpm pages:deploy --branch=main
    } else {
        pnpm pages:deploy --branch=preview
    }
    
    Set-Location "../.."
    Write-Host "✅ Web App desplegada" -ForegroundColor Green
    Write-Host ""
}

# Función para deploy de Admin App
function Deploy-AdminApp {
    Write-Host "🔧 Desplegando Admin App..." -ForegroundColor Cyan
    
    Set-Location "apps/admin"
    
    if (-not $SkipBuild) {
        Write-Host "   Building Next.js..." -ForegroundColor Gray
        pnpm build
        
        Write-Host "   Building for Cloudflare Pages..." -ForegroundColor Gray
        pnpm pages:build
    }
    
    Write-Host "   Deploying to Cloudflare..." -ForegroundColor Gray
    if ($Production) {
        pnpm pages:deploy --branch=main
    } else {
        pnpm pages:deploy --branch=preview
    }
    
    Set-Location "../.."
    Write-Host "✅ Admin App desplegada" -ForegroundColor Green
    Write-Host ""
}

# Función para deploy de Worker
function Deploy-Worker {
    Write-Host "⚙️ Desplegando Worker..." -ForegroundColor Cyan
    
    Set-Location "apps/worker"
    
    if (-not $SkipBuild) {
        Write-Host "   Building TypeScript..." -ForegroundColor Gray
        pnpm build
    }
    
    Write-Host "   Deploying to Cloudflare Workers..." -ForegroundColor Gray
    pnpm deploy
    
    Set-Location "../.."
    Write-Host "✅ Worker desplegado" -ForegroundColor Green
    Write-Host ""
}

# Ejecutar deployment según el target
try {
    $startTime = Get-Date
    
    switch ($Target) {
        "web" {
            Deploy-WebApp
        }
        "admin" {
            Deploy-AdminApp
        }
        "worker" {
            Deploy-Worker
        }
        "all" {
            Deploy-WebApp
            Deploy-AdminApp
            Deploy-Worker
        }
    }
    
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "🎉 Deployment completado exitosamente!" -ForegroundColor Green
    Write-Host "   Tiempo total: $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor Gray
    Write-Host ""
    
    if ($Production) {
        Write-Host "🌐 URLs de Producción:" -ForegroundColor Yellow
        Write-Host "   Web:   https://quinielas-web.pages.dev" -ForegroundColor Gray
        Write-Host "   Admin: https://quinielas-admin.pages.dev" -ForegroundColor Gray
    } else {
        Write-Host "🔍 URLs de Preview:" -ForegroundColor Yellow
        Write-Host "   Revisa el output arriba para las URLs de preview" -ForegroundColor Gray
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Error durante el deployment:" -ForegroundColor Red
    Write-Host "   $_" -ForegroundColor Red
    exit 1
}

# ============================================
# Ejemplos de uso:
# ============================================
#
# Deploy todo a preview:
#   .\scripts\deploy-cloudflare.ps1
#
# Deploy solo web app:
#   .\scripts\deploy-cloudflare.ps1 -Target web
#
# Deploy a producción:
#   .\scripts\deploy-cloudflare.ps1 -Production
#
# Deploy sin rebuild:
#   .\scripts\deploy-cloudflare.ps1 -SkipBuild
#
