export type Data = Record<string, unknown>;
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface Config extends RequestInit {
  baseURL?: string;
  method?: Method;
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

async function baseRequest<T>(url: string, config?: Config): Promise<Result<T>> {
  const defaultConfig: Config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const response = await fetch(config?.baseURL ?? '' + url, { ...defaultConfig, ...config });
  const result: Partial<Result> = {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };

  try {
    result.data = <Data>await response.json();
  } catch (error) {
    if (!response.ok) {
      throw new RequestError('Request failed');
    }
    result.data = {};
  }

  return <Result<T>>result;
}

export async function request<T = Data>(config: Config): Promise<Result<T>>;
export async function request<T = Data>(url: string, config?: Config): Promise<Result<T>>;
export async function request<T = Data>(firstArg: string | Config, lastArg?: Config): Promise<Result<T>> {
  if (typeof firstArg === 'string') {
    return baseRequest(firstArg, lastArg);
  } else if (typeof firstArg === 'object' && firstArg.url) {
    return baseRequest(firstArg.url, firstArg);
  } else {
    throw new RequestError('Bad parameter');
  }
}

export function getRequest<T = Data>(url: string, config?: Config): Promise<Result<T>> {
  config ??= {
    method: 'GET',
  };
  config.method = 'GET';

  return request(url, config);
}

export function postRequest<T = Data>(url: string, data?: Data, config?: Config): Promise<Result<T>> {
  config ??= {
    method: 'POST',
  };
  config.method = 'POST';
  config.body = JSON.stringify(data);

  return request(url, config);
}

export function create(config: Config) {
  return {
    config,
    get<T = Data>(url: string, config?: Config) {
      return getRequest<T>(url, { ...config, ...this.config });
    },
    post<T = Data>(url: string, data?: Data, config?: Config) {
      return postRequest<T>(url, data, { ...config, ...this.config });
    },
  };
}

export default {
  get: getRequest,
  post: postRequest,
  create,
};
