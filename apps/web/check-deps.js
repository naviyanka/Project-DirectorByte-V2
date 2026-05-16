import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

async function check() {
  console.log('CWD:', process.cwd());
  console.log('Node version:', process.version);
  
  const modules = [
    'vite',
    '@vitejs/plugin-react',
    'path',
    'url'
  ];

  for (const mod of modules) {
    try {
      await import(mod);
      console.log(`✅ ${mod} found`);
    } catch (e) {
      console.log(`❌ ${mod} NOT found: ${e.message}`);
    }
  }

  // Check node_modules
  const nmPath = path.resolve('../../node_modules');
  if (fs.existsSync(nmPath)) {
    console.log('✅ Root node_modules exists');
    const bins = fs.readdirSync(path.join(nmPath, '.bin'));
    console.log('Bins in root:', bins.filter(b => b.includes('vite')));
  } else {
    console.log('❌ Root node_modules NOT found at', nmPath);
  }
}

check();
