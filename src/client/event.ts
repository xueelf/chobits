export interface ReadyEvent {
  version: number;
  session_id: string;
  user: {
    id: string;
    username: string;
    bot: boolean;
    status: number;
  };
  shard: number[];
}

export interface MessageCreateEvent {
  author: {
    avatar: string;
    bot: boolean;
    id: string;
    username: string;
  };
  channel_id: string;
  content: string;
  guild_id: string;
  id: string;
  member: {
    joined_at: string;
    nick: string;
    roles: string[];
  };
  seq: number;
  seq_in_channel: string;
  timestamp: string;
}

export interface EventMap<T = any> {
  CLOSED: (this: T, event: unknown) => void;
  /** 可以通信 */
  READY: (this: T, event: ReadyEvent) => void;
  /** 会话错误 */
  ERROR: (this: T, event: unknown) => void;
  INVALID_SESSION: (this: T, event: unknown) => void;
  /** 服务端通知重新连接 */
  RECONNECT: (this: T, event: unknown) => void;
  /** 断线 */
  DISCONNECT: (this: T, event: unknown) => void;
  /** 内部通信 */
  EVENT_WS: (this: T, event: unknown) => void;
  /** 重连 */
  RESUMED: (this: T, event: unknown) => void;
  /** 连接已寄，请检查网络或重启 */
  DEAD: (this: T, event: unknown) => void;

  // TODO: ／人◕ ‿‿ ◕人＼ 事件补全
  MESSAGE_CREATE: (this: T, event: MessageCreateEvent) => void;
}

/** 事件类型 */
export type EventType = keyof EventMap;
