import type { Request, Result } from '@/utils';

export interface Gateway {
  /** 用于连接 `websocket` 的地址。 */
  url: string;
}

interface SessionStartLimit {
  /** 每 24 小时可创建 Session 数。 */
  total: number;
  /** 目前还可以创建的 Session 数。 */
  remaining: number;
  /** 重置计数的剩余时间(ms)。 */
  reset_after: number;
  /** 每 5s 可以创建的 Session 数。 */
  max_concurrency: number;
}

export interface GatewayBot {
  /** WebSocket 的连接地址。 */
  url: string;
  /** 建议的 shard 数。 */
  shards: number;
  /** 创建 Session 限制信息。 */
  session_start_limit: SessionStartLimit;
}

export default (request: Request) => {
  return {
    /**
     * 获取通用 WSS 接入点。
     */
    getGateway(): Promise<Result<Gateway>> {
      return request.get<Gateway>('/gateway');
    },

    /**
     * 获取带分片 WSS 接入点。
     */
    getGatewayBot(): Promise<Result<GatewayBot>> {
      return request.get<GatewayBot>('/gateway/bot');
    },
  };
};
