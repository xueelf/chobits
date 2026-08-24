import { type Client, type ClientEvent } from '#/index';

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

const isGroupMessage = (event: MessageEvent): event is GroupMessageEvent => {
  return Object.hasOwn(event, 'group_openid');
};

const getPixivImageUrl = async (): Promise<string> => {
  const response = await fetch('https://pixiv.yuki.sh/api/recommend?type=json');
  const { data } = <ImageResponse>await response.json();
  const url = data?.urls?.regular;

  if (!response.ok || !url) {
    throw new Error(`图片接口请求失败：${response.status}`);
  }
  return url;
};

const uploadImage = async (client: Client, event: MessageEvent, url: string): Promise<string> => {
  if (isGroupMessage(event)) {
    const file = await client.uploadGroupFile(event.group_openid, { file_type: 1, url, srv_send_msg: false });

    return file.file_info;
  }
  const file = await client.uploadUserFile(event.author.user_openid, { file_type: 1, url, srv_send_msg: false });

  return file.file_info;
};

const handleMessage = async (client: Client, event: MessageEvent): Promise<void> => {
  const content = event.content.trim();

  if (content === '测试文本') {
    await event.reply('hello world');
  }
  if (content === '测试图片') {
    const url = await getPixivImageUrl();
    const file_info = await uploadImage(client, event, url);

    await event.reply({ msg_type: 7, media: { file_info } });
  }
  if (content === '测试排版') {
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
  }
  if (content === '测试按钮') {
    await event.reply({
      msg_type: 0,
      content: '点击下方按钮测试互动事件。',
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
  }
};

export const registerHandlers = (client: Client): void => {
  client.on('C2C_MESSAGE_CREATE', async event => {
    await handleMessage(client, event);
  });
  client.on('GROUP_AT_MESSAGE_CREATE', async event => {
    await handleMessage(client, event);
  });
  client.on('GROUP_MESSAGE_CREATE', async event => {
    await handleMessage(client, event);
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
