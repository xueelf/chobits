import { expect, spyOn, test } from 'bun:test';

import { MockWebhook } from './mocks/webhook';

import { type Dispatch, type DispatchData } from '#/core/payload';
import { type Logger, Client } from '#/index';
import { type ReadonlyDeep } from '#/utils/object';
import { createSigningKey, sign } from '#/utils/signature';

const secret = 'naOC0ocQE3shWLAfffVLB1rhYPG7';

const createCallbackRequest = async (body: string): Promise<Request> => {
  const timestamp = '1725442341';
  const signature = await sign(await createSigningKey(secret), timestamp + body);

  return new Request('https://example.com/callback', {
    method: 'POST',
    headers: {
      'X-Signature-Ed25519': signature,
      'X-Signature-Timestamp': timestamp,
    },
    body,
  });
};

const createFriendDelete = (): DispatchData['FRIEND_DEL'] => ({
  author: { union_openid: '' },
  openid: 'user-openid',
  timestamp: Math.floor(Date.now() / 1000),
});

test('回调地址验证', async () => {
  const logs: Parameters<Logger>[] = [];
  const logger: Logger = (...entry) => logs.push(entry);
  const client = new Client({ appId: 'app-id', clientSecret: 'DG5g3B4j9X2KOErG', logger });
  const response = await client.callback(
    new Request('https://example.com/callback', {
      method: 'POST',
      body: JSON.stringify({
        op: 13,
        d: { plain_token: 'Arq0D5A61EgUu4OxUvOp', event_ts: '1725442341' },
      }),
    }),
  );

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    plain_token: 'Arq0D5A61EgUu4OxUvOp',
    signature:
      '87befc99c42c651b3aac0278e71ada338433ae26fcb24307bdc5ad38c1adc2d01bcfcadc0842edac85e85205028a1132afe09280305f13aa6909ffc2d652c706',
  });
  expect(logs).toEqual([
    ['webhook', '收到 Webhook 请求', { method: 'POST', url: 'https://example.com/callback' }],
    ['webhook', 'Webhook 回调地址验证完成', { status: 200 }],
  ]);
  expect(JSON.stringify(logs)).not.toContain('Arq0D5A61EgUu4OxUvOp');
});

test('事件签名与 ACK', async () => {
  const timestamp = '1725442341';
  const body = JSON.stringify({
    op: 0,
    t: 'FRIEND_DEL',
    d: createFriendDelete(),
  });
  const signature = await sign(await createSigningKey(secret), timestamp + body);
  const client = new Client({ appId: 'app-id', clientSecret: secret });
  const received: { openid: string | null } = { openid: null };
  const tasks: Promise<void>[] = [];

  client.on('FRIEND_DEL', event => {
    received.openid = event.openid;
  });
  const response = await client.callback(
    new Request('https://example.com/callback', {
      method: 'POST',
      headers: {
        'X-Signature-Ed25519': signature,
        'X-Signature-Timestamp': timestamp,
      },
      body,
    }),
    task => tasks.push(task),
  );

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ op: 12 });
  await Promise.all(tasks);
  expect(received.openid).toBe('user-openid');
});

test('ACK 响应时机', async () => {
  const body = JSON.stringify({
    op: 0,
    t: 'FRIEND_DEL',
    d: createFriendDelete(),
  });
  const started = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const tasks: Promise<void>[] = [];
  const state = { started: false, completed: false };
  const client = new Client({ appId: 'app-id', clientSecret: secret });

  client.on('FRIEND_DEL', async () => {
    state.started = true;
    started.resolve();
    await release.promise;
    state.completed = true;
  });
  const response = await client.callback(await createCallbackRequest(body), task => tasks.push(task));

  try {
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ op: 12 });
    expect(state.started).toBeFalse();
    expect(state.completed).toBeFalse();
    expect(tasks).toHaveLength(1);

    await started.promise;
  } finally {
    release.resolve();
    await Promise.all(tasks);
  }
  expect(state.completed).toBeTrue();
});

