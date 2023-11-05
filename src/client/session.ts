import type { Logger } from 'log4js';

import { RawData, WebSocket } from 'ws';
import { EventEmitter } from 'node:events';
import { getLogger } from '@/utils/logger.js';
import { EventType, ReadyEvent } from '@/client/event.js';

/** 心跳参数 */
enum Op {
  /** 服务端进行消息推送 */
  Dispatch = 0,
  /** 客户端发送心跳 */
  Heartbeat = 1,
  /** 鉴权 */
  Identify = 2,
  /** 恢复连接 */
  Resume = 6,
  /** 服务端通知客户端重连 */
  Reconnect = 7,
  /** 当 identify 或 resume 的时候，如果参数有错，服务端会返回该消息 */
  InvalidSession = 9,
  /** 当客户端与网关建立 ws 连接之后，网关下发的第一条消息 */
  Hello = 10,
  /** 当发送心跳成功之后，就会收到该消息 */
  HeartbeatAck = 11,
  /** 仅用于 http 回调模式的回包，代表机器人收到了平台推送的数据 */
  HttpCallbackAck = 12,
}

/** 事件类型 */
enum IntentEvent {
  Guilds = 'GUILDS',
  GuildMembers = 'GUILD_MEMBERS',
  GuildMessages = 'GUILD_MESSAGES',
  GuildMessageReactions = 'GUILD_MESSAGE_REACTIONS',
  DirectMessage = 'DIRECT_MESSAGE',
  OpenForumsEvent = 'OPEN_FORUMS_EVENT',
  AudioOrLiveChannelMember = 'AUDIO_OR_LIVE_CHANNEL_MEMBER',
  Interaction = 'INTERACTION',
  MessageAudit = 'MESSAGE_AUDIT',
  ForumsEvent = 'FORUMS_EVENT',
  AudioAction = 'AUDIO_ACTION',
  PublicGuildMessages = 'PUBLIC_GUILD_MESSAGES',

  // TODO: ／人◕ ‿‿ ◕人＼ 待补全
}

type IntentBitShift = {
  [key in IntentEvent]: number;
};

interface SessionConfig {
  url: string;
  appid: string;
  token: string;
}

/** 服务器推送消息 */
interface DispatchMessage {
  op: Op.Dispatch;
  /** 消息序列号 */
  s: number;
  d: ReadyEvent;
  /** 事件类型 */
  t: EventType;
}

/** 心跳消息 */
interface HeartbeatMessage {
  op: Op.Heartbeat;
  d: number;
}

/** 鉴权消息 */
interface IdentifyMessage {
  op: Op.Identify;
  d: {
    token: `QQBot ${string}`;
    intents: number;
    shard: number[];
    properties: Record<string, unknown>;
  };
}

/** 恢复连接消息 */
interface ResumeMessage {
  op: Op.Resume;
  d: {
    seq: number;
    session_id: string;
    token: `QQBot ${string}`;
  };
}

/** 等待重连消息 */
interface ReconnectMessage {
  op: Op.Reconnect;
}

/** 参数错误消息 */
interface InvalidSessionMessage {
  op: Op.InvalidSession;
  d: boolean;
}

/** 连接消息 */
interface HelloMessage {
  op: Op.Hello;
  d: {
    heartbeat_interval: number;
  };
}

/** 心跳回包消息 */
interface HeartbeatAckMessage {
  op: Op.HeartbeatAck;
}

type SessionMessage = DispatchMessage | ReconnectMessage | InvalidSessionMessage | HelloMessage | HeartbeatAckMessage;

/** 事件位移 */
const intentBitShift: IntentBitShift = {
  GUILDS: 1 << 0,
  GUILD_MEMBERS: 1 << 1,
  GUILD_MESSAGES: 1 << 9,
  GUILD_MESSAGE_REACTIONS: 1 << 10,
  DIRECT_MESSAGE: 1 << 12,
  OPEN_FORUMS_EVENT: 1 << 18,
  AUDIO_OR_LIVE_CHANNEL_MEMBER: 1 << 19,
  INTERACTION: 1 << 26,
  MESSAGE_AUDIT: 1 << 27,
  FORUMS_EVENT: 1 << 28,
  AUDIO_ACTION: 1 << 29,
  PUBLIC_GUILD_MESSAGES: 1 << 30,

  // TODO: ／人◕ ‿‿ ◕人＼ 待补全
};

