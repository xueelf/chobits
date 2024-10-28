import { EventEmitter } from 'node:events';
import { scheduler } from 'node:timers/promises';
import { Client } from './client';

export enum OpCode {
  /** 服务端进行消息推送 */
  Dispatch = 0,
  /** 客户端或服务端发送心跳 */
  Heartbeat = 1,
  /** 客户端发送鉴权 */
  Identify = 2,
  /** 客户端恢复连接 */
  Resume = 6,
  /** 服务端通知客户端重新连接 */
  Reconnect = 7,
  /** 当 Identify 或 Resume 的时候，如果参数有错，服务端会返回该消息 */
  InvalidSession = 9,
  /** 当客户端与网关建立 ws 连接之后，网关下发的第一条消息 */
  Hello = 10,
  /** 当发送心跳成功之后，就会收到该消息 */
  HeartbeatAck = 11,
  /** 仅用于 http 回调模式的回包，代表机器人收到了平台推送的数据 */
  HttpCallbackAck = 12,
}

/** 事件类型 */
export enum Intent {
  /** 频道 */
  GUILDS = 1 << 0,
  /** 频道成员 */
  GUILD_MEMBERS = 1 << 1,
  /** 频道消息（私域） */
  GUILD_MESSAGES = 1 << 9,
  /** 频道消息贴表情 */
  GUILD_MESSAGE_REACTIONS = 1 << 10,
  /** 频道私信消息 */
  DIRECT_MESSAGE = 1 << 12,
  /** 群聊 & 私聊 */
  GROUP_AND_C2C_EVENT = 1 << 25,
  /** 卡片消息互动 */
  INTERACTION = 1 << 26,
  /** 频道消息审核 */
  MESSAGE_AUDIT = 1 << 27,
  /** 频道论坛 */
  FORUMS_EVENT = 1 << 28,
  /** 频道音频 */
  AUDIO_ACTION = 1 << 29,
  /** 频道消息（公域） */
  PUBLIC_GUILD_MESSAGES = 1 << 30,
}

/** 消息推送 */
export interface IDispatchPayload {
  op: OpCode.Dispatch;
  /** 类型 */
  t: string;
  /** 序列号 */
  s: number;
  /** 数据 */
  d: unknown;
}

/** 消息推送类型 */
export enum DispatchType {
  Ready = 'READY',
  Resumed = 'RESUMED',
}

