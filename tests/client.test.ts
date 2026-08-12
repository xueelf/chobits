import { afterEach, expect, test } from 'bun:test';

import { TotteError } from 'totte';

import { MockOpenApi } from './mocks/open-api';
import { mockFetch, readMessageBody } from './mocks/request';

import { type Logger, type SendGroupMessagePayload, type SendUserMessagePayload, Client } from '#/index';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('客户端配置项', () => {
  expect(() => new Client({ appId: '', clientSecret: 'secret' })).toThrow('appId and clientSecret are required');
  expect(() => new Client({ appId: 'app-id', clientSecret: '' })).toThrow('appId and clientSecret are required');
  expect(() => new Client({ appId: 'app-id', clientSecret: 'secret', maxRetry: -1 })).toThrow(
    'maxRetry must be a non-negative integer or Infinity',
  );
  expect(() => new Client({ appId: 'app-id', clientSecret: 'secret', maxRetry: 1.5 })).toThrow(
    'maxRetry must be a non-negative integer or Infinity',
  );
  expect(() => new Client({ appId: 'app-id', clientSecret: 'secret', maxRetry: Infinity })).not.toThrow();
});

test('并发处理 OpenAPI', async () => {
  let tokenRequests = 0;

  const api = new MockOpenApi();
  const requests: Request[] = [];
  const timestamp = new Date().toISOString();

  globalThis.fetch = mockFetch(async (input, init) => {
    const request = input instanceof Request ? new Request(input, init) : new Request(input.toString(), init);
    requests.push(request);

    if (request.url === 'https://api.bot.qq.com/app/getAppAccessToken') {
      tokenRequests++;
      return Response.json(api.getAccessToken());
    }
    return Response.json(api.sendUserMessage({ id: 'message-id', timestamp }));
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret' });
  const userMessage: SendUserMessagePayload = { msg_type: 0, content: 'user', msg_seq: 42 };

  const [userResult, groupResult] = await Promise.all([
    client.sendUserMessage('user-openid', userMessage),
    client.sendGroupMessage('group-openid', {
      msg_type: 3,
      ark: {
        template_id: 23,
        kv: [
          {
            key: '#LIST#',
            obj: [{ obj_kv: [{ key: 'desc', value: 'group' }] }],
          },
        ],
      },
    }),
  ]);

  expect(userResult.data).toEqual({
    id: 'message-id',
    timestamp,
    ext_info: { ref_idx: 'user-message-index' },
  });
  expect(groupResult.data).toEqual(userResult.data);
  expect(tokenRequests).toBe(1);
  expect(requests).toHaveLength(3);

  const accessToken = requests[0]!;
  expect(accessToken.method).toBe('POST');
  expect(accessToken.headers.get('Authorization')).toBeNull();
  expect(accessToken.headers.get('Content-Type')).toBe('application/json');
  expect(await accessToken.json()).toEqual({ appId: 'app-id', clientSecret: 'secret' });

  const user = requests[1]!;
  expect(user.url).toBe('https://api.bot.qq.com/v2/users/user-openid/messages');
  expect(user.method).toBe('POST');
  expect(user.headers.get('Authorization')).toBe('QQBot access-token');
  expect(user.headers.get('Content-Type')).toBe('application/json');
  const userBody = await readMessageBody(user);
  expect(userBody).toMatchObject({ msg_type: 0, content: 'user' });
  expect(userBody.msg_seq).toBe(42);

  const group = requests[2]!;
  expect(group.url).toBe('https://api.bot.qq.com/v2/groups/group-openid/messages');
  const groupBody = await readMessageBody(group);
  expect(groupBody).toMatchObject({
    msg_type: 3,
    ark: {
      template_id: 23,
      kv: [
        {
          key: '#LIST#',
          obj: [{ obj_kv: [{ key: 'desc', value: 'group' }] }],
        },
      ],
    },
  });
  expect(Number.isSafeInteger(groupBody.msg_seq)).toBe(true);
  expect(groupBody.msg_seq).toBeGreaterThan(0);
  expect(groupBody.msg_seq).toBeLessThanOrEqual(4294967295);
});

test('OpenAPI 日志', async () => {
  const api = new MockOpenApi();
  const logs: Parameters<Logger>[] = [];
  const logger: Logger = (...entry) => logs.push(entry);

  globalThis.fetch = mockFetch(async input => {
    if (String(input) === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    return Response.json(api.getBotInfo());
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret', logger });
  await client.getBotInfo();

  expect(logs.map(([, message]) => message)).toEqual([
    '开始获取 Access Token',
    'Access Token 获取成功',
    '发送 OpenAPI 请求',
    '收到 OpenAPI 响应',
  ]);
  expect(logs[0]).toEqual(['auth', '开始获取 Access Token']);
  expect(logs[1]?.[2]).toEqual({ expiresIn: 7200 });
  expect(logs[2]?.[2]).toEqual({
    method: 'GET',
    origin: 'https://api.bot.qq.com',
    url: '/users/@me',
  });
  expect(logs[3]?.[2]).toEqual({
    method: 'GET',
    origin: 'https://api.bot.qq.com',
    url: '/users/@me',
    status: 200,
    data: {
      avatar: '',
      id: 'bot-id',
      share_url: 'https://example.com/bot',
      username: 'bot',
      welcome_msg: '',
    },
  });
  expect(JSON.stringify(logs)).not.toContain('access-token');
  expect(JSON.stringify(logs)).not.toContain('secret');
});

test('消息类型与内容字段', () => {
  const message: SendGroupMessagePayload = {
    msg_type: 2,
    // @ts-expect-error Markdown 消息不能携带富媒体内容代替 markdown。
    media: { file_info: 'file-info' },
  };
  const markdown: SendGroupMessagePayload = {
    msg_type: 2,
    markdown: {
      content: 'Markdown',
      force_verify_image_resource: true,
    },
  };
  // @ts-expect-error 官方没有定义 msg_type=1 的图片消息。
  const imageMessage: SendGroupMessagePayload = { msg_type: 1, image: 'https://example.com/image.png' };

  expect(message.msg_type).toBe(2);
  expect(markdown.markdown.force_verify_image_resource).toBe(true);
  expect(imageMessage).toBeDefined();
});

test('流式消息', async () => {
  const api = new MockOpenApi();
  const requests: Request[] = [];

  globalThis.fetch = mockFetch(async (input, init) => {
    const request = input instanceof Request ? new Request(input, init) : new Request(input.toString(), init);

    if (request.url === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    requests.push(request);
    return Response.json(api.sendUserStreamMessage({ id: 'stream-id' }));
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret' });
  await client.sendUserStreamMessage('user', {
    input_state: 1,
    index: 0,
    content_raw: '第一段',
    msg_id: 'message-id',
    msg_seq: 42,
  });
  await client.sendUserStreamMessage('user', {
    input_state: 1,
    index: 1,
    content_raw: '第二段',
    msg_id: 'message-id',
    stream_msg_id: 'stream-id',
  });

  expect(requests).toHaveLength(2);
  expect(await requests[0]!.json()).toEqual({
    input_state: 1,
    index: 0,
    content_raw: '第一段',
    msg_id: 'message-id',
    msg_seq: 42,
  });
  expect(await requests[1]!.json()).toEqual({
    input_state: 1,
    index: 1,
    content_raw: '第二段',
    msg_id: 'message-id',
    stream_msg_id: 'stream-id',
  });
});

test('OpenAPI 错误响应', async () => {
  const api = new MockOpenApi();

  globalThis.fetch = mockFetch(async input => {
    if (String(input) === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    return Response.json(api.invalidRequestData(), { status: 400 });
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret' });

  try {
    await client.recallGroupMessage('group', 'message');
    throw new Error('预期请求失败');
  } catch (error) {
    if (!(error instanceof TotteError) || !(error.cause instanceof Response)) {
      throw error;
    }
    expect(error.cause.status).toBe(400);
    expect(await error.cause.json()).toEqual(api.invalidRequestData());
  }
});

test('Access Token 错误响应', async () => {
  let requests = 0;
  const api = new MockOpenApi();
  const response = api.getAccessTokenError();

  globalThis.fetch = mockFetch(async () => {
    requests++;
    return Response.json(response);
  });

  const client = new Client({ appId: 'invalid-app-id', clientSecret: 'secret' });

  try {
    await client.getBotInfo();
    throw new Error('预期 Access Token 请求失败');
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }
    expect(error.message).toBe(response.message);
  }
  expect(requests).toBe(1);
});

test('文件、群信息、互动、撤回与分享', async () => {
  const api = new MockOpenApi();
  const requests: Request[] = [];
  const userFileData = api.uploadUserFile();
  const userPreparedData = api.prepareUserFileUpload();
  const groupFileData = api.uploadGroupFile();
  const groupPreparedData = api.prepareGroupFileUpload();
  const groupInfoData = api.getGroupInfo();
  const stateData = api.getGroupBotState();

  globalThis.fetch = mockFetch(async (input, init) => {
    const request = input instanceof Request ? new Request(input, init) : new Request(input.toString(), init);
    requests.push(request);

    if (request.url === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    if (request.url === 'https://api.bot.qq.com/v2/generate_url_link') {
      return Response.json(api.generateShareLink());
    }
    if (request.url === 'https://api.bot.qq.com/v2/users/user/files') {
      return Response.json(userFileData);
    }
    if (request.url === 'https://api.bot.qq.com/v2/users/user/upload_prepare') {
      return Response.json(userPreparedData);
    }
    if (request.url === 'https://api.bot.qq.com/v2/groups/group/files') {
      return Response.json(groupFileData);
    }
    if (request.url === 'https://api.bot.qq.com/v2/groups/group/upload_prepare') {
      return Response.json(groupPreparedData);
    }
    if (request.url === 'https://api.bot.qq.com/v2/groups/group/info') {
      return Response.json(groupInfoData);
    }
    if (request.url.endsWith('/bot_state')) {
      return Response.json(stateData);
    }
    return Response.json({});
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret' });

  const recalled = await client.recallUserMessage('user', 'message');
  const userFile = await client.uploadUserFile('user', {
    file_type: 1,
    url: 'https://example.com/user.png',
    srv_send_msg: false,
  });
  const userPrepared = await client.prepareUserFileUpload('user', {
    file_type: 4,
    file_size: '10',
    file_name: 'user.txt',
    md5: 'md5',
    sha1: 'sha1',
    md5_10m: 'md5-10m',
  });
  const userFinished = await client.finishUserFileUploadPart('user', { upload_id: 'upload', part_index: 1 });
  const groupFile = await client.uploadGroupFile('group', {
    file_type: 2,
    url: 'https://example.com/group.mp4',
    srv_send_msg: false,
  });
  const groupPrepared = await client.prepareGroupFileUpload('group', {
    file_type: 2,
    file_size: '10',
    file_name: 'video.mp4',
    md5: 'md5',
    sha1: 'sha1',
    md5_10m: 'md5-10m',
  });
  const groupFinished = await client.finishGroupFileUploadPart('group', {
    upload_id: 'upload',
    part_index: 1,
    block_size: '10',
    md5: 'part-md5',
  });
  const groupInfo = await client.getGroupInfo('group');
  const state = await client.getGroupBotState('group');
  const interaction = await client.respondToInteraction('interaction', { code: 0 });
  const link = await client.generateShareLink({ callback_data: 'source' });

  expect(recalled.data).toEqual({});
  expect(userFile.data).toEqual(userFileData);
  expect(userPrepared.data).toEqual(userPreparedData);
  expect(userFinished.data).toEqual({});
  expect(groupFile.data).toEqual(groupFileData);
  expect(groupPrepared.data).toEqual(groupPreparedData);
  expect(groupFinished.data).toEqual({});
  expect(groupInfo.data).toEqual(groupInfoData);
  expect(state.data).toEqual(stateData);
  expect(interaction.data).toEqual({});
  expect(requests.slice(1).map(request => [request.method, request.url])).toEqual([
    ['DELETE', 'https://api.bot.qq.com/v2/users/user/messages/message'],
    ['POST', 'https://api.bot.qq.com/v2/users/user/files'],
    ['POST', 'https://api.bot.qq.com/v2/users/user/upload_prepare'],
    ['POST', 'https://api.bot.qq.com/v2/users/user/upload_part_finish'],
    ['POST', 'https://api.bot.qq.com/v2/groups/group/files'],
    ['POST', 'https://api.bot.qq.com/v2/groups/group/upload_prepare'],
    ['POST', 'https://api.bot.qq.com/v2/groups/group/upload_part_finish'],
    ['GET', 'https://api.bot.qq.com/v2/groups/group/info'],
    ['GET', 'https://api.bot.qq.com/v2/groups/group/bot_state'],
    ['PUT', 'https://api.bot.qq.com/interactions/interaction'],
    ['POST', 'https://api.bot.qq.com/v2/generate_url_link'],
  ]);
  expect(await requests[2]!.json()).toEqual({
    file_type: 1,
    url: 'https://example.com/user.png',
    srv_send_msg: false,
  });
  expect(await requests[3]!.json()).toEqual({
    file_type: 4,
    file_size: '10',
    file_name: 'user.txt',
    md5: 'md5',
    sha1: 'sha1',
    md5_10m: 'md5-10m',
  });
  expect(await requests[5]!.json()).toEqual({
    file_type: 2,
    url: 'https://example.com/group.mp4',
    srv_send_msg: false,
  });
  expect(await requests[7]!.json()).toEqual({
    upload_id: 'upload',
    part_index: 1,
    block_size: '10',
    md5: 'part-md5',
  });
  expect(await requests.at(-1)!.json()).toEqual({ callback_data: 'source' });
  expect(link.data).toEqual({ retcode: 0, msg: 'success', data: { url: 'https://example.com/share' } });
});

test('群管理员接口错误', async () => {
  const api = new MockOpenApi();
  const requests: Request[] = [];

  globalThis.fetch = mockFetch(async (input, init) => {
    const request = input instanceof Request ? new Request(input, init) : new Request(input.toString(), init);
    requests.push(request);

    if (request.url === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    return Response.json(api.notGroupAdmin(), { status: 500 });
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret' });

  const results = await Promise.allSettled([
    client.reviewGroupJoinRequest('group', 'member', {
      op: 'decline',
      join_request_id: 'request',
      reject_reason: '拒绝理由',
      add_to_member_blacklist: true,
    }),
    client.getGroupJoinRequestList('group', { cursor: 'cursor', limit: 20 }),
    client.getGroupMuteState('group'),
    client.setGroupMemberMute('group', {
      members: [{ op: 'add', member_openid: 'member', mute_expire_at: '2026-08-12T12:00:00+08:00' }],
    }),
  ]);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      throw new Error('预期群管理员接口请求失败');
    }
    const error = result.reason;

    if (!(error instanceof TotteError) || !(error.cause instanceof Response)) {
      throw error;
    }
    expect(error.cause.status).toBe(500);
    expect(await error.cause.json()).toEqual(api.notGroupAdmin());
  }

  expect(requests.slice(1).map(request => [request.method, request.url])).toEqual([
    ['POST', 'https://api.bot.qq.com/v2/groups/group/approval_join_request/member'],
    ['GET', 'https://api.bot.qq.com/v2/groups/group/join_request_list?cursor=cursor&limit=20'],
    ['GET', 'https://api.bot.qq.com/v2/groups/group/restrict_chat_setting'],
    ['POST', 'https://api.bot.qq.com/v2/groups/group/restrict_chat_setting'],
  ]);
  expect(await requests[1]!.json()).toEqual({
    op: 'decline',
    join_request_id: 'request',
    reject_reason: '拒绝理由',
    add_to_member_blacklist: true,
  });
  expect(await requests[4]!.json()).toEqual({
    members: [{ op: 'add', member_openid: 'member', mute_expire_at: '2026-08-12T12:00:00+08:00' }],
  });
});

test('入群审批策略接口', async () => {
  const api = new MockOpenApi();
  const requests: Request[] = [];
  const listData = api.getGroupJoinApprovalStrategyList();
  const createdData = api.createGroupJoinApprovalStrategy();
  const updatedData = api.updateGroupJoinApprovalStrategy();
  const whitelistData = api.updateGroupJoinApprovalStrategyWhitelist();

  globalThis.fetch = mockFetch(async (input, init) => {
    const request = input instanceof Request ? new Request(input, init) : new Request(input.toString(), init);
    requests.push(request);

    if (request.url === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    if (request.method === 'GET') {
      return Response.json(listData);
    }
    if (request.method === 'DELETE') {
      return Response.json(api.deleteGroupJoinApprovalStrategy());
    }
    if (request.method === 'PATCH') {
      return Response.json(updatedData);
    }
    if (request.url.endsWith('/execute')) {
      return Response.json(api.executeGroupJoinApprovalStrategy());
    }
    if (request.url.endsWith('/whitelist_users')) {
      return Response.json(whitelistData);
    }
    return Response.json(createdData);
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret' });

  const list = await client.getGroupJoinApprovalStrategyList({ cursor: 'cursor', limit: 20 });
  const created = await client.createGroupJoinApprovalStrategy({ group_openids: ['group'], is_enable: 'on' });
  const deleted = await client.deleteGroupJoinApprovalStrategy('strategy');
  const updated = await client.updateGroupJoinApprovalStrategy('strategy', { is_enable: 'off' });
  const executed = await client.executeGroupJoinApprovalStrategy('strategy');
  const whitelist = await client.updateGroupJoinApprovalStrategyWhitelist('strategy', {
    op: 'add',
    whitelist_users: ['10000'],
  });

  expect(list.data).toEqual(listData);
  expect(created.data).toEqual(createdData);
  expect(deleted.data).toEqual({});
  expect(updated.data).toEqual(updatedData);
  expect(executed.data).toEqual({});
  expect(whitelist.data).toEqual(whitelistData);
  expect(requests.slice(1).map(request => [request.method, request.url])).toEqual([
    ['GET', 'https://api.bot.qq.com/v2/groups/join_approval_strategy?cursor=cursor&limit=20'],
    ['POST', 'https://api.bot.qq.com/v2/groups/join_approval_strategy'],
    ['DELETE', 'https://api.bot.qq.com/v2/groups/join_approval_strategy/strategy'],
    ['PATCH', 'https://api.bot.qq.com/v2/groups/join_approval_strategy/strategy'],
    ['POST', 'https://api.bot.qq.com/v2/groups/join_approval_strategy/strategy/execute'],
    ['POST', 'https://api.bot.qq.com/v2/groups/join_approval_strategy/strategy/whitelist_users'],
  ]);
  expect(await requests[2]!.json()).toEqual({ group_openids: ['group'], is_enable: 'on' });
  expect(await requests[4]!.json()).toEqual({ is_enable: 'off' });
  expect(await requests[6]!.json()).toEqual({ op: 'add', whitelist_users: ['10000'] });
});
