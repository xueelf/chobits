import type { Logger } from 'log4js';

import { EventEmitter } from 'node:events';
import { createApi } from '@/api';
import { Token } from '@/client/token';
import { BotEvent } from '@/client/event';
import { DispatchData, IntentEvent, Session } from '@/client/session';
import { LogLevel, Request, createLogger, objectToString } from '@/utils';

export interface BotConfig {
  /** 机器人 ID */
  appid: string;
  /** 机器人令牌 */
  token: string;
  /** 机器人密钥 */
  secret: string;
  /** 订阅事件 */
  events: IntentEvent[];
  /** 日志等级 */
  log_level?: LogLevel;
}

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
  public api: ReturnType<typeof createApi>;
  public request: Request;

  private token: Token;
  private session: Session;

  constructor(private config: BotConfig) {
    super();
    config.log_level ??= 'INFO';

    this.logger = createLogger(config.appid, config.log_level);
    this.checkConfig();

    this.token = new Token(<Required<BotConfig>>config);
    this.request = this.createRequest();
    this.session = new Session(config, this.token);
    this.api = createApi(this.token);
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

  private createRequest() {
    const request = new Request();

    request.useRequestInterceptor(config => {
      this.logger.trace('开始发起网络请求...');
      this.logger.debug(`Request: ${objectToString(config)}`);

      return config;
    });

    request.useResponseInterceptor(result => {
      this.logger.debug(`Response: ${objectToString(result.data)}`);
      return result;
    });
    return request;
  }
}
