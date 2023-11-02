import { instance } from './index.js';

interface Gateway {
  /** WebSocket 的连接地址。 */
  url: string;
}

/**
 * 获取通用 WSS 接入点。
 */
export function getGateway() {
  return instance.get<Gateway>('/gateway');
}

interface GatewayBot {
  /** WebSocket 的连接地址。 */
  url: string;
  /** 建议的 shard 数。 */
  shards: number;
  /** 创建 Session 限制信息。 */
  session_start_limit: {
    /** 每 24 小时可创建 Session 数。 */
    total: number;
    /** 目前还可以创建的 Session 数。 */
    remaining: number;
    /** 重置计数的剩余时间(ms)。 */
    reset_after: number;
    /** 每 5s 可以创建的 Session 数。 */
    max_concurrency: number;
  };
}

/**
 * 获取带分片 WSS 接入点。
 */
export function getGatewayBot() {
  return instance.get<GatewayBot>('/gateway/bot');
}
