import type { Logger } from 'log4js';
import type { Token } from '@/client/token';
import type { EventType, ReadyEvent, ResumedEvent } from '@/client/event';

import { RawData, WebSocket } from 'ws';
import { EventEmitter } from 'node:events';
import { getLogger } from '@/utils/logger';

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

interface Dispatch {
  op: Op.Dispatch;
  /** 消息序列号 */
  s: number;
}

interface DispatchReadyMessage extends Dispatch {
  t: 'READY';
  d: ReadyEvent;
}

interface DispatchResumedMessage extends Dispatch {
  t: 'RESUMED';
  d: ResumedEvent;
}

/** 服务器推送消息 */
type DispatchMessage = DispatchReadyMessage | DispatchResumedMessage;

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

type SessionMessage = DispatchMessage | HeartbeatAckMessage | InvalidSessionMessage | ReconnectMessage | HelloMessage;

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
  private retry: number;
  /** 消息序列号 */
  private seq: number;
  /** 会话 id */
  private session_id: string;
  private ws?: WebSocket;
  private ack_id?: NodeJS.Timeout;

  constructor(private appid: string, private token: Token) {
    super();

    this.is_reconnect = false;
    this.logger = getLogger(appid);
    this.retry = 0;
    this.seq = 0;
    this.session_id = '';
  }

  private onOpen() {
    this.retry = 0;
    this.logger.debug('连接 socket 成功');
  }

  private async onClose(code: number) {
    this.logger.debug(`Code: ${code}`);
    this.logger.warn('关闭 socket 连接');

    clearTimeout(this.ack_id);
    await this.token.renew();
    this.reconnect();
  }

  private onError(error: Error) {
    this.logger.fatal('连接 socket 发生错误');
  }

  private onDispatchMessage(message: DispatchMessage) {
    const { d, s, t } = message;
    this.seq = s;

    switch (t) {
      case 'READY':
        const { session_id } = d;

        this.session_id = session_id;
        this.logger.info(`Hello, ${d.user.username}`);
      case 'RESUMED':
        this.logger.trace('开始发送心跳...');
        this.heartbeat();
        break;
    }
    const dispatch = {
      type: t,
      data: d,
    };

    this.logger.info(dispatch);
    this.emit('dispatch', dispatch);
  }

  private onMessage(data: RawData) {
    this.logger.debug(`收到 socket 消息: ${data}`);
    const message = <SessionMessage>JSON.parse(data.toString());

    switch (message.op) {
      case Op.Dispatch:
        this.onDispatchMessage(message);
        break;
      case Op.Reconnect:
        this.logger.info('当前会话已失效，等待断开后自动重连');
        this.ws!.close();
        break;
      case Op.InvalidSession:
        this.logger.error('发起 socket 连接的参数有误');
        break;
      case Op.Hello:
        this.heartbeat_interval = message.d.heartbeat_interval;
        this.is_reconnect ? this.resume() : this.auth();
        break;
      case Op.HeartbeatAck:
        this.ack_id = setTimeout(() => this.heartbeat(), this.heartbeat_interval);
        break;
    }
  }

  private heartbeat() {
    const message: HeartbeatMessage = {
      op: Op.Heartbeat,
      d: this.seq,
    };
    this.sendMessage(message);
  }

  private sendMessage(message: unknown): void {
    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message);

      this.ws!.send(data);
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
        token: `QQBot ${this.token.value}`,
        intents: this.getIntents(),
        // TODO: ／人◕ ‿‿ ◕人＼ 分片
        shard: [0, 1],
        // TODO: ／人◕ ‿‿ ◕人＼ 暂时没有作用
        properties: {},
      },
    };
    this.sendMessage(message);
  }

  private resume() {
    const message: ResumeMessage = {
      op: Op.Resume,
      d: {
        token: `QQBot ${this.token.value}`,
        seq: this.seq,
        session_id: this.session_id,
      },
    };

    if (this.is_reconnect) {
      this.is_reconnect = false;
    }
    this.sendMessage(message);
  }

  private reconnect() {
    if (!this.is_reconnect) {
      this.is_reconnect = true;
    }
    this.retry++;
    this.ws!.removeAllListeners();

    try {
      this.logger.info(`尝试重连... x${this.retry}`);

      setTimeout(() => {
        this.ws = this.connect(this.ws!.url);
      }, this.retry * 1000);
    } catch (error) {
      this.reconnect();
    }
  }

  public connect(url: string): WebSocket {
    this.logger.trace('开始建立 ws 通信...');

    const ws = new WebSocket(url);

    ws.on('open', () => this.onOpen());
    ws.on('close', code => this.onClose(code));
    ws.on('error', error => this.onError(error));
    ws.on('message', data => this.onMessage(data));

    if (!this.ws) {
      this.ws = ws;
    }
    return ws;
  }
}
