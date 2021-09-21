const packageJSON = require('./package.json');
const banner = `/*!
 *
 * Constructor.io JavaScript Client, version ${packageJSON.version}
 * (c) 2015-${new Date().getFullYear()} Constructor.io
 * ---
 * Constructor Search uses artificial intelligence to provide AI-first search, browse, and recommendations results that increase conversions and revenue.
 * - https://constructor.io
 * - https://github.com/Constructor-io/constructorio-client-javascript
 *
 */`;

require('esbuild').build({
  entryPoints: ['./lib/constructorio.js'],
  bundle: true,
  minify: true,
  define: {
    "process.env": "{'BUNDLED':'true'}"
  },
  banner: { js: banner },
  outfile: `./dist/constructorio-client-javascript-${packageJSON.version}.js`,
}).catch(() => process.exit(1));
