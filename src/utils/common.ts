export type AnyObject = Record<any, any>;

/**
 * 对象深合并，用法与 `Object.assign()` 保持一致。
 *
 * @param target - 目标对象，接收源对象属性的对象，也是修改后的返回值。
 * @param sources - 源对象，包含将被合并的属性。
 * @returns 目标对象。
 */
export function deepAssign(target: AnyObject, ...sources: unknown[]): object {
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];

    if (!source || typeof source !== `object`) {
      return target;
    }
    Object.entries(source).forEach(([key, value]) => {
      if (value instanceof Date) {
        target[key] = new Date(value);
        return;
      }
      if (value instanceof RegExp) {
        target[key] = new RegExp(value);
        return;
      }
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

export function objectToParams(object: AnyObject) {
  const params = new URLSearchParams();

  for (const key in object) {
    params.append(key, object[key]);
  }
  return params.toString();
}

export function objectToString(object: unknown) {
  return JSON.stringify(object, null, 2);
}

export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
