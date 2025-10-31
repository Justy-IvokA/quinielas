const fs = require('fs');
const path = require('path');

console.log('🔍 Copiando binarios de Prisma para Vercel...');
console.log('📍 Script ejecutándose desde:', __dirname);

// ======================================
// 1. ENCONTRAR EL SOURCE (donde están los binaries)
// ======================================

// Rutas posibles del source
const possibleSources = [
  path.join(__dirname, '../../../node_modules/.prisma/client'),
  path.join(__dirname, '../../../packages/db/node_modules/@prisma/client'),
  path.join(__dirname, '../../../packages/db/node_modules/.prisma/client'),
];

let sourceFound = null;

console.log('\n🔎 Buscando Prisma Client generado...');

for (const src of possibleSources) {
  const exists = fs.existsSync(src);
  console.log(`   ${exists ? '✅' : '❌'} ${src}`);
  
  if (exists) {
    const files = fs.readdirSync(src);
    const binaries = files.filter(f => f.endsWith('.node') || f.endsWith('.so.node'));
    
    if (binaries.length > 0) {
      sourceFound = src;
      console.log(`   ✅ ¡Encontre! Binarios: ${binaries.join(', ')}`);
      break;
    } else {
      console.log(`   ⚠️  Carpeta existe pero no tiene binarios`);
    }
  }
}

if (!sourceFound) {
  console.error('\n❌ ERROR: No se encontró Prisma Client generado');
  console.error('💡 Solución: Ejecuta "pnpm --filter @qp/db exec prisma generate"');
  console.error('');
  process.exit(1);
}

// ======================================
// 2. DEFINIR TODOS LOS TARGETS (donde copiar)
// ======================================

const baseDir = path.join(__dirname, '..');

// Todas las rutas posibles que Vercel puede usar
const targets = [
  // Next.js server output (build time)
  path.join(baseDir, '.next/server/node_modules/.prisma/client'),
  
  // Next.js standalone (Vercel usa esto en producción)
  path.join(baseDir, '.next/standalone/node_modules/.prisma/client'),
  
  // Ruta específica de la app en standalone
  path.join(baseDir, '.next/standalone/apps/web/node_modules/.prisma/client'),
  
  // Dentro de chunks (donde Next.js a veces busca)
  path.join(baseDir, '.next/server/chunks/node_modules/.prisma/client'),
  
  // Ruta .prisma directa (sin node_modules)
  path.join(baseDir, '.next/server/.prisma/client'),
  path.join(baseDir, '.next/standalone/.prisma/client'),
  
  // ✅ CRÍTICO: Ruta pnpm específica que Vercel busca
  path.join(baseDir, '.next/server/node_modules/.pnpm/@prisma+client@6.18.0_prisma@6.18.0_typescript@5.9.3__typescript@5.9.3/node_modules/.prisma/client'),
  
  // Ruta sin node_modules (Vercel runtime)
  path.join(baseDir, '.next/server/apps/web/.prisma/client'),
  
  // /var/task equivalente (Vercel runtime paths)
  // Estos se crean en build pero pueden no funcionar, pero no hace daño intentar
];

// ======================================
// 3. COPIAR A TODOS LOS TARGETS
// ======================================

console.log('\n📦 Copiando binarios a ubicaciones de Vercel...');

let successCount = 0;
let failCount = 0;

targets.forEach((target, index) => {
  try {
    // Crear directorio (recursivo)
    fs.mkdirSync(target, { recursive: true });
    
    // Copiar todo el contenido recursivamente
    fs.cpSync(sourceFound, target, { 
      recursive: true,
      force: true // Sobrescribir si existe
    });
    
    // Verificar que se copiaron binaries
    const files = fs.readdirSync(target);
    const binaries = files.filter(f => f.endsWith('.node') || f.endsWith('.so.node'));
    
    if (binaries.length > 0) {
      console.log(`✅ [${index + 1}/${targets.length}] ${target}`);
      console.log(`      Binarios: ${binaries.join(', ')}`);
      successCount++;
      
      // Asegurar permisos de ejecución en binarios
      binaries.forEach(binary => {
        const binaryPath = path.join(target, binary);
        try {
          fs.chmodSync(binaryPath, 0o755);
        } catch (e) {
          // Ignorar errores de chmod en Windows
        }
      });
    } else {
      console.log(`⚠️  [${index + 1}/${targets.length}] Copiado pero sin binarios: ${target}`);
    }
  } catch (error) {
    console.log(`❌ [${index + 1}/${targets.length}] Error: ${target}`);
    console.log(`      Razón: ${error.message}`);
    failCount++;
  }
});

// ======================================
// 4. REPORTE FINAL
// ======================================

console.log('\n' + '='.repeat(60));
console.log(`✅ Éxito: ${successCount} ubicaciones`);
console.log(`❌ Fallos: ${failCount} ubicaciones (pueden ser normales)`);
console.log('='.repeat(60));

if (successCount === 0) {
  console.error('\n❌ ERROR: No se pudo copiar a NINGUNA ubicación');
  console.error('Esto causará errores en Vercel');
  process.exit(1);
}

console.log('\n✅ Prisma binarios listos para Vercel deployment');