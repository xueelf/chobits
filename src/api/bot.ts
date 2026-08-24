import embus, { type EmbusInstance } from 'embus';

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

/** 自定义菜单配置。 */
export interface Menu {
  /** 菜单项列表，最多 10 个，按列表顺序从左到右展示。 */
  items?: MenuItem[];
}

/** 自定义菜单项。 */
export interface MenuItem {
  /** 按钮名称，最多 10 个字符，一个中文汉字算2个字符。 */
  name?: string;
  /** 按钮类型，可选值：switch（开关）、send_message（发送消息）、link（链接跳转）、menu（含子菜单的折叠项）。 */
  type?: 'switch' | 'send_message' | 'link' | 'menu';
  /** 子菜单列表，仅 type=menu 时有效。子菜单最多 5 个，不支持再嵌套子菜单。 */
  sub_menu_items?: SubMenuItem[];
  /** 发送的内容，仅 type=send_message 时有效。用户点击后该文本会自动填入聊天输入框。 */
  send_message?: string;
  /** 跳转链接 URL，仅 type=link 时有效。用户点击后跳转到该地址，链接必须以https://开头。 */
  link?: string;
  /** 开关配置，仅 type=switch 时有效。定义开关的标识和默认状态。 */
  switch?: Switch;
}

/** 自定义菜单的子菜单项。 */
export interface SubMenuItem {
  /** 按钮名称，最多 14 个字符，约7个中文汉字。 */
  name?: string;
  /** 按钮类型，可选值：send_message（发送消息）、link（链接跳转）。二级菜单不支持 menu 类型。 */
  type?: 'send_message' | 'link';
  /** 发送的内容，仅 type=send_message 时有效。用户点击后该文本会自动填入聊天输入框。 */
  send_message?: string;
  /** 跳转链接 URL，仅 type=link 时有效。用户点击后跳转到该地址，链接必须以https://开头。 */
  link?: string;
}

/** 自定义菜单的开关配置。 */
export interface Switch {
  /**
   * 开关唯一标识。用户切换开关状态后会发送一条消息，消息内容中会携带此字段。
   *
   * 例如 switch_id 为 "search" 时，用户打开开关后消息的ext字段中会携带 "search=1"的标识，关闭后不会携带这个标识。
   */
  switch_id?: string;
  /** 开关的初始状态。true 表示默认打开，false 表示默认关闭。 */
  default?: boolean;
}

/** 当前生效的自定义菜单。 */
export interface GetMenu {
  /** 当前菜单的版本号。 */
  version: number;
  /** 当前生效的菜单配置。未设置过菜单时该字段为空。 */
  menu: Menu;
}

/** 修改自定义菜单时使用的参数。 */
export interface UpdateMenuPayload {
  /** 菜单配置。传入后会覆盖原有的完整菜单配置。 */
  menu?: Menu;
}

/** 自定义菜单修改结果。 */
export interface UpdateMenu {
  /** 本次修改后的菜单版本号，可用于后续判断配置是否有变更。 */
  version: number;
}

/** 指令面板配置。 */
export interface Panel {
  /** 面板元素列表，定义面板中展示的指令或链接项，一个指令面板里最多配置 20 个面板元素。 */
  items?: PanelItem[];
  /** 面板备注，用于开发者标记面板用途，最多 255 个字符，不对用户展示。 */
  remark?: string;
  /** 当前版本号。 */
  version?: number;
}

/** 指令面板元素。 */
export interface PanelItem {
  /** 元素名称。type=command 时用户点击后该内容会填入聊天输入框；type=link 时仅用于面板展示 最多 14 个字符，约 7 个中文汉字。 */
  name?: string;
  /** 元素描述，用于补充说明该指令或链接的功能，在面板中展示给用户 最多 30 个字符，约 15 个中文汉字。 */
  desc?: string;
  /** 元素类型，可选值：command（指令）、link（链接跳转）。 */
  type?: 'command' | 'link';
  /** 是否仅管理员可操作。true 时仅频道/群管理员可点击，false 时所有用户可点击。 */
  only_admin?: boolean;
  /** 跳转链接 URL，仅 type=link 时有效。用户点击后在浏览器中打开该地址。 */
  link?: string;
}

/** 指令面板记录。 */
export interface PanelRecord {
  /** 面板 ID。 */
  panel_id: string;
  /** 生效场景。 */
  scope: 'c2c' | 'group';
  /** 作用范围，可选值：all（全局配置）、specific（指定用户/群生效）。 */
  target_type: 'all' | 'specific';
  /** 面板配置内容。 */
  panel: Panel;
  /** 面板创建时间，RFC3339 格式（如 2024-01-15T10:30:00Z）。 */
  created_at: string;
  /** 面板更新时间，RFC3339 格式（如 2024-01-15T10:30:00Z）。 */
  updated_at: string;
  /** 面板版本号。 */
  version: number;
  /** 关联的用户 openid 列表。仅 c2c 场景且 target_type=specific 时返回，最多 1000 条。 */
  user_openids?: string[];
  /** 关联的群 openid 列表。仅 group 场景且 target_type=specific 时返回，最多 1000 条。 */
  group_openids?: string[];
}

