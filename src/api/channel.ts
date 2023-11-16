import type { Data, Request, Result } from '@/client/request';
import type { Channel, ChannelPermission, PrivateType, SpeakPermission } from '@/model/channel';
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

export interface ChannelOnlineNum extends Data {
  online_nums: number;
}

export interface updateChannelPermissionData extends Data {
  /** 字符串形式的位图表示赋予用户的权限 */
  add: string;
  /** 字符串形式的位图表示删除用户的权限 */
  remove: string;
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

    /**
     * 获取子频道在线成员数。
     */
    getChannelOnlineNum(channel_id: string): Promise<Result<ChannelOnlineNum>> {
      return request.get<ChannelOnlineNum>(`/channels/${channel_id}/online_nums`);
    },

    /**
     * 获取子频道 channel_id 下用户 user_id 的权限。
     */
    getChannelMemberPermission(channel_id: string, user_id: string): Promise<Result<ChannelPermission>> {
      return request.get<ChannelPermission>(`/channels/${channel_id}/members/${user_id}/permissions`);
    },

    /**
     * 修改子频道 channel_id 下用户 user_id 的权限。
     */
    updateChannelMemberPermission(
      channel_id: string,
      user_id: string,
      data: updateChannelPermissionData,
    ): Promise<Result> {
      return request.put(`/channels/${channel_id}/members/${user_id}/permissions`, data);
    },

    /**
     * 获取子频道 channel_id 下身份组 role_id 的权限。
     */
    getChannelRolePermission(channel_id: string, role_id: string): Promise<Result<ChannelPermission>> {
      return request.get<ChannelPermission>(`/channels/${channel_id}/roles/${role_id}/permissions`);
    },

    /**
     * 修改子频道 channel_id 下身份组 role_id 的权限。
     */
    updateChannelRolePermission(
      channel_id: string,
      role_id: string,
      data: updateChannelPermissionData,
    ): Promise<Result> {
      return request.put(`/channels/${channel_id}/roles/${role_id}/permissions`, data);
    },
  };
};
