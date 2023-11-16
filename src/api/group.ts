import type { Request, Result } from '@/utils';

export interface SendGroupsMessageParams {
  /** 文本内容 */
  content?: string;
  /** 消息类型： 0 是文本，1 图文混排 ，2 是 markdown 3 ark，4 embed */
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
  msg_id: string;
}

export interface GroupMessage {
  /** 消息唯一 ID */
  id: string;
  /** 发送时间 */
  timestamp: number;
}

export interface SendGroupFileParams {
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

export interface GroupFile {
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
    sendGroupMessage(group_openid: string, params: SendGroupsMessageParams): Promise<Result<GroupMessage>> {
      return request.post<GroupMessage>(`/v2/groups/${group_openid}/messages`, params);
    },

    /**
     * 发送富媒体消息到群。
     */
    sendGroupFile(group_openid: string, params: SendGroupFileParams): Promise<Result<GroupFile>> {
      return request.post<GroupFile>(`/v2/groups/${group_openid}/files`, params);
    },
  };
};
