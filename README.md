<div align="center">
    <img src="https://vip2.loli.io/2022/11/04/AWEchfODdwszL8N.png" alt="amesu" width="200" />
    <h3>amesu</h3>
</div>

---

[![npm package](https://img.shields.io/npm/v/amesu?color=616DF8&label=amesu&style=flat-square&labelColor=FAFAFA&logo=npm)](https://www.npmjs.com/package/amesu)
[![node engine](https://img.shields.io/node/v/amesu?color=339933&style=flat-square&labelColor=FAFAFA&logo=Node.js)](https://nodejs.org)

本项目是一个在 Node.js 环境下运行的 QQ 机器人第三方 SDK。

## 介绍

> 目前 amesu 处于 alpha 状态，由于腾讯是近期上线的群聊 API，官方文档的内容与实际情况 **有较大差异**，请勿将其用于生产环境。

项目的名字来源于 Cygames 开发和发行的游戏 《公主连结 Re:Dive》 中的登场角色 アメス，其罗马音 amesu 用作了本项目的名字。

## 使用

```shell
npm i amesu # or pnpm add amesu
```

```javascript
const { Bot } = require('amesu');

const bot = new Bot({
  appid: '1145141919',
  token: '38bc73e16208135fb111c0c573a44eaa',
  secret: '6208135fb111c0c5',
  events: ['GROUP_MESSAGES', 'PUBLIC_GUILD_MESSAGES'],
});

// 监听频道消息
bot.on('at.message.create', async data => {
  // 收到任意 at 消息后发送 "hello world"
  await bot.api.sendChannelMessage(data.channel_id, {
    content: 'hello world',
  });
});

// 监听群消息
bot.on('group.at.message.create', async data => {
  // 收到任意 at 消息后发送 "hello world"
  await bot.api.sendGroupMessage(data.group_openid, {
    msg_type: 0,
    content: 'hello world',
    msg_id: data.id,
  });
});

// 机器人上线
bot.online();
```

## API

### Bot.api

封装了官方文档所提供的 api 接口，可直接调用。（并不是所有 api 都能返回期望的结果）

### Bot.request

基于 fetch 封装，可发送自定义网络请求。

### Bot.online

机器人上线。

### Bot.offline

机器人下线。

## 事件

目前 socket 返回的事件全部为大写，并用下划线做分割。但是在 Node.js 的 `EventEmitter` 中，事件名一般使用小写字母。

这是因为事件名通常表示一种行为或状态，而不是一个特定的类或构造函数。根据 JavaScript 的命名约定，使用小写字母来表示这些行为或状态更为常见和推荐。

所以 amesu 针对事件名做了以下处理：

- 事件名全部转换为小写
- 使用小数点替换下划线
- 会话事件添加 `session` 前缀

例如 `MESSAGE_CREATE` -> `message.create`，`READY` -> `session.ready`。

你可以仅监听事件的部分前缀，例如：

```javascript
const { Bot } = require('amesu');

const bot = new Bot();

bot
  .on('guild.member', data => {
    console.log(data);
  })
  .login();
```

这样 `guild.member.add`、`guild.member.update`、`guild.member.remove`，三个事件将会被全部监听，这使得消息订阅更具有灵活性。

## FAQ

### 为什么要做这个项目？

因为官方 [频道 SDK](https://github.com/tencent-connect/bot-node-sdk) 已经有一年半没更新了，不支持群聊而且使用体验有点糟糕。

### 为什么 config 一定要指定 events？

如果你是公域机器人，那么在使用官方 SDK 不传入 events 情况下，就会不断重连并在控制台疯狂输出。

原因是部分事件仅限私域机器人使用，如果公域机器人订阅了就会抛异常，私域机器人订阅了公域事件却不会有任何问题...

官方 SDK 的逻辑是没有传 events 就默认监听全部事件，这是不合理的。现在也没有任何手段知道机器人是否是公域和私域，因此只能手动在 config 传入。

### 为什么部分 API 没有返回结果？

腾讯是近期才开放群聊 API 内测的，提供的文档也很不完善，目前存在字段、返回结果不一致，v1、v2 接口混用（鉴权方式不一样）等问题，所以调用某些接口可能会无法达到预期。

### 这个 SDK 能做什么？

频道与群聊的消息收发已测试完毕，API 返回结果与 interface 不符的问题还待腾讯后续完善文档和接口统一。

当前 amesu 已经有了完整的鉴权流程（会话保活、掉线重连、凭证刷新），并做了日志和网络请求的封装，后面没什么问题就不会再有大改了。如果有 API 缺失，在 `api` 文件内参考格式直接添加 url 就可以正常使用，也欢迎来提 pr。
