import { getLogger } from '@/utils/logger.js';
import { deepAssign } from '@/utils/common.js';

export type Data = Record<string, unknown>;
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestConfig extends RequestInit {
  appid?: string;
  baseURL?: string;
  method: Method;
  url?: string;
}

export interface Result<T = Data> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export class RequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestError';
  }
}

async function baseRequest<T>(url: string, config: RequestConfig): Promise<Result<T>> {
  const logger = getLogger(config.appid ?? '');
  const defaultConfig: Omit<RequestConfig, 'method'> = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  config = <RequestConfig>deepAssign(defaultConfig, config);
  config.url ??= url;

  logger?.trace('开始发起网络请求...');

  const response = await fetch((config.baseURL ?? '') + url, config);
  const result: Partial<Result> = {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };

  logger?.debug(`Request: ${JSON.stringify(config, null, 2)}`);

  try {
    const data = <Data>await response.json();

    // 异常处理
    // if (data.code) {
    //   logger?.debug(`Code: ${data.code}`);
    //   throw new RequestError(<string>data.message);
    // }
    result.data = data;

    logger?.debug(`Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    if (!response.ok) {
      logger?.error(error);
      throw error instanceof Error ? error : new RequestError('Request failed');
    }
    result.data = {};
  }
  return <Result<T>>result;
}

export async function request<T = Data>(config: RequestConfig): Promise<Result<T>>;
export async function request<T = Data>(url: string, config?: RequestConfig): Promise<Result<T>>;
export async function request<T = Data>(firstArg: string | RequestConfig, lastArg?: RequestConfig): Promise<Result<T>> {
  if (typeof firstArg === 'string') {
    return baseRequest(firstArg, lastArg ?? { method: 'GET' });
  } else if (typeof firstArg === 'object' && firstArg.url) {
    return baseRequest(firstArg.url, firstArg);
  } else {
    throw new RequestError('Bad parameter');
  }
}

export function getRequest<T = Data>(url: string, config?: Omit<RequestConfig, 'method'>): Promise<Result<T>> {
  return request(url, { ...config, method: 'GET' });
}

export function postRequest<T = Data>(
  url: string,
  data?: Data,
  config: Omit<RequestConfig, 'method'> = {},
): Promise<Result<T>> {
  config.body = JSON.stringify(data);

  return request(url, {
    ...config,
    ...{
      method: 'POST',
    },
  });
}

export function createRequest(config: Omit<RequestConfig, 'method'>) {
  return {
    config,
    get<T = Data>(url: string, config?: RequestConfig) {
      return getRequest<T>(url, { ...config, ...this.config });
    },
    post<T = Data>(url: string, data?: Data, config?: RequestConfig) {
      return postRequest<T>(url, data, { ...config, ...this.config });
    },
  };
}

export default {
  create: createRequest,
  get: getRequest,
  pose: postRequest,
};
