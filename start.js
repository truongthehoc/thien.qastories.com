const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('====================================================');
console.log('[ThienVien] Starting Digital Sanctuary Production App');
console.log('Node version:', process.version);
console.log('Working directory:', __dirname);
console.log('====================================================');

// 1. Attempt Prisma generation if schema exists
try {
  const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    console.log('[ThienVien] Attempting Prisma client generation...');
    const prismaCliLocal = path.join(__dirname, 'node_modules', 'prisma', 'build', 'index.js');
    if (fs.existsSync(prismaCliLocal)) {
      execSync(`"${process.execPath}" "${prismaCliLocal}" generate --schema="${schemaPath}"`, {
        stdio: 'inherit',
        cwd: __dirname,
      });
      console.log('[ThienVien] Local Prisma client generated successfully.');
    } else {
      console.log('[ThienVien] Prisma binary not in root node_modules, falling back to safe JSON mirror.');
    }
  }
} catch (err) {
  console.warn('[ThienVien] Prisma generator notice (safe fallback to JSON mirror active):', err.message);
}

// 2. Launch application
console.log('[ThienVien] Launching NestJS backend on port 3005...');
const mainPath = path.join(__dirname, 'backend', 'dist', 'src', 'main.js');
if (fs.existsSync(mainPath)) {
  require(mainPath);
} else {
  console.error('[ThienVien] FATAL: backend/dist/src/main.js not found!');
  process.exit(1);
}
