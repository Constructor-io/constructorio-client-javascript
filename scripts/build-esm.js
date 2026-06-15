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
  outfile: './lib/esm/constructorio.js',
}).catch(() => process.exit(1));
