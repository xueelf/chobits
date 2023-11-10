import type { Data, Request, Result } from '@/client/request';

export interface GroupsMessagesData extends Data {
  /** 文本内容 */
  content?: string;
  /** 消息类型 */
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
   * 回复消息的序号，与 msg_id 联合使用，避免相同消息id回复重复发送。
   * 不填默认是1，相同的 msg_id + msg_seq 重复发送会失败。
   */
  msg_seq?: number;
  /** 时间戳 */
  timestamp?: number;
}

export interface GroupsMessages {
  id: string;
  timestamp: number;
}

export interface GroupsFilesData extends Data {
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

export interface GroupsFiles {
  /** 消息唯一 ID */
  id: string;
  /** 发送时间 */
  timestamp: number;
}

export default (request: Request) => {
  return {
    /**
     * 发送消息到群。
     */
    groupsMessages(group_openid: string, data: GroupsMessagesData): Promise<Result<GroupsMessages>> {
      return request.post<GroupsMessages>(`/v2/groups/${group_openid}/messages`, data);
    },

    /**
     * 发送富媒体消息到群。
     */
    groupsFiles(group_openid: string, data: GroupsFilesData): Promise<Result<GroupsFiles>> {
      return request.post<GroupsFiles>(`/v2/groups/${group_openid}/messages`, data);
    },
  };
};
