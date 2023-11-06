import type { Data, Request, Result } from '@/client/request.js';
import type { User } from '@/model/user.js';

export interface UserMessagesData extends Data {
  /** 文本内容 */
  content?: string;
  msg_type: 0 | 1 | 2 | 3 | 4 | 6;
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
   * 回复消息的序号，与 msg_id 联合使用，避免相同消息id回复重复发送。
   * 不填默认是1，相同的 msg_id + msg_seq 重复发送会失败。
   */
  msg_seq?: number;
  /** 输入状态，仅 msg_type = 6 时使用 */
  input_notify?: Record<string, unknown>;
}

export interface UserMessages {
  id: string;
  timestamp: number;
}

export interface UserMessagesFilesData extends Data {
  /** 媒体类型 */
  file_type: number;
  /** 媒体资源地址 */
  url: string;
  /** 固定是：true */
  srv_send_msg: boolean;
  /**
   * @deprecated 暂未支持
   */
  file_data: unknown;
}

export interface UserFiles {
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
    usersMessages(openid: string, data: UserMessagesData): Promise<Result<UserMessages>> {
      return request.post<UserMessages>(`/v2/users/${openid}/messages`, data);
    },

    /**
     * 单独发送富媒体消息给用户。
     */
    usersFiles(openid: string, data: UserMessagesFilesData): Promise<Result<UserFiles>> {
      return request.post<UserFiles>(`/v2/users/${openid}/files`, data);
    },

    /**
     * 获取当前机器人详情。
     */
    users(): Promise<Result<User>> {
      return request.get<User>(`/users/@me`);
    },
  };
};
