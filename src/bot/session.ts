import type { Token } from '@/bot/token';

import { RawData, WebSocket } from 'ws';
import { EventEmitter } from 'node:events';
import { ClientConfig } from '@/bot/client';
import { Logger, getLogger } from '@/utils/logger';
import { objectToString, wait } from '@/utils/common';

enum OpCode {
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

enum DispatchType {
  READY = 'READY',
  RESUMED = 'RESUMED',
}

/** 事件类型 */
enum Intent {
  GUILDS = 1 << 0,
  GUILD_MEMBERS = 1 << 1,
  GUILD_MESSAGES = 1 << 9,
  GUILD_MESSAGE_REACTIONS = 1 << 10,
  DIRECT_MESSAGE = 1 << 12,
  GROUP_MESSAGES = 1 << 25,
  INTERACTION = 1 << 26,
  MESSAGE_AUDIT = 1 << 27,
  FORUMS_EVENT = 1 << 28,
  AUDIO_ACTION = 1 << 29,
  PUBLIC_GUILD_MESSAGES = 1 << 30,
}

/** 消息推送数据 */
interface DispatchPayload {
  op: OpCode.Dispatch;
  /** 消息序列号 */
  s: number;
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

interface ReadyDispatchPayload extends DispatchPayload {
  t: DispatchType.READY;
  d: ReadyData;
}

export type ResumedData = '';

interface ResumedDispatchPayload extends DispatchPayload {
  t: DispatchType.RESUMED;
  d: ResumedData;
}

/** 消息推送 */
type AllDispatchPayload = ReadyDispatchPayload | ResumedDispatchPayload;

/** 心跳数据 */
interface HeartbeatPayload {
  op: OpCode.Heartbeat;
  /** 客户端收到的最新的消息的 s，如果是首次连接，值为 `null` */
  d: number | null;
}

/** 鉴权数据 */
interface IdentifyPayload {
  op: OpCode.Identify;
  d: {
    token: string;
    intents: number;
    shard: number[];
    properties: Record<string, unknown>;
  };
}

/** 恢复连接数据 */
interface ResumePayload {
  op: OpCode.Resume;
  d: {
    seq: number;
    session_id: string;
    token: string;
  };
}

/** 等待重连数据 */
interface ReconnectPayload {
  op: OpCode.Reconnect;
}

/** 参数错误数据 */
interface InvalidSessionPayload {
  op: OpCode.InvalidSession;
  d: boolean;
}

/** 首次连接数据 */
interface HelloPayload {
  op: OpCode.Hello;
  d: {
    heartbeat_interval: number;
  };
}

/** 心跳回包数据 */
interface HeartbeatAckPayload {
  op: OpCode.HeartbeatAck;
}

type Payload =
  | AllDispatchPayload
  | HeartbeatPayload
  | IdentifyPayload
  | ResumePayload
  | ReconnectPayload
  | InvalidSessionPayload
  | HelloPayload
  | HeartbeatAckPayload;

class SessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionError';
  }
}

export type IntentEvent = keyof typeof Intent;

export interface DispatchData {
  t: string;
  d: any;
}

interface SessionEvent {
  dispatch: (data: DispatchData) => void;
}

export interface Session extends EventEmitter {
  addListener<T extends keyof SessionEvent>(event: T, listener: SessionEvent[T]): this;
  on<T extends keyof SessionEvent>(event: T, listener: SessionEvent[T]): this;
  once<T extends keyof SessionEvent>(event: T, listener: SessionEvent[T]): this;
  removeListener<T extends keyof SessionEvent>(event: T, listener: SessionEvent[T]): this;
  off<T extends keyof SessionEvent>(event: T, listener: SessionEvent[T]): this;
  removeAllListeners<T extends keyof SessionEvent>(event?: T): this;
  listeners<T extends keyof SessionEvent>(event: T): Function[];
  rawListeners<T extends keyof SessionEvent>(event: T): Function[];
  emit<T extends keyof SessionEvent>(event: T, ...args: Parameters<SessionEvent[T]>): boolean;
  listenerCount<T extends keyof SessionEvent>(event: T, listener?: SessionEvent[T]): number;
  prependListener<T extends keyof SessionEvent>(event: T, listener: SessionEvent[T]): this;
  prependOnceListener<T extends keyof SessionEvent>(event: T, listener: SessionEvent[T]): this;
  eventNames<T extends keyof SessionEvent>(): T[];
}

export class Session extends EventEmitter {
  private ackTimeout: NodeJS.Timeout | null;
  /** 心跳间隔 */
  private heartbeat_interval!: number;
  /** 是否重连 */
  private is_reconnect: boolean;
  /** 记录器 */
  private logger: Logger;
  /** 重连计数 */
  private retry: number;
  /** 最大重连数 */
  private max_retry: number;
  /** 消息序列号 */
  private seq: number;
  /** 会话 id */
  private session_id: string | null;
  private ws: WebSocket | null;

