import type { Logger } from 'log4js';

import { EventEmitter } from 'node:events';
import { generateApi } from '@/api';
import { Token } from '@/client/token';
import { BotEvent } from '@/client/event';
import { DispatchData, IntentEvent, Session } from '@/client/session';
import { AnyObject, LogLevel, Request, RequestError, Result, createLogger, deepAssign, objectToString } from '@/utils';

/** 机器人配置项 */
export interface BotConfig {
  /** 机器人 ID */
  appid: string;
  /** 机器人令牌 */
  token: string;
  /** 机器人密钥 */
  secret: string;
  /** 订阅事件 */
  events: IntentEvent[];
  /** 掉线重连数 */
  max_retry?: number;
  /** 日志等级 */
  log_level?: LogLevel;
}

type Api = ReturnType<typeof generateApi>;

type ApiData =
  | AnyObject
  | null
  | {
      code: number;
      message: string;
    };

class BotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BotError';
  }
}

export interface Bot extends EventEmitter {
  addListener<T extends keyof BotEvent>(event: T, listener: BotEvent[T]): this;
  addListener(event: string | symbol, listener: (...args: unknown[]) => void): this;

  on<T extends keyof BotEvent>(event: T, listener: BotEvent[T]): this;
  on(event: string | symbol, listener: (...args: unknown[]) => void): this;

  once<T extends keyof BotEvent>(event: T, listener: BotEvent[T]): this;
  once(event: string | symbol, listener: (...args: unknown[]) => void): this;

  removeListener<T extends keyof BotEvent>(event: T, listener: BotEvent[T]): this;
  removeListener(event: string | symbol, listener: (...args: any[]) => void): this;

  off<T extends keyof BotEvent>(event: T, listener: BotEvent[T]): this;
  off(event: string | symbol, listener: (...args: unknown[]) => void): this;

  removeAllListeners<T extends keyof BotEvent>(event?: T): this;
  removeAllListeners(event?: string | symbol): this;

  listeners<T extends keyof BotEvent>(event: T): Function[];
  listeners(event: string | symbol): Function[];

  rawListeners<T extends keyof BotEvent>(event: T): Function[];
  rawListeners(event: string | symbol): Function[];

  emit<T extends keyof BotEvent>(event: T, ...args: Parameters<BotEvent[T]>): boolean;
  emit(event: string | symbol, ...args: any[]): boolean;

  listenerCount<T extends keyof BotEvent>(event: T, listener?: BotEvent[T]): number;
  listenerCount(event: string | symbol, listener?: Function): number;

  prependListener<T extends keyof BotEvent>(event: T, listener: BotEvent[T]): this;
  prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

  prependOnceListener<T extends keyof BotEvent>(event: T, listener: BotEvent[T]): this;
  prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;

  eventNames<T extends keyof BotEvent>(): T[];
  eventNames(): Array<string | symbol>;
}

export class Bot extends EventEmitter {
  /** 记录器 */
  public logger: Logger;
  public api: Api;
  public request: Request;

  private token: Token;
  private session: Session;

  constructor(public config: BotConfig) {
    super();
    config.max_retry ??= 3;
    config.log_level ??= 'INFO';

    this.logger = createLogger(config.appid, config.log_level);
    this.checkConfig();

    this.api = this.createApi();
    this.request = this.createRequest();
    this.token = new Token(config);
    this.session = new Session(config, this.token);
  }

  /**
   * 机器人上线。
   */
  public async online(): Promise<void> {
    const { data } = await this.api.getGateway();

    this.session.connect(data.url);
    this.session.on('dispatch', data => this.onDispatch(data));
  }

  /**
   * 机器人下线。
   */
  public offline(): void {
    this.session.disconnect();
  }

  private onDispatch(data: DispatchData) {
    const { t, d } = data;
    const eventData = {
      t,
      ...d,
    };

    let event = t.replace(/_/g, '.').toLowerCase();

    // 不存在下划线就是 session 自身的事件，例如 READY、RESUMED
    if (!/\./.test(event)) {
      event = `session.${event}`;
    }
    while (true) {
      this.emit(event, eventData);
      this.logger.debug(`推送 "${event}" 事件`);

      const i = event.lastIndexOf('.');

      if (i === -1) {
        break;
      }
      event = event.slice(0, i);
    }
  }

  private checkConfig() {
    if (!this.config.events.length) {
      const wiki =
        'https://bot.q.qq.com/wiki/develop/api-231017/dev-prepare/interface-framework/event-emit.html#%E4%BA%8B%E4%BB%B6%E8%AE%A2%E9%98%85Intents';

      this.logger.error(`检测到 events 为空，请查阅相关文档：${wiki}`);
      throw new BotError('Events cannot be empty.');
    }
  }

  private createApi(): Api {
    const request = new Request();

    request.useRequestInterceptor(async config => {
      this.logger.trace('开始调用接口请求...');
      await this.token.renew();

      deepAssign(config, {
        baseURL: 'https://api.sgroup.qq.com',
        headers: {
          'Authorization': this.token.authorization,
          'X-Union-Appid': this.config.appid,
        },
      });
      this.logger.debug(`API Request: ${objectToString(config)}`);

      return config;
    });

    request.useResponseInterceptor((result: Result<ApiData>) => {
      const { data } = result;

      this.logger.debug(`API Response: ${objectToString(data)}`);

      if (data?.code) {
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
