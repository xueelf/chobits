import { afterEach, expect, test } from 'bun:test';

import { EmbusError } from 'embus';

import { type Logger, type SendGroupMessagePayload, type SendUserMessagePayload, Client } from '#/index';
import { isRecord } from '#/utils/type';

import { MockOpenApi } from './mocks/open-api';
import { mockFetch, readMessageBody, readRequestBody, toRequest } from './mocks/request';

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
    const request = toRequest(input, init);
    requests.push(request);

    if (request.url === 'https://api.bot.qq.com/app/getAppAccessToken') {
      tokenRequests++;
      return Response.json(api.getAccessToken());
    }
    return Response.json(api.sendUserMessage({ id: 'message-id', timestamp }));
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret' });
  const userPayload: SendUserMessagePayload = { msg_type: 0, content: 'user', msg_seq: 42 };

  const [userMessage, groupMessage] = await Promise.all([
    client.sendUserMessage('user-openid', userPayload),
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

  expect(userMessage).toEqual({
    id: 'message-id',
    timestamp,
    ext_info: { ref_idx: 'user-message-index' },
  });
  expect(groupMessage).toEqual(userMessage);
  expect(tokenRequests).toBe(1);
  expect(requests).toHaveLength(3);

  const [accessToken, user, group] = requests;

  if (!accessToken || !user || !group) {
    throw new TypeError('OpenAPI 请求数量无效');
  }
  expect(accessToken.method).toBe('POST');
  expect(accessToken.headers.get('Authorization')).toBeNull();
  expect(accessToken.headers.get('Content-Type')).toBe('application/json');
  expect(await accessToken.json()).toEqual({ appId: 'app-id', clientSecret: 'secret' });

  expect(user.url).toBe('https://api.bot.qq.com/v2/users/user-openid/messages');
  expect(user.method).toBe('POST');
  expect(user.headers.get('Authorization')).toBe('QQBot access-token');
  expect(user.headers.get('Content-Type')).toBe('application/json');
  const userBody = await readMessageBody(user);
  expect(userBody).toMatchObject({ msg_type: 0, content: 'user' });
  expect(userBody.msg_seq).toBe(42);

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
  const authStart = logs.find(([, message]) => message === '开始获取 Access Token');
  const authSuccess = logs.find(([, message]) => message === 'Access Token 获取成功');
  const openApiRequest = logs.find(([, message]) => message === '发送 OpenAPI 请求');
  const openApiResponse = logs.find(([, message]) => message === '收到 OpenAPI 响应');
  const [, , authData] = authSuccess ?? [];
  const [, , requestData] = openApiRequest ?? [];
  const [, , responseData] = openApiResponse ?? [];

  expect(authStart).toEqual(['auth', '开始获取 Access Token']);
  expect(authData).toEqual({ expiresIn: 7200 });
  expect(requestData).toEqual({
    headers: { authorization: 'QQBot access-token' },
    method: 'GET',
    origin: 'https://api.bot.qq.com',
    responseType: 'json',
    url: '/users/@me',
  });
  expect(responseData).toMatchObject({
    config: {
      headers: { authorization: 'QQBot access-token' },
      method: 'GET',
      origin: 'https://api.bot.qq.com',
      responseType: 'json',
      url: '/users/@me',
    },
    data: {
      avatar: '',
      id: 'bot-id',
      share_url: 'https://example.com/bot',
      username: 'bot',
      welcome_msg: '',
    },
    status: 200,
    statusText: '',
  });
  expect(JSON.stringify(logs)).toContain('access-token');
  expect(JSON.stringify(logs)).not.toContain('secret');
});

