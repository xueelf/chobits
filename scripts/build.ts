import { $, build, file, Glob } from 'bun';
import { rm } from 'node:fs/promises';

import { Journal, LevelDebug } from 'annal';

import { compilerOptions } from '~/tsconfig.json';

const logger = new Journal({ scope: 'build', level: LevelDebug });

await rm(compilerOptions.outDir, { recursive: true, force: true });
logger.info('Output directory cleaned');

await $`tsc -p tsconfig.build.json`;
logger.info('Type declaration files generated');
await build({
  entrypoints: ['src/index.ts'],
  format: 'esm',
  outdir: compilerOptions.outDir,
  packages: 'external',
  target: 'browser',
});
logger.info('JavaScript bundle generated');

const outputPaths = await Array.fromAsync(
  new Glob('**/*').scan({
    absolute: true,
    cwd: compilerOptions.outDir,
  }),
);
const outputBytes = outputPaths.reduce((bytes, path) => bytes + file(path).size, 0);
const outputSize = `${(outputBytes / 1000).toFixed(2)} KB`;

logger.info('Build completed');
logger.debug(`Output: ${compilerOptions.outDir}`);
logger.debug(`Artifacts: ${outputPaths.length} files, ${outputSize}`);
