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

> 现在是幻想时间，下列的伪代码是理想中的开发效果，可能会在未来发生变化。

基于 Emitter

```javascript
import { Client } from 'amesu';

const appid = '';
const token = '';
const client = new Client(appid, token);

client.on('GROUP_AT_MESSAGE_CREATE', event => {
  console.log(event);
});
```

基于 ReactiveX

```javascript
import { Client, event } from 'amesu';

const appid = '';
const token = '';
const client$ = new Client(appid, token);

client$
  .pipe(
    event('GROUP_AT_MESSAGE_CREATE'),
  )
  .subscribe(event => {
    console.log(event);
  });
```
