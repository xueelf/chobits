import chalk from 'chalk';
import { execSync } from 'node:child_process';

function log(message) {
  const time = chalk.gray(new Date().toLocaleTimeString());
  const prefix = chalk.blue.bold('[build]');

  console.log(`${time} ${prefix} ${message}`);
}

/**
 * @return {import('esbuild').Plugin}
 */
export function tscPlugin() {
  return {
    name: 'tsc',
    setup(build) {
      build.onEnd(result => {
        if (result.errors.length > 0) {
          return;
        }
        execSync('tsc');
        log(`typescript ${chalk.green('.d.ts')} files compiled successfully`);
      });
    },
  };
}
