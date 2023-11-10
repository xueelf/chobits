import type { Logger } from 'log4js';

import { EventEmitter } from 'node:events';
import { createApi } from '@/api/index';
import { Token } from '@/client/token';
import { Request } from '@/client/request';
import { Session } from '@/client/session';
import { EventMap } from '@/client/event';
import { deepAssign } from '@/utils/common';
import { LogLevel, createLogger } from '@/utils/logger';

type AsyncReturnType<T extends (...args: any[]) => Promise<any>> = T extends (...args: any[]) => Promise<infer R>
  ? R
  : never;

export interface BotConfig {
  appid: string;
  token: string;
  secret: string;
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
  public api: ReturnType<typeof createApi>;
  public request: Request;

  private token: Token;
  private session: Session;

  constructor(private config: BotConfig) {
    super();

    config.log_level ??= 'INFO';

    this.appid = config.appid;
    this.logger = createLogger(config.appid, config.log_level);
    this.token = new Token(<Required<BotConfig>>config);
    this.request = new Request(config.appid);
    this.session = new Session(config.appid, this.token);
    this.api = createApi(this.token);

    this.token.once('ready', async () => {
      await this.linkStart();
    });
  }

  private async linkStart(): Promise<void> {
    const { data } = await this.api.gateway();

    this.session.connect(data.url);
    this.session.on('dispatch', event => {
      this.emit(event.type, event.data);
    });
  }
}
