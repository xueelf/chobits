import type { Request, Result } from '@/utils';
import type { Guild } from '@/model/guild';
import type { Member, Role } from '@/model/member';
import type {
  ApiPermission,
  ApiPermissionDemand,
  ApiPermissionDemandIdentify,
} from '@/model/permission';
import type {
  Channel,
  ChannelSubType,
  ChannelType,
  PrivateType,
  SpeakPermission,
} from '@/model/channel';
import { MessageSetting } from '@/model/message';
import { Announce, RecommendChannel } from '@/model/announce';

export interface CreateGuildChannelParams {
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

export interface GetGuildMembersParams {
  /** 将上一次回包中next填入， 如果是第一次请求填 0，默认为 0 */
  start_index: string;
  /** 分页大小，1-400，默认是 1。成员较多的频道尽量使用较大的 limit 值，以减少请求数 */
  limit: number;
}

export interface GuildRoleMembers {
  data: Member[];
  next: string;
}

export interface DeleteGuildUserMemberParams {
  /** 删除成员的同时，将该用户添加到频道黑名单中 */
  add_blacklist: boolean;
  /** 删除成员的同时，撤回该成员的消息，可以指定撤回消息的时间范围 */
  delete_history_msg_days: number;
}

export interface GuildRoles {
  /** 频道 ID */
  guild_id: string;
  /** 一组频道身份组对象 */
  roles: Role[];
  /** 默认分组上限 */
  role_num_limit: string;
}

export interface GuildRoleParams {
  /** 名称 */
  name?: string;
  /** ARGB 的 HEX 十六进制颜色值转换后的十进制数值 */
  color?: number;
  /** 在成员列表中单独展示: 0-否, 1-是 */
  hoist?: number;
}

export interface CreateGuildRole {
  /** 身份组 ID */
  role_id: string;
  /** 所创建的频道身份组对象 */
  role: Role[];
}

export interface UpdateGuildRole {
  /** 频道 ID */
  guild_id: string;
  /** 身份组 ID */
  role_id: string;
  /** 所创建的频道身份组对象 */
  role: Role[];
}

export interface GuildMemberRoleParams {
  channel: Pick<Channel, 'id'>;
}

export interface GuildApiPermissions {
  apis: ApiPermission[];
}

export interface SendGuildApiPermissionDemandParams {
  /** 授权链接发送的子频道 id */
  channel_id: string;
  /** api 权限需求标识对象 */
  api_identify: ApiPermissionDemandIdentify[];
  /** 机器人申请对应的 API 接口权限后可以使用功能的描述 */
  desc: string;
}

export interface GuildMuteParams {
  /** 禁言到期时间戳，绝对时间戳，单位：秒（与 mute_seconds 字段同时赋值的话，以该字段为准） */
  mute_end_timestamp?: string;
  /** 禁言多少秒（两个字段二选一，默认以 mute_end_timestamp 为准） */
  mute_seconds?: string;
}

export interface GuildMembersMuteParams extends GuildMuteParams {
  /** 禁言成员的 user_id 列表，即 User 的 id */
  user_ids: string[];
}

export interface CreateGuildAnnounceParams {
  /** 选填，消息 id，message_id 有值则优选将某条消息设置为成员公告 */
  message_id: string;
  /** 选填，子频道 id，message_id 有值则为必填。 */
  channel_id: string;
  /** 选填，公告类别 0:成员公告，1:欢迎公告，默认为成员公告 */
  announces_type: number;
  /** 选填，推荐子频道列表，会一次全部替换推荐子频道列表 */
  recommend_channels: RecommendChannel[];
}

export default (request: Request) => {
  return {
    /**
     * 获取 `guild_id` 指定的频道的详情。
     */
    getGuildInfo(guild_id: string): Promise<Result<Guild>> {
      return request.get(`/guilds/${guild_id}`);
    },

    /**
     * 获取 guild_id 指定的频道下的子频道列表。
     */
    getGuildChannels(guild_id: string): Promise<Result<Channel[]>> {
      return request.get(`/guilds/${guild_id}/channels`);
    },

    /**
     * 在 guild_id 指定的频道下创建一个子频道。
     */
    createGuildChannel(
      guild_id: string,
      params: CreateGuildChannelParams,
    ): Promise<Result<Channel>> {
      return request.post(`/guilds/${guild_id}/channels`, params);
    },

    /**
     * 获取 guild_id 指定的频道中所有成员的详情列表，支持分页。
     */
    getGuildMembers(
      guild_id: string,
      after: string = '0',
      limit: number = 1,
    ): Promise<Result<Member[]>> {
      return request.get(`/guilds/${guild_id}/members?after=${after}&limit=${limit}`);
    },

    /**
     * 获取 guild_id 频道中指定 role_id 身份组下所有成员的详情列表，支持分页。
     */
    getGuildRoleMembers(
      guild_id: string,
      role_id: string,
      params: GetGuildMembersParams,
    ): Promise<Result<GuildRoleMembers>> {
      const defaultParams: GetGuildMembersParams = {
        start_index: '0',
        limit: 1,
      };
      return request.get(`/guilds/${guild_id}/roles/${role_id}/members`, {
        ...defaultParams,
        ...params,
      });
    },

    /**
     * 获取 guild_id 指定的频道中 user_id 对应成员的详细信息。
     */
    getGuildUserMember(guild_id: string, user_id: string): Promise<Result<Member>> {
      return request.get(`/guilds/${guild_id}/members/${user_id}`);
    },

    /**
     * 删除 guild_id 指定的频道下的成员 user_id。
     */
    deleteGuildUserMember(
      guild_id: string,
      user_id: string,
      params: DeleteGuildUserMemberParams,
    ): Promise<Result> {
      return request.delete(`/guilds/${guild_id}/members/${user_id}`, params);
    },

    /**
     * 获取 guild_id 指定的频道下的身份组列表。
     */
    getGuildRoles(guild_id: string): Promise<Result<GuildRoles>> {
      return request.get(`/guilds/${guild_id}/roles`);
    },

    /**
     * 用于在 guild_id 指定的频道下创建一个身份组。
     */
    createGuildRole(guild_id: string, params: GuildRoleParams): Promise<Result<CreateGuildRole>> {
      return request.post(`/guilds/${guild_id}/roles`, params);
    },

    /**
     * 修改频道 guild_id 下 role_id 指定的身份组。
     */
    updateGuildRole(
      guild_id: string,
      role_id: string,
      params: GuildRoleParams,
    ): Promise<Result<UpdateGuildRole>> {
      return request.patch(`/guilds/${guild_id}/roles/${role_id}`, params);
    },

    /**
     * 删除频道 guild_id下 role_id 对应的身份组。
     */
    deleteGuildRole(guild_id: string, role_id: string): Promise<Result> {
      return request.delete(`/guilds/${guild_id}/roles/${role_id}`);
    },

    /**
     * 将频道 guild_id 下的用户 user_id 添加到身份组 role_id 。
     */
    addGuildMemberRole(
      guild_id: string,
      user_id: string,
      role_id: string,
      params?: GuildMemberRoleParams,
    ): Promise<Result> {
      return request.put(`/guilds/${guild_id}/members/${user_id}/roles/${role_id}`, params);
    },

    /**
     * 将用户 user_id 从 频道 guild_id 的 role_id 身份组中移除。
     */
    deleteGuildMemberRole(
      guild_id: string,
      user_id: string,
      role_id: string,
      params?: GuildMemberRoleParams,
    ): Promise<Result> {
      return request.delete(`/guilds/${guild_id}/members/${user_id}/roles/${role_id}`, params);
    },

    /**
     * 用于获取机器人在频道 guild_id 内可以使用的权限列表。
     */
    getGuildApiPermissions(guild_id: string): Promise<Result<GuildApiPermissions>> {
      return request.get(`/guilds/${guild_id}/api_permission`);
    },

    /**
     * 发送机器人在频道接口权限的授权链接。
     */
    sendGuildApiPermissionDemand(
      guild_id: string,
      params: SendGuildApiPermissionDemandParams,
    ): Promise<Result<ApiPermissionDemand>> {
      return request.post(`/guilds/${guild_id}/api_permission/demand`, params);
    },

    /**
     * 用于获取机器人在频道 guild_id 内的消息频率设置。
     */
    getGuildMessageSetting(guild_id: string): Promise<Result<MessageSetting>> {
      return request.get(`/guilds/${guild_id}/message/setting`);
    },

    /**
     * 用于将频道的全体成员（非管理员）禁言。
     */
    guildMute(guild_id: string, params: GuildMuteParams): Promise<Result> {
      return request.patch(`/guilds/${guild_id}/mute`, params);
    },

    /**
     * 用于禁言频道 guild_id 下的成员 user_id。
     */
    guildMemberMute(guild_id: string, user_id: string, params: GuildMuteParams): Promise<Result> {
      return request.patch(`/guilds/${guild_id}/members/${user_id}/mute`, params);
    },

    /**
     * 用于将频道的指定批量成员（非管理员）禁言。
     */
    guildMembersMute(guild_id: string, params: GuildMembersMuteParams): Promise<Result> {
      return request.patch(`/guilds/${guild_id}/mute`, params);
    },

    /**
     * 用于创建频道全局公告，公告类型分为 消息类型的频道公告 和 推荐子频道类型的频道公告 。
     */
    createGuildAnnounce(
      guild_id: string,
      params: CreateGuildAnnounceParams,
    ): Promise<Result<Announce>> {
      return request.post(`/guilds/${guild_id}/announces`, params);
    },

    /**
     * 用于删除频道 guild_id 下指定 message_id 的全局公告。
     */
    deleteGuildAnnounce(guild_id: string, message_id: string): Promise<Result> {
      return request.delete(`/guilds/${guild_id}/announces/${message_id}`);
    },
  };
};
