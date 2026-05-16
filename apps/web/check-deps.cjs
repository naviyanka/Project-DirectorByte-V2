const fs = require('fs');
const path = require('path');

console.log('CWD:', process.cwd());
console.log('Node version:', process.version);

// Detect if we are at root or in apps/web
const isRoot = fs.existsSync(path.resolve('apps/web'));
const rootDir = isRoot ? process.cwd() : path.resolve('../../');

console.log('Detected Root Dir:', rootDir);

// Check if vite exists
const vitePath = path.join(rootDir, 'node_modules/.bin/vite');
if (fs.existsSync(vitePath)) {
  console.log('✅ Vite binary found at:', vitePath);
} else {
  console.log('❌ Vite binary NOT found at:', vitePath);
  // List what is in .bin
  const binDir = path.join(rootDir, 'node_modules/.bin');
  if (fs.existsSync(binDir)) {
    console.log('Contents of .bin:', fs.readdirSync(binDir).filter(f => f.includes('vite')));
  } else {
    console.log('❌ .bin directory NOT found at:', binDir);
  }
}

// Check if plugin-react exists
const reactPath = path.join(rootDir, 'node_modules/@vitejs/plugin-react');
if (fs.existsSync(reactPath)) {
  console.log('✅ @vitejs/plugin-react found at:', reactPath);
} else {
  console.log('❌ @vitejs/plugin-react NOT found at:', reactPath);
}
