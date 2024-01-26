import type { Message } from '@/model/message';
import type { ClientEvent, C2cMessageCreate, GroupAtMessageCreate } from '@/bot/event';

import { EventEmitter } from 'node:events';
import { generateApi } from '@/api';
import { UserMessage, SendUserMessageParams } from '@/api/users';
import { GroupMessage, SendGroupsMessageParams } from '@/api/groups';
import { SendChannelMessageParams } from '@/api/channels';
import { Token } from '@/bot/token';
import { DispatchData, IntentEvent, Session } from '@/bot/session';
import { deepAssign, objectToString, parseError } from '@/utils/common';
import { Request, RequestError, Result } from '@/utils/request';
import { LogLevel, Logger, createLogger } from '@/utils/logger';

/** 客户端配置项 */
export interface ClientConfig {
  /** 机器人 ID */
  appid: string;
  /** 机器人令牌 */
  token: string;
  /** 机器人密钥 */
  secret: string;
  /** 订阅事件 */
  events: IntentEvent[];
  /** 是否开启沙盒，默认 `false` */
  sandbox: boolean;
  /** 掉线重连数，默认 `3` */
  max_retry?: number;
  /** 日志等级，默认 `'INFO'` */
  log_level?: LogLevel;
}

type Api = ReturnType<typeof generateApi>;

class ClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientError';
  }
}

type EventInterceptor = (dispatch: DispatchData) => DispatchData | Promise<DispatchData>;

export interface Client extends EventEmitter {
  addListener<T extends keyof ClientEvent>(event: T, listener: ClientEvent[T]): this;
  addListener(event: string | symbol, listener: (...args: unknown[]) => void): this;

  on<T extends keyof ClientEvent>(event: T, listener: ClientEvent[T]): this;
  on(event: string | symbol, listener: (...args: unknown[]) => void): this;

  once<T extends keyof ClientEvent>(event: T, listener: ClientEvent[T]): this;
  once(event: string | symbol, listener: (...args: unknown[]) => void): this;

  removeListener<T extends keyof ClientEvent>(event: T, listener: ClientEvent[T]): this;
  removeListener(event: string | symbol, listener: (...args: any[]) => void): this;

  off<T extends keyof ClientEvent>(event: T, listener: ClientEvent[T]): this;
  off(event: string | symbol, listener: (...args: unknown[]) => void): this;

  removeAllListeners<T extends keyof ClientEvent>(event?: T): this;
  removeAllListeners(event?: string | symbol): this;

  listeners<T extends keyof ClientEvent>(event: T): Function[];
  listeners(event: string | symbol): Function[];

  rawListeners<T extends keyof ClientEvent>(event: T): Function[];
  rawListeners(event: string | symbol): Function[];

  emit<T extends keyof ClientEvent>(event: T, ...args: Parameters<ClientEvent[T]>): boolean;
  emit(event: string | symbol, ...args: any[]): boolean;

  listenerCount<T extends keyof ClientEvent>(event: T, listener?: ClientEvent[T]): number;
  listenerCount(event: string | symbol, listener?: Function): number;

  prependListener<T extends keyof ClientEvent>(event: T, listener: ClientEvent[T]): this;
  prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

  prependOnceListener<T extends keyof ClientEvent>(event: T, listener: ClientEvent[T]): this;
  prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;

  eventNames<T extends keyof ClientEvent>(): T[];
  eventNames(): Array<string | symbol>;
}

export class Client extends EventEmitter {
  public logger: Logger;
  public api: Api;
  public request: Request;

  private token: Token;
  private session: Session;
  private eventInterceptors: EventInterceptor[];

  constructor(public config: ClientConfig) {
    super();
    config.sandbox ??= false;
    config.max_retry ??= 3;
    config.log_level ??= 'INFO';

    this.logger = createLogger(config.appid, config.log_level);
    this.checkConfig();
    this.logger.mark('Client is initializing...');

    this.api = this.createApi();
    this.request = this.createRequest();
    this.token = new Token(config);
    this.session = new Session(config, this.token);
    this.eventInterceptors = [];

    this.useEventInterceptor(dispatch => {
      const { t, d } = dispatch;

      switch (t) {
        case 'GUILD_MEMBER_ADD':
        case 'GUILD_MEMBER_UPDATE':
        case 'GUILD_MEMBER_REMOVE':
        case 'MESSAGE_REACTION_ADD':
        case 'MESSAGE_REACTION_REMOVE':
        case 'FORUM_THREAD_CREATE':
        case 'FORUM_THREAD_UPDATE':
        case 'FORUM_THREAD_DELETE':
        case 'FORUM_POST_CREATE':
        case 'FORUM_POST_DELETE':
        case 'FORUM_REPLY_CREATE':
        case 'FORUM_REPLY_DELETE':
          d.reply = (params: SendChannelMessageParams): Promise<Result<Message>> => {
            return this.api.sendChannelMessage(d.channel_id, {
              event_id: d.id,
              ...params,
            });
          };
          break;
        case 'MESSAGE_CREATE':
        case 'AT_MESSAGE_CREATE':
          d.reply = (params: SendChannelMessageParams): Promise<Result<Message>> => {
            return this.api.sendChannelMessage(d.channel_id, {
              msg_id: d.id,
              ...params,
            });
          };
          break;
        case 'DIRECT_MESSAGE_CREATE':
          d.reply = (params: SendChannelMessageParams): Promise<Result<Message>> => {
            return this.api.sendDmMessage(d.guild_id, {
              msg_id: d.id,
              ...params,
            });
          };
          break;
        case 'GROUP_AT_MESSAGE_CREATE':
          d.reply = (params: SendGroupsMessageParams): Promise<Result<GroupMessage>> => {
            return this.api.sendGroupMessage(d.group_openid, {
              msg_id: d.id,
              ...params,
            });
          };
          break;
        case 'C2C_MESSAGE_CREATE':
          d.reply = (params: SendUserMessageParams): Promise<Result<UserMessage>> => {
            return this.api.sendUserMessage(d.author.user_openid, {
              msg_id: d.id,
              ...params,
            });
          };
          break;
      }
      return dispatch;
    });
  }

