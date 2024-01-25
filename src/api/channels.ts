import type { Request, Result } from '@/utils';
import type { Schedule } from '@/model/schedule';
import type { AudioControl } from '@/model/audio';
import type { Format, Thread, ThreadInfo } from '@/model/forum';
import type { Channel, ChannelPermission, PrivateType, SpeakPermission } from '@/model/channel';
import type {
  Message,
  MessageArk,
  MessageEmbed,
  MessageMarkdown,
  MessageReference,
  PinMessage,
} from '@/model/message';

/**
 * @link https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/post_messages.html#%E9%80%9A%E7%94%A8%E5%8F%82%E6%95%B0
 */
export interface SendChannelMessageParams {
  /** 消息内容 */
  content?: string;
  /** embed 消息 */
  embed?: MessageEmbed;
  /** ark 消息对象 */
  ark?: MessageArk;
  /** 引用消息对象 */
  message_reference?: MessageReference;
  /** 图片 url 地址，平台会转存该图片，用于下发图片消息 */
  image?: string;
  /** 要回复的消息 id, 在 `at.create.message` 事件中获取。 */
  msg_id?: string;
  /** 要回复的事件 id, 在各事件对象中获取。 */
  event_id?: string;
  /** markdown 消息对象 */
  markdown?: MessageMarkdown;
  /** 通过文件上传的方式发送图片。 */
  file_image?: Blob;
}

