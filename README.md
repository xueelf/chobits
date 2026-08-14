# Chobits

Chobits 是一个使用 TypeScript 语言，基于 Web API 开发的 QQ 机器人 SDK。

## 介绍

Chobits 提供消息事件接收、消息回复、主动消息、文件上传等常用能力，并支持两种事件接入方式：

- **WebSocket**，适合持续运行的机器人服务。
- **Webhook**，适合通过 HTTP 接收事件的服务器或云函数。

Chobits 仅支持 **QQ 群聊与私聊**，不兼容 QQ 频道及官方已经废弃的接口。项目以 **纯 ESM** 发布，使用标准 Web API，不依赖 Node.js、Bun 或其他运行时的专有 API。

> [!WARNING]
> QQ 机器人官方文档中的部分事件与接口说明，与实际收到的事件推送或接口响应并不一致。截至 2026 年 8 月 12 日，Chobits 已分别使用 QQ 平台的 WebSocket、Webhook 和 OpenAPI 完成联调，核对并处理这些差异。由于 QQ 接口仍可能调整，正式使用前建议结合自身场景完成测试。

## 安装

```shell
npm install chobits
```

## 快速开始

使用前，请在 [QQ 开放平台](https://q.qq.com/qqbot/) 创建机器人，并在开发设置中取得 AppID 与 AppSecret。接口与事件的详细说明可以查阅 [QQ 机器人开发文档](https://bot.q.qq.com/wiki/develop/api-v2/)。

```typescript
import { Client } from 'chobits';

const bot = new Client({
  appId: '1145141919',
  clientSecret: '38bc73e16208135fb111c0c573a44eaa',
});

bot.on('C2C_MESSAGE_CREATE', async event => {
  // 机器人会在收到私聊消息后立即回复
  await event.reply('收到私聊消息');
});

bot.on('GROUP_AT_MESSAGE_CREATE', async event => {
  // 机器人会在收到群聊 @ 消息后立即回复
  await event.reply('收到群 @ 消息');
});

bot.on('GROUP_MESSAGE_CREATE', async event => {
  // 机器人会在收到群聊消息后立即回复（需要群主授权）
  await event.reply('收到群聊消息');
});
```

### WebSocket

```typescript
import { Client } from 'chobits';

const bot = new Client(options);

bot.on('READY', async event => {
  console.log('服务连接成功');
});

await bot.online();
```

调用 `online()` 便会建立 WebSocket 连接，可以使用 `await` 等待连接成功。

除此之外 `offline()` 会主动断开 WebSocket 连接，并清理当前会话状态：

```typescript
await bot.offline();
```

首次连接失败时，`online()` 会抛出错误。WebSocket 连接建立后，Chobits 会自动处理心跳和断线重连。后续发生的内部连接错误会触发 `error` 事件，例如自动重连失败：

```typescript
bot.on('error', error => {
  console.error(error);
});
```

事件监听器中的错误不会触发 `error`，需要开发者自行捕获：

```typescript
bot.on('C2C_MESSAGE_CREATE', async event => {
  try {
    await event.reply('hello world');
  } catch (error) {
    console.error('消息发送失败', error);
  }
});
```

### Webhook

Webhook 是 QQ 主动发送到指定 HTTP 地址的事件请求。`Client` 的 `callback()` 接收一个 Web 标准的 [Request](https://developer.mozilla.org/zh-CN/docs/Web/API/Request)，并返回一个 Web 标准的 [Response](https://developer.mozilla.org/zh-CN/docs/Web/API/Response)。

Chobits 不内置 HTTP Server，也不依赖 Express、Hono 或其他服务器框架。Webhook 使用 Web Crypto 中的 [Ed25519](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/verify#ed25519) 算法校验签名。

#### HTTP Server

HTTP Server 需要将返回的 `Response` 作为当前请求的响应。`callback()` 会完成回调地址验证、事件签名校验和事件确认，监听器不会阻塞确认响应。

[Hono](https://hono.dev/docs/concepts/web-standard)：

```typescript
import { Client } from 'chobits';
import { Hono } from 'hono';

const app = new Hono();
const bot = new Client(options);

app.post('/qq/callback', async context => {
  return await bot.callback(context.req.raw);
});

export default app;
```

[Bun](https://bun.com/docs/runtime/http/routing)：

```typescript
import { serve } from 'bun';

import { Client } from 'chobits';

const bot = new Client(options);

serve({
  routes: {
    '/qq/callback': {
      POST: async request => await bot.callback(request),
    },
  },
});
```

#### 事件处理生命周期

函数 `callback()` 还有一个可选的第二个参数，可以传入**任务处理函数**。收到事件后，Chobits 会将本次事件处理任务对应的 Promise 传给该函数。开发者可以在函数中记录处理耗时、捕获错误、跟踪任务状态，或者将任务注册到云函数的生命周期：

```typescript
const trackTask = async (task: Promise<void>): Promise<void> => {
  const startedAt = performance.now();

  try {
    await task;
  } catch (error) {
    console.error(error);
  } finally {
    console.info(`事件处理耗时 ${performance.now() - startedAt}ms`);
  }
};

app.post('/qq/callback', async context => {
  return await bot.callback(context.req.raw, trackTask);
});
```

#### 云函数

Cloudflare Workers、Vercel Functions 和 Netlify Functions 等云函数平台，可能在 HTTP 响应结束后终止尚未完成的事件处理。使用这些平台时，应将平台提供的**生命周期函数**传入 `callback()` 的第二个参数，使事件处理能够在响应结束后继续运行。

[Cloudflare Workers](https://developers.cloudflare.com/changelog/post/2025-08-08-add-waituntil-cloudflare-workers/)：

```typescript
import { waitUntil } from 'cloudflare:workers';

export default {
  async fetch(request: Request): Promise<Response> {
    return await bot.callback(request, waitUntil);
  },
};
```

[Vercel Functions](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package)：

```typescript
import { waitUntil } from '@vercel/functions';

export async function POST(request: Request): Promise<Response> {
  return await bot.callback(request, waitUntil);
}
```

[Netlify Functions](https://docs.netlify.com/build/functions/api/)：

```typescript
import { type Context } from '@netlify/functions';

export default async (request: Request, context: Context): Promise<Response> => {
  return await bot.callback(request, context.waitUntil);
};
```

如果当前使用的云函数平台没有提供类似的生命周期函数，`callback()` 返回 HTTP 响应后，尚未完成的事件处理可能会被终止。建议迁移至支持任务生命周期管理的云函数平台。

即使使用 `waitUntil`，也需要注意平台的任务执行时间限制。例如，[Cloudflare Workers](https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil) 只允许 `waitUntil` 注册的任务在 HTTP 响应结束后继续运行最多 30 秒。若事件处理可能超过该限制，应将 Chobits 部署在持续运行的服务器上。

## 配置项

| 配置项         | 类型     | 必填 | 说明                                                     |
| -------------- | -------- | ---- | -------------------------------------------------------- |
| `appId`        | `string` | 是   | 机器人 AppID                                             |
| `clientSecret` | `string` | 是   | 机器人 AppSecret                                         |
| `maxRetry`     | `number` | 否   | WebSocket 建立或恢复连接时允许的最大重试次数，默认为 `3` |
| `logger`       | `Logger` | 否   | 自定义日志处理函数                                       |

`maxRetry` 设置为 `0` 时不会重试，设置为 `Infinity` 时会持续重试。重试间隔按照重试次数逐秒增加，最长不超过 30 秒：

```typescript
const bot = new Client({
  appId: '1145141919',
  clientSecret: '38bc73e16208135fb111c0c573a44eaa',
  maxRetry: Infinity,
});
```

## 消息回复

在前面的示例代码中，使用到了 `reply()` 函数，但其实 `event.reply()` 不是 QQ 官方事件字段，而是 Chobits 为可回复事件增加的快捷方法。它会根据事件来源调用 `sendUserMessage()` 或 `sendGroupMessage()`，并自动带上当前消息或事件的 ID。

QQ 的发送消息接口使用 `msg_seq` 与 `msg_id` 共同区分针对同一条消息的多次回复。直接调用 `sendGroupMessage()` 时，可以自行传入目标群、消息 ID 和序号：

```typescript
bot.on('GROUP_MESSAGE_CREATE', async event => {
  await bot.sendGroupMessage(event.group_openid, {
    msg_id: event.id,
    msg_seq: 1,
    msg_type: 0,
    content: 'hello world',
  });
});
```

`msg_seq` 是 QQ 发送消息接口的**必填字段**。官方文档只说明其类型为 `number`，没有给出具体的取值范围。经过实测，有效范围为 **`1` 至 `4294967295`**，最大值即 `2 ** 32 - 1`，传入超出该范围的数值会返回 `40011000` 请求数据异常。

为了减少开发人员的心智负担，Chobits 简化了消息序号的管理。在调用 `sendUserMessage()` 或 `sendGroupMessage()` 时可以省略 `msg_seq`，内部会自动生成一个 `1` 至 `4294967295` 的随机数。如果手动传入，则按指定值发送。

`event.reply()` 在此基础上进一步简化了回复过程，它会自动从当前事件中取得 `msg_id` 或 `event_id`，并为每次回复生成新的 `msg_seq`。这些字段由 Chobits 内部进行管理，不能通过 `reply()` 覆盖。刚刚使用 `sendGroupMessage` 的函数调用可以简化为：

```typescript
bot.on('GROUP_MESSAGE_CREATE', async event => {
  await event.reply('hello world');
});
```

传入字符串时，Chobits 会将其转换为 `msg_type: 0` 的文本消息。发送 Markdown、富媒体或键盘时，需要传入对应场景的官方消息结构：

```typescript
bot.on('GROUP_AT_MESSAGE_CREATE', async event => {
  await event.reply({
    msg_type: 2,
    markdown: {
      content: '**hello world**',
    },
  });

  await event.reply({
    msg_type: 7,
    media: {
      file_info: '上传接口返回的 file_info',
    },
  });
});
```

## 事件

可以通过 `on()` 监听以下事件：

| 事件名                     | 触发场景                                     |
| -------------------------- | -------------------------------------------- |
| `C2C_MESSAGE_CREATE`       | 用户向机器人发送私聊消息                     |
| `FRIEND_ADD`               | 用户添加机器人                               |
| `FRIEND_DEL`               | 用户删除机器人                               |
| `C2C_MSG_RECEIVE`          | 用户开启私聊主动消息                         |
| `C2C_MSG_REJECT`           | 用户关闭私聊主动消息                         |
| `GROUP_AT_MESSAGE_CREATE`  | 用户在群内 @ 机器人                          |
| `GROUP_MESSAGE_CREATE`     | 用户在群内发送普通消息                       |
| `GROUP_ADD_ROBOT`          | 机器人被添加到群                             |
| `GROUP_DEL_ROBOT`          | 机器人被移出群                               |
| `GROUP_MSG_RECEIVE`        | 群消息接收设置被开启                         |
| `GROUP_MSG_REJECT`         | 群消息接收设置被关闭                         |
| `GROUP_MEMBER_ADD`         | 群成员加入群                                 |
| `GROUP_MEMBER_REMOVE`      | 群成员离开群                                 |
| `SUBSCRIBE_MESSAGE_STATUS` | 订阅消息授权状态发生变更                     |
| `GROUP_JOIN_REQUEST`       | 用户申请加入群                               |
| `INTERACTION_CREATE`       | 用户点击消息按钮、变更授权或进入群机器人管理 |
| `READY`                    | WebSocket 会话准备完成                       |
| `RESUMED`                  | WebSocket 会话恢复完成                       |

### 实际事件与文档的差异

QQ 实际推送的部分事件与开发文档中的说明并不一致。以下记录来自我个人对 WebSocket 和 Webhook 的实际测试：

- PC 端修改群消息接收设置时，WebSocket 可以收到 `GROUP_MSG_RECEIVE` 和 `GROUP_MSG_REJECT`。手机端切换「机器人主动在群聊内发言」时没有收到事件。
- 移动端在「机器人权限设置」中开启或关闭「允许主动发送消息」时，WebSocket 与 Webhook 实际收到的是 `INTERACTION_CREATE type: 18`，没有收到文档定义的 `C2C_MSG_RECEIVE` 和 `C2C_MSG_REJECT`。
- 每次进入群设置中的「机器人管理」时，WebSocket 与 Webhook 都会触发 `INTERACTION_CREATE type: 20`，并返回文档没有记录的 `data.type: 2001`。
- 快捷指令和快捷菜单均触发 `C2C_MESSAGE_CREATE`，没有收到文档定义的 `INTERACTION_CREATE type: 12`。服务入口依赖小程序，暂时无法测试。
- WebSocket 与 Webhook 提交入群申请时均未收到 `GROUP_JOIN_REQUEST`，同意申请后可以收到 `GROUP_MEMBER_ADD`。当前没有 `SUBSCRIBE_MESSAGE_STATUS` 的测试条件。

各事件的数据结构可以通过 TypeScript 类型查看。官方文档与实际表现不一致的差异，会记录在对应类型的 `@remarks` 中。

## API

以下 API 可以用于发送消息、上传文件、管理群聊、查询机器人信息和处理交互事件：

| 方法                                       | 功能                       | 官方接口                                                               |
| ------------------------------------------ | -------------------------- | ---------------------------------------------------------------------- |
| `sendUserMessage`                          | 发送私聊消息               | `POST /v2/users/{user_openid}/messages`                                |
| `sendUserStreamMessage`                    | 发送私聊流式消息           | `POST /v2/users/{user_openid}/stream_messages`                         |
| `recallUserMessage`                        | 撤回私聊消息               | `DELETE /v2/users/{user_openid}/messages/{message_id}`                 |
| `uploadUserFile`                           | 上传私聊文件               | `POST /v2/users/{user_openid}/files`                                   |
| `prepareUserFileUpload`                    | 准备私聊文件分片上传       | `POST /v2/users/{user_id}/upload_prepare`                              |
| `finishUserFileUploadPart`                 | 完成私聊文件分片上传       | `POST /v2/users/{user_id}/upload_part_finish`                          |
| `sendGroupMessage`                         | 发送群聊消息               | `POST /v2/groups/{group_openid}/messages`                              |
| `recallGroupMessage`                       | 撤回群聊消息               | `DELETE /v2/groups/{group_openid}/messages/{message_id}`               |
| `uploadGroupFile`                          | 上传群聊文件               | `POST /v2/groups/{group_openid}/files`                                 |
| `prepareGroupFileUpload`                   | 准备群聊文件分片上传       | `POST /v2/groups/{group_id}/upload_prepare`                            |
| `finishGroupFileUploadPart`                | 完成群聊文件分片上传       | `POST /v2/groups/{group_id}/upload_part_finish`                        |
| `getGroupInfo`                             | 获取群资料                 | `GET /v2/groups/{group_openid}/info`                                   |
| `getGroupBotState`                         | 获取机器人在群内的状态     | `GET /v2/groups/{group_openid}/bot_state`                              |
| `reviewGroupJoinRequest`                   | 审批入群申请               | `POST /v2/groups/{group_openid}/approval_join_request/{member_openid}` |
| `getGroupJoinRequestList`                  | 拉取入群申请列表           | `GET /v2/groups/{group_openid}/join_request_list`                      |
| `getGroupMuteState`                        | 查询群禁言状态             | `GET /v2/groups/{group_openid}/restrict_chat_setting`                  |
| `setGroupMemberMute`                       | 设置群成员禁言             | `POST /v2/groups/{group_openid}/restrict_chat_setting`                 |
| `getGroupJoinApprovalStrategyList`         | 查询入群自动审批策略列表   | `GET /v2/groups/join_approval_strategy`                                |
| `createGroupJoinApprovalStrategy`          | 创建入群自动审批策略       | `POST /v2/groups/join_approval_strategy`                               |
| `deleteGroupJoinApprovalStrategy`          | 删除入群自动审批策略       | `DELETE /v2/groups/join_approval_strategy/{strategy_id}`               |
| `updateGroupJoinApprovalStrategy`          | 修改入群自动审批策略       | `PATCH /v2/groups/join_approval_strategy/{strategy_id}`                |
| `executeGroupJoinApprovalStrategy`         | 执行入群自动审批策略       | `POST /v2/groups/join_approval_strategy/{strategy_id}/execute`         |
| `updateGroupJoinApprovalStrategyWhitelist` | 修改入群自动审批策略白名单 | `POST /v2/groups/join_approval_strategy/{strategy_id}/whitelist_users` |
| `getBotInfo`                               | 获取机器人资料             | `GET /users/@me`                                                       |
| `generateShareLink`                        | 生成机器人分享链接         | `POST /v2/generate_url_link`                                           |
| `getMenu`                                  | 查询全局自定义菜单         | `GET /v2/menu`                                                         |
| `updateMenu`                               | 修改全局自定义菜单         | `PUT /v2/menu`                                                         |
| `getPanelList`                             | 查询指令面板列表           | `GET /v2/panels`                                                       |
| `createPanel`                              | 创建指令面板               | `POST /v2/panels`                                                      |
| `getPanel`                                 | 查询指令面板详情           | `GET /v2/panels/{panel_id}`                                            |
| `updatePanel`                              | 修改指令面板               | `PUT /v2/panels/{panel_id}`                                            |
| `deletePanel`                              | 删除指令面板               | `DELETE /v2/panels/{panel_id}`                                         |
| `updatePanelTarget`                        | 修改指令面板关联对象       | `PUT /v2/panels/{panel_id}/target`                                     |
| `respondToInteraction`                     | 响应互动事件               | `PUT /interactions/{interaction_id}`                                   |

接口参数和返回值可以通过 TypeScript 类型查看，接口规则以 [QQ 机器人开发文档](https://bot.q.qq.com/wiki/develop/api-v2/) 为准。

## 中间件

`use()` 的用法与 Koa、Hono 的中间件基本一致。每个中间件都会收到当前事件的 `context` 和用于继续执行的 `next`，适合记录事件、计算耗时或为后续处理整理数据。

```typescript
const bot = new Client(options);

bot.use(async (context, next) => {
  const startedAt = performance.now();

  console.log('收到事件', context.payload.t);
  await next();
  console.log('处理完成', context.payload.t, `${performance.now() - startedAt}ms`);
});
```

中间件按照注册顺序执行。调用 `await next()` 时，当前中间件会暂停，并将控制权交给下一个中间件。后续中间件和事件监听器正常完成后，才会继续执行 `await next()` 之后的代码。不调用 `next()` 时，后续中间件和事件监听器不会执行。

每次收到事件都会创建一个新的 `context`，同一事件经过的所有中间件共享该对象：

- **`context.payload`** 是 QQ 推送的原始事件数据，不允许修改。
- **`context.state`** 只在当前事件处理期间有效，用于在中间件之间传递数据。

Chobits 不会读取 `state` 中的特殊字段来控制事件，开发者可以自行决定其中保存的数据。

### 进阶：自定义事件

如果你想在 QQ 平台实现 [OneBot](https://github.com/botuniverse/onebot)、[Satori](https://github.com/satorijs/satori) 等机器人协议，可以使用 Chobits 接收 QQ 事件和调用 OpenAPI，再通过 `Client` 泛型和中间件完成协议转换。

下面以 OneBot 12 的私聊消息事件为例，将 `C2C_MESSAGE_CREATE` 转换为 `message.private`：

```typescript
interface TextSegment {
  type: 'text';
  data: {
    text: string;
  };
}

interface PrivateMessage {
  id: string;
  self: {
    platform: 'qq';
    user_id: string;
  };
  time: number;
  type: 'message';
  detail_type: 'private';
  sub_type: '';
  message_id: string;
  message: TextSegment[];
  alt_message: string;
  user_id: string;
}

type OneBotEvents = {
  'message.private': [event: PrivateMessage];
};

interface OneBotState {
  event?: {
    name: 'message.private';
    data: PrivateMessage;
  };
}

const bot = new Client<OneBotEvents>(options);
const { data: botInfo } = await bot.getBotInfo();

const sendPrivateMessage = (userId: string, content: string) => {
  return bot.sendUserMessage(userId, { msg_type: 0, content });
};

bot
  .use<OneBotState>(async (context, next) => {
    if (context.payload.t === 'C2C_MESSAGE_CREATE' && context.payload.id) {
      const { d, id } = context.payload;

      context.state.event = {
        name: 'message.private',
        data: {
          id,
          self: { platform: 'qq', user_id: botInfo.id },
          time: Date.parse(d.timestamp) / 1000,
          type: 'message',
          detail_type: 'private',
          sub_type: '',
          message_id: d.id,
          message: [{ type: 'text', data: { text: d.content } }],
          alt_message: d.content,
          user_id: d.author.user_openid,
        },
      };
    }
    await next();
  })
  .use(async (context, next) => {
    const { event } = context.state;

    if (event) {
      await bot.emit(event.name, event.data);
    }
    await next();
  });

bot.on('message.private', async event => {
  console.log(event.alt_message);

  await sendPrivateMessage(event.user_id, 'hello world');
});
```

`OneBotEvents` 使用参数元组定义每个事件的监听器参数，`on()` 与 `emit()` 会据此完成类型检查。示例中的 `sendPrivateMessage()` 是适配层方法，内部调用 `sendUserMessage()` 发送 QQ 私聊消息。

本示例仅演示私聊消息事件与发送方法的转换，不建议直接复用。完整实现 OneBot 12 还需提供 `send_message` 动作，根据 `detail_type` 调用 `sendUserMessage()` 或 `sendGroupMessage()`，并处理 OneBot 与 QQ 的消息结构、错误信息等协议差异。

## 日志

通过 `logger` 可以接收 Chobits 运行时产生的日志，并自行决定如何输出或保存。Chobits 不会主动向控制台或文件写入内容：

```typescript
import { type Logger, Client } from 'chobits';

const logger: Logger = (kind, message, data) => {
  console.debug(`[chobits:${kind}] ${message}`, data);
};

const bot = new Client({
  appId: '1145141919',
  clientSecret: '38bc73e16208135fb111c0c573a44eaa',
  logger,
});
```

| `kind`      | 记录范围                                        |
| ----------- | ----------------------------------------------- |
| `auth`      | Access Token 获取与刷新                         |
| `openapi`   | OpenAPI 请求、成功响应与 QQ 业务错误            |
| `websocket` | WebSocket 连接、事件数据、心跳与重连            |
| `webhook`   | Webhook 地址验证、签名校验、请求拒绝与事件确认  |
| `dispatch`  | WebSocket 与 Webhook 共用的中间件和事件分发过程 |

`logger` 会依次接收 `kind`、`message` 和 `data`，分别表示日志类别、说明文本和相关数据。部分日志没有相关数据，此时 Chobits 不会传入第三个参数，`data` 的值为 `undefined`。

调用 `logger` 后，Chobits 会立即继续执行，不会等待回调中的异步操作。需要将日志写入文件或发送到日志服务时，应由开发者自行处理相应任务。

机器人的身份凭证不会被写入日志，但部分日志可能包含用户发送的消息内容。将日志保存到文件或发送到第三方服务前，请根据实际业务过滤不应记录的信息。

## FAQ

### 为什么不兼容 QQ 频道？

~~因为 QQ 频道是史！~~

QQ 频道使用独立的接口和事件结构，与 QQ 群聊及私聊并不是同一套体系。Chobits 只处理群聊与私聊，可以避免在公共 API 中混合两套差异明显的协议。如果同时兼容 QQ 频道，SDK 需要维护大量仅适用于频道的类型、事件和接口，不仅会增加代码体积，也会提高使用和维护成本。

### 为什么使用标准 Web API？

标准 Web API 已被多种 JavaScript 运行环境支持，包括服务器、云函数和边缘运行时。Chobits 因此使用 `Request`、`Response`、`fetch`、`WebSocket` 和 Web Crypto，而不依赖 Node.js 或 Bun 的专有 API。这样既不会将 SDK 绑定到某个运行环境，也能让同一套机器人代码部署到不同的运行环境。

### Chobits 这个名字有什么含义？

《Chobits》是由 CLAMP 创作的一部漫画，并有动画、游戏等衍生作品，中文译名《人形电脑天使心》。该作品描绘了人型电脑走进人类生活，在相处与交流中与人建立联系的故事。QQ 机器人同样以程序为载体，通过一次次消息与用户相识、交流，因此我选择 **Chobits** 作为这个项目的名字。