test('事件任务注册', async () => {
  const body = JSON.stringify({
    op: 0,
    t: 'FRIEND_DEL',
    d: createFriendDelete(),
  });
  const release = Promise.withResolvers<void>();
  const tasks: Promise<unknown>[] = [];
  const client = new Client({ appId: 'app-id', clientSecret: secret });

  client.on('FRIEND_DEL', async () => {
    await release.promise;
  });
  const response = await client.callback(await createCallbackRequest(body), task => tasks.push(task));

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ op: 12 });
  expect(tasks).toHaveLength(1);

  release.resolve();
  await Promise.all(tasks);
});

test('事件任务异常', async () => {
  const body = JSON.stringify({
    op: 0,
    t: 'FRIEND_DEL',
    d: createFriendDelete(),
  });
  const error = new Error('事件处理失败');
  const tasks: Promise<void>[] = [];
  const client = new Client({ appId: 'app-id', clientSecret: secret });

  client.on('FRIEND_DEL', () => {
    throw error;
  });
  const response = await client.callback(await createCallbackRequest(body), task => tasks.push(task));

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ op: 12 });
  expect(tasks).toHaveLength(1);
  const [task] = tasks;

  if (!task) {
    throw new Error('宿主未收到 Webhook 事件处理任务');
  }
  await expect(task).rejects.toBe(error);
});

test('事件错误日志', async () => {
  const error = new Error('事件处理失败');
  const failed = Promise.withResolvers<unknown>();
  const webhook = new MockWebhook(secret);
  const client = new Client({
    appId: 'app-id',
    clientSecret: secret,
    logger: (kind, message, data) => {
      if (kind === 'dispatch' && message === 'Dispatch 处理失败') {
        failed.resolve(data?.error);
      }
    },
  });

  client.on('FRIEND_DEL', () => {
    throw error;
  });
  const response = await client.callback(await webhook.sendFriendDelete());

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ op: 12 });
  expect(await failed.promise).toBe(error);
});

test('群消息原始字段', async () => {
  const webhook = new MockWebhook(secret);
  const client = new Client({ appId: 'app-id', clientSecret: secret });
  const received = Promise.withResolvers<ReadonlyDeep<DispatchData['GROUP_MESSAGE_CREATE']>>();
  const request = await webhook.sendGroupMessage({ content: '测试后台任务' });
  const payload: unknown = await request.clone().json();

  client.on('GROUP_MESSAGE_CREATE', event => {
    received.resolve(event);
  });
  const response = await client.callback(request);
  const event = await received.promise;

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ op: 12 });
  expect(event).toMatchObject({
    content: '测试后台任务',
    id: 'group-message-id',
    group_id: 'group-openid',
    group_openid: 'group-openid',
    message_type: 0,
    message_scene: {
      source: 'default',
      ext: ['msg_idx=group-message-index', 'auth_token=group-message-token'],
    },
  });
  expect(Object.isFrozen(event)).toBeTrue();
  expect(Object.isFrozen(event.author)).toBeTrue();
  expect(payload).toMatchObject({
    op: 0,
    id: 'group-message-event-id',
    t: 'GROUP_MESSAGE_CREATE',
    d: {
      id: 'group-message-id',
      group_id: 'group-openid',
      group_openid: 'group-openid',
      message_type: 0,
      message_scene: {
        source: 'default',
        ext: ['msg_idx=group-message-index', 'auth_token=group-message-token'],
      },
    },
  });
  expect(Object.hasOwn(<object>payload, 's')).toBeFalse();
});

test('引用消息数据', async () => {
  const parallelMessage = {
    msg_nodes: [{ message_type: 0, content: '被引用的消息' }],
  };
  const webhook = new MockWebhook(secret);
  const client = new Client({ appId: 'app-id', clientSecret: secret });
  const tasks: Promise<void>[] = [];
  const received: { message_type: number; content: string }[] = [];
  const requests = await Promise.all([
    webhook.sendUserMessage({ message_type: 103, parallel_message: parallelMessage }),
    webhook.sendGroupMessage({ message_type: 103, parallel_message: parallelMessage }),
  ]);

  client.on('C2C_MESSAGE_CREATE', event => {
    if (event.parallel_message) {
      received.push(...event.parallel_message.msg_nodes);
    }
  });
  client.on('GROUP_MESSAGE_CREATE', event => {
    if (event.parallel_message) {
      received.push(...event.parallel_message.msg_nodes);
    }
  });

  for (const request of requests) {
    await client.callback(request, task => tasks.push(task));
  }
  await Promise.all(tasks);
  expect(received).toEqual([...parallelMessage.msg_nodes, ...parallelMessage.msg_nodes]);
});

