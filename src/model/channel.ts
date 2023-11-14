// https://bot.q.qq.com/wiki/develop/api-231017/server-inter/channel/manage/channel/model.html#channel
export type ChannelType = 0 | 1 | 2 | 3 | 4 | 10005 | 10006 | 10007;
export type ChannelSubType = 0 | 1 | 2 | 3;
export type PrivateType = 0 | 1 | 2;
export type SpeakPermission = 0 | 1 | 2;
type Permissions = 0x0000000001 | 0x0000000002 | 0x0000000004;

export interface Channel {
  /** 子频道 id */
  id: string;
  /** 频道 id */
  guild_id: string;
  /** 子频道名 */
  name: string;
  /** 子频道类型 */
  type: ChannelType;
  /** 子频道子类型 */
  sub_type: ChannelSubType;
  /** 排序值 */
  position: number;
  /** 所属分组 id，仅对子频道有效，对 `子频道分组（ChannelType=4）` 无效 */
  parent_id: string;
  /** 创建人 id */
  owner_id: string;
  /** 子频道私密类型 */
  private_type: PrivateType;
  /** 子频道发言权限 */
  speak_permission: SpeakPermission;
  /** 用于标识应用子频道应用类型，仅应用子频道时会使用该字段 */
  application_id: string;
  /** 用户拥有的子频道权限 */
  permissions: Permissions;
}
