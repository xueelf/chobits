type Listener<Arguments extends unknown[]> = (...args: Arguments) => unknown;

/**
 * 类型安全的异步事件分发器。
 *
 * @typeParam Events - 事件名与监听器参数元组的映射。
 */
export class EventEmitter<Events extends Record<keyof Events, unknown[]>> {
  private readonly listeners: Partial<{
    [Event in keyof Events]: Set<Listener<Events[Event]>>;
  }> = Object.create(null);

  /**
   * 订阅事件。
   *
   * @typeParam Event - 事件名。
   * @param event - 事件名。
   * @param listener - 事件监听器。
   * @returns 当前实例。
   */
  public on<Event extends keyof Events>(event: Event, listener: Listener<Events[Event]>): this {
    const listeners = this.listeners[event] ?? new Set<Listener<Events[Event]>>();

    listeners.add(listener);
    this.listeners[event] = listeners;

    return this;
  }

  /**
   * 移除指定事件监听器。
   *
   * @typeParam Event - 事件名。
   * @param event - 事件名。
   * @param listener - 传给 `on()` 的同一个监听器。
   * @returns 当前实例。
   */
  public off<Event extends keyof Events>(event: Event, listener: Listener<Events[Event]>): this {
    this.listeners[event]?.delete(listener);

    return this;
  }

  /**
   * 触发事件。
   *
   * 直接调用该事件的监听器，不经过中间件链。
   * 所有监听器并发执行，全部完成后本次调用才结束。
   *
   * @typeParam Event - 事件名。
   * @param event - 事件名。
   * @param args - 事件参数。
   * @throws 监听器执行失败时，在全部监听器完成后按注册顺序抛出首个错误。
   */
  public async emit<Event extends keyof Events>(event: Event, ...args: Events[Event]): Promise<void> {
    const listeners = this.listeners[event];

    if (listeners) {
      const results = await Promise.allSettled([...listeners].map(async listener => await listener(...args)));

      for (const result of results) {
        if (result.status === 'rejected') {
          throw result.reason;
        }
      }
    }
  }
}
