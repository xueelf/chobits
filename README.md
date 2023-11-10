<div align="center">
    <img src="https://vip2.loli.io/2022/11/04/AWEchfODdwszL8N.png" alt="amesu" width="200" />
    <h3>amesu</h3>
</div>

---

[![npm package](https://img.shields.io/npm/v/amesu?color=616DF8&label=amesu&style=flat-square&labelColor=FAFAFA&logo=npm)](https://www.npmjs.com/package/amesu)
[![node engine](https://img.shields.io/node/v/amesu?color=339933&style=flat-square&labelColor=FAFAFA&logo=Node.js)](https://nodejs.org)

本项目是一个在 Node.js 环境下运行的 QQ 机器人第三方 SDK。

## 介绍

> 目前 amesu 处于 alpha 状态，由于腾讯是近期上线的群聊 API，提供的文档内容与实际情况 **有较大差异**，请勿将其用于生产环境。

项目的名字来源于 Cygames 开发和发行的游戏 《公主连结 Re:Dive》 中的登场角色 アメス，其罗马音 amesu 用作了本项目的名字。

## 使用

```shell
npm i amesu
```

```javascript
const { Bot } = require('amesu');

const bot = new Bot({
  appid: '<appid>',
  token: '<token>',
  secret: '<secret>',
  // 日志等级，默认 INFO
  log_level: '[log_level]',
});

// 在频道发送任意消息都将收到 "hello world" 的回复
bot.on('MESSAGE_CREATE', event => {
  bot.api.sendChannelsMessages(event.channel_id, {
    content: 'hello world',
  });
});
```

## API

### Bot.api

封装了官方文档所提供的 api 接口，可直接调用。（并不是所有 api 都能返回期望的结果）

### Bot.request

基于 fetch 封装，可发送自定义网络请求。

## FAQ

### 为什么要做这个项目？

因为官方 [频道 SDK](https://github.com/tencent-connect/bot-node-sdk) 已经有一年半没更新了，不支持群聊而且使用体验有点糟糕。

### 为什么部分 API 没有返回结果？

腾讯是近期才开放群聊 API 内测的，提供的文档也很不完善，目前存在字段、返回结果不一致，v1、v2 接口混用（鉴权方式不一样）等问题，所以调用某些接口可能会无法达到预期。

### 这个 SDK 能做什么？

当前 amesu 已经有了完整的鉴权流程（会话保活、掉线重连、凭证刷新），并做了日志和网络请求的封装，后面没什么问题就不会再有大改了。如果有 API 缺失，在 `api` 文件内参考格式直接添加 url 就可以正常使用，也欢迎来提 pr。

目前嘛...能调通的只有频道的消息收发，还待腾讯后续完善文档和接口统一。
