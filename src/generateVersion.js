const { writeFileSync } = require('fs');
const { version } = require('../package.json');

const content = `export default '${version}';\n`;
writeFileSync('./src/version.js', content);
