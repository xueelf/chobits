import { Client } from './client';

interface AppAccessToken {
  /** 获取到的凭证。 */
  access_token: string;
  /** 凭证有效时间，单位：秒。目前是 `7200` 秒之内的值。 */
  expires_in: number;
}

export class Token {
  public value: string;
  /** 有效期 */
  public lifespan: number;

  constructor(private client: Client) {
    this.value = '';
    this.lifespan = 0;
  }

  public get authorization(): string {
    return `QQBot ${this.value}`;
  }

  private get is_expires(): boolean {
    return this.lifespan - Date.now() < 6000;
  }

  private async getAppAccessToken(): Promise<AppAccessToken> {
    const { appid, secret } = this.client.config;
    const { data } = await this.client.request.post<AppAccessToken>(
      'https://bots.qq.com/app/getAppAccessToken',
      {
        appId: appid,
        clientSecret: secret,
      },
    );

    return data;
  }

  public async renew(): Promise<void> {
    if (!this.is_expires) {
      return;
    }

    try {
      const { access_token, expires_in }: AppAccessToken = await this.getAppAccessToken();
      const timestamp: number = Date.now();

      this.value = access_token;
      this.lifespan = timestamp + expires_in * 1000;
    } catch (error) {
      this.client.logger.error('获取 token 失败，请检查网络以及 appid 等参数是否有效');
      throw new Error('Please check the config parameter is correct');
    }
  }
}
