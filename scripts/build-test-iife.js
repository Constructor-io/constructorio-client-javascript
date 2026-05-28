const packageJSON = require('../package.json');

require('esbuild').build({
  entryPoints: ['./src/constructorio.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'ConstructorioClient',
  target: 'es2017',
  platform: 'browser',
  define: {
    process: '{"env":{"BUNDLED":"true"}}',
  },
  outfile: `./dist/test-only/constructorio-client-javascript-${packageJSON.version}.iife.js`,
}).catch(() => process.exit(1));
