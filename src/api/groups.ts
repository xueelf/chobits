import { Ark } from '@/types/ark';
import { Keyboard } from '@/types/keyboard';
import { Markdown } from '@/types/markdown';
import { FileType, MessageResponse, MsgType } from '@/types/message';
import { Result, type TotteInstance } from 'totte';

export interface SendGroupsMessagePayload {
  /** 文本内容 */
  content: string;
  /** 消息类型 */
  msg_type: MsgType;
  markdown?: Markdown;
  keyboard?: Keyboard;
  media?: {
    file_info: string;
  };
  ark?: Ark;
  /**
   * @deprecated 消息引用
   */
  message_reference?: Record<string, unknown>;
  /**
   * 前置收到的事件 id，用于发送被动消息，支持事件：
   * - INTERACTION_CREATE
   * - GROUP_ADD_ROBOT
   * - GROUP_MSG_RECEIVE
   */
  event_id?: string;
  /** 前置收到的用户发送过来的消息 id，用于发送被动消息 */
  msg_id?: string;
  /**
   * 回复消息的序号
   *
   * 与 msg_id 联合使用，避免相同消息 id 回复重复发送，不填默认是 `1`，相同的 msg_id + msg_seq 重复发送会失败。 */
  msg_seq?: number;
}

export interface SendGroupFilePayload {
  /** 媒体类型 */
  file_type: FileType;
  /** 需要发送媒体资源的 url */
  url: string;
  /** 设置 `true` 会直接发送消息到目标端，且会占用主动消息频次 */
  srv_send_msg: boolean;
  /**
   * @deprecated 暂未支持
   */
  file_data?: unknown;
}

export interface GroupFile {
  /** 文件 ID */
  file_uuid: string;
  /** 文件信息，用于发消息接口的 media 字段使用 */
  file_info: string;
  /** 有效期，表示剩余多少秒到期，到期后 file_info 失效，当等于 0 时，表示可长期使用 */
  ttl: string;
  /** 发送消息的唯一 ID，当 srv_send_msg 设置为 true 时返回 */
  id: string;
}

export default (request: TotteInstance) => {
  return {
    /**
     * 发送消息到群。
     */
    sendGroupMessage(
      group_openid: string,
      payload: SendGroupsMessagePayload,
    ): Promise<Result<MessageResponse>> {
      return request.post(`/v2/groups/${group_openid}/messages`, payload);
    },

    /**
     * 用于撤回机器人发送给当前用户 `openid` 的消息 `message_id`，发送超出2分钟的消息不可撤回。
     */
    recallGroupMessage(group_openid: string, message_id: string): Promise<Result> {
      return request.delete(`/v2/groups/${group_openid}/messages/${message_id}`);
    },

    /**
     * 发送富媒体消息到群。
     */
    sendGroupFile(group_openid: string, payload: SendGroupFilePayload): Promise<Result<GroupFile>> {
      return request.post(`/v2/groups/${group_openid}/files`, payload);
    },
  };
};
