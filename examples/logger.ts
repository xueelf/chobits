import { inspect } from 'bun';
import { appendFileSync, mkdirSync } from 'node:fs';

import { Journal, LevelDebug } from 'annal';

import type { Logger } from '#/index';

export const journal = new Journal({ level: LevelDebug, scope: 'chobits' });

const logDirectory = new URL('../logs/', import.meta.url);
const logUrl = new URL(`${new Intl.DateTimeFormat('en-CA').format(new Date())}.log`, logDirectory);

mkdirSync(logDirectory, { recursive: true });
journal.info('日志文件', logUrl.pathname);

export const logger: Logger = (...args) => {
  journal.info(...args);
  appendFileSync(
    logUrl,
    `[${new Date().toISOString()}] ${inspect(args, { colors: false, compact: false, depth: Infinity })}\n\n`,
  );
};
