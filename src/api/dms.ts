import type { createRequest, Result } from '@/utils/request.js';
import type { ChannelsMessages, ChannelsMessagesData } from '@/api/channels.js';

export interface DmfMessagesData extends ChannelsMessagesData {}
export interface DmfMessages extends ChannelsMessages {}

export default (instance: ReturnType<typeof createRequest>) => {
  return {
    /**
     * 用于发送私信消息，前提是已经创建了私信会话。
     */
    dmsMessages(guild_id: string, data: DmfMessagesData): Promise<Result<DmfMessages>> {
      return instance.post<DmfMessages>(`/dms/${guild_id}/messages`, data);
    },
  };
};
