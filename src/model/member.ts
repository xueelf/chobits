import type { User } from '@/model/user.js';

export interface Member {
  /** 用户的频道基础信息，只有成员相关接口中会填充此信息 */
  user: User;
  /** 用户的昵称 */
  nick: string;
  /** 用户在频道内的身份组 ID, 默认值可参考 DefaultRoles */
  roles: string[];
  /** timestamp	用户加入频道的时间 */
  joined_at: number;
}

export interface MemberWithGuildID {
  /** 频道id */
  guild_id: string;
  /** 用户的频道基础信息 */
  user: User;
  /** 用户的昵称 */
  nick: string;
  /** 用户在频道内的身份 */
  roles: string[];
  /** timestamp	用户加入频道的时间 */
  joined_at: number;
}
