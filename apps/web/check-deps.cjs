const fs = require('fs');
const path = require('path');

console.log('CWD:', process.cwd());

const isRoot = fs.existsSync(path.resolve('apps/web'));
const rootDir = isRoot ? process.cwd() : path.resolve('../../');
console.log('Root Dir:', rootDir);

function findModule(moduleName, startDir) {
  let currentDir = startDir;
  while (currentDir !== path.dirname(currentDir)) {
    const modulePath = path.join(currentDir, 'node_modules', moduleName);
    if (fs.existsSync(modulePath)) {
      return modulePath;
    }
    currentDir = path.dirname(currentDir);
  }
  return null;
}

const modulesToCheck = ['vite', '@vitejs/plugin-react', 'react', 'react-dom'];

modulesToCheck.forEach(mod => {
  const p = findModule(mod, process.cwd());
  if (p) {
    console.log(`✅ ${mod} found at: ${p}`);
  } else {
    console.log(`❌ ${mod} NOT found in any node_modules up to root`);
  }
});

// Also check specifically in apps/web/node_modules
const webNodeModules = path.join(rootDir, 'apps/web/node_modules');
if (fs.existsSync(webNodeModules)) {
  console.log('Contents of apps/web/node_modules/@vitejs:', 
    fs.existsSync(path.join(webNodeModules, '@vitejs')) ? fs.readdirSync(path.join(webNodeModules, '@vitejs')) : 'NOT FOUND'
  );
} else {
  console.log('❌ apps/web/node_modules NOT found');
}
