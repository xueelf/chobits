import { type Dispatch } from '#/core/payload';
import { type ReadonlyDeep } from '#/utils/object';

/**
 * 事件中间件上下文。
 *
 * 同一事件的所有中间件共享一个 Context。
 *
 * @typeParam State 中间件共享状态。
 */
export interface Context<State extends object = Record<string, unknown>> {
  /** 深层只读并冻结的原始 Dispatch Payload。 */
  readonly payload: ReadonlyDeep<Dispatch>;
  /** 事件共享状态。 */
  readonly state: State;
}

/**
 * 事件中间件。
 *
 * 调用 `next()` 后继续执行后续中间件与事件监听器。不调用 `next()` 时，当前事件不再继续分发。
 *
 * @typeParam State 中间件共享状态。
 * @param context 事件上下文。
 * @param next 继续执行后续中间件与事件监听器。
 */
export type Middleware<State extends object = Record<string, unknown>> = (
  context: Context<State>,
  next: () => Promise<void>,
) => unknown;

/**
 * 组合事件中间件，并确保每个中间件只能调用一次 `next()`。
 *
 * @param middlewares 事件中间件。
 * @returns 中间件执行函数。
 */
export const compose = (middlewares: readonly Middleware[]): Middleware => {
  return async (context, next) => {
    let lastIndex = -1;

    const dispatch = async (nextIndex: number): Promise<void> => {
      if (nextIndex <= lastIndex) {
        throw new Error('next() called multiple times');
      }
      const middleware = middlewares[nextIndex];

      lastIndex = nextIndex;

      if (!middleware) {
        await next();

        return;
      }
      await middleware(context, () => dispatch(nextIndex + 1));
    };

    await dispatch(0);
  };
};