  constructor(private config: ClientConfig, private token: Token) {
    super();

    this.ackTimeout = null;
    this.is_reconnect = false;
    this.logger = getLogger(config.appid);
    this.retry = 0;
    this.max_retry = config.max_retry!;
    this.seq = 0;
    this.session_id = null;
    this.ws = null;
  }

  private onOpen(): void {
    if (this.retry) {
      this.retry = 0;
    }
    this.logger.debug('连接 socket 成功');
  }

  private async onClose(code: number): Promise<void> {
    clearTimeout(<NodeJS.Timeout | undefined>this.ackTimeout);
    this.ackTimeout = null;
    this.ws!.removeAllListeners();
    this.logger.debug(`Session Exit Code: ${code}.`);

    if (!this.is_reconnect) {
      this.ws = null;
      this.logger.info('会话连接已关闭');
      return;
    }
    this.logger.warn('会话连接已被中断');
    await this.token.renew();
    this.reconnect();
  }

  private onError(error: Error): void {
    this.logger.fatal(error);
  }

  private onMessage(data: RawData): void {
    const payload = <Payload>JSON.parse(data.toString());
    this.logger.debug(`收到 payload 数据: ${objectToString(payload)}`);

    switch (payload.op) {
      case OpCode.Dispatch:
        this.onDispatch(payload);
        break;
      case OpCode.Reconnect:
        this.logger.info('当前会话已失效，等待断开后自动重连');
        this.ws!.close();
        break;
      case OpCode.InvalidSession:
        this.logger.error('发送的 payload 参数有误');
        throw new SessionError('The Payload parameter sent is incorrect.');
      case OpCode.Hello:
        this.heartbeat_interval = payload.d.heartbeat_interval;
        this.is_reconnect ? this.sendResumePayload() : this.sendAuthPayload();
        break;
      case OpCode.HeartbeatAck:
        this.ackTimeout = setTimeout(() => this.heartbeat(), this.heartbeat_interval);
        break;
    }
  }

  private onDispatch(payload: AllDispatchPayload): void {
    const { d, s, t } = payload;
    this.seq = s;

    switch (t) {
      case DispatchType.READY:
        const { session_id } = d;

        this.session_id = session_id;
        this.logger.mark(`Hello, ${d.user.username}`);
      case DispatchType.RESUMED:
        this.logger.trace('开始发送心跳...');
        this.heartbeat();
        break;
    }
    const dispatch: DispatchData = {
      t,
      d,
    };

    this.emit('dispatch', dispatch);
  }

  private heartbeat(): void {
    const payload: HeartbeatPayload = {
      op: OpCode.Heartbeat,
      d: this.seq,
    };
    this.sendPayload(payload);
  }

  private sendPayload(payload: Payload): void {
    try {
      const data = objectToString(payload);

      this.ws!.send(data);
      this.logger.debug(`发送 payload 数据: ${data}`);
    } catch (error) {
      this.logger.error(error);
    }
  }

  private getIntents(): number {
    const events = this.config.events;
    const intents = events.reduce((previous, current) => previous | Intent[current], 0);

    return intents;
  }

  private sendAuthPayload(): void {
    const payload: IdentifyPayload = {
      op: OpCode.Identify,
      d: {
        token: this.token.authorization,
        intents: this.getIntents(),
        // TODO: ／人◕ ‿‿ ◕人＼ 分片
        shard: [0, 1],
        // TODO: ／人◕ ‿‿ ◕人＼ 暂时没有作用
        properties: {},
      },
    };

    this.is_reconnect = true;
    this.sendPayload(payload);
  }

  private sendResumePayload(): void {
    const payload: ResumePayload = {
      op: OpCode.Resume,
      d: {
        token: this.token.authorization,
        seq: this.seq,
        session_id: this.session_id!,
      },
    };
    this.sendPayload(payload);
  }

  private async reconnect(): Promise<void> {
    if (this.retry === this.max_retry) {
      this.logger.error('重连失败，请检查网络和配置。');
      throw new SessionError('Reached the maximum number of reconnection attempts.');
    }
    this.retry++;

    try {
      this.logger.info(`尝试重连... x${this.retry}`);
      await wait(this.retry * 3000);
      this.connect(this.ws!.url);
    } catch (error) {
      this.reconnect();
    }
  }

  public connect(url: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.logger.warn('已建立会话通信，不要重复连接。');
      return;
    }
    this.logger.trace('开始建立 ws 通信...');

    const ws = new WebSocket(url);

    ws.on('open', () => this.onOpen());
    ws.on('close', code => this.onClose(code));
    ws.on('error', error => this.onError(error));
    ws.on('message', data => this.onMessage(data));

    this.ws = ws;
  }

  public disconnect(): void {
    if (!this.ws) {
      this.logger.warn('未建立会话通信，无效的操作。');
      return;
    }
    this.is_reconnect = false;

    this.logger.trace('正在断开 ws 通信...');
    this.ws.close();
  }
}