test('修改日志数据', async () => {
  const api = new MockOpenApi();
  const requests: Request[] = [];
  const payload: SendUserMessagePayload = { msg_type: 0, content: 'hello world', msg_seq: 42 };
  const logger: Logger = (_kind, message, data) => {
    if (message === '发送 OpenAPI 请求' && isRecord(data)) {
      const loggedPayload = Reflect.get(data, 'payload');

      if (isRecord(loggedPayload)) {
        Reflect.set(loggedPayload, 'content', 'modified request');
      }
    } else if (message === '收到 OpenAPI 响应' && isRecord(data)) {
      const loggedData = Reflect.get(data, 'data');

      if (isRecord(loggedData)) {
        Reflect.set(loggedData, 'id', 'modified response');
      }
    }
  };

  globalThis.fetch = mockFetch(async (input, init) => {
    const request = toRequest(input, init);

    if (request.url === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    requests.push(request);
    return Response.json(api.sendUserMessage());
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret', logger });
  const message = await client.sendUserMessage('user-openid', payload);

  const [request] = requests;

  if (!request) {
    throw new TypeError('缺少消息请求');
  }
  expect((await readMessageBody(request)).content).toBe('hello world');
  expect(payload.content).toBe('hello world');
  expect(message.id).toBe('user-message-id');
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
    const request = toRequest(input, init);

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
  const [firstRequest, secondRequest] = requests;

  expect(await readRequestBody(firstRequest)).toEqual({
    input_state: 1,
    index: 0,
    content_raw: '第一段',
    msg_id: 'message-id',
    msg_seq: 42,
  });
  expect(await readRequestBody(secondRequest)).toEqual({
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
    if (!(error instanceof EmbusError) || !(error.response instanceof Response)) {
      throw error;
    }
    expect(error.response.status).toBe(400);
    expect(await error.response.json()).toEqual(api.invalidRequestData());
  }
});

test('OpenAPI 业务错误', async () => {
  const api = new MockOpenApi();
  const logs: Parameters<Logger>[] = [];
  const response = api.invalidRequestData();

  globalThis.fetch = mockFetch(async input => {
    if (String(input) === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    return Response.json(response);
  });

  const client = new Client({
    appId: 'app-id',
    clientSecret: 'secret',
    logger: (...entry) => logs.push(entry),
  });

  try {
    await client.recallGroupMessage('group', 'message');
    throw new Error('预期请求失败');
  } catch (error) {
    expect(error).toEqual(new Error(response.message));
  }
  const responseLog = logs.find(([, message]) => message === '收到 OpenAPI 响应');
  const [, , responseData] = responseLog ?? [];

  expect(responseData).toMatchObject({
    data: response,
    status: 200,
  });
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
    expect(error.cause).toBe(response.code);
  }
  expect(requests).toBe(1);
});

test('文件与分片上传', async () => {
  const api = new MockOpenApi();
  const requests: Request[] = [];
  const userFileData = api.uploadUserFile();
  const userPreparedData = api.prepareUserFileUpload();
  const groupFileData = api.uploadGroupFile();
  const groupPreparedData = api.prepareGroupFileUpload();

  globalThis.fetch = mockFetch(async (input, init) => {
    const request = toRequest(input, init);

    if (request.url === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    requests.push(request);
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
    return Response.json({});
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret' });

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

  expect(userFile).toEqual(userFileData);
  expect(userPrepared).toEqual(userPreparedData);
  expect(userFinished).toEqual({});
  expect(groupFile).toEqual(groupFileData);
  expect(groupPrepared).toEqual(groupPreparedData);
  expect(groupFinished).toEqual({});
  expect(requests.map(request => [request.method, request.url])).toEqual([
    ['POST', 'https://api.bot.qq.com/v2/users/user/files'],
    ['POST', 'https://api.bot.qq.com/v2/users/user/upload_prepare'],
    ['POST', 'https://api.bot.qq.com/v2/users/user/upload_part_finish'],
    ['POST', 'https://api.bot.qq.com/v2/groups/group/files'],
    ['POST', 'https://api.bot.qq.com/v2/groups/group/upload_prepare'],
    ['POST', 'https://api.bot.qq.com/v2/groups/group/upload_part_finish'],
  ]);
  const [
    uploadUserFileRequest,
    prepareUserFileUploadRequest,
    ,
    uploadGroupFileRequest,
    ,
    finishGroupFileUploadPartRequest,
  ] = requests;

  expect(await readRequestBody(uploadUserFileRequest)).toEqual({
    file_type: 1,
    url: 'https://example.com/user.png',
    srv_send_msg: false,
  });
  expect(await readRequestBody(prepareUserFileUploadRequest)).toEqual({
    file_type: 4,
    file_size: '10',
    file_name: 'user.txt',
    md5: 'md5',
    sha1: 'sha1',
    md5_10m: 'md5-10m',
  });
  expect(await readRequestBody(uploadGroupFileRequest)).toEqual({
    file_type: 2,
    url: 'https://example.com/group.mp4',
    srv_send_msg: false,
  });
  expect(await readRequestBody(finishGroupFileUploadPartRequest)).toEqual({
    upload_id: 'upload',
    part_index: 1,
    block_size: '10',
    md5: 'part-md5',
  });
});

test('群信息', async () => {
  const api = new MockOpenApi();
  const requests: Request[] = [];
  const groupInfoData = api.getGroupInfo();
  const stateData = api.getGroupBotState();

  globalThis.fetch = mockFetch(async (input, init) => {
    const request = toRequest(input, init);

    if (request.url === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    requests.push(request);
    return Response.json(request.url.endsWith('/bot_state') ? stateData : groupInfoData);
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret' });
  const groupInfo = await client.getGroupInfo('group');
  const state = await client.getGroupBotState('group');

  expect(groupInfo).toEqual(groupInfoData);
  expect(state).toEqual(stateData);
  expect(requests.map(request => [request.method, request.url])).toEqual([
    ['GET', 'https://api.bot.qq.com/v2/groups/group/info'],
    ['GET', 'https://api.bot.qq.com/v2/groups/group/bot_state'],
  ]);
});

test('撤回、互动与分享', async () => {
  const api = new MockOpenApi();
  const requests: Request[] = [];

  globalThis.fetch = mockFetch(async (input, init) => {
    const request = toRequest(input, init);

    if (request.url === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    requests.push(request);
    return Response.json(request.url.endsWith('/generate_url_link') ? api.generateShareLink() : {});
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret' });
  const recalled = await client.recallUserMessage('user', 'message');
  const interaction = await client.respondToInteraction('interaction', { code: 0 });
  const link = await client.generateShareLink({ callback_data: 'source' });
  const [, , shareLinkRequest] = requests;

  expect(recalled).toEqual({});
  expect(interaction).toEqual({});
  expect(link).toEqual({ retcode: 0, msg: 'success', data: { url: 'https://example.com/share' } });
  expect(requests.map(request => [request.method, request.url])).toEqual([
    ['DELETE', 'https://api.bot.qq.com/v2/users/user/messages/message'],
    ['PUT', 'https://api.bot.qq.com/interactions/interaction'],
    ['POST', 'https://api.bot.qq.com/v2/generate_url_link'],
  ]);
  expect(await readRequestBody(shareLinkRequest)).toEqual({ callback_data: 'source' });
});

test('自定义菜单与指令面板', async () => {
  const api = new MockOpenApi();
  const requests: Request[] = [];

  globalThis.fetch = mockFetch(async (input, init) => {
    const request = toRequest(input, init);

    if (request.url === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    requests.push(request);
    return Response.json({});
  });

  const client = new Client({ appId: 'app-id', clientSecret: 'secret' });

  await client.getMenu();
  await client.updateMenu({
    menu: { items: [{ name: '帮助', type: 'send_message', send_message: '/help' }] },
  });
  await client.getPanelList({ scope: 'c2c', cursor: 'cursor', limit: 10 });
  await client.createPanel({
    scope: 'group',
    target_type: 'specific',
    group_openids: ['group'],
    panel: { items: [{ name: '签到', desc: '每日签到', type: 'command' }] },
  });
  await client.getPanel('panel');
  await client.updatePanel('panel', {
    panel: { items: [{ name: '帮助', type: 'link', link: 'https://example.com' }], remark: '帮助面板' },
  });
  await client.deletePanel('panel');
  await client.updatePanelTarget('panel', { op: 'add', group_openids: ['group'] });

  expect(requests.map(request => [request.method, request.url])).toEqual([
    ['GET', 'https://api.bot.qq.com/v2/menu'],
    ['PUT', 'https://api.bot.qq.com/v2/menu'],
    ['GET', 'https://api.bot.qq.com/v2/panels?scope=c2c&cursor=cursor&limit=10'],
    ['POST', 'https://api.bot.qq.com/v2/panels'],
    ['GET', 'https://api.bot.qq.com/v2/panels/panel'],
    ['PUT', 'https://api.bot.qq.com/v2/panels/panel'],
    ['DELETE', 'https://api.bot.qq.com/v2/panels/panel'],
    ['PUT', 'https://api.bot.qq.com/v2/panels/panel/target'],
  ]);
  const [, updateMenuRequest, , createPanelRequest, , updatePanelRequest, , updatePanelTargetRequest] = requests;

  expect(await readRequestBody(updateMenuRequest)).toEqual({
    menu: { items: [{ name: '帮助', type: 'send_message', send_message: '/help' }] },
  });
  expect(await readRequestBody(createPanelRequest)).toEqual({
    scope: 'group',
    target_type: 'specific',
    group_openids: ['group'],
    panel: { items: [{ name: '签到', desc: '每日签到', type: 'command' }] },
  });
  expect(await readRequestBody(updatePanelRequest)).toEqual({
    panel: { items: [{ name: '帮助', type: 'link', link: 'https://example.com' }], remark: '帮助面板' },
  });
  expect(await readRequestBody(updatePanelTargetRequest)).toEqual({ op: 'add', group_openids: ['group'] });
});

test('群管理员接口错误', async () => {
  const api = new MockOpenApi();
  const requests: Request[] = [];

  globalThis.fetch = mockFetch(async (input, init) => {
    const request = toRequest(input, init);

    if (request.url === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    requests.push(request);
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

    if (!(error instanceof EmbusError) || !(error.response instanceof Response)) {
      throw error;
    }
    expect(error.response.status).toBe(500);
    expect(await error.response.json()).toEqual(api.notGroupAdmin());
  }

  expect(requests.map(request => [request.method, request.url])).toEqual([
    ['POST', 'https://api.bot.qq.com/v2/groups/group/approval_join_request/member'],
    ['GET', 'https://api.bot.qq.com/v2/groups/group/join_request_list?cursor=cursor&limit=20'],
    ['GET', 'https://api.bot.qq.com/v2/groups/group/restrict_chat_setting'],
    ['POST', 'https://api.bot.qq.com/v2/groups/group/restrict_chat_setting'],
  ]);
  const [reviewRequest, , , muteRequest] = requests;

  expect(await readRequestBody(reviewRequest)).toEqual({
    op: 'decline',
    join_request_id: 'request',
    reject_reason: '拒绝理由',
    add_to_member_blacklist: true,
  });
  expect(await readRequestBody(muteRequest)).toEqual({
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
    const request = toRequest(input, init);

    if (request.url === 'https://api.bot.qq.com/app/getAppAccessToken') {
      return Response.json(api.getAccessToken());
    }
    requests.push(request);
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

  expect(list).toEqual(listData);
  expect(created).toEqual(createdData);
  expect(deleted).toEqual({});
  expect(updated).toEqual(updatedData);
  expect(executed).toEqual({});
  expect(whitelist).toEqual(whitelistData);
  expect(requests.map(request => [request.method, request.url])).toEqual([
    ['GET', 'https://api.bot.qq.com/v2/groups/join_approval_strategy?cursor=cursor&limit=20'],
    ['POST', 'https://api.bot.qq.com/v2/groups/join_approval_strategy'],
    ['DELETE', 'https://api.bot.qq.com/v2/groups/join_approval_strategy/strategy'],
    ['PATCH', 'https://api.bot.qq.com/v2/groups/join_approval_strategy/strategy'],
    ['POST', 'https://api.bot.qq.com/v2/groups/join_approval_strategy/strategy/execute'],
    ['POST', 'https://api.bot.qq.com/v2/groups/join_approval_strategy/strategy/whitelist_users'],
  ]);
  const [, createRequest, , updateRequest, , whitelistRequest] = requests;

  expect(await readRequestBody(createRequest)).toEqual({ group_openids: ['group'], is_enable: 'on' });
  expect(await readRequestBody(updateRequest)).toEqual({ is_enable: 'off' });
  expect(await readRequestBody(whitelistRequest)).toEqual({ op: 'add', whitelist_users: ['10000'] });
});
