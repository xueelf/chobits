/**
 * 生成指定闭区间内的随机整数。
 *
 * @param min 最小值。
 * @param max 最大值。
 * @returns `min` 至 `max` 之间的随机整数。
 */
export const createRandom = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
