import type { Data, Request, Result } from '@/client/request';
import type { Channel, PrivateType, SpeakPermission } from '@/model/channel';
import type { Message, MessageArk, MessageEmbed, MessageMarkdown, MessageReference } from '@/model/message';

export interface sendChannelMessageData extends Data {
  /** 消息内容 */
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
  markdown?: MessageMarkdown;
}

export interface updateChannelMessageData extends Data {
  /** 子频道名 */
  name?: string;
  /** 排序 */
  position?: number;
  /** 分组 id */
  parent_id?: string;
  /** 子频道私密类型 */
  private_type?: PrivateType;
  /** 子频道发言权限 */
  speak_permission?: SpeakPermission;
}

export default (request: Request) => {
  return {
    /**
     * 发动消息到文字子频道。
     */
    sendChannelMessage(channel_id: string, data: sendChannelMessageData): Promise<Result<Message>> {
      return request.post<Message>(`/channels/${channel_id}/messages`, data);
    },

    /**
     * 撤回子频道消息。
     */
    recallChannelMessage(channel_id: string, message_id: string, hidetip: boolean = false): Promise<Result> {
      return request.delete(`/channels/${channel_id}/messages/${message_id}?hidetip=${hidetip}`);
    },

    /**
     * 获取 channel_id 指定的子频道的详情。
     */
    getChannelInfo(channel_id: string): Promise<Result<Channel>> {
      return request.get<Channel>(`/channels/${channel_id}`);
    },

    /**
     * 修改 channel_id 指定的子频道的信息。
     */
    updateChannelInfo(channel_id: string, data: updateChannelMessageData): Promise<Result<Channel>> {
      return request.patch<Channel>(`/channels/${channel_id}`, data);
    },

    /**
     * 删除 channel_id 指定的子频道。
     */
    deleteChannel(channel_id: string): Promise<Result> {
      return request.delete(`/channels/${channel_id}`);
    },
  };
};
