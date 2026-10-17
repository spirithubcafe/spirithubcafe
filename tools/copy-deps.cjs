// copy-deps.cjs - Install production dependencies in dist folder
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const distPath = path.join(__dirname, '..', 'dist');
const distPackageJson = path.join(distPath, 'package.json');

console.log('📦 Installing production dependencies in dist folder...\n');

// Check if dist folder exists
if (!fs.existsSync(distPath)) {
  console.error('❌ Error: dist folder does not exist. Run "npm run build" first.');
  process.exit(1);
}

// Check if package.json exists in dist
if (!fs.existsSync(distPackageJson)) {
  console.error('❌ Error: package.json not found in dist folder.');
  process.exit(1);
}

try {
  // Install only production dependencies
  console.log('Installing dependencies...');
  execSync('npm install --production --no-package-lock', {
    cwd: distPath,
    stdio: 'inherit'
  });
  
  console.log('\n✅ Dependencies installed successfully!');
  
  // Get size of node_modules
  const nodeModulesPath = path.join(distPath, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    const { execSync: exec } = require('child_process');
    const size = exec(`du -sh "${nodeModulesPath}"`, { encoding: 'utf8' }).split('\t')[0];
    console.log(`📊 node_modules size: ${size}`);
  }
  
  console.log('\n🎉 Ready to upload dist/ folder!');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}
