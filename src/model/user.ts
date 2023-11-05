export interface User {
  /** 用户 id */
  id: string;
  /** 用户名 */
  username: string;
  /** 用户头像地址 */
  avatar: string;
  /** 是否是机器人 */
  bot: boolean;
  /** 特殊关联应用的 openid，需要特殊申请并配置后才会返回。 */
  union_openid: string;
  /** 机器人关联的互联应用的用户信息，与 union_openid 关联的应用是同一个。 */
  union_user_account: string;
}
