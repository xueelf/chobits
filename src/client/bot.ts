import type { Logger } from 'log4js';

import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { createApi } from '@/api/index.js';
import { Token } from '@/client/token.js';
import { Request, Result } from '@/client/request.js';
import { Session } from '@/client/session.js';
import { EventMap } from '@/client/event.js';
import { LogLevel, createLogger } from '@/utils/logger.js';

type AsyncReturnType<T extends (...args: any[]) => Promise<any>> = T extends (...args: any[]) => Promise<infer R>
  ? R
  : never;

export interface BotConfig {
  appid: string;
  token: string;
  secret: string;
  data_dir?: string;
  log_level?: LogLevel;
}

/** 事件接口 */
export interface Bot extends EventEmitter {
  on<T extends keyof EventMap>(event: T, listener: EventMap<this>[T]): this;
  on<S extends string | symbol>(
    event: S & Exclude<S, keyof EventMap>,
    listener: (this: this, ...args: any[]) => void,
  ): this;
  once<T extends keyof EventMap>(event: T, listener: EventMap<this>[T]): this;
  once<S extends string | symbol>(
    event: S & Exclude<S, keyof EventMap>,
    listener: (this: this, ...args: any[]) => void,
  ): this;
  prependListener<T extends keyof EventMap>(event: T, listener: EventMap<this>[T]): this;
  prependListener(event: string | symbol, listener: (this: this, ...args: any[]) => void): this;
  prependOnceListener<T extends keyof EventMap>(event: T, listener: EventMap<this>[T]): this;
  prependOnceListener(event: string | symbol, listener: (this: this, ...args: any[]) => void): this;
  off<T extends keyof EventMap>(event: T, listener: EventMap<this>[T]): this;
  off<S extends string | symbol>(
    event: S & Exclude<S, keyof EventMap>,
    listener: (this: this, ...args: any[]) => void,
  ): this;
}

export class Bot extends EventEmitter {
  public appid: string;
  public logger: Logger;
  public api!: Omit<AsyncReturnType<typeof createApi>, 'request'>;
  public request: Request;

  private token: Token;
  private session!: Session;

  constructor(private config: BotConfig) {
    super();

    config.data_dir ??= join(process.cwd(), 'data');
    config.log_level ??= 'INFO';

    this.appid = config.appid;
    this.logger = createLogger(config.appid, config.log_level);
    this.token = new Token(<Required<BotConfig>>config);
    this.request = new Request(this.token);

    this.initEvents();
  }

  private initEvents() {
    this.token.once('ready', () => this.onTokenReady());
    this.request.on('response', event => this.onRequestResponse(event));
  }

  private async onRequestResponse(event: Result) {
    const { data } = event;

    if (data.code && data.code === 11244) {
      this.logger.info('token 过期');
      await this.token.renewToken();
    } else if (data.code) {
      // TODO: ／人◕ ‿‿ ◕人＼ 异常处理
      // this.logger.debug(`Code: ${data.code}`);
      // throw new Error(<string>data.message);
    }
  }

  private async onTokenReady() {
    this.api = await createApi(this.request);
    await this.createSession();
  }

  private async createSession() {
    const { data } = await this.api.gateway();

    if (!data.url) {
      await this.createSession();
      return;
    }
    this.session = new Session({
      url: data.url,
      appid: this.appid,
      token: this.token.value,
    });
    this.session.on('dispatch', event => {
      this.emit(event.type, event.data);
    });
  }
}
