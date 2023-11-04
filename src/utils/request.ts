import { getLogger } from '@/utils/logger.js';

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

async function baseRequest<T>(url: string, config?: RequestConfig): Promise<Result<T>> {
  const logger = getLogger(config?.appid ?? '');
  const defaultConfig: Omit<RequestConfig, 'method'> = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const response = await fetch((config?.baseURL ?? '') + url, { ...defaultConfig, ...config });
  const result: Partial<Result> = {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };

  logger?.debug(`Request: ${response.url}`);

  try {
    const data = <Data>await response.json();

    if (data.code) {
      // TODO: ／人◕ ‿‿ ◕人＼ 处理 token 重新获取
      logger?.error(`Code: ${data.code}`);
      throw new RequestError(<string>data.message);
    }
    result.data = data;
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
    return baseRequest(firstArg, lastArg);
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
