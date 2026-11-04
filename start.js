const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('[ThienVien] Initializing Digital Sanctuary Server...');

// 1. Ensure Prisma client is generated
try {
  const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    console.log('[ThienVien] Generating Prisma client...');
    execSync(`npx --yes prisma@5.22.0 generate --schema="${schemaPath}"`, {
      stdio: 'inherit',
      cwd: __dirname,
    });
    console.log('[ThienVien] Prisma client generated successfully.');
  }
} catch (err) {
  console.warn('[ThienVien] Prisma generation notice (fallback to JSON mirror):', err.message);
}

// 2. Launch production server
console.log('[ThienVien] Starting NestJS production application...');
const mainPath = path.join(__dirname, 'backend', 'dist', 'src', 'main.js');
if (fs.existsSync(mainPath)) {
  require(mainPath);
} else {
  console.error('[ThienVien] ERROR: backend/dist/src/main.js not found!');
  process.exit(1);
}