  /**
   * 机器人上线。
   */
  public async online(): Promise<void> {
    const { data } = await this.api.getGateway();

    this.session.connect(data.url);
    this.session.on('dispatch', data => this.onDispatch(data));

    this.on('c2c.message.create', this.onMessage);
    this.on('group.at.message.create', this.onMessage);
    this.on('direct.message.create', this.onMessage);
    this.on('at.message.create', this.onMessage);
  }

  /**
   * 机器人下线。
   */
  public offline(): void {
    this.session.disconnect();
    this.session.removeAllListeners('dispatch');

    this.off('c2c.message.create', this.onMessage);
    this.off('group.at.message.create', this.onMessage);
    this.off('direct.message.create', this.onMessage);
    this.off('at.message.create', this.onMessage);
  }

  /**
   * 添加事件拦截器。
   */
  public useEventInterceptor(interceptor: EventInterceptor) {
    this.eventInterceptors.push(interceptor);
  }

  private async onDispatch(dispatch: DispatchData) {
    for (const interceptor of this.eventInterceptors) {
      try {
        dispatch = await interceptor(dispatch);
      } catch (error) {
        const message = parseError(error);

        this.logger.error(message);
        throw new ClientError(message);
      }
    }
    const { t, d } = dispatch;
    const data = {
      t,
      ...d,
    };
    const events = t.toLowerCase().split('_');

    // 不存在下划线就是 session 自身的事件，例如 READY、RESUMED
    if (events.length === 1) {
      events.unshift('session');
    }

    do {
      const event = events.join('.');

      this.emit(event, data);
      this.logger.debug(`推送 "${event}" 事件`);
      events.pop();
    } while (events.length);
  }

  private onMessage(message: C2cMessageCreate | GroupAtMessageCreate | Message) {
    const { attachments, content } = message;
    const text = attachments ? `<attachment>${content}` : content;

    this.logger.info(`Received message: "${text}"`);
  }

  private checkConfig() {
    if (!this.config.events.length) {
      const wiki =
        'https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html#%E4%BA%8B%E4%BB%B6%E8%AE%A2%E9%98%85Intents';

      this.logger.error(`检测到 events 为空，请查阅相关文档：${wiki}`);
      throw new ClientError('Events cannot be empty.');
    }
  }

  private createApi(): Api {
    const request = new Request();
    const origin = this.config.sandbox
      ? 'https://sandbox.api.sgroup.qq.com'
      : 'https://api.sgroup.qq.com';

    request.useRequestInterceptor(async config => {
      this.logger.trace('开始调用接口请求...');
      await this.token.renew();

      deepAssign(config, {
        origin,
        headers: {
          'Authorization': this.token.authorization,
          'X-Union-Appid': this.config.appid,
        },
      });
      this.logger.debug(`API Request: ${objectToString(config)}`);

      return config;
    });

    request.useResponseInterceptor<undefined | { code: number; message: string }>(result => {
      const { data } = result;
      this.logger.debug(`API Response: ${objectToString(data)}`);

      if (data?.code) {
        this.logger.error(`API Code: ${data.code}, ${data.message}.`);
        throw new RequestError(`Code ${data.code}, ${data.message}.`);
      }
      return result;
    });
    return generateApi(request);
  }

  private createRequest(): Request {
    const request = new Request();

    request.useRequestInterceptor(config => {
      this.logger.trace('开始发起网络请求...');
      this.logger.debug(`HTTP Request: ${objectToString(config)}`);

      return config;
    });

    request.useResponseInterceptor(result => {
      this.logger.debug(`HTTP Response: ${objectToString(result.data)}`);
      return result;
    });
    return request;
  }
}