export interface ReadyData {
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

export interface ReadyDispatchPayload extends IDispatchPayload {
  t: DispatchType.Ready;
  d: ReadyData;
}

// 为什么 tx 这里要固定返回空字符串？→_→
export type ResumedData = '';

export interface ResumedDispatchPayload extends IDispatchPayload {
  t: DispatchType.Resumed;
  d: ResumedData;
}

export interface GroupOpData {
  /** 操作的时间戳 */
  timestamp: number;
  /** 操作群的群 openid */
  group_openid: string;
  /** 操作群成员的 openid */
  op_member_openid: string;
}

/** 机器人加入群聊 */
export interface GroupAddRobotDispatchPayload extends IDispatchPayload {
  t: 'GROUP_ADD_ROBOT';
  id: string;
  d: GroupOpData;
}

/** 机器人退出群聊 */
export interface GroupDelRobotDispatchPayload extends IDispatchPayload {
  t: 'GROUP_DEL_ROBOT';
  id: string;
  d: GroupOpData;
}

export type GroupRobotDispatchPayload = GroupAddRobotDispatchPayload | GroupDelRobotDispatchPayload;

/** 群聊拒绝机器人主动消息 */
export interface GroupMsgRejectDispatchPayload extends IDispatchPayload {
  t: 'GROUP_MSG_REJECT';
  id: string;
  d: GroupOpData;
}

/** 群聊接受机器人主动消息 */
export interface GroupMsgReceiveDispatchPayload extends IDispatchPayload {
  t: 'GROUP_MSG_RECEIVE';
  id: string;
  d: GroupOpData;
}

export type GroupMsgDispatchPayload =
  | GroupMsgRejectDispatchPayload
  | GroupMsgReceiveDispatchPayload;

export interface C2COpData {
  /** 操作时间戳 */
  timestamp: number;
  /** 用户 openid */
  openid: string;
}

/** 用户添加机器人 */
export interface FriendAddDispatchPayload extends IDispatchPayload {
  t: 'FRIEND_ADD';
  id: string;
  d: C2COpData;
}

/** 用户删除机器人 */
export interface FriendDelDispatchPayload extends IDispatchPayload {
  t: 'FRIEND_DEL';
  id: string;
  d: C2COpData;
}

export type FriendDispatchPayload = FriendAddDispatchPayload | FriendDelDispatchPayload;

/** 拒绝机器人主动消息 */
export interface C2CMsgRejectDispatchPayload extends IDispatchPayload {
  t: 'C2C_MSG_REJECT';
  id: string;
  d: C2COpData;
}

/** 接受机器人主动消息 */
export interface C2CMsgReceiveDispatchPayload extends IDispatchPayload {
  t: 'C2C_MSG_RECEIVE';
  id: string;
  d: C2COpData;
}

export type C2CMsgDispatchPayload = C2CMsgRejectDispatchPayload | C2CMsgReceiveDispatchPayload;

export interface GroupMessageData {
  author: {
    id: string;
    member_openid: string;
    union_openid: string;
  };
  content: string;
  group_id: string;
  group_openid: string;
  id: string;
  timestamp: string;
}

/** 群 @ */
export interface GroupAtMessageDispatchPayload extends IDispatchPayload {
  t: 'GROUP_AT_MESSAGE_CREATE';
  id: string;
  d: GroupMessageData;
}

export interface C2CMessageData {
  author: {
    id: string;
    union_openid: string;
    user_openid: string;
  };
  content: string;
  id: string;
  timestamp: string;
}

/** 私聊 */
export interface C2CMessageDispatchPayload extends IDispatchPayload {
  t: 'C2C_MESSAGE_CREATE';
  id: string;
  d: C2CMessageData;
}

export type MessageDispatchPayload = GroupAtMessageDispatchPayload | C2CMessageDispatchPayload;

/** 消息推送 */
export type DispatchPayload =
  | ReadyDispatchPayload
  | ResumedDispatchPayload
  | GroupRobotDispatchPayload
  | GroupMsgDispatchPayload
  | FriendDispatchPayload
  | C2CMsgDispatchPayload
  | MessageDispatchPayload;

/** 心跳 */
export interface HeartbeatPayload {
  op: OpCode.Heartbeat;
  /** 客户端收到的最新的消息的 s，如果是首次连接，值为 `null` */
  d: number | null;
}

/** 鉴权 */
export interface IdentifyPayload {
  op: OpCode.Identify;
  d: {
    token: string;
    intents: number;
    shard?: number[];
    /**
     * @deprecated 据 {@link https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html | 官方文档} 描述，该参数可留空，但实际作用未知。
     */
    properties?: Record<string, unknown>;
  };
}

/** 恢复连接 */
export interface ResumePayload {
  op: OpCode.Resume;
  d: {
    seq: number | null;
    session_id: string | null;
    token: string;
  };
}

/** 等待重连 */
export interface ReconnectPayload {
  op: OpCode.Reconnect;
}

/** 参数错误 */
export interface InvalidSessionPayload {
  op: OpCode.InvalidSession;
  d: boolean;
}

/** 首次连接 */
export interface HelloPayload {
  op: OpCode.Hello;
  d: {
    heartbeat_interval: number;
  };
}

/** 心跳回包 */
export interface HeartbeatAckPayload {
  op: OpCode.HeartbeatAck;
}

export type Payload =
  | DispatchPayload
  | HeartbeatPayload
  | IdentifyPayload
  | ResumePayload
  | ReconnectPayload
  | InvalidSessionPayload
  | HelloPayload
  | HeartbeatAckPayload;

export type IntentEvent = keyof typeof Intent;

export interface SessionEventMap {
  dispatch: [DispatchPayload];
}

export class Session extends EventEmitter<SessionEventMap> {
  private ackTimeout?: NodeJS.Timeout;
  /** 心跳间隔 */
  private heartbeat_interval?: number;
  /** 消息序列号 */
  private seq: number | null;
  /** 会话 id */
  private session_id: string | null;
  private ws: WebSocket | null;

  constructor(private client: Client) {
    super();

    this.seq = null;
    this.session_id = null;
    this.ws = null;
  }

  private onClose(event: CloseEvent): void {
    clearTimeout(this.ackTimeout);
    const { code } = event;

    this.client.logger.debug('Session Exit Code: %d', code);
    this.client.logger.debug('Session Disconnected');

    const codes: number[] = [1006, 4009];
    const isPassive: boolean = codes.includes(code);
    const notReconnect: boolean = code !== 4009;

    if (notReconnect) {
      this.client.logger.error('会话已断开已断开');
    }
    this.ws = null;

    isPassive && this.reconnect(notReconnect);
  }

  private onOpen(): void {
    this.client.logger.debug('Session Connected');
  }

