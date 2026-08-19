import { afterEach, expect, mock, spyOn, test } from 'bun:test';

import { MockOpenApi } from './mocks/open-api';
import { mockFetch, readMessageBody } from './mocks/request';
import { MockGateway, mockWebSocket } from './mocks/websocket';

import { OpCode } from '#/core/payload';
import { type Logger, type SendGroupMessagePayload, Client } from '#/index';

const originalFetch = globalThis.fetch;
const OriginalWebSocket = globalThis.WebSocket;

const openReadySession = async (
  maxRetry = 1,
  logger?: Logger,
): Promise<{ client: Client; gateway: MockGateway; requests: Request[] }> => {
  const api = new MockOpenApi();
  const requests: Request[] = [];

  globalThis.WebSocket = mockWebSocket(MockGateway);
  globalThis.fetch = mockFetch(async (input, init) => {
    const request = input instanceof Request ? new Request(input, init) : new Request(input.toString(), init);

    if (request.url === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    if (request.url.endsWith('/gateway')) {
      return Response.json(api.getGateway());
    }
    requests.push(request);
    return Response.json(api.sendGroupMessage({ id: 'reply-id' }));
  });

  const client = new Client({
    appId: 'app-id',
    clientSecret: 'secret',
    maxRetry,
    ...(logger === undefined ? {} : { logger }),
  });
  const online = client.online();
  const gateway = await MockGateway.waitForConnection();
  gateway.hello();
  gateway.ready();
  await online;

  return { client, gateway, requests };
};

afterEach(() => {
  mock.restore();
  globalThis.fetch = originalFetch;
  globalThis.WebSocket = OriginalWebSocket;
  MockGateway.instances.length = 0;
});

test('WebSocket 事件数据', () => {
  const gateway = new MockGateway('wss://gateway.example.com');
  const ready = gateway.ready();
  const userImage = gateway.sendUserMessage({
    attachments: [
      {
        content: '',
        content_type: 'image/png',
        filename: 'image.png',
        height: 5000,
        size: 19815867,
        url: 'https://example.com/image.png',
        width: 7500,
      },
    ],
  });
  const groupVoice = gateway.sendGroupMessage({
    attachments: [
      {
        content_type: 'voice',
        filename: 'voice.amr',
        size: 4012,
        url: 'https://example.com/voice.amr',
        voice_wav_url: 'https://example.com/voice.wav',
      },
    ],
    content: '',
  });
  const groupMention = gateway.sendGroupMessage({
    content: '<@bot-openid> 测试消息',
    mentions: [
      {
        bot: true,
        id: 'bot-openid',
        is_you: true,
        member_openid: 'bot-openid',
        member_role: 'member',
        scope: 'single',
        username: 'bot',
      },
    ],
  });
  const groupQuote = gateway.sendGroupMessage({
    content: ' 引用消息',
    message_scene: {
      ext: ['ref_msg_idx=referenced-message-index', 'msg_idx=group-message-index', 'auth_token=group-message-token'],
      source: 'default',
    },
    message_type: 103,
    msg_elements: [{ content: '语音消息', message_type: 103, msg_idx: 'referenced-message-index' }],
  });
  const payloads = [
    gateway.sendGroupAtMessage(),
    gateway.sendFriendAdd(),
    gateway.sendFriendDelete(),
    gateway.sendGroupAddRobot(),
    gateway.sendGroupDeleteRobot(),
    gateway.sendGroupMessageReceive(),
    gateway.sendGroupMessageReject(),
    gateway.sendGroupMemberAdd(),
    gateway.sendGroupMemberRemove(),
    gateway.sendUserButtonInteraction(),
    gateway.sendGroupButtonInteraction(),
    gateway.sendUserAuthorizeInteraction(),
    gateway.sendGroupAuthorizeStatusInteraction(),
    gateway.sendUserAuthorizeInteraction({
      data: {
        resolved: {
          authorize_data: { opt_scene: 'setting', scope: 'c2c_push' },
        },
      },
    }),
    gateway.sendUserAuthorizeInteraction({
      data: {
        resolved: {
          authorize_data: { opt_scene: 'friend_del', scope: 'c2c_push' },
        },
      },
    }),
  ];

  expect(ready.d).toEqual({
    version: 1,
    session_id: 'session-id',
    user: { id: 'bot-id', username: 'bot', bot: true, status: 1 },
    shard: [0, 0],
  });
  expect(payloads.every(payload => typeof payload.s === 'number')).toBeTrue();
  expect(payloads.map(payload => payload.t)).toEqual([
    'GROUP_AT_MESSAGE_CREATE',
    'FRIEND_ADD',
    'FRIEND_DEL',
    'GROUP_ADD_ROBOT',
    'GROUP_DEL_ROBOT',
    'GROUP_MSG_RECEIVE',
    'GROUP_MSG_REJECT',
    'GROUP_MEMBER_ADD',
    'GROUP_MEMBER_REMOVE',
    'INTERACTION_CREATE',
    'INTERACTION_CREATE',
    'INTERACTION_CREATE',
    'INTERACTION_CREATE',
    'INTERACTION_CREATE',
    'INTERACTION_CREATE',
  ]);
  expect(userImage.d.attachments?.[0]).toMatchObject({
    content: '',
    content_type: 'image/png',
    height: 5000,
    size: 19815867,
    width: 7500,
  });
  expect(groupVoice.d.attachments?.[0]).toMatchObject({
    content_type: 'voice',
    size: 4012,
    voice_wav_url: 'https://example.com/voice.wav',
  });
  expect(groupMention.d.mentions?.[0]).toMatchObject({ is_you: true, scope: 'single' });
  expect(groupQuote.d).toMatchObject({
    message_type: 103,
    msg_elements: [{ content: '语音消息', message_type: 103, msg_idx: 'referenced-message-index' }],
  });
  expect(payloads[1]?.d).not.toHaveProperty('scene');
  expect(payloads[1]?.d).not.toHaveProperty('scene_param');
  expect(payloads[1]?.d).not.toHaveProperty('short_code');
  expect(payloads[7]?.d).not.toHaveProperty('user_openid');
  expect(payloads[8]?.d).not.toHaveProperty('user_openid');
  expect(payloads[9]?.d).not.toHaveProperty('union_openid');
  expect(payloads[11]?.d).not.toHaveProperty('chat_type');
  expect(payloads[11]?.d).not.toHaveProperty('union_openid');
  expect(payloads[12]?.d).not.toHaveProperty('application_id');
  expect(payloads[14]?.d).toMatchObject({
    data: { resolved: { authorize_data: { opt_scene: 'friend_del', scope: 'c2c_push' } } },
  });
});

test('Intents 订阅', async () => {
  const { client, gateway } = await openReadySession(0);

  expect(JSON.parse(gateway.sent[0]!)).toEqual({
    op: 2,
    d: {
      token: 'QQBot access-token',
      intents: (1 << 24) | (1 << 25) | (1 << 26),
    },
  });

  await client.offline();
});

test('回复消息', async () => {
  let replyCount = 0;
  let replied: Promise<unknown> | null = null;

  const api = new MockOpenApi();
  const messageRequests: Request[] = [];

  globalThis.WebSocket = mockWebSocket(MockGateway);
  globalThis.fetch = mockFetch(async (input, init) => {
    const request = input instanceof Request ? new Request(input, init) : new Request(input.toString(), init);

    if (request.url === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    if (request.url.endsWith('/gateway')) {
      return Response.json(api.getGateway());
    }
    messageRequests.push(request);
    return Response.json(api.sendGroupMessage({ id: 'reply-id' }));
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret', maxRetry: 0 });
  const online = client.online();
  const gateway = await MockGateway.waitForConnection();
  gateway.hello();

  gateway.ready();
  await online;

  spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.5).mockReturnValueOnce(0.75);
  client.on('GROUP_AT_MESSAGE_CREATE', event => {
    replyCount++;

    if (replyCount > 1) {
      replied = event.reply('third');
      return;
    }
    const second: SendGroupMessagePayload = {
      msg_type: 2,
      markdown: { content: 'second' },
      event_id: 'caller-event-id',
      msg_seq: 99,
    };

    replied = Promise.all([event.reply('first'), event.reply(second)]);
  });

  gateway.sendGroupAtMessage({
    id: 'message-id',
    author: {
      bot: false,
      id: 'member',
      member_openid: 'member',
      member_role: 'member',
      union_openid: '',
      username: 'member',
    },
    content: 'hello',
    group_openid: 'group',
  });

  while (!replied) {
    await Promise.resolve();
  }
  await replied;

  gateway.sendGroupAtMessage({
    id: 'next-message-id',
    author: {
      bot: false,
      id: 'member',
      member_openid: 'member',
      member_role: 'member',
      union_openid: '',
      username: 'member',
    },
    content: 'next',
    group_openid: 'group',
  });

  while (replyCount < 2 || messageRequests.length < 3) {
    await Promise.resolve();
  }
  await replied;

  expect(messageRequests).toHaveLength(3);
  const [firstRequest, secondRequest, thirdRequest] = messageRequests;

  if (!firstRequest || !secondRequest || !thirdRequest) {
    throw new TypeError('回复消息请求数量无效');
  }
  const [firstBody, secondBody, thirdBody] = await Promise.all([
    readMessageBody(firstRequest),
    readMessageBody(secondRequest),
    readMessageBody(thirdRequest),
  ]);

  expect(firstBody).toMatchObject({
    msg_type: 0,
    content: 'first',
    msg_id: 'message-id',
  });
  expect(secondBody).toMatchObject({
    msg_type: 2,
    markdown: { content: 'second' },
    msg_id: 'message-id',
  });
  expect(firstBody.msg_seq).toBeGreaterThan(0);
  expect(secondBody.msg_seq).not.toBe(firstBody.msg_seq);
  expect(secondBody.msg_seq).not.toBe(99);
  expect(Object.hasOwn(secondBody, 'event_id')).toBe(false);
  expect(thirdBody).toMatchObject({
    content: 'third',
    msg_id: 'next-message-id',
  });
  expect(thirdBody.msg_seq).not.toBe(secondBody.msg_seq);

  await client.offline();
});

test('私聊和群聊消息', async () => {
  const { client, gateway } = await openReadySession();
  const received: string[] = [];

  client.on('C2C_MESSAGE_CREATE', event => {
    received.push(event.content);
  });
  client.on('GROUP_MESSAGE_CREATE', event => {
    received.push(event.content);
  });

  gateway.sendUserMessage({ content: '私聊测试' });
  gateway.sendGroupMessage({ content: '群聊测试' });

  while (received.length < 2) {
    await Promise.resolve();
  }
  expect(received).toEqual(['私聊测试', '群聊测试']);
  await client.offline();
});

test('WebSocket 日志', async () => {
  const logs: Parameters<Logger>[] = [];
  const logger: Logger = (...entry) => logs.push(entry);
  const { client } = await openReadySession(0, logger);
  const messages = logs.map(([, message]) => message);
  const sent = logs.find(([, message]) => message === '发送 Gateway Payload');

  expect(messages).toContain('开始建立 WebSocket 连接');
  expect(messages).toContain('WebSocket 连接已建立');
  expect(messages).toContain('收到 Gateway Payload');
  expect(messages).toContain('开始处理 Dispatch');
  expect(messages).toContain('Dispatch 处理完成');
  expect(sent?.[2]).toEqual({
    payload: {
      op: OpCode.Identify,
      d: { intents: (1 << 24) | (1 << 25) | (1 << 26) },
    },
  });
  expect(JSON.stringify(logs)).not.toContain('QQBot access-token');

  await client.offline();
  expect(logs.map(([, message]) => message)).toContain('主动关闭 WebSocket 连接');
  expect(logs.map(([, message]) => message)).toContain('WebSocket 连接已关闭');
});

test('未知 Dispatch', async () => {
  const logs: Parameters<Logger>[] = [];
  const logger: Logger = (...entry) => logs.push(entry);
  const { client, gateway } = await openReadySession(0, logger);

  gateway.sendPayload({ op: OpCode.Dispatch, s: 2, t: 'UNKNOWN_EVENT', d: {} });

  while (!logs.some(([, message]) => message === '不受支持的 Dispatch 事件')) {
    await Promise.resolve();
  }
  expect(logs.find(([, message]) => message === '不受支持的 Dispatch 事件')).toEqual([
    'dispatch',
    '不受支持的 Dispatch 事件',
    { t: 'UNKNOWN_EVENT' },
  ]);

  await client.offline();
});

test('并发事件处理', async () => {
  const { client, gateway } = await openReadySession();
  const barrier = Promise.withResolvers<void>();
  const firstStarted = Promise.withResolvers<void>();
  const secondCompleted = Promise.withResolvers<void>();
  const started: string[] = [];
  const handled: string[] = [];

  client.on('GROUP_MESSAGE_CREATE', async event => {
    started.push(event.content);
    if (event.content === '第一条消息') {
      firstStarted.resolve();
      await barrier.promise;
    } else {
      secondCompleted.resolve();
    }
    handled.push(event.content);
  });

  gateway.sendGroupMessage({ content: '第一条消息' });
  await firstStarted.promise;
  gateway.sendGroupMessage({ content: '第二条消息' });
  await secondCompleted.promise;

  expect(started).toEqual(['第一条消息', '第二条消息']);
  expect(handled).toEqual(['第二条消息']);
  barrier.resolve();

  while (handled.length < 2) {
    await Promise.resolve();
  }
  expect(handled).toEqual(['第二条消息', '第一条消息']);
  await client.offline();
});

test('授权互动事件', async () => {
  const { client, gateway } = await openReadySession();
  const received: unknown[] = [];

  client.on('INTERACTION_CREATE', event => {
    received.push(event.data);
  });

  gateway.sendUserAuthorizeInteraction({
    data: {
      resolved: {
        authorize_data: {
          opt_scene: 'setting',
          scope: 'c2c_push',
          switch: true,
        },
      },
    },
  });
  gateway.sendGroupAuthorizeStatusInteraction();

  while (received.length < 2) {
    await Promise.resolve();
  }
  expect(received).toEqual([
    {
      resolved: {
        authorize_data: {
          opt_scene: 'setting',
          scope: 'c2c_push',
          switch: true,
        },
      },
    },
    { resolved: {}, type: 2001 },
  ]);
  await client.offline();
});

test('互动事件回复', async () => {
  const { client, gateway, requests } = await openReadySession();
  let replied: Promise<unknown> | null = null;

  client.on('INTERACTION_CREATE', event => {
    replied = event.reply('互动回复');
  });
  gateway.sendGroupButtonInteraction();

  while (!replied) {
    await Promise.resolve();
  }
  await replied;

  const request = requests[0];

  if (!request) {
    throw new TypeError('缺少互动事件回复请求');
  }
  expect(await readMessageBody(request)).toMatchObject({
    event_id: 'group-interaction-event-id',
    content: '互动回复',
  });

  await client.offline();
});

test('会话恢复', async () => {
  const { client, gateway: first } = await openReadySession();
  const errors: Error[] = [];

  client.on('error', error => errors.push(error));

  first.sendFriendDelete();
  await new Promise(resolve => setTimeout(resolve));
  first.close(4009);
  const second = await MockGateway.waitForConnection(1);
  second.hello();

  expect(JSON.parse(second.sent[0]!)).toEqual({
    op: 6,
    d: {
      token: 'QQBot access-token',
      session_id: 'session-id',
      seq: 2,
    },
  });

  second.resumed(3);
  expect(errors).toEqual([]);
  await client.offline();
});

test('重连失败', async () => {
  const logs: Parameters<Logger>[] = [];
  const logger: Logger = (...entry) => logs.push(entry);
  const { client, gateway } = await openReadySession(0, logger);
  const failure = Promise.withResolvers<Error>();

  client.on('error', error => failure.resolve(error));
  gateway.close(4009);

  expect((await failure.promise).message).toBe('WebSocket reconnect limit reached');
  expect(MockGateway.instances).toHaveLength(1);
  expect(logs.map(([, message]) => message)).toContain('WebSocket 重试次数已耗尽');
  await client.offline();
});

test('无效凭证', async () => {
  let requests = 0;

  globalThis.WebSocket = mockWebSocket(MockGateway);
  globalThis.fetch = mockFetch(async () => {
    requests++;
    return Response.json({ code: 100016, message: 'invalid appid or secret' });
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'invalid-secret', maxRetry: 3 });

  await expect(client.online()).rejects.toThrow('invalid appid or secret');
  expect(requests).toBe(1);
  expect(MockGateway.instances).toHaveLength(0);
});

test('可恢复序列号', async () => {
  const { client, gateway: first } = await openReadySession();
  const processing = Promise.withResolvers<void>();
  const started = Promise.withResolvers<void>();

  await new Promise(resolve => setTimeout(resolve));
  client.on('FRIEND_DEL', async () => {
    started.resolve();
    await processing.promise;
  });
  first.sendFriendDelete();
  await started.promise;
  first.close(4009);
  const second = await MockGateway.waitForConnection(1);

  second.hello();
  expect(JSON.parse(second.sent[0]!)).toEqual({
    op: OpCode.Resume,
    d: {
      token: 'QQBot access-token',
      session_id: 'session-id',
      seq: 1,
    },
  });

  processing.resolve();
  second.resumed(3);
  await client.offline();
});

test('重复 Dispatch', async () => {
  const { client, gateway: first } = await openReadySession();
  const barrier = Promise.withResolvers<void>();
  const restored = Promise.withResolvers<void>();
  const started = Promise.withResolvers<void>();
  const handled: string[] = [];

  client.on('GROUP_MESSAGE_CREATE', async event => {
    if (event.content === 's3') {
      started.resolve();
      await barrier.promise;
    }
    handled.push(event.content);
  });
  client.on('RESUMED', () => restored.resolve());

  first.sendGroupMessage({ content: 's2' });
  while (handled.length < 1) {
    await Promise.resolve();
  }
  const third = first.sendGroupMessage({ content: 's3' });
  await started.promise;
  const fourth = first.sendGroupMessage({ content: 's4' });

  while (!handled.includes('s4')) {
    await Promise.resolve();
  }
  first.close(4009);
  const second = await MockGateway.waitForConnection(1);
  second.hello();

  expect(JSON.parse(second.sent[0]!)).toEqual({
    op: OpCode.Resume,
    d: {
      token: 'QQBot access-token',
      session_id: 'session-id',
      seq: 2,
    },
  });

  second.dispatch('GROUP_MESSAGE_CREATE', third.d, { id: third.id, sequence: 3 });
  second.dispatch('GROUP_MESSAGE_CREATE', fourth.d, { id: fourth.id, sequence: 4 });
  second.resumed(5);

  await restored.promise;
  expect(handled).toEqual(['s2', 's4']);
  barrier.resolve();

  while (!handled.includes('s3')) {
    await Promise.resolve();
  }
  await client.offline();

  expect(handled).toEqual(['s2', 's4', 's3']);
});

test('Reconnect', async () => {
  const { client, gateway: first } = await openReadySession();

  first.sendFriendDelete();
  await new Promise(resolve => setTimeout(resolve));
  first.reconnect();
  const second = await MockGateway.waitForConnection(1);
  second.hello();

  expect(JSON.parse(second.sent[0]!)).toEqual({
    op: OpCode.Resume,
    d: {
      token: 'QQBot access-token',
      session_id: 'session-id',
      seq: 2,
    },
  });

  second.resumed(3);
  await client.offline();
});

test('可恢复的 Invalid Session', async () => {
  const { client, gateway: first } = await openReadySession();

  first.sendFriendDelete();
  await new Promise(resolve => setTimeout(resolve));
  first.invalidateSession(true);
  const second = await MockGateway.waitForConnection(1);
  second.hello();

  expect(JSON.parse(second.sent[0]!)).toEqual({
    op: OpCode.Resume,
    d: {
      token: 'QQBot access-token',
      session_id: 'session-id',
      seq: 2,
    },
  });

  second.resumed(3);
  await client.offline();
});

test('不可恢复的 Invalid Session', async () => {
  const { client, gateway: first } = await openReadySession();

  first.invalidateSession();
  const second = await MockGateway.waitForConnection(1);
  second.hello();

  expect(JSON.parse(second.sent[0]!)).toEqual({
    op: OpCode.Identify,
    d: {
      token: 'QQBot access-token',
      intents: (1 << 24) | (1 << 25) | (1 << 26),
    },
  });

  second.ready({ session_id: 'next-session-id' });
  await client.offline();
});

test('心跳序列号', async () => {
  globalThis.WebSocket = mockWebSocket(MockGateway);
  globalThis.fetch = mockFetch(async input => {
    if (String(input) === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json({ access_token: 'access-token', expires_in: '7200' });
    }
    return Response.json({ url: 'wss://gateway.example.com' });
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret', maxRetry: 0 });
  const processing = Promise.withResolvers<void>();
  const started = Promise.withResolvers<void>();

  client.on('FRIEND_DEL', async () => {
    started.resolve();
    await processing.promise;
  });
  const online = client.online();
  const gateway = await MockGateway.waitForConnection();
  gateway.hello(20);
  gateway.ready({}, 7);
  await online;
  gateway.sendFriendDelete();
  await started.promise;

  while (!gateway.sent.some(value => JSON.parse(value).op === OpCode.Heartbeat && JSON.parse(value).d === 8)) {
    await new Promise(resolve => setTimeout(resolve, 1));
  }
  expect(
    gateway.sent.map(value => JSON.parse(value)).find(payload => payload.op === OpCode.Heartbeat && payload.d === 8),
  ).toEqual({ op: OpCode.Heartbeat, d: 8 });

  processing.resolve();
  gateway.heartbeatAck();
  await client.offline();
});

test('首次心跳与心跳超时', async () => {
  globalThis.WebSocket = mockWebSocket(MockGateway);
  globalThis.fetch = mockFetch(async input => {
    if (String(input) === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json({ access_token: 'access-token', expires_in: '7200' });
    }
    return Response.json({ url: 'wss://gateway.example.com' });
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret', maxRetry: 1 });
  const online = client.online();
  const first = await MockGateway.waitForConnection();

  first.hello(20);
  while (!first.sent.some(value => JSON.parse(value).op === OpCode.Heartbeat)) {
    await new Promise(resolve => setTimeout(resolve, 1));
  }
  expect(first.sent.map(value => JSON.parse(value)).find(payload => payload.op === OpCode.Heartbeat)).toEqual({
    op: OpCode.Heartbeat,
    d: null,
  });
  first.heartbeatAck();
  first.ready();
  await online;
  const second = await MockGateway.waitForConnection(1);

  second.hello();
  expect(JSON.parse(second.sent[0]!)).toEqual({
    op: OpCode.Resume,
    d: {
      token: 'QQBot access-token',
      session_id: 'session-id',
      seq: 1,
    },
  });

  second.resumed();
  await client.offline();
});

test('无效会话序列号', async () => {
  const { client, gateway: first } = await openReadySession();

  first.close(4007);
  const second = await MockGateway.waitForConnection(1);

  second.hello();
  expect(JSON.parse(second.sent[0]!)).toEqual({
    op: OpCode.Identify,
    d: {
      token: 'QQBot access-token',
      intents: (1 << 24) | (1 << 25) | (1 << 26),
    },
  });

  second.ready();
  await client.offline();
});

test('不可恢复关闭与主动下线', async () => {
  globalThis.WebSocket = mockWebSocket(MockGateway);
  globalThis.fetch = mockFetch(async input => {
    if (String(input) === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json({ access_token: 'access-token', expires_in: '7200' });
    }
    return Response.json({ url: 'wss://gateway.example.com' });
  });

  const connect = async (client: Client): Promise<MockGateway> => {
    const online = client.online();
    const gateway = await MockGateway.waitForConnection();
    gateway.hello();
    gateway.ready();
    await online;

    return gateway;
  };

  const fatalClient = new Client({ appId: 'app-id', clientSecret: 'secret', maxRetry: 1 });
  const fatalError = Promise.withResolvers<Error>();

  fatalClient.on('error', error => fatalError.resolve(error));
  const fatalSocket = await connect(fatalClient);

  fatalSocket.close(4014);
  expect((await fatalError.promise).message).toBe('WebSocket closed with code 4014');
  expect(MockGateway.instances).toHaveLength(1);

  MockGateway.instances.length = 0;

  const offlineClient = new Client({ appId: 'app-id', clientSecret: 'secret', maxRetry: 1 });
  const offlineErrors: Error[] = [];

  offlineClient.on('error', error => offlineErrors.push(error));
  await connect(offlineClient);
  await offlineClient.offline();
  await new Promise(resolve => setTimeout(resolve, 10));
  expect(MockGateway.instances).toHaveLength(1);
  expect(offlineErrors).toEqual([]);
});

test('重新上线', async () => {
  const { client } = await openReadySession();

  await client.offline();
  const online = client.online();
  const gateway = await MockGateway.waitForConnection(1);

  gateway.hello();
  gateway.ready();
  await online;
  await client.offline();
});

test('下线等待重连', async () => {
  const { client, gateway: first } = await openReadySession();

  first.close(4009);
  await Promise.resolve();
  await client.offline();
  const online = client.online();
  const second = await MockGateway.waitForConnection(1);

  second.hello();
  second.ready();
  await online;
  await client.offline();
});

test('下线取消重连', async () => {
  const { client, gateway } = await openReadySession(Infinity);

  gateway.close(4009);
  await Promise.resolve();
  const started = performance.now();

  await client.offline();

  expect(performance.now() - started).toBeLessThan(500);
  expect(MockGateway.instances).toHaveLength(1);
});

test('初始化期间下线', async () => {
  const gatewayStarted = Promise.withResolvers<void>();
  const gatewayResponse = Promise.withResolvers<void>();

  globalThis.WebSocket = mockWebSocket(MockGateway);
  globalThis.fetch = mockFetch(async input => {
    if (String(input) === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json({ access_token: 'access-token', expires_in: '7200' });
    }
    gatewayStarted.resolve();
    await gatewayResponse.promise;
    return Response.json({ url: 'wss://gateway.example.com' });
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret', maxRetry: 1 });
  const online = client.online();

  await gatewayStarted.promise;
  const offline = client.offline();

  gatewayResponse.resolve();
  await offline;

  await expect(online).rejects.toThrow('WebSocket connection stopped');
  expect(MockGateway.instances).toHaveLength(0);
});
