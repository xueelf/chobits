import log4js, { Level } from 'log4js';

export type Logger = log4js.Logger;
export type LogLevel = 'OFF' | 'FATAL' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE' | 'ALL';

const loggerMap: Map<string, Logger> = new Map();

export function createLogger(name: string, level: Level | LogLevel): Logger {
  const logger = log4js.getLogger(`[${name}]`);
  logger.level = level;

  loggerMap.set(name, logger);
  return logger;
}

export function getLogger(name: string): Logger {
  if (!loggerMap.has(name)) {
    throw new Error('No instance of Logger exists.');
  }
  return loggerMap.get(name)!;
}
