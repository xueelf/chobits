import totte, { type TotteInstance } from 'totte';

import { OPEN_API_ORIGIN } from '#/api/index';

/** 获取 access_token 所需的 appId 和 clientSecret。 */
export interface GetAccessTokenPayload {
  /** 在开放平台管理端上获得。 */
  appId: string;
  /** 在开放平台管理端上获得。 */
  clientSecret: string;
}

/** 机器人身份调用 API 时使用的凭证，可读写的数据范围由机器人的权限范围决定。适用于机器人主动发消息、管理群聊等场景。 */
export interface AccessToken {
  /** 获取到的凭证。 */
  access_token: string;
  /**
   * 凭证有效时间，单位：秒。目前是 7200 秒之内的值。
   *
   * @remarks
   * 官方文档字段表将 `expires_in` 定义为 `number`，响应示例和实际响应均为 `string`。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/access-token.html}
   */
  expires_in: string;
}

/**
 * 获取 access_token 失败时返回的错误信息。
 *
 * @remarks
 * 官方文档仅列出错误码和错误信息，未定义错误响应结构。实际响应返回 `code` 和 `message`。
 *
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/access-token.html}
 */
export interface AccessTokenError {
  /** 错误码。 */
  code: number;
  /** 错误信息。 */
  message: string;
}

/** WebSocket 连接地址。 */
export interface Gateway {
  /** WebSocket 连接地址。 */
  url: string;
}

/**
 * 当前用户（机器人）的详情信息。
 *
 * @remarks
 * 接口说明称 union_openid 和 union_user_account 仅在单独拉取 member 时提供，文档同一页面的字段表和示例仍包含这两个字段。
 *
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/users_me.get.html}
 */
export interface BotInfo {
  /** 用户 ID。 */
  id: string;
  /** 用户名。 */
  username: string;
  /** 头像 URL。 */
  avatar: string;
  /**
   * 是否为机器人。
   *
   * @remarks
   * 实际响应未返回 `bot`。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/users_me.get.html}
   */
  bot?: boolean;
  /** 跨应用统一用户 OpenID（需特殊申请）。 */
  union_openid?: string;
  /** 跨应用统一用户账号（需特殊申请）。 */
  union_user_account?: string;
  /**
   * 机器人分享链接。
   *
   * @remarks
   * 官方文档的响应字段表未收录 `share_url`，文档同一页面的响应示例和实际响应均返回该字段。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/users_me.get.html}
   */
  share_url: string;
  /**
   * 欢迎语。
   *
   * @remarks
   * 官方文档的响应字段表未收录 `welcome_msg`，文档同一页面的响应示例和实际响应均返回该字段。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/users_me.get.html}
   */
  welcome_msg: string;
}

/** 生成机器人分享链接时使用的参数。 */
export interface GenerateShareLinkPayload {
  /**
   * 用户通过该链接添加机器人时，callback_data 参数会透传给开发者。
   *
   * callback_data 最长 32 字符。
   *
   * @remarks
   * 官方文档的请求体字段表未收录 `callback_data`，接口说明、请求示例和实际请求仍使用该字段。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_generate_url_link.post.html}
   */
  callback_data?: string;
  /** 需要跳转的 URL。 */
  url_link?: string;
}

/** 分享链接生成结果。 */
export interface GenerateShareLink {
  /**
   * 生成的分享链接。
   *
   * @remarks
   * 实际响应未返回 `url_link`。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_generate_url_link.post.html}
   */
  url_link?: string;
  /**
   * 返回码。
   *
   * @remarks
   * 该字段未被文档收录，实际返回 `0`。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_generate_url_link.post.html}
   */
  retcode: number;
  /**
   * 返回信息。
   *
   * @remarks
   * 该字段未被文档收录，实际返回 `success`。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_generate_url_link.post.html}
   */
  msg: string;
  /**
   * 返回数据。
   *
   * @remarks
   * 该字段未被文档收录。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_generate_url_link.post.html}
   */
  data: {
    /**
     * 生成的分享链接。
     *
     * @remarks
     * 该字段未被文档收录，实际返回生成的分享链接。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_generate_url_link.post.html}
     */
    url: string;
  };
}

/**
 * 获取 access_token
 *
 * @returns
 *
 * - access_token：获取到的凭证。
 * - expires_in：凭证有效时间，单位：秒。目前是 7200 秒之内的值。
 * @throws 100001 Too many requests
 * @throws 100007 appid invalid
 * @throws 100016 invalid appid or secret
 * @throws 10004 机器人不存在
 */
export const getAccessToken = (payload: GetAccessTokenPayload) =>
  totte<AccessToken | AccessTokenError>({
    method: 'POST',
    origin: OPEN_API_ORIGIN,
    url: '/app/getAppAccessToken',
    payload,
  });

export default (request: TotteInstance) => {
  return {
    /**
     * 获取通用 WSS 接入点
     *
     * 获取 WSS 接入地址，通过该地址可建立 WebSocket 长连接。
     *
     * 接口频率限制：2 QPM / 10 QPM burst
     *
     * @returns WebSocket 连接地址
     */
    getGateway() {
      return request.get<Gateway>('/gateway');
    },

    /**
     * 获取机器人详情
     *
     * 获取当前用户（机器人）的详情信息。
     *
     * union_openid 和 union_user_account 需特殊申请并配置后才会返回
     *
     * 这两个字段仅在单独拉取 member 信息时提供
     *
     * 接口频率限制：50 QPS
     *
     * @returns
     *
     * - id：用户 ID
     * - username：用户名
     * - avatar：头像 URL
     * - bot：是否为机器人
     * - union_openid：跨应用统一用户 OpenID（需特殊申请）
     * - union_user_account：跨应用统一用户账号（需特殊申请）
     */
    getBotInfo() {
      return request.get<BotInfo>('/users/@me');
    },

    /**
     * 生成分享链接
     *
     * 生成机器人分享链接，用于邀请用户添加机器人为好友。
     *
     * 生成带自定义参数的机器人分享链接，用于邀请用户添加机器人为好友。
     *
     * 用户通过该链接添加机器人时，callback_data 参数会透传给开发者。
     *
     * callback_data 最长 32 字符。
     *
     * 接口频率限制：50 QPS
     *
     * @returns 生成的分享链接
     * @throws 10001 请求参数异常
     * @throws 10002 请求头异常
     * @throws 10003 查询机器人信息异常
     * @throws 10044 从协议头获取uin失败
     * @throws 11004 生成分享ARK失败
     */
    generateShareLink(payload: GenerateShareLinkPayload) {
      return request.post<GenerateShareLink>('/v2/generate_url_link', payload);
    },
  };
};
