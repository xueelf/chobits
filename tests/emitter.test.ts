import { expect, test } from 'bun:test';

import { EventEmitter } from '#/utils/emitter';

test('移除事件监听器', async () => {
  const emitter = new EventEmitter<{ change: [value: number, source: string] }>();
  const values: Array<[number, string]> = [];
  const listener = async (value: number, source: string) => values.push([value, source]);

  emitter.on('change', listener);
  await emitter.emit('change', 1, '测试');
  emitter.off('change', listener);
  await emitter.emit('change', 2, '测试');

  expect(values).toEqual([[1, '测试']]);
});

test('同步监听器错误', async () => {
  const emitter = new EventEmitter<{ change: [] }>();
  const error = new Error('监听器执行失败');
  const calls: string[] = [];

  emitter.on('change', () => {
    calls.push('失败监听器');
    throw error;
  });
  emitter.on('change', () => {
    calls.push('后续监听器');
  });

  await expect(emitter.emit('change')).rejects.toBe(error);
  expect(calls).toEqual(['失败监听器', '后续监听器']);
});

test('异步监听器错误', async () => {
  const emitter = new EventEmitter<{ change: [] }>();
  const error = new Error('监听器执行失败');
  const calls: string[] = [];

  emitter.on('change', async () => {
    await Promise.resolve();
    throw error;
  });
  emitter.on('change', async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    calls.push('监听器执行完成');
  });

  await expect(emitter.emit('change')).rejects.toBe(error);
  expect(calls).toEqual(['监听器执行完成']);
});

test('Object 原型属性事件名', async () => {
  type Events = {
    constructor: [value: string];
    toString: [value: string];
    __proto__: [value: string];
  };

  const emitter = new EventEmitter<Events>();
  const events: Array<keyof Events> = ['constructor', 'toString', '__proto__'];
  const calls: string[] = [];

  for (const event of events) {
    const listener = (value: string) => calls.push(`${String(event)}:${value}`);

    emitter.on(event, listener);
    await emitter.emit(event, '第一次');
    emitter.off(event, listener);
    await emitter.emit(event, '第二次');
  }

  expect(calls).toEqual(['constructor:第一次', 'toString:第一次', '__proto__:第一次']);
});