test('Webhook 事件数据', async () => {
  const events: string[] = [];
  const tasks: Promise<void>[] = [];
  const unionOpenids: string[] = [];
  const webhook = new MockWebhook(secret);
  const client = new Client({ appId: 'app-id', clientSecret: secret }).use(async (context, next) => {
    events.push(context.payload.t);
    await next();
  });
  const requests = await Promise.all([
    webhook.sendUserMessage(),
    webhook.sendGroupAtMessage(),
    webhook.sendFriendAdd(),
    webhook.sendFriendDelete(),
    webhook.sendGroupAddRobot(),
    webhook.sendGroupDeleteRobot(),
    webhook.sendGroupMemberAdd(),
    webhook.sendGroupMemberRemove(),
    webhook.sendUserButtonInteraction(),
    webhook.sendGroupButtonInteraction(),
    webhook.sendGroupAuthorizeStatusInteraction(),
    webhook.sendUserAuthorizeInteraction({
      data: {
        resolved: {
          authorize_data: {
            opt_scene: 'setting',
            scope: 'c2c_push',
            switch: true,
          },
        },
      },
    }),
    webhook.sendUserAuthorizeInteraction({
      data: {
        resolved: {
          authorize_data: { opt_scene: 'setting', scope: 'c2c_push' },
        },
      },
    }),
    webhook.sendUserAuthorizeInteraction({
      data: {
        resolved: {
          authorize_data: { opt_scene: 'friend_del', scope: 'c2c_push' },
        },
      },
    }),
  ]);
  const payloads = await Promise.all(requests.map(async request => <Dispatch>await request.clone().json()));

  client.on('INTERACTION_CREATE', event => {
    if (event.scene === 'c2c') {
      unionOpenids.push(event.union_openid ?? '');
    }
  });

  for (const request of requests) {
    const response = await client.callback(request, task => tasks.push(task));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ op: 12 });
  }
  await Promise.all(tasks);
  expect(payloads.every(payload => !Object.hasOwn(payload, 's'))).toBeTrue();
  expect(payloads).toMatchObject([
    {
      id: 'user-message-event-id',
      t: 'C2C_MESSAGE_CREATE',
      d: {
        author: { id: 'user-openid', user_openid: 'user-openid' },
        id: 'user-message-id',
        message_scene: { ext: ['msg_idx=user-message-index'], source: 'default' },
        message_type: 0,
      },
    },
    {
      id: 'group-at-message-event-id',
      t: 'GROUP_AT_MESSAGE_CREATE',
      d: {
        group_id: 'group-openid',
        group_openid: 'group-openid',
        message_scene: {
          ext: ['msg_idx=group-message-index', 'auth_token=group-message-token'],
          source: 'default',
        },
        message_type: 0,
      },
    },
    {
      id: 'friend-add-event-id',
      t: 'FRIEND_ADD',
      d: { author: { union_openid: '' }, scene: 1000, scene_param: '' },
    },
    {
      id: 'friend-delete-event-id',
      t: 'FRIEND_DEL',
      d: { author: { union_openid: '' }, openid: 'user-openid' },
    },
    {
      id: 'group-add-robot-event-id',
      t: 'GROUP_ADD_ROBOT',
      d: { group_openid: 'group-openid', op_member_openid: 'member-openid' },
    },
    {
      id: 'group-delete-robot-event-id',
      t: 'GROUP_DEL_ROBOT',
      d: { group_openid: 'group-openid', op_member_openid: 'member-openid' },
    },
    {
      id: 'group-member-add-event-id',
      t: 'GROUP_MEMBER_ADD',
      d: { group_openid: 'group-openid', member_openid: 'member-openid' },
    },
    {
      id: 'group-member-remove-event-id',
      t: 'GROUP_MEMBER_REMOVE',
      d: { group_openid: 'group-openid', member_openid: 'member-openid' },
    },
    {
      id: 'user-interaction-event-id',
      t: 'INTERACTION_CREATE',
      d: {
        application_id: 'app-id',
        chat_type: 2,
        data: {
          resolved: {
            button_data: 'interaction:respond-reply',
            button_id: 'interaction-respond-reply',
          },
          type: 11,
        },
        scene: 'c2c',
        type: 11,
        version: 1,
      },
    },
    {
      id: 'group-interaction-event-id',
      t: 'INTERACTION_CREATE',
      d: {
        application_id: 'app-id',
        chat_type: 1,
        data: {
          resolved: {
            button_data: 'interaction:respond-reply',
            button_id: 'interaction-respond-reply',
          },
          type: 11,
        },
        scene: 'group',
        type: 11,
        version: 1,
      },
    },
    {
      id: 'group-authorize-status-interaction-event-id',
      t: 'INTERACTION_CREATE',
      d: { data: { resolved: {}, type: 2001 }, scene: 'group', type: 20, version: 1 },
    },
    {
      id: 'user-authorize-interaction-event-id',
      t: 'INTERACTION_CREATE',
      d: {
        application_id: 'app-id',
        data: {
          resolved: {
            authorize_data: { opt_scene: 'setting', scope: 'c2c_push', switch: true },
          },
        },
        scene: 'c2c',
        type: 18,
        version: 1,
      },
    },
    {
      id: 'user-authorize-interaction-event-id',
      t: 'INTERACTION_CREATE',
      d: {
        data: {
          resolved: {
            authorize_data: { opt_scene: 'setting', scope: 'c2c_push' },
          },
        },
        scene: 'c2c',
        type: 18,
        version: 1,
      },
    },
    {
      id: 'user-authorize-interaction-event-id',
      t: 'INTERACTION_CREATE',
      d: {
        data: {
          resolved: {
            authorize_data: { opt_scene: 'friend_del', scope: 'c2c_push' },
          },
        },
        scene: 'c2c',
        type: 18,
        version: 1,
      },
    },
  ]);
  expect(payloads[10]?.d).not.toHaveProperty('application_id');
  expect(payloads[10]?.d).not.toHaveProperty('chat_type');
  expect(payloads[10]?.d).not.toHaveProperty('group_member_openid');
  expect(payloads[11]?.d).not.toHaveProperty('chat_type');
  expect(payloads[2]?.d).not.toHaveProperty('short_code');
  expect(payloads[6]?.d).not.toHaveProperty('user_openid');
  expect(payloads[7]?.d).not.toHaveProperty('user_openid');
  expect(events.sort()).toEqual(
    [
      'C2C_MESSAGE_CREATE',
      'FRIEND_ADD',
      'FRIEND_DEL',
      'GROUP_ADD_ROBOT',
      'GROUP_AT_MESSAGE_CREATE',
      'GROUP_DEL_ROBOT',
      'GROUP_MEMBER_ADD',
      'GROUP_MEMBER_REMOVE',
      'INTERACTION_CREATE',
      'INTERACTION_CREATE',
      'INTERACTION_CREATE',
      'INTERACTION_CREATE',
      'INTERACTION_CREATE',
      'INTERACTION_CREATE',
    ].sort(),
  );
  expect(unionOpenids.sort()).toEqual(['', '', '', 'union-openid']);
});

