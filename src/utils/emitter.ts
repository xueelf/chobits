type Listener<Arguments extends unknown[]> = (...args: Arguments) => unknown;

export class EventEmitter<Events extends Record<keyof Events, unknown[]>> {
  private readonly listeners: Partial<{
    [Event in keyof Events]: Set<Listener<Events[Event]>>;
  }> = Object.create(null);

  /**
   * 订阅事件。
   *
   * @param event 事件名。
   * @param listener 事件监听器。
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
   * @param event 事件名。
   * @param listener 传给 `on()` 的同一个监听器。
   * @returns 当前实例。
   */
  public off<Event extends keyof Events>(event: Event, listener: Listener<Events[Event]>): this {
    this.listeners[event]?.delete(listener);

    return this;
  }

  /**
   * 触发事件。
   *
   * 该方法直接调用对应监听器，不会进入中间件链。
   *
   * @param event 事件名。
   * @param args 事件参数。
   * @returns 事件监听器执行完成后结束。
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
