<div align="center">
    <img src="https://vip2.loli.io/2022/11/04/AWEchfODdwszL8N.png" alt="Amesu" width="200" />
    <h3>Amesu</h3>
</div>

---

![package](https://img.shields.io/npm/v/amesu?label=amesu&style=flat-square&logo=npm&labelColor=FAFAFA)
![engine](https://img.shields.io/node/v/amesu?style=flat-square&logo=Node.js&labelColor=FAFAFA)
![downloads](https://img.shields.io/npm/dt/amesu?style=flat-square&logo=tinder&logoColor=FF8C00&labelColor=FAFAFA&color=616DF8)

本项目是一个在 Node.js 环境下运行的 QQ 机器人第三方 SDK。

## 介绍

> [!WARNING]
> QQ 机器人的官方文档写的有点没节操，内容描述与 API 实际表现**有部分差异**，并且会**随时暗改**，不建议将其用于生产环境。

项目的名字来源于 Cygames 开发和发行的游戏『公主连结 Re:Dive』中的登场角色「アメス」，其罗马音 **「a me su」** 用作了本项目的名字。

## 安装

Amesu 从 2.3.0 版本后只提供群聊的支持，未来也不再打算兼容频道，你可以 [在这里](https://github.com/xueelf/amesu/discussions/1) 查看缘由。

```shell
npm i amesu
```

## 使用

在开始之前，请确保你已经安装好了 **LTS 或以上**版本的 [Node.js](https://nodejs.org/zh-cn)，并在 [QQ 开放平台](https://bot.q.qq.com/wiki/develop/api-v2/) 创建好了机器人。

### 简单示例

```javascript
import { Client } from 'amesu';

const client = new Client({
  appid: '1145141919',
  token: '38bc73e16208135fb111c0c573a44eaa',
  secret: '6208135fb111c0c5',
});

// 监听群 @ 事件
client.on('GROUP_AT_MESSAGE_CREATE', event => {
  // 快捷回复
  event.reply('hello world');
});
// 机器人上线
client.online();
```

上述代码，在机器人成功上线后，收到任何**群 @ 消息**，都将会发送 `hello world` 来回复当前用户。

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

## API

### Client.api

封装了官方文档所提供的 API 接口，可直接调用。（并不是所有 API 都能返回期望的结果）

### Client.request

基于 `Fetch` 封装，使用方式可查看 totte 的 [README](https://github.com/xueelf/totte/blob/master/README.zh.md) 自述。

### Client.online()

机器人上线。

### Client.offline()

机器人下线。

### Client.sendMessage([options])

- options
  - `type` [\<string\>](https://web.nodejs.cn/en-us/docs/web/javascript/reference/global_objects/string/) 发送类型，可选值：`'group'` | `'user'`。
  - `to_id` [\<string\>](https://web.nodejs.cn/en-us/docs/web/javascript/reference/global_objects/string/) 发送的目标 id，事件的 `group_openid` 或 `user_openid`。
  - `from_id` [\<string\>](https://web.nodejs.cn/en-us/docs/web/javascript/reference/global_objects/string/) 消息的来源 id，`msg_id` 或 `event_id`，不传入则视为**主动消息**。
  - `content` [\<string\>](https://web.nodejs.cn/en-us/docs/web/javascript/reference/global_objects/string/) 消息内容。

发送文本消息，基于 `Client.api.sendGroupMessage` 与 `Client.api.sendUserMessage` 的二次封装。

~~回的四种写法~~：

```javascript
import { Client } from 'amesu';

const client = new Client({ ... });

client.on('GROUP_AT_MESSAGE_CREATE', event => {
  const content = 'hello world';

  // 原生 API 调用，需要传入完整的数据结构。
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
  // 只有在特定的事件里，才会有 reply 方法，它能直接调用并发送消息。
  event.reply(content);
});
```

### Client.sendGroupMessage(group_openid, content[, from_id])

- `group_openid` [\<string\>](https://web.nodejs.cn/en-us/docs/web/javascript/reference/global_objects/string/) 群 openid。
- `content` [\<string\>](https://web.nodejs.cn/en-us/docs/web/javascript/reference/global_objects/string/) 消息内容。
- `from_id` [\<string\>](https://web.nodejs.cn/en-us/docs/web/javascript/reference/global_objects/string/) 消息的来源 id，`msg_id` 或 `event_id`，不传入则视为**主动消息**。

发送群消息，基于 `Client.sendMessage` 的二次封装。

### Client.sendUserMessage(openid, content[, from_id])

- `openid` [\<string\>](https://web.nodejs.cn/en-us/docs/web/javascript/reference/global_objects/string/) 用户 openid。
- `content` [\<string\>](https://web.nodejs.cn/en-us/docs/web/javascript/reference/global_objects/string/) 消息内容。
- `from_id` [\<string\>](https://web.nodejs.cn/en-us/docs/web/javascript/reference/global_objects/string/) 消息的来源 id，`msg_id` 或 `event_id`，不传入则视为**主动消息**。

发送私聊消息，基于 `Client.sendMessage` 的二次封装。
