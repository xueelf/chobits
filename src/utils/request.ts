import { AnyObject, deepAssign, objectToParams } from '@/utils/common';

/** 方法 */
type Method = 'GET' | 'DELETE' | 'POST' | 'PUT' | 'PATCH';
type Data = AnyObject | null;
type Config = Omit<RequestConfig, 'method' | 'url'>;

export class RequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestError';
  }
}

/** 请求配置项 */
export interface RequestConfig extends RequestInit {
  baseURL?: string;
  method: Method;
  url: string;
}

/** 请求拦截器 */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
/** 响应拦截器 */
export type ResponseInterceptor = (result: Result) => Result | Promise<Result>;

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

export class Request {
  private requestInterceptors: RequestInterceptor[];
  private responseInterceptors: ResponseInterceptor[];

  constructor() {
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
    const response = await fetch((config.baseURL ?? '') + config.url, config);
    const result: Partial<Result> = {
      status: response.status,
      config,
      statusText: response.statusText,
      headers: response.headers,
    };

    try {
      result.data = <Data>await response.json();
    } catch (error) {
      if (!response.ok) {
        throw error instanceof Error ? error : new RequestError('Request failed.');
      }
      result.data = null;
    }

    for (const interceptor of this.responseInterceptors) {
      deepAssign(result, await interceptor(<Result>result));
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
