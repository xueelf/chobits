import type { Logger } from 'log4js';

import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { existsSync, mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

import { BotConfig } from '@/client/bot.js';
import { getLogger } from '@/utils/logger.js';
import { postRequest } from '@/utils/request.js';

export interface AppAccessToken {
  /** 获取到的凭证。 */
  access_token: string;
  /** 凭证有效时间，单位：秒。目前是7200秒之内的值。 */
  expires_in: number;
}

export class Token extends EventEmitter {
  public value: string;
  public lifespan: number;
  public file: string;

  private logger: Logger;

  constructor(public config: Required<BotConfig>) {
    super();

    this.value = '';
    this.lifespan = 0;
    this.file = join(config.data_dir, config.appid, 'token.json');
    this.logger = getLogger(config.appid)!;

    this.initData();
  }

  private get is_expires() {
    return this.lifespan - Date.now() < 6000;
  }

  private createDir() {
    const { appid, data_dir } = this.config;

    !existsSync(data_dir) && mkdirSync(data_dir);
    const bot_dir = join(data_dir, appid);
    !existsSync(bot_dir) && mkdirSync(bot_dir);
  }

  private async updateToken(): Promise<void> {
    const { appid, secret } = this.config;
    const { data } = await postRequest<AppAccessToken>(
      'https://bots.qq.com/app/getAppAccessToken',
      {
        appId: appid,
        clientSecret: secret,
      },
      {
        appid,
      },
    );

    if (!Object.keys(data).length) {
      this.logger.error('获取 token 失败，请检查 appid 等参数是否有效');
      throw new Error('Please check the config parameter is correct');
    }
    const timestamp = Date.now();

    this.value = data.access_token;
    this.lifespan = timestamp + data.expires_in * 1000;
    this.logger.debug('获取 token 成功');
    await this.writeCache();
  }

  private async initData(): Promise<void> {
    await this.readCache();

    if (this.is_expires) {
      this.logger.debug('未检测到有效值，正在重新获取');
      await this.updateToken();
    } else {
      this.logger.debug('已读取数据');
    }
    this.emit('ready');
  }

  private async readCache() {
    this.logger.trace('开始解析 token 缓存文件...');
    this.createDir();

    try {
      const data = await readFile(this.file, 'utf8');
      const cache = JSON.parse(data);

      this.value = cache.value;
      this.lifespan = cache.lifespan;
    } catch (error) {}
  }

  private async writeCache() {
    const cache = {
      value: this.value,
      lifespan: this.lifespan,
    };
    // TODO: ／人◕ ‿‿ ◕人＼ 明文加密（话说这有加密的必要么）
    try {
      await writeFile(this.file, JSON.stringify(cache, null, 2));
      this.logger.debug('写入缓存成功');
    } catch (error) {
      this.logger.error('写入缓存失败');
    }
  }
}
