# Script de migración seguro para alineación Prisma ↔ tRPC
# Uso: .\scripts\migrate-schema.ps1 -Environment dev|staging|production

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "production")]
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "backup_${Environment}_${Timestamp}.sql"

Write-Host "🚀 Iniciando migración de schema..." -ForegroundColor Cyan
Write-Host "📍 Ambiente: $Environment" -ForegroundColor Cyan
Write-Host ""

# Función de error
function Write-Error-Exit {
    param($Message)
    Write-Host "❌ Error: $Message" -ForegroundColor Red
    exit 1
}

# Función de advertencia
function Write-Warning-Custom {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

# Función de éxito
function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

# 1. Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Error-Exit "Debes ejecutar este script desde la raíz del proyecto"
}

# 2. Verificar que existe la variable DATABASE_URL
if (-not $env:DATABASE_URL) {
    Write-Error-Exit "DATABASE_URL no está definida. Cargar desde .env primero"
}

$MaskedUrl = $env:DATABASE_URL -replace '(.*://)(.*)(@.*)', '$1***$3'
Write-Host "📊 Base de datos: $MaskedUrl" -ForegroundColor Gray
Write-Host ""

# 3. Confirmar acción en producción
if ($Environment -eq "production") {
    Write-Warning-Custom "ESTÁS A PUNTO DE MODIFICAR LA BASE DE DATOS DE PRODUCCIÓN"
    $confirmation = Read-Host "¿Estás seguro? Escribe 'CONFIRMO' para continuar"
    
    if ($confirmation -ne "CONFIRMO") {
        Write-Host "Migración cancelada." -ForegroundColor Yellow
        exit 0
    }
}

# 4. Crear backup (solo si pg_dump está disponible)
if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
    Write-Host "📦 Creando backup..." -ForegroundColor Cyan
    try {
        pg_dump $env:DATABASE_URL | Out-File -FilePath $BackupFile -Encoding utf8
        Write-Success "Backup creado: $BackupFile"
    } catch {
        Write-Warning-Custom "No se pudo crear backup automático"
    }
} else {
    Write-Warning-Custom "pg_dump no disponible. Asegúrate de tener un backup manual."
}

Write-Host ""

# 5. Ir al directorio de Prisma
Push-Location packages\db

# 6. Ejecutar migración según ambiente
try {
    if ($Environment -eq "dev") {
        Write-Host "🔧 Ejecutando migración en modo desarrollo..." -ForegroundColor Cyan
        pnpm prisma migrate dev --name align_schema_with_trpc
    } else {
        Write-Host "🔧 Ejecutando migración en modo deploy..." -ForegroundColor Cyan
        pnpm prisma migrate deploy
    }
    Write-Success "Migración aplicada"
} catch {
    Write-Error-Exit "Migración falló: $_"
}

# 7. Generar cliente Prisma
Write-Host ""
Write-Host "🔄 Regenerando cliente Prisma..." -ForegroundColor Cyan
try {
    pnpm prisma generate
    Write-Success "Cliente Prisma generado"
} catch {
    Write-Error-Exit "Generación de cliente falló: $_"
}

# 8. Regresar a root
Pop-Location

# 9. Ejecutar validación
Write-Host ""
Write-Host "🧪 Validando schema..." -ForegroundColor Cyan
if (Test-Path "scripts\validate-schema.ts") {
    try {
        pnpm tsx scripts\validate-schema.ts
    } catch {
        Write-Warning-Custom "Validación falló - revisar manualmente"
    }
} else {
    Write-Warning-Custom "Script de validación no encontrado"
}

# 10. Ejecutar tests (solo en dev)
if ($Environment -eq "dev") {
    Write-Host ""
    Write-Host "🧪 Ejecutando tests..." -ForegroundColor Cyan
    try {
        pnpm turbo test --filter=@qp/api
    } catch {
        Write-Warning-Custom "Tests fallaron - revisar antes de deploy"
    }
}

# 11. Build para verificar tipos
Write-Host ""
Write-Host "🏗️  Verificando build..." -ForegroundColor Cyan
try {
    pnpm turbo build --filter=@qp/api
    Write-Success "Build exitoso"
} catch {
    Write-Error-Exit "Build falló - hay errores de tipos"
}

# 12. Resumen final
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Success "MIGRACIÓN COMPLETADA EXITOSAMENTE"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Revisar logs de migración en packages\db\prisma\migrations\"
Write-Host "   2. Verificar que las apps funcionan correctamente"
Write-Host "   3. Hacer commit de los cambios generados por Prisma"
Write-Host ""

if (Test-Path $BackupFile) {
    Write-Host "💾 Backup guardado en: $BackupFile" -ForegroundColor Gray
    Write-Host "   (Eliminar después de confirmar que todo funciona)"
    Write-Host ""
}

Write-Host "📖 Documentación completa: DATABASE_ANALYSIS.md" -ForegroundColor Cyan
Write-Host ""
