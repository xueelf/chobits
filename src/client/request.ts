import type { Logger } from 'log4js';
import { getLogger } from '@/utils/logger';
import { AnyObject, deepAssign, objectToParams, objectToString } from '@/utils/common';

/** 方法 */
export type Method = 'GET' | 'DELETE' | 'POST' | 'PUT' | 'PATCH';
/** 请求拦截器 */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
/** 响应拦截器 */
export type ResponseInterceptor = (data: AnyObject) => AnyObject | Promise<AnyObject>;

/** 请求配置项 */
export interface RequestConfig extends RequestInit {
  baseURL?: string;
  method: Method;
  url: string;
}

type Config = Omit<RequestConfig, 'method' | 'url'>;

export type Data = AnyObject | null;

/** 请求结果集 */
export interface Result<T = Data> {
  data: T;
  /** 请求配置项 */
  config: RequestConfig;
  /** 响应状态码 */
  status: number;
  /** 状态码消息 */
  statusText: string;
  /** 请求头 */
  headers: Headers;
}

class RequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestError';
  }
}

export class Request {
  private logger: Logger;
  private requestInterceptors: RequestInterceptor[];
  private responseInterceptors: ResponseInterceptor[];

  constructor(appid: string) {
    this.logger = getLogger(appid);
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /** 添加请求拦截器 */
  public useRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /** 添加响应拦截器 */
  public useResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  public async base<T>(config: RequestConfig): Promise<Result<T>> {
    const defaultConfig: Config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    config = <RequestConfig>deepAssign(defaultConfig, config);

    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }
    this.logger.trace('开始发起网络请求...');

    const response = await fetch((config.baseURL ?? '') + config.url, config);
    const result: Partial<Result> = {
      status: response.status,
      config,
      statusText: response.statusText,
      headers: response.headers,
    };

    this.logger.debug(`Request: ${objectToString(config)}`);

    try {
      result.data = <Data>await response.json();

      for (const interceptor of this.responseInterceptors) {
        result.data = await interceptor(result.data!);
      }
      this.logger.debug(`Response: ${objectToString(result.data)}`);
    } catch (error) {
      if (!response.ok) {
        this.logger.error(error);
        throw error instanceof Error ? error : new RequestError('Request failed.');
      }
      result.data = null;
    }
    return <Result<T>>result;
  }

  public get<T = Data>(url: string, params?: AnyObject, config?: Config): Promise<Result<T>> {
    if (params) {
      url += (/\?/.test(url) ? '&' : '?') + objectToParams(params);
    }
    return this.base<T>({
      url,
      method: 'GET',
      ...config,
    });
  }

  public delete<T = Data>(url: string, params?: AnyObject, config: Config = {}): Promise<Result<T>> {
    config.body = JSON.stringify(params);

    return this.base<T>({
      url,
      method: 'DELETE',
      ...config,
    });
  }

  public post<T = Data>(url: string, params?: AnyObject, config: Config = {}): Promise<Result<T>> {
    config.body = JSON.stringify(params);

    return this.base<T>({
      url,
      method: 'POST',
      ...config,
    });
  }

  public put<T = Data>(url: string, params?: AnyObject, config: Config = {}): Promise<Result<T>> {
    config.body = JSON.stringify(params);

    return this.base<T>({
      url,
      method: 'PUT',
      ...config,
    });
  }

  public patch<T = Data>(url: string, params?: AnyObject, config: Config = {}): Promise<Result<T>> {
    config.body = JSON.stringify(params);

    return this.base<T>({
      url,
      method: 'PATCH',
      ...config,
    });
  }
}
