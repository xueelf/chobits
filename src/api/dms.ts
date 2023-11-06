import type { Request, Result } from '@/client/request.js';
import type { ChannelsMessages, ChannelsMessagesData } from '@/api/channels.js';

export interface DmfMessagesData extends ChannelsMessagesData {}
export interface DmfMessages extends ChannelsMessages {}

export default (request: Request) => {
  return {
    /**
     * 用于发送私信消息，前提是已经创建了私信会话。
     */
    dmsMessages(guild_id: string, data: DmfMessagesData): Promise<Result<DmfMessages>> {
      return request.post<DmfMessages>(`/dms/${guild_id}/messages`, data);
    },
  };
};
