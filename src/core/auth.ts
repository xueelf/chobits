import { type AccessToken, type AccessTokenError, getAccessToken } from '#/api/bot';
import { type Logger } from '#/core/logger';
import { isNumber, isRecord } from '#/utils/type';

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60000;

const isAccessTokenError = (data: unknown): data is AccessTokenError => isRecord(data) && isNumber(data.code);

export class Auth {
  /** Access Token。 */
  private accessToken: string | null = null;
  /** Access Token 过期时间戳，单位为毫秒。 */
  private expiresAtMs = 0;
  /** Access Token 刷新请求。 */
  private refreshPromise: Promise<string> | null = null;

  /**
   * 初始化 QQ 鉴权。
   *
   * @param appId 机器人 AppID。
   * @param clientSecret 机器人 AppSecret。
   * @param logger SDK 日志回调。
   */
  public constructor(
    private readonly appId: string,
    private readonly clientSecret: string,
    private readonly logger?: Logger,
  ) {}

  /**
   * 获取 Authorization。
   *
   * Access Token 即将过期时自动刷新，并合并同时发生的刷新请求。
   *
   * @returns QQ OpenAPI 和 Gateway 使用的 Authorization。
   */
  public async getAuthorization(): Promise<string> {
    return `QQBot ${await this.getAccessToken()}`;
  }

  /**
   * 获取 Access Token。
   *
   * @throws 获取失败或凭证无效时抛出。
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.expiresAtMs - ACCESS_TOKEN_REFRESH_BUFFER_MS) {
      return this.accessToken;
    }
    this.refreshPromise ??= (async () => {
      try {
        this.logger?.('auth', '开始获取 Access Token');
        const { data } = await getAccessToken({ appId: this.appId, clientSecret: this.clientSecret });

        if (isAccessTokenError(data)) {
          throw new Error(data.message);
        }
        const { access_token: accessToken, expires_in: expiresInValue } = <AccessToken>data;
        const expiresIn = Number(expiresInValue);

        this.accessToken = accessToken;
        this.expiresAtMs = Date.now() + expiresIn * 1000;
        this.logger?.('auth', 'Access Token 获取成功', { expiresIn });

        return accessToken;
      } catch (error) {
        this.logger?.('auth', 'Access Token 获取失败', { error });

        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return await this.refreshPromise;
  }
}
