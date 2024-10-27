import { execSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { type Plugin, type PluginBuild } from 'esbuild';
import { Logger, colorful } from 'nebia';

const logger = new Logger({
  name: 'build',
});

export function rmPlugin(): Plugin {
  return {
    name: 'rm',
    async setup(): Promise<void> {
      await rm('dist', { recursive: true, force: true });
      logger.info('dist directory removed');
    },
  };
}

export function tscPlugin(): Plugin {
  return {
    name: 'tsc',
    setup(build: PluginBuild): void {
      build.onEnd(result => {
        if (result.errors.length > 0) {
          return;
        }
        execSync('tsc');
        logger.info(`typescript ${colorful('.d.ts', 'blue')} files compiled successfully`);
      });
    },
  };
}
