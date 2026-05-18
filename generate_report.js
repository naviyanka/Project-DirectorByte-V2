const fs = require('fs');
const reportContent = fs.readFileSync('report.md', 'utf8');
console.log(reportContent);
