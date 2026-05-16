const fs = require('fs');
const path = require('path');

console.log('CWD:', process.cwd());
console.log('Node version:', process.version);

// Check if vite exists
const vitePath = path.resolve('../../node_modules/.bin/vite');
if (fs.existsSync(vitePath)) {
  console.log('✅ Vite binary found at:', vitePath);
} else {
  console.log('❌ Vite binary NOT found at:', vitePath);
  // List what is in .bin
  const binDir = path.resolve('../../node_modules/.bin');
  if (fs.existsSync(binDir)) {
    console.log('Contents of .bin:', fs.readdirSync(binDir));
  } else {
    console.log('❌ .bin directory NOT found at:', binDir);
  }
}

// Check if plugin-react exists
const reactPath = path.resolve('../../node_modules/@vitejs/plugin-react');
if (fs.existsSync(reactPath)) {
  console.log('✅ @vitejs/plugin-react found at:', reactPath);
} else {
  console.log('❌ @vitejs/plugin-react NOT found at:', reactPath);
}
