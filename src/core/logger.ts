import { deepClone } from '#/utils/object';

/** 日志分类。 */
export type LogKind = 'auth' | 'openapi' | 'websocket' | 'webhook' | 'dispatch';

/**
 * 接收运行日志。
 *
 * @param kind 日志分类。
 * @param message 日志内容。
 * @param data 与当前操作相关的数据副本，部分日志没有相关数据时为 `undefined`。
 */
export type Logger = (kind: LogKind, message: string, data?: object) => void;

/** 包装日志回调，并深拷贝日志数据。 */
export const wrapLogger = (logger?: Logger): Logger | undefined => {
  if (!logger) {
    return;
  }
  return (kind, message, data) => {
    if (data === undefined) {
      logger(kind, message);
    } else {
      logger(kind, message, deepClone(data));
    }
  };
};
