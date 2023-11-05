import type { Logger } from 'log4js';

import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { existsSync, mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

import { BotConfig } from '@/client/bot.js';
import { getLogger } from '@/utils/logger.js';
import { objectToString } from '@/utils/common.js';

export interface AppAccessToken {
  /** 获取到的凭证。 */
  access_token: string;
  /** 凭证有效时间，单位：秒。目前是7200秒之内的值。 */
  expires_in: number;
}

/**
 * 获取接口凭证
 *
 * @param appId - 在开放平台管理端上获得。
 * @param clientSecret - 在开放平台管理端上获得。
 */
export async function getAppAccessToken(appId: string, clientSecret: string): Promise<AppAccessToken> {
  const response = await fetch('https://bots.qq.com/app/getAppAccessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appId,
      clientSecret,
    }),
  });
  return <Promise<AppAccessToken>>response.json();
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

    if (!existsSync(data_dir)) {
      mkdirSync(data_dir);
    }
    const bot_dir = join(data_dir, appid);

    if (!existsSync(bot_dir)) {
      mkdirSync(bot_dir);
      this.logger.info(`已创建 ${bot_dir} 目录`);
    }
  }

  private async initData(): Promise<void> {
    await this.readCache();

    if (this.is_expires) {
      this.logger.debug('未检测到有效值，开始重新获取');
      await this.renewToken();
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
      await writeFile(this.file, objectToString(cache));
      this.logger.debug('写入缓存成功');
    } catch (error) {
      this.logger.error('写入缓存失败');
    }
  }

  public async renewToken(): Promise<void> {
    const { appid, secret } = this.config;

    try {
      const data = await getAppAccessToken(appid, secret);
      const timestamp = Date.now();

      this.value = data.access_token;
      this.lifespan = timestamp + data.expires_in * 1000;

      this.logger.debug(`Token: ${objectToString(data)}`);
      await this.writeCache();
    } catch (error) {
      this.logger.error('获取 token 失败，请检查 appid 等参数是否有效');
      throw new Error('Please check the config parameter is correct');
    }
  }
}
