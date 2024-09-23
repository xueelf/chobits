import { parseArgs } from 'node:util';
import { build, context, type BuildOptions } from 'esbuild';
import { rmPlugin, tscPlugin } from './plugin';

const { values } = parseArgs({
  options: {
    watch: {
      type: 'boolean',
      short: 'w',
      default: false,
    },
  },
});
const options: BuildOptions = {
  bundle: true,
  format: 'esm',
  outdir: 'dist',
  plugins: [rmPlugin(), tscPlugin()],
  entryPoints: ['src/index.ts'],
};

values.watch ? await context(options).then(ctx => ctx.watch()) : await build(options);
