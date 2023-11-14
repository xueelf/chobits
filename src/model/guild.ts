export interface Guild {
  /** 频道 ID */
  id: string;
  /** 频道名称 */
  name: string;
  /** 频道头像地址 */
  icon: string;
  /** 创建人用户 ID */
  owner_id: string;
  /** 当前人是否是创建人 */
  owner: boolean;
  /** 成员数 */
  member_count: number;
  /** 最大成员数 */
  max_members: number;
  /** 描述 */
  description: string;
  /** 加入时间 */
  joined_at: string;
}