  private onError(event: Event): void {
    this.client.logger.error('Session Error: %s', event);
  }

  private onMessage(event: MessageEvent): void {
    const { data } = event;
    const payload: Payload = JSON.parse(data);

    if (payload.op === OpCode.HeartbeatAck) {
      this.client.logger.trace('Heartbeat Pong: %O', payload);
    } else {
      this.client.logger.debug('Session Receive: %s', OpCode[payload.op]);
      this.client.logger.trace('Session Response: %O', payload);
    }

    switch (payload.op) {
      case OpCode.Dispatch:
        this.onDispatch(payload);
        break;
      case OpCode.Reconnect:
        this.client.logger.debug('当前会话已失效，等待断开后自动重连');
        this.disconnect();
        break;
      case OpCode.InvalidSession:
        this.client.logger.error('发送的 payload 参数有误');
        break;
      case OpCode.Hello:
        this.heartbeat_interval = payload.d.heartbeat_interval;
        this.session_id ? this.sendResumePayload() : this.sendAuthPayload();
        break;
      case OpCode.HeartbeatAck:
        this.sendHeartbeatPayload();
        break;
    }
  }

  private onDispatch(payload: DispatchPayload): void {
    const { d, s, t } = payload;

    switch (t) {
      case DispatchType.Ready:
        const { session_id, user } = d;

        this.session_id = session_id;
        this.client.username = user.username;
        this.client.logger.info('Welcome, %s', user.username);
        this.sendHeartbeatPayload();
        break;
      case DispatchType.Resumed:
        this.client.logger.debug('Session Resumed');
        this.client.logger.info('Welcome back, %s', this.client.username);
        this.sendHeartbeatPayload();
        break;
    }
    this.seq = s;
    this.emit('dispatch', payload);
  }

  private sendHeartbeatPayload(): void {
    this.ackTimeout = setTimeout(() => {
      const payload: HeartbeatPayload = {
        op: OpCode.Heartbeat,
        d: this.seq,
      };
      this.sendPayload(payload);
    }, this.heartbeat_interval);
  }

  private sendPayload(payload: Payload): void {
    if (payload.op === OpCode.Heartbeat) {
      this.client.logger.trace('Heartbeat Ping: %O', payload);
    } else {
      this.client.logger.debug('Session Send: %s', OpCode[payload.op]);
      this.client.logger.trace('Session Request: %O', payload);
    }
    this.ws?.send(JSON.stringify(payload));
  }

  private getIntents(events: IntentEvent[]): number {
    return events.reduce((previous, current) => previous | Intent[current], 0);
  }

  private sendAuthPayload(): void {
    const events: IntentEvent[] = ['GROUP_AND_C2C_EVENT', 'INTERACTION'];
    const intents = this.getIntents(events);
    const payload: IdentifyPayload = {
      op: OpCode.Identify,
      d: {
        token: this.client.token.authorization,
        intents,
      },
    };

    this.sendPayload(payload);
  }

  private sendResumePayload(): void {
    const payload: ResumePayload = {
      op: OpCode.Resume,
      d: {
        token: this.client.token.authorization,
        seq: this.seq,
        session_id: this.session_id,
      },
    };

    this.sendPayload(payload);
  }

  private async reconnect(outputLog: boolean, retry: number = 1): Promise<void> {
    if (retry > this.client.config.maxRetry) {
      this.client.logger.error('会话重连失败，请检查网络和配置');
      throw new Error('Reached the maximum number of reconnection attempts');
    }
    this.client.logger.debug('Session Reconnect');
    outputLog && this.client.logger.warn('正在尝试重连... (x%d)', retry);

    try {
      await this.connect();
    } catch {
      await scheduler.wait(retry * 3000);
      await this.reconnect(outputLog, ++retry);
    }
  }

  public async connect(): Promise<void> {
    this.client.logger.debug('Session Connect');

    if (this.ws) {
      return this.client.logger.warn('已建立会话通信，不要重复操作');
    }
    const { data } = await this.client.api.getGateway();
    const { url } = data;

    this.ws = new WebSocket(url);
    this.ws.addEventListener('close', this.onClose.bind(this));
    this.ws.addEventListener('error', this.onError.bind(this));
    this.ws.addEventListener('message', this.onMessage.bind(this));
    this.ws.addEventListener('open', this.onOpen.bind(this));
  }

  public disconnect(): void {
    this.client.logger.debug('Session Disconnect');

    if (!this.ws) {
      return this.client.logger.warn('未建立会话通信，无效的操作');
    }
    this.ws.close();
  }
}