/** 查询指令面板列表时使用的参数。 */
export interface GetPanelListPayload {
  /** 生效场景。 */
  scope: 'c2c' | 'group';
  /** 分页游标。首次请求不传或传空串，后续请求传入上次响应中的 next_cursor 值。 */
  cursor?: string;
  /** 每页拉取条数，默认 20，最大 50。 */
  limit?: number;
}

/** 指令面板列表。 */
export interface GetPanelList {
  /** 面板记录列表，按设置时间倒序排列。 */
  records: PanelRecord[];
  /**
   * 下一页游标。空串表示已到最后一页，无更多数据。
   *
   * @remarks
   * 实际响应在 `is_end` 为 `true` 时未返回 `next_cursor`。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_panels.get.html}
   */
  next_cursor?: string;
  /** 是否已拉取到最后一页。true 表示无更多数据。 */
  is_end: boolean;
}

/** 创建指令面板时使用的参数。 */
export interface CreatePanelPayload {
  /** 生效场景。 */
  scope: 'c2c' | 'group';
  /** 作用范围，可选值：all（对该场景下所有用户/群生效）、specific（仅对指定用户/群生效）。 */
  target_type?: 'all' | 'specific';
  /** 用户 openid 列表，仅 c2c 场景且 target_type=specific 时有效。指定面板对这些用户生效，一次最多传 20 个。 */
  user_openids?: string[];
  /** 群 openid 列表，仅 group 场景且 target_type=specific 时有效。指定面板对这些群生效，一次最多传 20 个。 */
  group_openids?: string[];
  /** 面板配置内容，定义面板中展示的指令和链接项。 */
  panel: Panel;
}

/** 指令面板创建结果。 */
export interface CreatePanel {
  /** 新创建的面板 ID。后续修改、删除、查询详情均需使用此 ID。 */
  panel_id: string;
}

/** 修改指令面板时使用的参数。 */
export interface UpdatePanelPayload {
  /** 面板配置内容。传入后会覆盖原有的面板元素列表和备注，不影响已关联的用户/群列表。 */
  panel: Panel;
}

/** 指令面板修改结果。 */
export interface UpdatePanel {
  /** 本次修改后的面板版本号。 */
  version: number;
}

