export interface ApiPermission {
  /** API 接口名，例如 /guilds/{guild_id}/members/{user_id} */
  path: string;
  /** 请求方法，例如 GET */
  method: string;
  /** API 接口名称，例如 获取频道信 */
  desc: string;
  /** 授权状态，auth_stats 为 1 时已授权 */
  auth_status: number;
}

export interface ApiPermissionDemandIdentify {
  /** API 接口名，例如 /guilds/{guild_id}/members/{user_id} */
  path: string;
  /** 请求方法，例如 GET */
  method: string;
}

export interface ApiPermissionDemand {
  /** 申请接口权限的频道 id */
  guild_id: string;
  /** 接口权限需求授权链接发送的子频道 id */
  channel_id: string;
  /**	权限接口唯一标识 */
  api_identify: ApiPermissionDemandIdentify;
  /** 接口权限链接中的接口权限描述信息 */
  title: string;
  /** 接口权限链接中的机器人可使用功能的描述信息 */
  desc: string;
}
