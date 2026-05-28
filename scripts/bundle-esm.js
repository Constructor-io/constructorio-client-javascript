const packageJSON = require('../package.json');

const banner = `/*!
 *
 * Constructor.io JavaScript Client, version ${packageJSON.version}
 * (c) 2015-${new Date().getFullYear()} Constructor.io
 * ---
 * Constructor Search uses artificial intelligence to provide AI-first search, browse, and recommendations results that increase conversions and revenue.
 * - https://constructor.io
 * - https://github.com/Constructor-io/constructorio-client-javascript
 * ---
 * Includes code from the 'browserify/events' library, licensed under the MIT License.
 * For full license details, see the library documentation.
 *
 */`;

require('esbuild').build({
  entryPoints: ['./src/constructorio.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2017',
  platform: 'browser',
  define: {
    global: 'window',
    process: '{"env":{"BUNDLED":"true"}}',
  },
  banner: { js: banner },
  outfile: `./dist/esm/constructorio-client-javascript-${packageJSON.version}.esm.js`,
}).catch(() => process.exit(1));
