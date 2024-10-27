import { Result, type TotteInstance } from 'totte';

export interface Gateway {
  /** 用于连接 `WebSocket` 的地址。 */
  url: string;
}

export interface SessionStartLimit {
  /** 每 24 小时可创建 Session 数。 */
  total: number;
  /** 目前还可以创建的 Session 数。 */
  remaining: number;
  /** 重置计数的剩余时间（ms）。 */
  reset_after: number;
  /** 每 5s 可以创建的 Session 数。 */
  max_concurrency: number;
}

export interface GatewayBot {
  /** `WebSocket` 的连接地址。 */
  url: string;
  /** 建议的 shard 数。 */
  shards: number;
  /** 创建 Session 限制信息。 */
  session_start_limit: SessionStartLimit;
}

export default (request: TotteInstance) => {
  return {
    /**
     * 用于获取 WSS 接入地址，通过该地址可建立 `WebSocket` 长连接。
     */
    getGateway(): Promise<Result<Gateway>> {
      return request.get('/gateway');
    },

    /**
     * 用于获取 WSS 接入地址及相关信息，通过该地址可建立 `WebSocket` 长连接。
     * 相关信息包括：
     * - 建议的分片数。
     * - 目前连接数使用情况。
     */
    getGatewayBot(): Promise<Result<GatewayBot>> {
      return request.get('/gateway/bot');
    },
  };
};
