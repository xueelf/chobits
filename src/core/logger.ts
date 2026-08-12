/** 日志分类。 */
export type LogKind = 'auth' | 'openapi' | 'websocket' | 'webhook' | 'dispatch';

/**
 * 接收运行日志。
 *
 * @param kind 日志分类。
 * @param message 日志内容。
 * @param data 与当前操作相关的数据，部分日志没有相关数据时为 `undefined`。
 */
export type Logger = (kind: LogKind, message: string, data?: Readonly<Record<string, unknown>>) => void;
