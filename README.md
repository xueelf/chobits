<div align="center">
    <img src="https://vip2.loli.io/2022/11/04/AWEchfODdwszL8N.png" alt="amesu" width="200" />
    <h3>amesu</h3>
</div>

---

[![npm package](https://img.shields.io/npm/v/amesu?color=616DF8&label=amesu&style=flat-square&labelColor=FAFAFA&logo=npm)](https://www.npmjs.com/package/amesu)
[![node engine](https://img.shields.io/node/v/amesu?color=339933&style=flat-square&labelColor=FAFAFA&logo=Node.js)](https://nodejs.org)

本项目是一个在 Node.js 环境下运行的 QQ 机器人第三方 SDK。

## 介绍

> 腾讯近期将开放官方 Bot API，在此之前 amesu 是基于第三方协议库开发，v2 重构中。

项目的名字来源于 Cygames 开发和发行的游戏 《公主连结 Re:Dive》 中的登场角色 アメス，其罗马音 amesu 用作了本项目的名字。

## 使用

> 目前还未发版，当前的示例代码可能会在未来发生变化。

```javascript
import { Bot } from 'amesu';

const bot = new Bot({
  appid: '<appid>',
  token: '<token>',
  secret: '<secret>',
  log_level: '[log_level]',
});

bot.on('MESSAGE_CREATE', event => {
  // 收到的消息事件
  console.log(event);

  // 调用 api
  bot.api.channelsMessages(event.channel_id, {
    content: 'hello world',
  });
});
```
