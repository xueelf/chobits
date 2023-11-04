import type { Logger } from 'log4js';
import type { createRequest } from '@/utils/request.js';

import { join } from 'node:path';
import { createApi } from '@/api/index.js';
import { Token } from '@/client/token.js';
// import { Session } from '@/client/session.js';
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

export class Bot {
  public appid: string;
  public logger: Logger;

  private token: Token;
  private api!: Omit<AsyncReturnType<typeof createApi>, 'request'>;
  private request!: ReturnType<typeof createRequest>;
  // private session!: Session;

  constructor(private config: BotConfig) {
    config.data_dir ??= join(process.cwd(), 'data');
    config.log_level ??= 'INFO';

    this.appid = config.appid;
    this.logger = createLogger(config.appid, config.log_level);
    this.token = new Token(config as Required<BotConfig>);

    this.token.once('token.ready', async () => {
      const { request, ...api } = await createApi(this.token);

      this.api = api;
      this.request = request;

      const { data } = await this.api.getGateway();

      // this.session = new Session({
      //   url: data.url,
      //   appid: this.appid,
      //   token: this.token.value,
      // });
    });
  }
}