test('中间件执行顺序', async () => {
  const timestamp = '1725442341';
  const payload: Dispatch = {
    op: 0,
    t: 'C2C_MESSAGE_CREATE',
    d: {
      id: 'message-id',
      author: {
        bot: false,
        id: 'user-id',
        union_openid: '',
        user_openid: 'user-openid',
        username: '',
      },
      content: '测试消息',
      message_scene: { ext: ['msg_idx=message-index'], source: 'default' },
      message_type: 0,
      timestamp: new Date().toISOString(),
    },
  };
  const body = JSON.stringify(payload);
  const signature = await sign(await createSigningKey(secret), timestamp + body);
  type CustomEvents = {
    'message.private': [event: { content: string; source: string }];
  };
  interface DebugState {
    source: string;
  }
  interface EventState {
    customEvent?: {
      name: 'message.private';
      args: CustomEvents['message.private'];
    };
  }

  const client = new Client<CustomEvents>({
    appId: 'app-id',
    clientSecret: secret,
  });
  const calls: string[] = [];
  const contexts: object[] = [];
  const completed = Promise.withResolvers<void>();
  const output = spyOn(globalThis.console, 'log').mockImplementation(() => undefined);

  const configuredClient = client
    .use<DebugState>(async (context, next) => {
      contexts.push(context);
      context.state.source = '中间件';
      expect(Object.isFrozen(context.payload)).toBeTrue();
      expect(Object.isFrozen(context.payload.d)).toBeTrue();
      expect(Object.isFrozen(context.state)).toBeFalse();

      if (context.payload.t === 'C2C_MESSAGE_CREATE') {
        expect(Object.isFrozen(context.payload.d.author)).toBeTrue();
      }
      calls.push(`进入 ${context.payload.t}`);
      await next();
      calls.push(`离开 ${context.payload.t}`);
      completed.resolve();
    })
    .use<EventState>(async (context, next) => {
      contexts.push(context);
      globalThis.console.log(`[chobits] ${context.payload.t}`, context.payload);

      if (context.payload.t === 'C2C_MESSAGE_CREATE') {
        context.state.customEvent = {
          name: 'message.private',
          args: [{ content: context.payload.d.content, source: context.state.source }],
        };
      }
      const event = context.state.customEvent;

      if (event) {
        await client.emit(event.name, ...event.args);
      }
      await next();
    });

  configuredClient.on('message.private', event => {
    calls.push(`自定义事件 ${event.content} ${event.source}`);
  });
  configuredClient.on('C2C_MESSAGE_CREATE', (...args) => {
    expect(args).toHaveLength(1);
    expect(args[0].reply).toBeFunction();
    calls.push('事件监听器');
  });

  try {
    const response = await configuredClient.callback(
      new Request('https://example.com/callback', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': signature,
          'X-Signature-Timestamp': timestamp,
        },
        body,
      }),
    );

    expect(response.status).toBe(200);
    await completed.promise;
    expect(calls).toEqual([
      '进入 C2C_MESSAGE_CREATE',
      '自定义事件 测试消息 中间件',
      '事件监听器',
      '离开 C2C_MESSAGE_CREATE',
    ]);
    expect(new Set(contexts).size).toBe(1);
    expect(output).toHaveBeenCalledWith('[chobits] C2C_MESSAGE_CREATE', payload);
    expect(Object.hasOwn(payload.d, 'reply')).toBeFalse();
  } finally {
    output.mockRestore();
  }
});

