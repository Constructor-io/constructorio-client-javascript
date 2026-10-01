require('esbuild').build({
  entryPoints: ['./src/constructorio.js'],
  bundle: true,
  format: 'esm',
  target: 'es2017',
  platform: 'browser',
  sourcemap: true,
  define: {
    global: 'window',
  },
  // .mjs so Node classifies this as ESM without `"type": "module"`, which would
  // reclassify every .js in the package and break CJS consumers.
  outfile: './lib/esm/constructorio.mjs',
}).catch(() => process.exit(1));
