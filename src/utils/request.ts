import { type TotteInstance, createInstance } from 'totte';

import { OPEN_API_ORIGIN } from '#/api/index';
import { Auth } from '#/core/auth';
import { type Logger } from '#/core/logger';
import { isRecord, isString } from '#/utils/type';

/** 创建已鉴权并处理 QQ 业务错误的网络请求实例。 */
export const createRequest = (auth: Auth, logger?: Logger): TotteInstance => {
  const request = createInstance({ origin: OPEN_API_ORIGIN });

  request.useRequestInterceptor(async config => {
    const headers = new Headers(config.headers);

    headers.set('Authorization', await auth.getAuthorization());
    logger?.('openapi', '发送 OpenAPI 请求', {
      method: config.method,
      origin: config.origin,
      url: config.url,
      ...(config.payload === undefined ? {} : { payload: config.payload }),
    });

    return { ...config, headers };
  });
  request.useResponseInterceptor(response => {
    const data = response.data;
    const details = {
      method: response.config.method,
      origin: response.config.origin,
      url: response.config.url,
      ...(response.config.payload === undefined ? {} : { payload: response.config.payload }),
      status: response.status,
    };

    if (!isRecord(data) || !(data.err_code || data.code)) {
      logger?.('openapi', '收到 OpenAPI 响应', { ...details, data });

      return;
    }
    const error = new Error(isString(data.message) ? data.message : 'QQ OpenAPI request failed');

    Object.assign(error, data, { status: response.status });
    logger?.('openapi', 'OpenAPI 返回业务错误', { ...details, error });

    throw error;
  });

  return request;
};
