import { execSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import chalk from 'chalk';
import { type Plugin, type PluginBuild } from 'esbuild';

function log(message: string): void {
  const time: string = chalk.gray(new Date().toLocaleTimeString('zh-CN'));
  const prefix: string = chalk.blue.bold('[build]');

  console.log(`${time} ${prefix} ${message}`);
}

export function rmPlugin(): Plugin {
  return {
    name: 'rm',
    async setup(): Promise<void> {
      await rm('dist', { recursive: true, force: true });
      log('dist directory removed');
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
        log(`typescript ${chalk.bold.green('.d.ts')} files compiled successfully`);
      });
    },
  };
}
