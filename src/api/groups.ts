import type { Data, Instance, Request, Result } from '@/client/request.js';

export interface GroupsMessagesData extends Data {
  /** 文本内容 */
  content?: string;
  /** 消息类型 */
  msg_type: 0 | 1 | 2 | 3 | 4;
  markdown?: Record<string, unknown>;
  keyboard?: Record<string, unknown>;
  ark?: Record<string, unknown>;
  /**
   * @invalid 暂不支持
   */
  image?: unknown;
  /**
   * 消息引用
   * @invalid 暂未支持
   */
  message_reference?: Record<string, unknown>;
  /**
   * 前置收到的事件 ID，用于发送被动消息
   * @invalid 暂未支持
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

export default (instance: Instance) => {
  return {
    /**
     * 发动消息到群。
     */
    groupsMessages(group_openid: string, data: GroupsMessagesData): Promise<Result<GroupsMessages>> {
      return instance.post<GroupsMessages>(`/v2/groups/${group_openid}/messages`, data);
    },
  };
};
