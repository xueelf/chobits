import { EmbusError } from 'embus';

import { type Client, type ClientEvent } from '#/index';
import { logger } from '~/examples/logger';

const BUTTON_ACTION = 'example:button';

type MessageEvent = ClientEvent<'C2C_MESSAGE_CREATE' | 'GROUP_AT_MESSAGE_CREATE' | 'GROUP_MESSAGE_CREATE'>;
type GroupMessageEvent = ClientEvent<'GROUP_AT_MESSAGE_CREATE' | 'GROUP_MESSAGE_CREATE'>;

interface ImageResponse {
  data?: {
    urls?: {
      regular?: string;
    };
  };
}

const getPixivImageUrl = async (): Promise<string> => {
  const response = await fetch('https://pixiv.yuki.sh/api/recommend?type=json&proxy=i.pixiv.re');
  const { data } = <ImageResponse>await response.json();
  const url = data?.urls?.regular;

  if (!response.ok || !url) {
    throw new Error(`图片接口请求失败：${response.status}`);
  }
  return url;
};

const isGroupMessage = (event: MessageEvent): event is GroupMessageEvent => {
  return Object.hasOwn(event, 'group_openid');
};

const uploadImage = async (client: Client, event: MessageEvent, url: string): Promise<string> => {
  if (isGroupMessage(event)) {
    const file = await client.uploadGroupFile(event.group_openid, { file_type: 1, url, srv_send_msg: false });

    return file.file_info;
  }
  const file = await client.uploadUserFile(event.author.user_openid, { file_type: 1, url, srv_send_msg: false });

  return file.file_info;
};

const handleGroupCommand = async (client: Client, event: GroupMessageEvent, content: string): Promise<void> => {
  const { group_openid } = event;
  const target = event.mentions?.find(mention => !mention.is_you)?.member_openid;
  const command = target ? (content.split('<@')[0] ?? content).trim() : content;

  switch (command) {
    case '测试群信息':
      await client.getGroupInfo(group_openid);
      break;
    case '测试群成员列表':
      await client.getGroupMemberList(group_openid);
      break;
    case '测试入群申请列表':
      await client.getGroupJoinRequestList(group_openid);
      break;
    case '测试审批通过':
    case '测试审批拒绝': {
      const { list } = await client.getGroupJoinRequestList(group_openid);
      const [request] = list;

      if (request) {
        await client.reviewGroupJoinRequest(group_openid, request.member_openid, {
          op: command === '测试审批通过' ? 'approve' : 'decline',
          join_request_id: request.join_request_id,
          ...(command === '测试审批拒绝' ? { reject_reason: '测试拒绝' } : {}),
        });
      }
      break;
    }
    case '测试禁言状态':
      await client.getGroupMuteState(group_openid);
      break;
    case '测试黑名单':
      await client.getGroupMemberBlacklist(group_openid);
      break;
    case '测试成员信息':
      if (target) {
        await client.getGroupMemberInfo(group_openid, target);
      }
      break;
    case '测试禁言':
      if (target) {
        await client.setGroupMemberMute(group_openid, {
          members: [{ op: 'add', member_openid: target, mute_expire_at: new Date(Date.now() + 60000).toISOString() }],
        });
      }
      break;
    case '测试解除禁言':
      if (target) {
        await client.setGroupMemberMute(group_openid, { members: [{ op: 'del', member_openid: target }] });
      }
      break;
    case '测试移除成员':
      if (target) {
        await client.removeGroupMembers(group_openid, { member_openids: [target] });
      }
      break;
  }
};

const handleMessage = async (client: Client, event: MessageEvent): Promise<void> => {
  const content = event.content.trim();

  switch (content) {
    case '测试文本':
      await event.reply('hello world');
      break;
    case '测试图片': {
      const url = await getPixivImageUrl();
      const file_info = await uploadImage(client, event, url);

      await event.reply({ msg_type: 7, media: { file_info } });
      break;
    }
    case '测试at':
      await event.reply({ msg_type: 2, markdown: { content: '<qqbot-at-everyone /> 测试 at 全体成员' } });
      break;
    case '测试md':
      await event.reply({
        msg_type: 2,
        markdown: {
          content: [
            '# 一级标题',
            '## 二级标题',
            '**粗体**、_斜体_、~~删除线~~',
            '> 块引用',
            '***',
            '1. 有序列表',
            '2. 有序列表',
            '- 无序列表',
            '- [链接](https://github.com/xueelf/chobits)',
          ].join('\n'),
        },
      });
      break;
    case '测试卡片': {
      const url = await getPixivImageUrl();

      await event.reply({
        msg_type: 8,
        card: {
          type: 'tuwen',
          content: {
            title: '图文卡片',
            description: '测试 msg_type=8 消息',
            url: 'https://github.com/xueelf/chobits',
            pic_url: url,
          },
        },
      });
      break;
    }
    case '测试按钮':
      await event.reply({
        msg_type: 2,
        markdown: {
          content: '点击下方按钮测试互动事件。',
        },
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  {
                    id: 'example-button',
                    render_data: { label: '确认', visited_label: '已确认', style: 1 },
                    action: {
                      type: 1,
                      permission: { type: 2 },
                      data: BUTTON_ACTION,
                      unsupport_tips: '请更新 QQ 版本',
                    },
                  },
                ],
              },
            ],
          },
        },
      });
      break;
    default:
      if (content === '测试用户信息' || content.startsWith('测试用户信息 ')) {
        const openid =
          content.slice('测试用户信息'.length).trim() || (!isGroupMessage(event) ? event.author.user_openid : '');

        if (openid) {
          await client.getUserInfo(openid);
        }
      } else if (isGroupMessage(event)) {
        await handleGroupCommand(client, event, content);
      }
  }
};

const handleMessageSafely = async (client: Client, event: MessageEvent): Promise<void> => {
  try {
    await handleMessage(client, event);
  } catch (error) {
    if (!(error instanceof EmbusError) || !error.response) {
      throw error;
    }
    logger('openapi', 'OpenAPI 错误响应', {
      url: error.response.url,
      status: error.response.status,
      statusText: error.response.statusText,
      body: await error.response.text(),
    });
  }
};

export const registerHandlers = (client: Client): void => {
  client.on('C2C_MESSAGE_CREATE', async event => {
    await handleMessageSafely(client, event);
  });
  client.on('GROUP_AT_MESSAGE_CREATE', async event => {
    await handleMessageSafely(client, event);
  });
  client.on('GROUP_MESSAGE_CREATE', async event => {
    await handleMessageSafely(client, event);
  });
  client.on('INTERACTION_CREATE', async event => {
    if (event.data.resolved.button_data === BUTTON_ACTION) {
      await client.respondToInteraction(event.id, { code: 0 });
      await event.reply('按钮点击成功。');
    }
  });
  client.on('error', error => {
    console.error('WebSocket 连接错误', error);
  });
};
