import { ClientConfig } from '@/bot/client';
import { objectToString } from '@/utils/common';
import { Logger, getLogger } from '@/utils/logger';

interface AppAccessToken {
  /** 获取到的凭证。 */
  access_token: string;
  /** 凭证有效时间，单位：秒。目前是 7200 秒之内的值。 */
  expires_in: number;
}

/**
 * 获取接口凭证
 *
 * @param appId - 在开放平台管理端上获得。
 * @param clientSecret - 在开放平台管理端上获得。
 */
async function getAppAccessToken(appId: string, clientSecret: string): Promise<AppAccessToken> {
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

export class Token {
  public value: string;
  /** 有效期 */
  public lifespan: number;

  /** 记录器 */
  private logger: Logger;

  constructor(private config: ClientConfig) {
    this.value = '';
    this.lifespan = 0;
    this.logger = getLogger(config.appid);
  }

  public get authorization() {
    return `QQBot ${this.value}`;
  }

  private get is_expires() {
    return this.lifespan - Date.now() < 6000;
  }

  public async renew(): Promise<void> {
    if (!this.is_expires) {
      return;
    }
    const { appid, secret } = this.config;

    try {
      this.logger.trace('开始获取 token 令牌...');

      const data = await getAppAccessToken(appid, secret);
      const timestamp = Date.now();

      this.value = data.access_token;
      this.lifespan = timestamp + data.expires_in * 1000;

      this.logger.debug(`Token: ${objectToString(data)}`);
    } catch (error) {
      this.logger.error('获取 token 失败，请检查网络以及 appid 等参数是否有效');
      throw new Error('Please check the config parameter is correct');
    }
  }
}
