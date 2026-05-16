const { build } = require('vite');
const path = require('path');

(async () => {
  try {
    await build({
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      root: __dirname,
    });
  } catch (err) {
    console.error('VITE BUILD FAILED');
    console.error(err);
    if (err.loc) {
      console.error(`Location: ${err.loc.file}:${err.loc.line}:${err.loc.column}`);
    }
    if (err.frame) {
      console.error('Frame:');
      console.error(err.frame);
    }
    process.exit(1);
  }
})();
