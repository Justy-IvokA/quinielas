# Script para aplicar migración de campo teléfono
# Fecha: 2025-10-09
# Uso: .\scripts\apply-phone-migration.ps1

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Migración: Add Phone to Registration" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$rootPath = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$rootPath\packages\db\prisma\schema.prisma")) {
    Write-Host "❌ Error: No se encuentra el schema de Prisma" -ForegroundColor Red
    Write-Host "   Ejecuta este script desde la raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Paso 1: Verificando conexión a PostgreSQL..." -ForegroundColor Yellow
Write-Host ""

# Leer variables de entorno
$envFile = "$rootPath\packages\db\prisma\.env"
if (Test-Path $envFile) {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green
    
    # Extraer DATABASE_URL
    $dbUrl = Get-Content $envFile | Where-Object { $_ -match "^DATABASE_URL=" } | ForEach-Object { $_ -replace "DATABASE_URL=", "" } | ForEach-Object { $_.Trim('"') }
    
    if ($dbUrl) {
        Write-Host "   DATABASE_URL configurado" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  No se pudo leer DATABASE_URL del .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Archivo .env no encontrado en packages/db/prisma/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Paso 2: Aplicando migración SQL..." -ForegroundColor Yellow
Write-Host ""

$migrationFile = "$rootPath\packages\db\migrations\add_phone_to_registration.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Error: Archivo de migración no encontrado" -ForegroundColor Red
    Write-Host "   Esperado en: $migrationFile" -ForegroundColor Gray
    exit 1
}

Write-Host "Archivo de migración encontrado:" -ForegroundColor Gray
Write-Host "  $migrationFile" -ForegroundColor Gray
Write-Host ""

# Mostrar contenido de la migración
Write-Host "Contenido de la migración:" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray
Get-Content $migrationFile | Write-Host -ForegroundColor White
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Preguntar confirmación
$confirmation = Read-Host "¿Deseas aplicar esta migración? (S/N)"
if ($confirmation -ne "S" -and $confirmation -ne "s") {
    Write-Host "❌ Migración cancelada por el usuario" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Opciones para aplicar la migración:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Aplicar con psql (requiere PostgreSQL CLI instalado)" -ForegroundColor White
Write-Host "2. Copiar SQL al portapapeles para ejecutar manualmente" -ForegroundColor White
Write-Host "3. Mostrar instrucciones detalladas" -ForegroundColor White
Write-Host "4. Cancelar" -ForegroundColor White
Write-Host ""

$option = Read-Host "Selecciona una opción (1-4)"

switch ($option) {
    "1" {
        Write-Host ""
        Write-Host "Ingresa los datos de conexión:" -ForegroundColor Yellow
        $dbHost = Read-Host "Host (default: localhost)"
        if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }
        
        $dbPort = Read-Host "Puerto (default: 5432)"
        if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "5432" }
        
        $dbName = Read-Host "Base de datos (default: quinielas)"
        if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "quinielas" }
        
        $dbUser = Read-Host "Usuario (default: postgres)"
        if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }
        
        Write-Host ""
        Write-Host "Ejecutando migración..." -ForegroundColor Yellow
        
        $env:PGPASSWORD = Read-Host "Password" -AsSecureString | ConvertFrom-SecureString -AsPlainText
        
        try {
            psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $migrationFile
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✅ Migración aplicada exitosamente!" -ForegroundColor Green
            } else {
                Write-Host ""
                Write-Host "❌ Error al aplicar migración" -ForegroundColor Red
                Write-Host "   Código de salida: $LASTEXITCODE" -ForegroundColor Gray
            }
        } catch {
            Write-Host ""
            Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
            Write-Host "💡 Asegúrate de tener psql instalado y en el PATH" -ForegroundColor Yellow
            Write-Host "   O usa la opción 2 para copiar el SQL manualmente" -ForegroundColor Yellow
        }
    }
    
    "2" {
        $sql = Get-Content $migrationFile -Raw
        Set-Clipboard -Value $sql
        Write-Host ""
        Write-Host "✅ SQL copiado al portapapeles!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Ahora puedes:" -ForegroundColor Cyan
        Write-Host "1. Abrir tu cliente SQL favorito (DBeaver, pgAdmin, etc.)" -ForegroundColor White
        Write-Host "2. Conectar a la base de datos 'quinielas'" -ForegroundColor White
        Write-Host "3. Pegar (Ctrl+V) y ejecutar el SQL" -ForegroundColor White
    }
    
    "3" {
        Write-Host ""
        Write-Host "📖 Instrucciones detalladas:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Ver el archivo: MIGRATION_INSTRUCTIONS.md" -ForegroundColor White
        Write-Host ""
        Start-Process "$rootPath\MIGRATION_INSTRUCTIONS.md"
    }
    
    default {
        Write-Host ""
        Write-Host "❌ Operación cancelada" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "📋 Paso 3: Regenerando cliente Prisma..." -ForegroundColor Yellow
Write-Host ""

$regenerate = Read-Host "¿Deseas regenerar el cliente Prisma ahora? (S/N)"
if ($regenerate -eq "S" -or $regenerate -eq "s") {
    Write-Host ""
    Write-Host "Deteniendo procesos de Node.js..." -ForegroundColor Yellow
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    
    Write-Host "Ejecutando prisma generate..." -ForegroundColor Yellow
    Set-Location "$rootPath\packages\db"
    
    try {
        pnpm prisma generate
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Cliente Prisma regenerado exitosamente!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "⚠️  Hubo un problema al regenerar el cliente" -ForegroundColor Yellow
            Write-Host "   Intenta ejecutar manualmente:" -ForegroundColor Gray
            Write-Host "   cd packages/db && pnpm prisma generate" -ForegroundColor Gray
        }
    } catch {
        Write-Host ""
        Write-Host "⚠️  Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   Intenta ejecutar manualmente:" -ForegroundColor Gray
        Write-Host "   cd packages/db && pnpm prisma generate" -ForegroundColor Gray
    }
    
    Set-Location $rootPath
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Migración completada" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Verificar que la migración se aplicó correctamente" -ForegroundColor White
Write-Host "2. Ejecutar tests manuales de los formularios de registro" -ForegroundColor White
Write-Host "3. Rebuild del proyecto: pnpm turbo build" -ForegroundColor White
Write-Host ""
Write-Host "Ver instrucciones completas en: MIGRATION_INSTRUCTIONS.md" -ForegroundColor Gray
Write-Host ""
