import { isObject } from '#/utils/type';

/**
 * 递归将对象属性设为只读，函数类型保持不变。
 *
 * @typeParam Value - 需要转换的值类型。
 */
export type ReadonlyDeep<Value> = Value extends object
  ? Value extends (...args: never[]) => unknown
    ? Value
    : { readonly [Key in keyof Value]: ReadonlyDeep<Value[Key]> }
  : Value;

/**
 * 复制值，优先使用 `structuredClone()`。
 *
 * 结构化克隆失败时，改用 JSON 序列化和解析。
 *
 * @typeParam T - 待复制的值类型。
 * @param value - 待复制的值。
 * @returns 复制后的值。若 JSON 序列化返回 `undefined`，则返回原值。
 */
export function deepClone<T = unknown>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    const stringified = JSON.stringify(value, (_key, current) => {
      return current instanceof Headers ? Object.fromEntries(current) : current;
    });

    if (!stringified) {
      return value;
    }
    return JSON.parse(stringified);
  }
}

const freezeObject = (value: object, visited: WeakSet<object>): void => {
  if (visited.has(value)) {
    return;
  }
  visited.add(value);

  for (const key of Reflect.ownKeys(value)) {
    const property = Reflect.get(value, key);

    if (isObject(property)) {
      freezeObject(property, visited);
    }
  }
  Object.freeze(value);
};

/**
 * 冻结对象及其嵌套对象。
 *
 * @typeParam Value - 待冻结的对象类型。
 * @param value - 待冻结的对象。
 * @returns 冻结后的原对象。
 */
export const deepFreeze = <Value extends object>(value: Value): ReadonlyDeep<Value> => {
  freezeObject(value, new WeakSet());
  return <ReadonlyDeep<Value>>value;
};
