<div align="center">
    <img src="https://vip2.loli.io/2022/11/04/AWEchfODdwszL8N.png" alt="Amesu" width="200" />
    <h3>Amesu</h3>
</div>

---

![package](https://img.shields.io/npm/v/amesu?label=amesu&style=flat-square&logo=npm&labelColor=FAFAFA)
![engine](https://img.shields.io/node/v/amesu?style=flat-square&logo=Node.js&labelColor=FAFAFA)
![downloads](https://img.shields.io/npm/dt/amesu?style=flat-square&logo=tinder&logoColor=FF8C00&labelColor=FAFAFA&color=616DF8)

本项目是一个使用 [TypeScript](https://www.typescriptlang.org/) 语言开发，在 [Node.js](https://nodejs.org/zh-cn) 环境下运行的 [QQ](https://im.qq.com/) 机器人 SDK。

## 介绍

> [!WARNING]
> QQ 机器人的官方文档写的有点没节操，内容描述与 API 实际表现**有部分差异**，并且会**随时暗改**，不建议将其用于生产环境。

项目的名字来源于 Cygames 开发和发行的游戏『公主连结 Re:Dive』中的登场角色「アメス」，其罗马音 **「a me su」** 用作了本项目的名字。

## 安装

Amesu 自 2.3.0 版本后，将不再提供对 QQ 频道的支持，你可以 [在这里](https://github.com/xueelf/amesu/discussions/1) 查看缘由。

```shell
npm i amesu
```

## 使用

在开始之前，请确保你已经安装好了 **LTS 或以上**版本的 Node.js，并在 [QQ 开放平台](https://bot.q.qq.com/wiki/develop/api-v2/) 创建好了机器人。

### 简单示例

```javascript
import { Client } from 'amesu';

const client = new Client({
  appid: '1145141919',
  token: '38bc73e16208135fb111c0c573a44eaa',
  secret: '6208135fb111c0c5',
});

// 监听私聊事件
client.on('C2C_MESSAGE_CREATE', event => {
  event.reply('我是私聊消息');
});
// 监听群 @ 事件
client.on('GROUP_AT_MESSAGE_CREATE', event => {
  event.reply('我是群聊消息');
});
// 机器人上线
client.online();
```

上述代码，在机器人成功上线后，收到**私聊**或**群 @**的任何消息，都将会发送对应的回复。

## 配置项

```typescript
/** 客户端配置项 */
interface ClientConfig {
  /** 机器人 ID */
  appid: string;
  /** 机器人令牌 */
  token: string;
  /** 机器人密钥 */
  secret: string;
  /** 是否开启沙盒，默认 `false` */
  sandbox: boolean;
  /** 掉线重连数，默认 `3` */
  maxRetry?: number;
  /** 日志等级，默认 `"info"` */
  logLevel?: Level;
}

type Level = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
```

关于日志，具体使用可查阅 [nebia](https://github.com/xueelf/nebia#readme) 文档。

## 事件

虽然很不喜欢，但 Amesu 未对消息推送做任何处理，所有事件信息均以 [官方文档](https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html#%E4%BA%8B%E4%BB%B6%E8%AE%A2%E9%98%85Intents) 为主。

| 事件名                  | 条件                                         |
| ----------------------- | -------------------------------------------- |
| C2C_MESSAGE_CREATE      | 用户单聊发消息给机器人时候                   |
| FRIEND_ADD              | 用户添加使用机器人                           |
| FRIEND_DEL              | 用户删除机器人                               |
| C2C_MSG_REJECT          | 用户在机器人资料卡手动关闭"主动消息"推送     |
| C2C_MSG_RECEIVE         | 用户在机器人资料卡手动开启"主动消息"推送开关 |
| GROUP_AT_MESSAGE_CREATE | 用户在群里@机器人时收到的消息                |
| GROUP_ADD_ROBOT         | 机器人被添加到群聊                           |
| GROUP_DEL_ROBOT         | 机器人被移出群聊                             |
| GROUP_MSG_REJECT        | 群管理员主动在机器人资料页操作关闭通知       |
| GROUP_MSG_RECEIVE       | 群管理员主动在机器人资料页操作开启通知       |

## API

### Client.api

封装了官方文档所提供的 API 接口，可直接调用。（并不是所有 API 都能返回期望的结果）

### Client.request

基于 `Fetch` 封装，使用方式可查看 totte 的 [README](https://github.com/xueelf/totte/blob/master/README.zh.md) 自述。

### Client.useEventInterceptor(interceptor)

- `interceptor` [\<Function\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function)
  - `payload` [\<Object\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object) 事件载荷，数据结构可查阅 [官方文档](https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html#payload)。

事件拦截器，客户端的绝大部分行为都是通过事件来驱动的，利用好拦截器，你可以实现各种各样的需求。

例如在收到消息时，向控制台输出日志：

```javascript
import { Client } from 'amesu';

const client = new Client({ ... });

client.useEventInterceptor(payload => {
  switch (payload.t) {
    case 'C2C_MESSAGE_CREATE':
    case 'GROUP_AT_MESSAGE_CREATE':
      client.logger.info('机器人收到消息：%s', payload.d.content);
      break;
  }
});
```

当然，以上代码仅供示例参考，你不用真的在项目中这样做，因为 Amesu 已经做好了相关处理，仅需修改 `logLevel`，你就可以看到任何你想要的数据。

你甚至能自定义客户端事件，以实现 OneBot 的兼容：

```javascript
import { Client } from 'amesu';

const client = new Client({ ... });

client.useEventInterceptor(payload => {
  switch (payload.t) {
    case 'C2C_MESSAGE_CREATE':
      client.emit('message.private');
      break;
    case 'GROUP_AT_MESSAGE_CREATE':
      client.emit('message.group');
      break;
  }
});
```

还有更多用法等着你来创造。

### Client.online()

机器人上线。

### Client.offline()

机器人下线。

### Client.sendMessage([options])

- `options` [\<Object\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object)
  - `type` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 发送类型，可选值：`'group'` | `'user'`。
  - `to_id` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 发送的目标 id，事件的 `group_openid` 或 `user_openid`。
  - `from_id` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 消息的来源 id，`msg_id` 或 `event_id`，不传入则视为**主动消息**。
  - `content` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 消息内容。

发送文本消息，基于 `Client.api.sendGroupMessage` 与 `Client.api.sendUserMessage` 的二次封装。

### Client.sendGroupMessage(group_openid, content[, from_id])

- `group_openid` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 群 openid。
- `content` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 消息内容。
- `from_id` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 消息的来源 id，`msg_id` 或 `event_id`，不传入则视为**主动消息**。

发送群消息，基于 `Client.sendMessage` 的二次封装。

### Client.sendUserMessage(openid, content[, from_id])

- `openid` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 用户 openid。
- `content` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 消息内容。
- `from_id` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 消息的来源 id，`msg_id` 或 `event_id`，不传入则视为**主动消息**。

发送私聊消息，基于 `Client.sendMessage` 的二次封装。

### Client.sendImage([options])

- `options` [\<Object\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object)
  - `type` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 发送类型，可选值：`'group'` | `'user'`。
  - `to_id` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 发送的目标 id，事件的 `group_openid` 或 `user_openid`。
  - `from_id` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 消息的来源 id，`msg_id` 或 `event_id`，不传入则视为**主动消息**。
  - `url` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 图片链接。（需要注意，群聊不支持 302 跳转，但频道支持 😅）
  - `content` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 消息内容。
  - `err_msg` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 图片发送失败后的回复内容，默认回复 API 的 `err_msg`。

发送图片消息，基于 `Client.api.sendGroupFile` 与 `Client.api.sendUserFile` 的二次封装。

### Client.sendGroupImage(group_openid, url[, from_id])

- `group_openid` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 群 openid。
- `url` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 图片链接。
- `from_id` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 消息的来源 id，`msg_id` 或 `event_id`，不传入则视为**主动消息**。

发送群图片，基于 `Client.sendImage` 的二次封装。

### Client.sendUserImage(openid, url[, from_id])

- `openid` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 用户 openid。
- `url` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 图片链接。
- `from_id` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 消息的来源 id，`msg_id` 或 `event_id`，不传入则视为**主动消息**。

发送私聊图片，基于 `Client.sendImage` 的二次封装。

## FAQ

### 为什么要做这个项目？

因为官方 [Node SDK](https://github.com/tencent-connect/bot-node-sdk) 已经有 3 年没更新了，不支持群聊而且使用体验非常糟糕。

### 已经有了 `Client.api`，为什么还要二次封装？

因为 ~~回有四种写法~~ 使用起来更加简洁，你可以简单理解为语法糖：

```javascript
import { Client } from 'amesu';

const client = new Client({ ... });

client.on('GROUP_AT_MESSAGE_CREATE', event => {
  const content = 'hello world';

  // 原生 API 调用，需要传入完整的数据结构。如果是发送图片，会更加复杂。
  client.api.sendGroupMessage(event.group_openid, {
    msg_id: event.id,
    msg_seq: 1,
    msg_type: 0,
    content,
  });
  /**
   * 与 Client.api.sendGroupMessage 相比：
   *   - 你不用手动生成 msg_seq 和 msg_type。
   *   - 也不用自己来区分 msg_id 和 event_id。
   */
  client.sendMessage({
    type: 'group',
    to_id: event.group_openid,
    from_id: event.id,
    content,
  });
  client.sendGroupMessage(event.group_openid, content, event.id);
  // 在特定的事件里，会有 reply 方法，它能直接调用并发送消息。
  event.reply(content);
});
```