export class Session extends EventEmitter {
  /** 是否重连 */
  private is_reconnect: boolean;
  /** 心跳间隔 */
  private heartbeat_interval!: number;
  /** 记录器 */
  private logger: Logger;
  // private retry: number;
  /** 消息序列号 */
  private seq: number;
  /** 会话 id */
  private session_id: string;
  private ws: WebSocket;

  constructor(private config: SessionConfig) {
    super();

    this.is_reconnect = false;
    this.logger = getLogger(config.appid);
    // this.retry = 0;
    this.seq = 0;
    this.session_id = '';
    this.logger.trace('开始建立 ws 通信...');
    this.ws = new WebSocket(this.config.url);

    this.initEvents();
  }

  private initEvents() {
    this.ws.on('open', () => this.onOpen());
    this.ws.on('close', code => this.onClose(code));
    this.ws.on('error', error => this.onError(error));
    this.ws.on('message', data => this.onMessage(data));
  }

  private onOpen() {
    this.logger.debug('连接 socket 成功');
  }

  private onClose(code: number) {
    this.is_reconnect = true;

    this.logger.debug(`Code: ${code}`);
    this.logger.warn('断开 socket 连接');
    this.ws.removeAllListeners();
    this.reconnect();
  }

  private onError(error: Error) {
    this.logger.fatal('连接 socket 发生错误');
  }

  private onMessage(data: RawData) {
    this.logger.debug(`收到 socket 消息: ${data}`);
    const message = <SessionMessage>JSON.parse(data.toString());

    switch (message.op) {
      case Op.Dispatch:
        const { d, s, t } = message;
        this.seq = s;

        if (t === 'READY') {
          const { session_id } = d;

          this.session_id = session_id;

          this.logger.info(`Hello, ${d.user.username}`);
          this.logger.trace('开始发送心跳...');
          this.dokidoki();
        }
        const dispatch = {
          type: t,
          data: d,
        };

        this.logger.info(dispatch);
        this.emit('dispatch', dispatch);
        break;
      case Op.Reconnect:
        this.logger.info('当前会话已失效，等待断开后自动重连');
        this.ws.close();
        break;
      case Op.InvalidSession:
        this.logger.error('发起 socket 连接的参数有误');
        break;
      case Op.Hello:
        this.heartbeat_interval = message.d.heartbeat_interval;
        this.is_reconnect ? this.connect() : this.auth();
        break;
      case Op.HeartbeatAck:
        setTimeout(() => this.dokidoki(), this.heartbeat_interval);
        break;
    }
  }

  private dokidoki() {
    const message: HeartbeatMessage = {
      op: Op.Heartbeat,
      d: this.seq,
    };
    this.sendMessage(message);
  }

  private sendMessage(message: unknown): void {
    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message);

      this.ws.send(data);
      this.logger.debug(`发送 socket 消息: ${data}`);
    } catch (error) {
      this.logger.error(error);
    }
  }

  private getIntents() {
    const events = this.getEvents();

    if (!events.length) {
      throw new Error('Event cannot be empty');
    }
    const intents = events.reduce((previous, current) => previous | intentBitShift[current], 0);
    return intents;
  }

  private getEvents(): IntentEvent[] {
    const events = <IntentEvent[]>Object.values(IntentEvent);
    return events;
  }

  private auth() {
    const message: IdentifyMessage = {
      op: Op.Identify,
      d: {
        token: `QQBot ${this.config.token}`,
        intents: this.getIntents(),
        // TODO: ／人◕ ‿‿ ◕人＼ 分片
        shard: [0, 1],
        // TODO: ／人◕ ‿‿ ◕人＼ 暂时没有作用
        properties: {},
      },
    };
    this.sendMessage(message);
  }

  private connect() {
    this.is_reconnect = false;

    const message: ResumeMessage = {
      op: Op.Resume,
      d: {
        token: `QQBot ${this.config.token}`,
        seq: this.seq,
        session_id: this.session_id,
      },
    };
    this.sendMessage(message);
  }

  private reconnect() {
    // TODO: ／人◕ ‿‿ ◕人＼ retry 计数
    this.logger.info(`尝试重连...`);

    setTimeout(() => {
      this.ws = new WebSocket(this.config.url);
      this.initEvents();
    }, 1000);
  }
}
