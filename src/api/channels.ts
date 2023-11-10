import type { Data, Request, Result } from '@/client/request';
import type { User } from '@/model/user';
import type { MessageArk, MessageAttachment, MessageEmbed, MessageMarkdown, MessageReference } from '@/model/message';
import type { Member } from '@/model/member';

export interface ChannelsMessagesData extends Data {
  /** 文本内容 */
  content?: string;
  embed?: MessageEmbed;
  /** ark 消息对象 */
  ark?: MessageArk;
  /** 引用消息对象 */
  message_reference?: MessageReference;
  /** 图片 url 地址，平台会转存该图片，用于下发图片消息 */
  image?: string;
  /** 要回复的消息id(Message.id), 在 AT_CREATE_MESSAGE 事件中获取。 */
  msg_id?: string;
  /** 要回复的事件 id, 在各事件对象中获取。 */
  event_id?: string;
  markdown?: MessageMarkdown;
}

export interface ChannelsMessages {
  /** 消息 id */
  id: string;
  /** 子频道 id */
  channel_id: string;
  /** 频道 id */
  guild_id: string;
  /** 消息内容 */
  content: string;
  /** timestamp	消息创建时间 */
  timestamp: number;
  /** timestamp	消息编辑时间 */
  edited_timestamp: number;
  /** 是否是@全员消息 */
  mention_everyone: boolean;
  /** 对象	消息创建者 */
  author: User;
  /** 对象数组	附件 */
  attachments: MessageAttachment;
  /** 对象数组	embed */
  embeds: MessageEmbed;
  /** 对象数组	消息中 @ 的人 */
  mentions: User;
  /** 对象	消息创建者的 member 信息 */
  member: Member;
  /** ark消息对象	ark消息 */
  ark: MessageArk;
  /**
   * 用于消息间的排序，seq 在同一子频道中按从先到后的顺序递增，不同的子频道之间消息无法排序。
   *
   * @deprecated 目前只在消息事件中有值，2022年8月1日 后续废弃。
   */
  seq: number;
  /** 子频道消息 seq，用于消息间的排序，seq 在同一子频道中按从先到后的顺序递增，不同的子频道之间消息无法排序 */
  seq_in_channel: string;
  /** 对象	引用消息对象 */
  message_reference: MessageReference;
  /** 用于私信场景下识别真实的来源频道 id */
  src_guild_id: string;
}

export default (request: Request) => {
  return {
    /**
     * 发动消息到文字子频道。
     */
    sendChannelsMessages(channel_id: string, data: ChannelsMessagesData): Promise<Result<ChannelsMessages>> {
      return request.post<ChannelsMessages>(`/channels/${channel_id}/messages`, data);
    },

    /**
     * 撤回消息。
     */
    reCallChannelsMessages(channel_id: string, message_id: string, hidetip: boolean = false): Promise<Result<unknown>> {
      return request.delete<unknown>(`/channels/${channel_id}/messages/${message_id}?hidetip=${hidetip}`);
    },
  };
};
