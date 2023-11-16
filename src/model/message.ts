import type { User } from '@/model/user';
import type { Member } from '@/model/member';

export interface MessageEmbedThumbnail {
  /** 图片地址 */
  url: string;
}

export interface MessageEmbedField {
  /** 字段名 */
  name: string;
}

export interface MessageEmbed {
  /** 标题 */
  title: string;
  /** 消息弹窗内容 */
  prompt: string;
  /** 缩略图 */
  thumbnail: MessageEmbedThumbnail;
  /** embed 字段数据 */
  fields: MessageEmbedField[];
}

export interface MessageArkObjKv {
  key: string;
  value: string;
}

export interface MessageArkObj {
  /** ark obj kv 列表 */
  obj_kv: MessageArkObjKv[];
}

export interface MessageArkKv {
  key: string;
  value: string;
  /** ark obj 类型的列表 */
  obj: MessageArkObj[];
}

export interface MessageArk {
  /** ark 模板 id（需要先申请） */
  template_id: number;
  /** kv 值列表 */
  kv: MessageArkKv;
}

export interface MessageReference {
  /** 需要引用回复的消息 id */
  message_id: string;
  /** 是否忽略获取引用消息详情错误，默认否 */
  ignore_get_message_error: boolean;
}

interface MessageMarkdownParams {
  /** markdown 模版 key */
  key: string;
  /** markdown 模版 key 对应的 values ，列表长度大小为 1 代表单 value 值，长度大于 1 则为列表类型的参数 values 传参数 */
  values: string[];
}

export interface MessageMarkdown {
  /** markdown 模板 id */
  template_id: number;
  /** markdown 模板模板参数 */
  params: MessageMarkdownParams;
  /** 原生 markdown 内容,与 `template_id` 和 `params` 参数互斥,参数都传值将报错。 */
  content: string;
}

export interface Message {
  /** 消息 id */
  id: string;
  /** 子频道 id */
  channel_id: string;
  /** 频道 id */
  guild_id: string;
  /** 消息内容 */
  content: string;
  /** 消息创建时间 */
  timestamp: number;
  /** 消息编辑时间 */
  edited_timestamp: number;
  /** 是否是 @ 全员消息 */
  mention_everyone: boolean;
  /** 消息创建者 */
  author: User;
  /** 附件 */
  attachments: MessageAttachment[];
  /** embed */
  embeds: MessageEmbed;
  /** 消息中 @ 的人 */
  mentions: User[];
  /** 消息创建者的 member 信息 */
  member: Member;
  /** ark 消息 */
  ark: MessageArk;
  /**
   * 用于消息间的排序，seq 在同一子频道中按从先到后的顺序递增，不同的子频道之间消息无法排序。
   *
   * @deprecated 目前只在消息事件中有值，`2022 年 8 月 1 日`后续废弃。
   */
  seq: number;
  /** 子频道消息 seq，用于消息间的排序，seq 在同一子频道中按从先到后的顺序递增，不同的子频道之间消息无法排序 */
  seq_in_channel: string;
  /** 对象	引用消息对象 */
  message_reference: MessageReference;
}

interface MessageAttachment {
  /** 下载地址 */
  url: string;
}

export interface MessageSetting {
  /** 是否允许创建私信 */
  disable_create_dm: string;
  /** 是否允许发主动消息 */
  disable_push_msg: string;
  /** 子频道 id 数组 */
  channel_ids: string[];
  /** 每个子频道允许主动推送消息最大消息条数 */
  channel_push_max_num: number;
}
