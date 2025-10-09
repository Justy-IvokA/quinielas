#!/bin/bash

# Script de migración seguro para alineación Prisma ↔ tRPC
# Uso: ./scripts/migrate-schema.sh [dev|staging|production]

set -e  # Exit on error

ENVIRONMENT=${1:-dev}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${ENVIRONMENT}_${TIMESTAMP}.sql"

echo "🚀 Iniciando migración de schema..."
echo "📍 Ambiente: $ENVIRONMENT"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función de error
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

# Función de advertencia
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Función de éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error_exit "Debes ejecutar este script desde la raíz del proyecto"
fi

# 2. Verificar que existe la variable DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    error_exit "DATABASE_URL no está definida. Cargar desde .env primero"
fi

echo "📊 Base de datos: $(echo $DATABASE_URL | sed -E 's/(.*:\/\/)(.*)(@.*)/\1***\3/')"
echo ""

# 3. Confirmar acción en producción
if [ "$ENVIRONMENT" = "production" ]; then
    warning "ESTÁS A PUNTO DE MODIFICAR LA BASE DE DATOS DE PRODUCCIÓN"
    read -p "¿Estás seguro? Escribe 'CONFIRMO' para continuar: " confirmation
    
    if [ "$confirmation" != "CONFIRMO" ]; then
        echo "Migración cancelada."
        exit 0
    fi
fi

# 4. Crear backup (solo si pg_dump está disponible)
if command -v pg_dump &> /dev/null; then
    echo "📦 Creando backup..."
    pg_dump $DATABASE_URL > "$BACKUP_FILE" 2>/dev/null || warning "No se pudo crear backup automático"
    if [ -f "$BACKUP_FILE" ]; then
        success "Backup creado: $BACKUP_FILE"
    fi
else
    warning "pg_dump no disponible. Asegúrate de tener un backup manual."
fi

echo ""

# 5. Ir al directorio de Prisma
cd packages/db

# 6. Ejecutar migración según ambiente
if [ "$ENVIRONMENT" = "dev" ]; then
    echo "🔧 Ejecutando migración en modo desarrollo..."
    pnpm prisma migrate dev --name align_schema_with_trpc || error_exit "Migración falló"
else
    echo "🔧 Ejecutando migración en modo deploy..."
    pnpm prisma migrate deploy || error_exit "Migración falló"
fi

success "Migración aplicada"

# 7. Generar cliente Prisma
echo ""
echo "🔄 Regenerando cliente Prisma..."
pnpm prisma generate || error_exit "Generación de cliente falló"
success "Cliente Prisma generado"

# 8. Regresar a root
cd ../..

# 9. Ejecutar validación
echo ""
echo "🧪 Validando schema..."
if [ -f "scripts/validate-schema.ts" ]; then
    pnpm tsx scripts/validate-schema.ts || warning "Validación falló - revisar manualmente"
else
    warning "Script de validación no encontrado"
fi

# 10. Ejecutar tests (solo en dev)
if [ "$ENVIRONMENT" = "dev" ]; then
    echo ""
    echo "🧪 Ejecutando tests..."
    pnpm turbo test --filter=@qp/api || warning "Tests fallaron - revisar antes de deploy"
fi

# 11. Build para verificar tipos
echo ""
echo "🏗️  Verificando build..."
pnpm turbo build --filter=@qp/api || error_exit "Build falló - hay errores de tipos"
success "Build exitoso"

# 12. Resumen final
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "MIGRACIÓN COMPLETADA EXITOSAMENTE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Revisar logs de migración en packages/db/prisma/migrations/"
echo "   2. Verificar que las apps funcionan correctamente"
echo "   3. Hacer commit de los cambios generados por Prisma"
echo ""

if [ -f "$BACKUP_FILE" ]; then
    echo "💾 Backup guardado en: $BACKUP_FILE"
    echo "   (Eliminar después de confirmar que todo funciona)"
    echo ""
fi

echo "📖 Documentación completa: DATABASE_ANALYSIS.md"
echo ""
