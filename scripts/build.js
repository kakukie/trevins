const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Build Next.js app
console.log('Building Next.js app...');
try {
  execSync('npx next build', { 
    stdio: 'inherit',
    shell: true
  });
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

console.log('Copying static files to standalone...');
copyDirectory('.next/static', '.next/standalone/.next');

console.log('Copying public files to standalone...');
copyDirectory('public', '.next/standalone');

console.log('Build complete!');