export interface UpdateChannelMessageParams {
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

export interface ChannelOnlineNum {
  online_nums: number;
}

export interface UpdateChannelPermissionParams {
  /** 字符串形式的位图表示赋予用户的权限 */
  add: string;
  /** 字符串形式的位图表示删除用户的权限 */
  remove: string;
}

export interface ChannelScheduleParams {
  schedule: Omit<Schedule, 'id'>;
}

export interface ChannelMicParams {
  channel_id: string;
}

export interface ChannelThread {
  /** 帖子列表对象 */
  threads: Thread;
  /** 是否拉取完毕(0:否；1:是) */
  is_finish: number;
}

export interface CreateChannelThreadParams {
  /** 帖子标题 */
  title: string;
  /** 帖子内容 */
  content: string;
  /** 帖子文本格式 */
  format: Format;
}

export default (request: Request) => {
  return {
    /**
     * 用于向 channel_id 指定的子频道发送消息。
     */
    sendChannelMessage(
      channel_id: string,
      params: SendChannelMessageParams,
    ): Promise<Result<Message>> {
      return request.post(`/channels/${channel_id}/messages`, params);
    },

    /**
     * 用于撤回子频道 channel_id 下的消息 message_id。
     */
    deleteChannelMessage(
      channel_id: string,
      message_id: string,
      hidetip: boolean = false,
    ): Promise<Result> {
      return request.delete(`/channels/${channel_id}/messages/${message_id}?hidetip=${hidetip}`);
    },

    /**
     * 获取 channel_id 指定的子频道的详情。
     */
    getChannelInfo(channel_id: string): Promise<Result<Channel>> {
      return request.get(`/channels/${channel_id}`);
    },

    /**
     * 修改 channel_id 指定的子频道的信息。
     */
    updateChannelInfo(
      channel_id: string,
      params: UpdateChannelMessageParams,
    ): Promise<Result<Channel>> {
      return request.patch(`/channels/${channel_id}`, params);
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
      return request.get(`/channels/${channel_id}/online_nums`);
    },

    /**
     * 获取子频道 channel_id 下用户 user_id 的权限。
     */
    getChannelMemberPermission(
      channel_id: string,
      user_id: string,
    ): Promise<Result<ChannelPermission>> {
      return request.get(`/channels/${channel_id}/members/${user_id}/permissions`);
    },

    /**
     * 用于修改子频道 channel_id 下用户 user_id 的权限。
     */
    updateChannelMemberPermission(
      channel_id: string,
      user_id: string,
      params: UpdateChannelPermissionParams,
    ): Promise<Result> {
      return request.put(`/channels/${channel_id}/members/${user_id}/permissions`, params);
    },

    /**
     * 获取子频道 channel_id 下身份组 role_id 的权限。
     */
    getChannelRolePermission(
      channel_id: string,
      role_id: string,
    ): Promise<Result<ChannelPermission>> {
      return request.get(`/channels/${channel_id}/roles/${role_id}/permissions`);
    },

    /**
     * 修改子频道 channel_id 下身份组 role_id 的权限。
     */
    updateChannelRolePermission(
      channel_id: string,
      role_id: string,
      params: UpdateChannelPermissionParams,
    ): Promise<Result> {
      return request.put(`/channels/${channel_id}/roles/${role_id}/permissions`, params);
    },

    /**
     * 用于添加子频道 channel_id 内的精华消息。
     */
    addChannelPin(channel_id: string, message_id: string): Promise<Result<PinMessage>> {
      return request.put(`/channels/${channel_id}/pins/${message_id}`);
    },

    /**
     * 用于删除子频道 channel_id 下指定 message_id 的精华消息。
     */
    deleteChannelPin(channel_id: string, message_id: string): Promise<Result> {
      return request.delete(`/channels/${channel_id}/pins/${message_id}`);
    },

    /**
     * 用于获取子频道 channel_id 内的精华消息。
     */
    getChannelPin(channel_id: string): Promise<Result<PinMessage>> {
      return request.get(`/channels/${channel_id}/pins`);
    },

    /**
     * 用于获取channel_id指定的子频道中当天的日程列表。
     */
    getChannelSchedule(channel_id: string, since?: number): Promise<Result<Schedule>> {
      return request.get(`/channels/${channel_id}/schedules?since=${since}`);
    },

    /**
     * 获取日程子频道 channel_id 下 schedule_id 指定的的日程的详情。
     */
    getChannelScheduleInfo(channel_id: string, schedule_id: string): Promise<Result<Schedule>> {
      return request.get(`/channels/${channel_id}/schedules/${schedule_id}`);
    },

    /**
     * 用于在 channel_id 指定的日程子频道下创建一个日程。
     */
    createChannelSchedule(
      channel_id: string,
      params: ChannelScheduleParams,
    ): Promise<Result<Schedule>> {
      return request.post(`/channels/${channel_id}/schedules`, params);
    },

    /**
     * 用于修改日程子频道 channel_id 下 schedule_id 指定的日程的详情。
     */
    updateChannelSchedule(
      channel_id: string,
      schedule_id: string,
      params: ChannelScheduleParams,
    ): Promise<Result<Schedule>> {
      return request.patch(`/channels/${channel_id}/schedules/${schedule_id}`, params);
    },

    /**
     * 用于删除日程子频道 channel_id 下 schedule_id 指定的日程。
     */
    deleteChannelSchedule(channel_id: string, schedule_id: string): Promise<Result> {
      return request.delete(`/channels/${channel_id}/schedules/${schedule_id}`);
    },

    /**
     * 用于控制子频道 channel_id 下的音频。
     */
    channelAudioControl(channel_id: string, params: AudioControl): Promise<Result> {
      return request.post(`/channels/${channel_id}/audio`, params);
    },

    /**
     * 机器人在 channel_id 对应的语音子频道上麦。
     */
    channelMicOn(channel_id: string, params: ChannelMicParams): Promise<Result> {
      return request.put(`/channels/${channel_id}/mic`, params);
    },

    /**
     * 机器人在 channel_id 对应的语音子频道下麦。
     */
    channelMicOff(channel_id: string, params: ChannelMicParams): Promise<Result> {
      return request.delete(`/channels/${channel_id}/mic`, params);
    },

    /**
     * 该接口用于获取子频道下的帖子列表。
     */
    getChannelThread(channel_id: string): Promise<Result<ChannelThread>> {
      return request.get(`/channels/${channel_id}/threads`);
    },

    /**
     * 该接口用于获取子频道下的帖子详情。
     */
    getChannelThreadInfo(channel_id: string, thread_id: string): Promise<Result<ThreadInfo>> {
      return request.get(`/channels/${channel_id}/threads/${thread_id}`);
    },

    /**
     * 发表帖子。
     */
    createChannelThread(
      channel_id: string,
      params: CreateChannelThreadParams,
    ): Promise<Result<ChannelThread>> {
      return request.put(`/channels/${channel_id}/threads`, params);
    },

    /**
     * 用于删除指定子频道下的某个帖子。
     */
    deleteChannelThread(channel_id: string, thread_id: string): Promise<Result> {
      return request.delete(`/channels/${channel_id}/threads/${thread_id}`);
    },
  };
};
