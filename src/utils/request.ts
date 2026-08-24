import { type EmbusInstance, createInstance } from 'embus';

import { OPEN_API_ORIGIN } from '#/api/index';
import { Auth } from '#/core/auth';
import { type Logger } from '#/core/logger';
import { isRecord, isString } from '#/utils/type';

/** 创建已鉴权并处理 QQ 业务错误的网络请求实例。 */
export const createRequest = (auth: Auth, logger?: Logger): EmbusInstance => {
  const request = createInstance({ origin: OPEN_API_ORIGIN });

  request.useRequestInterceptor(async config => {
    config.headers = new Headers(config.headers);
    config.headers.set('Authorization', await auth.getAuthorization());

    logger?.('openapi', '发送 OpenAPI 请求', config);

    return config;
  });
  request.useResponseInterceptor(response => {
    const { data } = response;
    const failed = isRecord(data) && Boolean(data.err_code);

    logger?.('openapi', '收到 OpenAPI 响应', response);

    if (failed) {
      throw new Error(isString(data.message) ? data.message : 'QQ OpenAPI request failed');
    }
    return data;
  });

  return request;
};
