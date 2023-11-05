import log4js, { Level, Logger } from 'log4js';

/** 日志等级 */
export type LogLevel = 'ALL' | 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

const loggerMap: Map<string, Logger> = new Map();

export function createLogger(name: string, level: Level | LogLevel): Logger {
  const logger = log4js.getLogger(`[${name}]`);
  logger.level = level;

  loggerMap.set(name, logger);
  return logger;
}

export function getLogger(name: string): Logger {
  if (!loggerMap.has(name)) {
    throw new Error('No instance of Logger exists');
  }
  return loggerMap.get(name)!;
}
