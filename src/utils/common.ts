/**
 * 对象深合并，用法与 `Object.assign()` 保持一致。
 *
 * @param target - 目标对象，接收源对象属性的对象，也是修改后的返回值。
 * @param sources - 源对象，包含将被合并的属性。
 * @returns 目标对象。
 */
export function deepAssign(target: any, ...sources: unknown[]): object {
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];

    if (!source || typeof source !== `object`) {
      return target;
    }
    Object.entries(source).forEach(([key, value]) => {
      if (!value || typeof value !== `object`) {
        target[key] = value;
        return;
      }
      if (Array.isArray(value)) {
        target[key] = [];
      }
      if (typeof target[key] !== `object` || !target[key]) {
        target[key] = {};
      }
      deepAssign(target[key], value);
    });
  }
  return target;
}

export function objectToParams(object: object): string {
  const params = new URLSearchParams();
  const keys = Object.keys(object);

  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const value = Reflect.get(object, key);

    params.append(key, value);
  }
  return params.toString();
}

export function parseBody(params?: object): Required<RequestInit['body']> {
  if (!params) {
    return;
  }
  const has_blob = Object.entries(params).some(([_, value]) => value instanceof Blob);

  if (has_blob) {
    const formData = new FormData();
    const keys = Object.keys(params);

    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      const value = Reflect.get(params, key);

      formData.append(key, value);
    }
    return formData;
  }
  return JSON.stringify(params);
}

export function objectToString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value, null, 2);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function parseError(error: unknown): string {
  return error instanceof Error ? error.message : objectToString(error);
}
