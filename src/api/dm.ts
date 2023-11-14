import type { Message } from '@/model/message';
import type { Request, Result } from '@/client/request';
import type { sendChannelMessageData } from '@/api/channel';

export default (request: Request) => {
  return {
    /**
     * 用于发送频道私信消息，前提是已经创建了私信会话。
     */
    sendDmMessage(guild_id: string, data: sendChannelMessageData): Promise<Result<Message>> {
      return request.post<Message>(`/dms/${guild_id}/messages`, data);
    },

    /**
     * 撤回频道私信消息。
     */
    recallDmMessage(guild_id: string, message_id: string, hidetip: boolean = false): Promise<Result> {
      return request.delete(`/dms/${guild_id}/messages/${message_id}?hidetip=${hidetip}`);
    },
  };
};
