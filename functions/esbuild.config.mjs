import { build } from 'esbuild';

const entryPoints = ['./src/index.ts'];

await build({
  entryPoints,
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'cjs',
  outfile: 'lib/index.cjs',
  external: ['firebase-admin', 'firebase-functions', '@napi-rs/image'],
  sourcemap: true,
  minify: true,
  keepNames: true,
  metafile: true,
  logLevel: 'info',
  legalComments: 'none',
})
  .then((result) => {
    console.log('Build completed successfully');
    if (result.metafile) {
      console.log('Output files:');
      Object.keys(result.metafile.outputs).forEach((file) => {
        console.log(`  ${file}`);
      });
    }
  })
  .catch(() => process.exit(1));
