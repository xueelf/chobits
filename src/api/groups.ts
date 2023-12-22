import type { Request, Result } from '@/utils';

export interface SendGroupsMessageParams {
  /** 文本内容 */
  content?: string;
  /** 消息类型： 0 是文本，2 是 markdown，3 ark，4 embed，7 media 富媒体 */
  msg_type: 0 | 2 | 3 | 4 | 7;
  markdown?: Record<string, unknown>;
  keyboard?: Record<string, unknown>;
  media?: {
    file_info: string;
  };
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

export interface GroupMessage {
  /** 消息唯一 ID */
  id: string;
  /** 发送时间 */
  timestamp: string;
}

export interface SendGroupFileParams {
  /** 媒体类型 */
  file_type: number;
  /** 需要发送媒体资源的 url */
  url: string;
  /** 设置 true 会直接发送消息到目标端，且会占用主动消息频次 */
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
  timestamp: string;
}

export default (request: Request) => {
  return {
    /**
     * 发送消息到群。
     */
    sendGroupMessage(group_openid: string, params: SendGroupsMessageParams): Promise<Result<GroupMessage>> {
      return request.post(`/v2/groups/${group_openid}/messages`, params);
    },

    /**
     * 发送富媒体消息到群。
     */
    sendGroupFile(group_openid: string, params: SendGroupFileParams): Promise<Result<GroupFile>> {
      return request.post(`/v2/groups/${group_openid}/files`, params);
    },
  };
};
