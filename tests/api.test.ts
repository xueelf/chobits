import { expect, test } from 'bun:test';

import { MockOpenApi } from './mocks/open-api';

test('OpenAPI 响应数据', () => {
  const api = new MockOpenApi();

  expect(api.getAccessToken()).toEqual({
    access_token: 'access-token',
    expires_in: '7200',
  });
  expect(api.getGateway()).toEqual({ url: 'wss://gateway.example.com' });
  expect(api.getBotInfo()).toEqual({
    avatar: '',
    id: 'bot-id',
    share_url: 'https://example.com/bot',
    username: 'bot',
    welcome_msg: '',
  });
  expect(api.generateShareLink()).toEqual({
    retcode: 0,
    msg: 'success',
    data: { url: 'https://example.com/share' },
  });
  expect(api.getMenu()).toEqual({ version: 1, menu: {} });
  expect(api.updateMenu()).toEqual({ version: 2 });
  expect(api.getPanelList()).toMatchObject({
    records: [
      {
        panel_id: 'panel-id',
        scope: 'group',
        target_type: 'specific',
        panel: {
          items: [{ name: '测试指令', desc: 'Chobits OpenAPI 测试', type: 'command' }],
          remark: 'Chobits OpenAPI 测试',
        },
        version: 1,
      },
    ],
    is_end: true,
  });
  expect(api.getPanelList()).not.toHaveProperty('next_cursor');
  expect(api.createPanel()).toEqual({ panel_id: 'panel-id' });
  expect(api.getPanel()).toMatchObject({ panel_id: 'panel-id', group_openids: ['group-openid'] });
  expect(api.updatePanel()).toEqual({ version: 2 });
  expect(api.notGroupAdmin()).toEqual({
    message: 'not group admin',
    code: 11703,
    err_code: 11703,
    trace_id: 'trace-id',
  });
  expect(api.invalidRequestData()).toEqual({
    message: '请求数据异常',
    code: 40011000,
    err_code: 40011000,
    trace_id: 'trace-id',
  });
  expect(api.sendUserMessage()).toMatchObject({
    id: 'user-message-id',
    ext_info: { ref_idx: 'user-message-index' },
  });
  expect(api.sendUserStreamMessage()).toMatchObject({
    id: 'user-stream-message-id',
    ext_info: { ref_idx: 'user-message-index' },
    remain_msg_len: 0,
  });
  expect(api.uploadUserFile()).toEqual({
    file_uuid: 'user-file-uuid',
    file_info: 'user-file-info',
    ttl: 86400,
    id: '',
    raw_url: '',
  });
  expect(api.prepareUserFileUpload()).toMatchObject({
    upload_id: 'user-upload-id',
    block_size: '5242880',
    parts: [{ index: 1, block_size: '5242880' }],
    upload_config: { concurrency: 1, retry_timeout: 300, retry_delay: 1 },
  });
  expect(api.sendGroupMessage()).toMatchObject({
    id: 'group-message-id',
    ext_info: { ref_idx: 'group-message-index' },
  });
  expect(api.uploadGroupFile()).toEqual({
    file_uuid: 'group-file-uuid',
    file_info: 'group-file-info',
    ttl: 86400,
    id: '',
    raw_url: '',
  });
  expect(api.prepareGroupFileUpload()).toMatchObject({
    upload_id: 'group-upload-id',
    block_size: '5242880',
    parts: [{ index: 1, block_size: '5242880' }],
    upload_config: { concurrency: 1, retry_timeout: 300, retry_delay: 1 },
  });
  expect(api.getGroupInfo()).toEqual({
    group_openid: 'group-openid',
    group_name: '测试群',
    group_finger_memo: '',
    group_class_text: '游戏',
    group_tags: [],
    group_member_num: 3,
  });
  expect(api.getGroupBotState()).toMatchObject({
    member_openid: 'bot-member-openid',
    allow_proactive_msg: true,
    recv_msg_setting: 'all',
    member_role: 'member',
  });
  expect(api.getGroupJoinApprovalStrategyList()).toMatchObject({
    strategies: [
      {
        strategy_id: 'strategy-id',
        group_openids: ['group-openid'],
        group_ids: [],
        whitelist_user_count: 0,
        is_enable: 'off',
        remark: 'Chobits OpenAPI 测试',
      },
    ],
    next_cursor: '',
  });
  expect(api.createGroupJoinApprovalStrategy()).toMatchObject({ strategy_id: 'strategy-id', is_enable: 'on' });
  expect(api.updateGroupJoinApprovalStrategy()).toMatchObject({ is_enable: 'off' });
  expect(api.updateGroupJoinApprovalStrategyWhitelist()).toMatchObject({
    strategy_id: 'strategy-id',
    whitelist_user_count: 0,
  });
  expect(api.recallUserMessage()).toEqual({});
  expect(api.finishUserFileUploadPart()).toEqual({});
  expect(api.recallGroupMessage()).toEqual({});
  expect(api.finishGroupFileUploadPart()).toEqual({});
  expect(api.executeGroupJoinApprovalStrategy()).toEqual({});
  expect(api.deleteGroupJoinApprovalStrategy()).toEqual({});
  expect(api.deletePanel()).toEqual({});
  expect(api.updatePanelTarget()).toEqual({});
  expect(api.respondToInteraction()).toEqual({});
});
