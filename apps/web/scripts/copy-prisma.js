const fs = require('fs');
const path = require('path');

console.log('🔍 Copiando binarios de Prisma...');

// Rutas posibles del source
const possibleSources = [
  path.join(__dirname, '../../../node_modules/.prisma/client'),
  path.join(__dirname, '../../../packages/db/node_modules/@prisma/client'),
  path.join(__dirname, '../../../packages/db/node_modules/.prisma/client'),
];

let sourceFound = null;

// Encontrar el source
for (const src of possibleSources) {
  console.log(`🔎 Buscando en: ${src}`);
  
  if (fs.existsSync(src)) {
    const files = fs.readdirSync(src);
    const binaries = files.filter(f => f.endsWith('.node') || f.endsWith('.so.node'));
    
    if (binaries.length > 0) {
      sourceFound = src;
      console.log(`✅ ¡Encontre! Binarios: ${binaries.join(', ')}`);
      break;
    } else {
      console.log(`⚠️  Existe pero no tiene binarios`);
    }
  } else {
    console.log(`❌ No existe`);
  }
}

if (!sourceFound) {
  console.error('\n❌ ERROR: No se encontró Prisma Client generado');
  console.error('💡 Solución: Ejecuta "pnpm --filter @qp/db exec prisma generate"');
  console.error('');
  process.exit(1);
}

// Targets en Next.js output
const targets = [
  path.join(__dirname, '../.next/server/node_modules/.prisma/client'),
  path.join(__dirname, '../.next/standalone/node_modules/.prisma/client'),
];

let copiedCount = 0;

// Copiar a todos los targets
targets.forEach(target => {
  try {
    fs.mkdirSync(target, { recursive: true });
    
    // Copiar recursivamente
    fs.cpSync(sourceFound, target, { recursive: true });
    
    // Verificar binaries copiados
    const files = fs.readdirSync(target);
    const binaries = files.filter(f => f.endsWith('.node') || f.endsWith('.so.node'));
    
    if (binaries.length > 0) {
      console.log(`✅ Copiado a: ${target}`);
      console.log(`   Binaries: ${binaries.join(', ')}`);
      copiedCount++;
    }
  } catch (error) {
    console.warn(`⚠️  Error copiando a ${target}: ${error.message}`);
  }
});

if (copiedCount === 0) {
  console.error('❌ No se pudo copiar a ningún destino');
  process.exit(1);
}

console.log(`\n✅ ¡Éxito! Binarios copiados a ${copiedCount} ubicación(es)`);