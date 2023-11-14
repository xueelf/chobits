import type { Data, Request, Result } from '@/client/request';
import type { Guild } from '@/model/guild';
import type { Channel, ChannelSubType, ChannelType, PrivateType, SpeakPermission } from '@/model/channel';

interface GuildChannelData extends Data {
  /** 子频道名称 */
  name: string;
  /** 子频道类型 */
  type: ChannelType;
  /** 子频道子类型 */
  sub_type: ChannelSubType;
  /** 子频道排序，必填；当子频道类型为 子频道分组（ChannelType=4）时，必须大于等于 2 */
  position: number;
  /** 子频道所属分组ID */
  parent_id: string;
  /** 子频道私密类型 */
  private_type: PrivateType;
  /** 子频道私密类型成员 ID */
  private_user_ids: string[];
  /** 子频道发言权限 */
  speak_permission: SpeakPermission;
  /** 应用类型子频道应用 AppID，仅应用子频道需要该字段 */
  application_id: string;
}

export default (request: Request) => {
  return {
    /**
     * 获取 `guild_id` 指定的频道的详情。
     */
    getGuildInfo(guild_id: string): Promise<Result<Guild>> {
      return request.get<Guild>(`/guilds/${guild_id}`);
    },

    /**
     * 获取 guild_id 指定的频道下的子频道列表。
     */
    getGuildChannels(guild_id: string): Promise<Result<Channel[]>> {
      return request.get<Channel[]>(`/guilds/${guild_id}/channels`);
    },

    /**
     * 在 guild_id 指定的频道下创建一个子频道。
     */
    createGuildChannel(guild_id: string, data: GuildChannelData): Promise<Result<Channel>> {
      return request.post<Channel>(`/guilds/${guild_id}/channels`, data);
    },
  };
};
