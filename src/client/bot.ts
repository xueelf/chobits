import type { Logger } from 'log4js';
import type { createRequest } from '@/utils/request.js';

import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { createApi } from '@/api/index.js';
import { Token } from '@/client/token.js';
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
  public request!: ReturnType<typeof createRequest>;

  private token: Token;
  private session!: Session;

  constructor(private config: BotConfig) {
    super();

    config.data_dir ??= join(process.cwd(), 'data');
    config.log_level ??= 'INFO';

    this.appid = config.appid;
    this.logger = createLogger(config.appid, config.log_level);
    this.token = new Token(<Required<BotConfig>>config);

    this.token.once('ready', async () => {
      const { request, ...api } = await createApi(this.token);

      this.api = api;
      this.request = request;

      const { data } = await this.api.gateway();

      this.session = new Session({
        url: data.url,
        appid: this.appid,
        token: this.token.value,
      });
      this.session.on('dispatch', event => {
        this.emit(event.type, event.data);
      });
    });
  }
}
