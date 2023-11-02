import request from '@/utils/request.js';

interface AppAccessToken {
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
export function getAppAccessToken(appId: string, clientSecret: string) {
  return request.post<AppAccessToken>('https://bots.qq.com/app/getAppAccessToken', {
    appId,
    clientSecret,
  });
}
