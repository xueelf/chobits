/** 判断值是否为字符串。 */
export const isString = (value: unknown): value is string => typeof value === 'string';

/** 判断值是否为数字。 */
export const isNumber = (value: unknown): value is number => typeof value === 'number';

/** 判断值是否为 Error。 */
export const isError = (value: unknown): value is Error => value instanceof Error;

/** 判断值是否为非 null 对象。 */
export const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null;

/** 判断值是否为非 null 且非数组的对象。 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
