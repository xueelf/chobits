import { deepClone } from '#/utils/object';

/** 日志分类。 */
export type LogKind = 'auth' | 'openapi' | 'websocket' | 'webhook' | 'dispatch';

/**
 * 同步接收运行日志。
 *
 * SDK 不等待回调中的异步任务完成。
 *
 * @param kind - 日志分类。
 * @param message - 日志内容。
 * @param data - 当前操作的数据副本，没有相关数据时为 `undefined`。
 */
export type Logger = (kind: LogKind, message: string, data?: object) => void;

/** 深拷贝日志数据，避免日志回调修改 SDK 使用的对象。 */
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