test('中间件终止与重复 next', async () => {
  let received = false;
  const body = JSON.stringify({
    op: 0,
    t: 'FRIEND_DEL',
    d: createFriendDelete(),
  });
  const blocked = new Client({ appId: 'app-id', clientSecret: secret }).use(() => undefined);

  blocked.on('FRIEND_DEL', () => {
    received = true;
  });
  const blockedResponse = await blocked.callback(await createCallbackRequest(body));

  expect(blockedResponse.status).toBe(200);
  expect(received).toBeFalse();

  const failed = Promise.withResolvers<unknown>();
  const tasks: Promise<void>[] = [];
  const repeated = new Client({
    appId: 'app-id',
    clientSecret: secret,
    logger: (kind, message, data) => {
      if (kind === 'dispatch' && message === 'Dispatch 处理失败') {
        failed.resolve(data?.error);
      }
    },
  }).use(async (_context, next) => {
    await next();
    await next();
  });
  const repeatedResponse = await repeated.callback(await createCallbackRequest(body), task => tasks.push(task));
  const error = await failed.promise;
  const [task] = tasks;

  if (!task) {
    throw new Error('宿主未收到 Webhook 事件处理任务');
  }

  expect(repeatedResponse.status).toBe(200);
  expect(tasks).toHaveLength(1);
  await expect(task).rejects.toThrow('next() called multiple times');
  expect(error).toBeInstanceOf(Error);
  expect((<Error>error).message).toBe('next() called multiple times');
});

test('无效事件签名', async () => {
  const client = new Client({ appId: 'app-id', clientSecret: secret });
  const response = await client.callback(
    new Request('https://example.com/callback', {
      method: 'POST',
      headers: {
        'X-Signature-Ed25519': '00'.repeat(64),
        'X-Signature-Timestamp': '1725442341',
      },
      body: JSON.stringify({ op: 0, t: 'FRIEND_DEL', d: {} }),
    }),
  );

  expect(response.status).toBe(401);
});
