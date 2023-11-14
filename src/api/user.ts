import type { User } from '@/model/user';
import type { Data, Request, Result } from '@/client/request';
import { Guild } from '@/model/guild';

export interface UserMessageData extends Data {
  /** 文本内容 */
  content?: string;
  msg_type: 0 | 1 | 2 | 3 | 4;
  markdown?: Record<string, unknown>;
  keyboard?: Record<string, unknown>;
  ark?: Record<string, unknown>;
  /**
   * @deprecated 暂不支持
   */
  image?: unknown;
  /**
   * 消息引用
   * @deprecated 暂未支持
   */
  message_reference?: Record<string, unknown>;
  /**
   * 前置收到的事件 ID，用于发送被动消息
   * @deprecated 暂未支持
   */
  event_id?: string;
  /** 前置收到的消息 ID，用于发送被动消息 */
  msg_id?: string;
  /**
   * 回复消息的序号，与 msg_id 联合使用，避免相同消息 id 回复重复发送，不填默认是 1。
   * 相同的 msg_id + msg_seq 重复发送会失败。
   */
  msg_seq?: number;
}

export interface UserMessage {
  /** 消息唯一 ID */
  id: string;
  /** 发送时间 */
  timestamp: number;
}

export interface UserMessageFileData extends Data {
  /** 媒体类型 */
  file_type: number;
  /** 需要发送媒体资源的 url */
  url: string;
  /** 固定是：true */
  srv_send_msg: boolean;
  /**
   * @deprecated 暂未支持
   */
  file_data?: unknown;
}

export interface UserFile {
  /** 消息唯一 ID */
  id: string;
  /** 发送时间 */
  timestamp: number;
}

export default (request: Request) => {
  return {
    /**
     * 单独发送消息给用户。
     */
    sendUserMessage(openid: string, data: UserMessageData): Promise<Result<UserMessage>> {
      return request.post<UserMessage>(`/v2/users/${openid}/messages`, data);
    },

    /**
     * 单独发送富媒体消息给用户。
     */
    sendUserFile(openid: string, data: UserMessageFileData): Promise<Result<UserFile>> {
      return request.post<UserFile>(`/v2/users/${openid}/files`, data);
    },

    /**
     * 获取当前机器人详情。
     */
    getUserInfo(): Promise<Result<User>> {
      return request.get<User>(`/users/@me`);
    },

    /**
     * 获取用户频道列表。
     */
    getUserGuilds(): Promise<Result<Guild[]>> {
      return request.get<Guild[]>(`/users/@me/guilds`);
    },
  };
};