/** 修改指令面板关联对象时使用的参数。 */
export interface UpdatePanelTargetPayload {
  /** 操作类型，可选值：add（添加关联对象）、del（移除关联对象）。 */
  op: 'add' | 'del';
  /** 用户 openid 列表，仅 c2c 场景有效，一次最多 20 个。 */
  user_openids?: string[];
  /** 群 openid 列表，仅 group 场景有效，一次最多 20 个。 */
  group_openids?: string[];
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
export const getAccessToken = async (payload: GetAccessTokenPayload): Promise<AccessToken | AccessTokenError> => {
  const response = await embus<AccessToken | AccessTokenError>({
    method: 'POST',
    origin: OPEN_API_ORIGIN,
    url: '/app/getAppAccessToken',
    payload,
  });

  return response.data;
};

export default (request: EmbusInstance) => {
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
    getGateway(): Promise<Gateway> {
      return request.get('/gateway');
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
    getBotInfo(): Promise<BotInfo> {
      return request.get('/users/@me');
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
    generateShareLink(payload: GenerateShareLinkPayload): Promise<GenerateShareLink> {
      return request.post('/v2/generate_url_link', payload);
    },

    /**
     * 查询全局自定义菜单
     *
     * 查询当前已设置的自定义菜单配置
     *
     * 接口频率限制：30 QPM
     *
     * @returns
     *
     * - version：当前菜单的版本号
     * - menu：当前生效的菜单配置。未设置过菜单时该字段为空
     */
    getMenu(): Promise<GetMenu> {
      return request.get('/v2/menu');
    },

    /**
     * 修改全局自定义菜单
     *
     * 修改自定义菜单。自定义菜单仅支持 C2C（单聊）场景，设置后对所有用户生效，不支持按用户维度区分
     *
     * 接口频率限制：5 QPM
     *
     * @returns version：本次修改后的菜单版本号，可用于后续判断配置是否有变更
     * @throws 40030008 URL 格式错误
     * @throws 40030013 超出数量限制
     * @throws 40030014 菜单类型不合法
     * @throws 40030016 必填字段缺失
     * @throws 40030020 内容存在安全风险，请修改后重试
     */
    updateMenu(payload: UpdateMenuPayload): Promise<UpdateMenu> {
      return request.put('/v2/menu', payload);
    },

    /**
     * 查询指令面板列表
     *
     * 分页拉取指定场景下已生效的指令面板列表，按设置时间倒序排列。必须传入 scope 参数进行场景筛选
     *
     * 接口频率限制：30 QPM
     *
     * @remarks
     * Chobits 只支持私聊和群聊，因此 `scope` 仅提供 `c2c` 和 `group`。
     *
     * @returns
     *
     * - records：面板记录列表，按设置时间倒序排列
     * - next_cursor：下一页游标。空串表示已到最后一页，无更多数据
     * - is_end：是否已拉取到最后一页。true 表示无更多数据
     * @throws 40030001 参数错误
     * @throws 40030011 生效场景不合法
     */
    getPanelList(payload: GetPanelListPayload): Promise<GetPanelList> {
      return request.get('/v2/panels', payload);
    },

    /**
     * 创建指令面板
     *
     * 创建指令面板。
     *
     * 一个机器人最多创建 20 个指令面板
     *
     * 接口频率限制：10 QPM
     *
     * @remarks
     * Chobits 只支持私聊和群聊，因此 `scope` 仅提供 `c2c` 和 `group`。
     *
     * @returns panel_id：新创建的面板 ID。后续修改、删除、查询详情均需使用此 ID
     * @throws 40030008 URL 格式错误
     * @throws 40030009 指令面板操作进行中，请稍后重试
     * @throws 40030011 生效场景不合法
     * @throws 40030012 生效范围不合法
     * @throws 40030013 超出数量限制
     * @throws 40030015 面板元素类型不合法
     * @throws 40030016 必填字段缺失
     * @throws 40030018 当前场景不支持此操作
     * @throws 40030020 内容存在安全风险，请修改后重试
     * @throws 40030021 全局面板不支持添加指定关联对象
     */
    createPanel(payload: CreatePanelPayload): Promise<CreatePanel> {
      return request.post('/v2/panels', payload);
    },

    /**
     * 查询指令面板详情
     *
     * 查询指定指令面板的完整配置详情，包括面板内容、生效场景、生效范围，以及关联的用户或群 openid 列表
     *
     * 接口频率限制：30 QPM
     *
     * @param panel_id 面板 ID
     * @throws 40030006 指令面板不存在
     */
    getPanel(panel_id: string): Promise<PanelRecord> {
      return request.get(`/v2/panels/${panel_id}`);
    },

    /**
     * 修改指令面板
     *
     * 修改指定指令面板的配置内容，包括面板元素列表和备注。不影响已关联的用户/群列表
     *
     * 接口频率限制：10 QPM
     *
     * @param panel_id 面板 ID
     * @returns version：本次修改后的面板版本号
     * @throws 40030006 指令面板不存在
     * @throws 40030008 URL 格式错误
     * @throws 40030009 指令面板操作进行中，请稍后重试
     * @throws 40030013 超出数量限制
     * @throws 40030015 面板元素类型不合法
     * @throws 40030016 必填字段缺失
     * @throws 40030018 当前场景不支持此操作
     * @throws 40030020 内容存在安全风险，请修改后重试
     * @throws 40030021 全局面板不支持添加指定关联对象
     */
    updatePanel(panel_id: string, payload: UpdatePanelPayload): Promise<UpdatePanel> {
      return request.put(`/v2/panels/${panel_id}`, payload);
    },

    /**
     * 删除指令面板
     *
     * 删除指定的指令面板。删除后该面板不再对任何用户或群生效
     *
     * 接口频率限制：10 QPM
     *
     * @remarks
     * 官方文档将响应标记为「无」，文档同一页面的响应示例和实际响应均为 `{}`。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_panels_panel_id.delete.html}
     *
     * @param panel_id 面板 ID
     * @throws 40030006 指令面板不存在
     */
    deletePanel(panel_id: string): Promise<Record<string, never>> {
      return request.delete(`/v2/panels/${panel_id}`);
    },

    /**
     * 修改指令面板关联对象
     *
     * 对指定指令面板关联的用户或群进行添加或删除操作。c2c 场景操作用户 openid，group 场景操作群 openid。channel 和 dm 场景为全局配置，不支持此操作
     *
     * 接口频率限制：60 QPM
     *
     * @remarks
     * 官方文档将响应标记为「无」，文档同一页面的响应示例和实际响应均为 `{}`。
     *
     * Chobits 只支持私聊和群聊。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_panels_panel_id_target.put.html}
     *
     * @param panel_id 面板 ID
     * @throws 40030013 超出数量限制
     * @throws 40030017 操作类型不合法
     * @throws 40030018 当前场景不支持此操作
     * @throws 40030021 全局面板不支持添加指定关联对象
     */
    updatePanelTarget(panel_id: string, payload: UpdatePanelTargetPayload): Promise<Record<string, never>> {
      return request.put(`/v2/panels/${panel_id}/target`, payload);
    },
  };
};
