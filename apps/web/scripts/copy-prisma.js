const fs = require('fs');
const path = require('path');

console.log('🔍 Copiando binarios de Prisma...');

// Rutas posibles del source
const possibleSources = [
  path.join(__dirname, '../../node_modules/@prisma/client'),
  path.join(__dirname, '../../packages/db/node_modules/@prisma/client'),
];

// Rutas de destino
const targets = [
  path.join(__dirname, './.next/server'),
  path.join(__dirname, './.next/standalone/node_modules/.prisma/client'),
];

let sourceFound = null;

// Encontrar el source
for (const src of possibleSources) {
  if (fs.existsSync(src)) {
    sourceFound = src;
    console.log('✅ Encontré fuentes de Prisma en:', src);
    break;
  }
}

if (!sourceFound) {
  console.error('❌ No encontré fuentes de Prisma en ninguna de estas ubicaciones:');
  possibleSources.forEach(p => console.error('  -', p));
  process.exit(1);
}

// Copiar a todos los targets
targets.forEach(target => {
  try {
    fs.mkdirSync(target, { recursive: true });
    
    // Copiar todos los archivos
    const files = fs.readdirSync(sourceFound);
    
    files.forEach(file => {
      const srcFile = path.join(sourceFound, file);
      const destFile = path.join(target, file);
      
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
      }
    });
    
    console.log('✅ Copiados fuentes de Prisma a:', target);
    
    // Listar binaries copiados
    const binaries = files.filter(f => f.endsWith('.node') || f.endsWith('.so.node'));
    if (binaries.length > 0) {
      console.log('   Binarios:', binaries.join(', '));
    }
  } catch (error) {
    console.warn('⚠️  No se pudo copiar a:', target, error.message);
  }
});

console.log('✅ Copiado de binarios de Prisma completado');