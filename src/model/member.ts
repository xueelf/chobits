import type { User } from '@/model/user';

export interface Member {
  /** 用户的频道基础信息，只有成员相关接口中会填充此信息 */
  user: User;
  /** 用户的昵称 */
  nick: string;
  /** 用户在频道内的身份组 ID, 默认值可参考 DefaultRoles */
  roles: string[];
  /**	用户加入频道的时间 */
  joined_at: number;
}

export interface MemberWithGuildID {
  /** 频道 id */
  guild_id: string;
  /** 用户的频道基础信息 */
  user: User;
  /** 用户的昵称 */
  nick: string;
  /** 用户在频道内的身份 */
  roles: string[];
  /**	用户加入频道的时间 */
  joined_at: number;
}

export interface Role {
  /** 身份组ID */
  id: string;
  /** 名称 */
  name: string;
  /** ARGB 的 HEX 十六进制颜色值转换后的十进制数值 */
  color: number;
  /** 是否在成员列表中单独展示: 0-否, 1-是 */
  hoist: number;
  /** 人数 */
  number: number;
  /** 成员上限 */
  member_limit: number;
}
