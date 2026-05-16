const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.css')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
};

const files = getAllFiles('src');
console.log(`Checking ${files.length} CSS files...`);

(async () => {
  for (const file of files) {
    const css = fs.readFileSync(file, 'utf8');
    try {
      await postcss().process(css, { from: file });
    } catch (error) {
      console.error(`Error in ${file}:`);
      console.error(error.message);
      process.exit(1);
    }
  }
  console.log('All CSS files are valid!');
})();
