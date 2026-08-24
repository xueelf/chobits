import { isObject } from '#/utils/type';

/** 深层只读类型。 */
export type ReadonlyDeep<Value> = Value extends object
  ? Value extends (...args: never[]) => unknown
    ? Value
    : { readonly [Key in keyof Value]: ReadonlyDeep<Value[Key]> }
  : Value;

/** 深拷贝值。 */
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

/** 递归冻结对象。 */
export const deepFreeze = <Value extends object>(value: Value): ReadonlyDeep<Value> => {
  freezeObject(value, new WeakSet());
  return <ReadonlyDeep<Value>>value;
};
