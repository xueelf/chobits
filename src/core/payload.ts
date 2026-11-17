import { type VerifyInfo } from '#/api/index';

/** QQ Gateway Payload 的操作码。 */
export enum OpCode {
  /** 服务端推送 Dispatch。 */
  Dispatch = 0,
  /** 客户端或服务端发送心跳。 */
  Heartbeat = 1,
  /** 客户端发送 Identify。 */
  Identify = 2,
  /** 客户端发送 Resume。 */
  Resume = 6,
  /** 服务端发送 Reconnect。 */
  Reconnect = 7,
  /** 服务端发送 Invalid Session。 */
  InvalidSession = 9,
  /** 服务端建立连接后发送 Hello。 */
  Hello = 10,
  /** 服务端发送心跳 ACK。 */
  HeartbeatAck = 11,
  /** 客户端发送 HTTP Callback ACK。 */
  HttpCallbackAck = 12,
  /** 开放平台验证 Webhook 回调地址。 */
  CallbackValidation = 13,
}

/** WebSocket 会话维护事件类型。 */
export enum DispatchType {
  /** READY 事件。 */
  Ready = 'READY',
  /** RESUMED 事件。 */
  Resumed = 'RESUMED',
}

/**
 * 服务端推送事件的通用 Payload。
 *
 * @typeParam Type - 官方事件名。
 * @typeParam Data - 事件数据。
 */
export interface DispatchPayload<Type extends string = string, Data = unknown> {
  /** 事件 ID。 */
  id?: string;
  /** Payload 操作码。 */
  op: OpCode.Dispatch;
  /**
   * 事件序列号。
   *
   * @remarks
   * WebSocket Dispatch 实际携带该字段，已取得的 Webhook Dispatch 均未携带该字段。
   *
   * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/event-emit/websocket.html}
   * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/event-emit/webhook.html}
   */
  s?: number;
  /** 官方事件名。 */
  t: Type;
  /** 事件数据。 */
  d: Data;
}

/** 好友事件中的用户标识。 */
export interface FriendAuthor {
  /** 用户跨应用的 UnionOpenID。 */
  union_openid: string;
}

/** 订阅消息模板的授权结果。 */
export interface SubscribeMsgTemplateResult {
  /** 平台提供的订阅模板 ID。 */
  template_id: number;
  /** 自定义订阅模板 ID。 */
  custom_template_id: string;
  /** 用户操作。1=允许订阅，2=拒绝订阅。 */
  op: 1 | 2;
  /** 订阅 ID，发送订阅消息时需使用。 */
  subscribe_id: string;
  /** 订阅操作时间戳（Unix 秒）。 */
  subscribe_ts: number;
  /** 订阅状态最后更新时间戳（Unix 秒）。 */
  update_ts: number;
}

/** 自动审批通过的扩展信息。 */
export interface AutoApproved {
  /** 自动审批通过的策略ID。 */
  strategy_id: string;
}

/** 互动事件类型。 */
export enum InteractionType {
  /** 消息按钮回调。 */
  INLINE_KEYBOARD = 11,
  /**
   * 私聊快捷菜单回调（CALLBACK_COMMAND）：用户点击私聊场景下的自定义菜单。
   *
   * @remarks
   * 实测点击快捷指令或快捷菜单均触发 `C2C_MESSAGE_CREATE`，未收到该类型的事件。
   * 服务入口依赖小程序，暂未取得真实 Payload。
   *
   * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
   */
  CALLBACK_COMMAND = 12,
  /** 用户授权。 */
  USER_AUTHORIZE = 18,
  /**
   * 群授权。
   *
   * @remarks
   * 移动端切换「机器人主动在群聊内发言」时，WebSocket 与 Webhook 均未收到该类型。
   *
   * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
   */
  GROUP_AUTHORIZE = 19,
  /**
   * 群授权状态变更。
   *
   * @remarks
   * 实测进入群设置中的「机器人管理」时，WebSocket 和 Webhook 均收到该类型的事件。
   *
   * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
   */
  GROUP_AUTHORIZE_STATUS = 20,
}

/** 互动事件携带的数据。 */
export interface InteractionData {
  /**
   * 互动数据类型。
   *
   * 文档中，消息按钮和快捷菜单分别使用 `11` 和 `12`。
   *
   * @remarks
   * `GROUP_AUTHORIZE_STATUS` 实际返回 `type: 2001`，该取值未被文档收录。
   *
   * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
   */
  type?: InteractionType.INLINE_KEYBOARD | InteractionType.CALLBACK_COMMAND | 2001;
  /** 已解析的互动数据。 */
  resolved: InteractionResolved;
}

/** 已解析的互动数据。 */
export interface InteractionResolved {
  /** 按钮携带的数据。 */
  button_data?: string;
  /** 按钮 ID。 */
  button_id?: string;
  /** 功能 ID。 */
  feature_id?: string;
  /** 授权互动数据。 */
  authorize_data?: AuthorizeData;
}

/** 授权互动数据。 */
export interface AuthorizeData {
  /**
   * 授权操作场景。
   *
   * @remarks
   * 文档仅定义 `dialog` 和 `setting`，删除机器人好友时实际返回 `friend_del`。
   *
   * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
   */
  opt_scene: 'dialog' | 'setting' | 'friend_del';
  /** 授权范围。 */
  scope: 'c2c_push' | 'group_push';
  /**
   * 授权开关。
   *
   * @remarks
   * 该字段未被文档收录。
   * 实测开启「允许主动发送消息」后，WebSocket 和 Webhook 均返回 `true`，关闭后均不返回该字段。
   *
   * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
   */
  switch?: boolean;
}

/**
 * 用户对象。
 *
 * 用户对象中所涉及的 ID 类数据，都仅在机器人场景流通，与真实的 ID 无关。请不要理解为真实的 ID。
 *
 * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/openapi/user/model.html}
 */
export interface User {
  /** 用户 id。 */
  id: string;
  /** 用户名。 */
  username?: string;
  /** 用户头像地址。 */
  avatar?: string;
  /** 是否是机器人。 */
  bot?: boolean;
  /** 特殊关联应用的 openid，需要特殊申请并配置后才会返回。如需申请，请联系平台运营人员。 */
  union_openid?: string;
  /** 机器人关联的互联应用的用户信息，与union_openid关联的应用是同一个。如需申请，请联系平台运营人员。 */
  union_user_account?: string;
}

/** 单聊消息的发送者。 */
export interface C2CUser {
  /** 用户唯一标识（OpenID 格式）。 */
  id: string;
  /** 用户昵称。 */
  username?: string;
  /** 用户头像 URL。 */
  avatar?: string;
  /** 是否为机器人。 */
  bot?: boolean;
  /** 跨应用关联用户openid，当绑定了3方应用时有效。 */
  union_openid?: string;
  /** 用户 OpenID。 */
  user_openid: string;
}

/** 群聊消息的发送者。 */
export interface GroupUser {
  /** 用户唯一标识（OpenID 格式）。 */
  id: string;
  /** 用户昵称。 */
  username?: string;
  /** 用户头像 URL。 */
  avatar?: string;
  /** 是否为机器人。 */
  bot?: boolean;
  /** 跨应用关联用户openid，当绑定了3方应用时有效。 */
  union_openid?: string;
  /** 群成员 OpenID。 */
  member_openid: string;
  /** 群内角色。member=普通成员, admin=管理员, owner=群主。 */
  member_role?: string;
  /** 群场景：用户在群内的昵称。 */
  member_nickname?: string;
}

/**
 * 群消息中提及的用户。
 *
 * @remarks
 * 官方文档将 `id` 和 `member_openid` 列为字段，实测 @全体成员 的条目只有 `is_you`、`scope` 和 `username`，其中 `is_you` 为 `true`。
 *
 * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_at_message_create.html}
 * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_message_create.html}
 */
export interface GroupMentionsUser {
  /** 用户唯一标识（OpenID 格式）。 */
  id?: string;
  /** 用户昵称。 */
  username?: string;
  /** 是否为机器人。 */
  bot?: boolean;
  /** 群成员 OpenID（群聊场景使用）。 */
  member_openid?: string;
  /** 群内角色。member=普通成员, admin=管理员, owner=群主。 */
  member_role?: string;
  /** 用户在群内的昵称。 */
  member_nickname?: string;
  /** 是否是@的当前bot。 */
  is_you?: boolean;
  /** all：@全体成员，single：指定@对象。 */
  scope?: string;
}

/** 消息场景上下文。 */
export interface MessageScene {
  /** 场景来源。default=默认聊天窗口 */
  source: string;
  /** 扩展数据列表，key=value 格式: msg_idx=消息索引, 用于引用场景 ref_msg_idx=引用的消息索引 auth_token=鉴权令牌 */
  ext: string[];
}

/** 并行消息数据。 */
interface ParallelMessage {
  /** 消息节点。 */
  msg_nodes: {
    /** 官方定义的入站消息类型。 */
    message_type: number;
    /** 消息文本内容。 */
    content: string;
  }[];
}

/** 消息附件。 */
export interface MessageAttachment {
  /**
   * 附件内容。
   *
   * @remarks
   * 该字段未被文档收录，图片附件实际返回空字符串。
   *
   * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/c2c_message_create.html}
   */
  content?: string;
  /** 附件下载 URL。 */
  url?: string;
  /** 文件名。 */
  filename?: string;
  /** 图片宽度（像素），非图片附件无此字段。 */
  width?: number;
  /** 图片高度（像素），非图片附件无此字段。 */
  height?: number;
  /** 文件大小（字节）。 */
  size?: number;
  /** 附件内容类型（MIME 类型）: voice=语音消息 image/jpeg=JPEG 图片 image/png=PNG 图片 image/gif=GIF 图片 video/mp4=MP4 视频 file=群文件。 */
  content_type?: string;
  /** 语音消息 SILK 等转换后的 WAV 文件 URL。 */
  voice_wav_url?: string;
  /** 语音消息 ASR 参考结果。 */
  asr_refer_text?: string;
}

/** 收到的消息中的 ARK 数据。 */
export interface ARKData {
  /** 卡片消息中的用户操作提示文本。 */
  prompt?: string;
  /**
   * ARK 类型。
   *
   * 卡片消息类型标识:
   *
   * - tuwen = 图文 H5（如快手分享链接）
   * - feed = 图文卡片（群相册、分享卡片）
   * - miniapp = 小程序（微信小程序、QQ 小程序、哔哩哔哩等）
   * - map = 位置卡片
   * - contact_card = 好友名片
   * - video_share = 视频分享
   * - music_together = 一起听歌
   * - picture = 图片
   */
  ark_type?: string;
  /** 卡片消息类型的中文名称，如「图文 H5」、「小程序」、「图文卡片」。 */
  ark_name?: string;
  /** 卡片消息字段，常见键名: tag/tags=来源标签, title=标题, desc=描述, jump_url=跳转链接, preview=预览图, source=来源名称, source_logo=来源图标, tag_icon=标签图标, nickname=昵称, avatar=头像, address=地址。 */
  fields?: Record<string, unknown>;
}

/** 收到的消息中的元素。 */
export interface MsgElement {
  /** 消息元素在列表中的引用消息索引。 */
  msg_idx?: string;
  /** 消息内容类型: 0=普通文本, 3=结构化卡片, 101=并行消息, 102=聊天记录, 103=引用消息。 */
  message_type?: number;
  /** 消息正文内容。 */
  content?: string;
  /** 该元素携带的附件。 */
  attachments?: MessageAttachment[];
  /** 结构化卡片消息数据（message_type=3 时有值）。 */
  ark_data?: ARKData;
  /** 嵌套消息元素列表（递归结构）。 */
  msg_elements?: MsgElement[];
}

/** 官方事件名与事件数据的映射。 */
export type DispatchData = {
  READY: {
    /** Gateway 协议版本。 */
    version: number;
    /** 当前会话 ID。 */
    session_id: string;
    /** 当前机器人用户信息。 */
    user: User &
      Required<Pick<User, 'username' | 'bot'>> & {
        /**
         * 用户状态。
         *
         * @remarks
         * 该字段未被文档收录，WebSocket `READY` Payload 实际返回 `1`。
         *
         * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/event-emit/websocket.html}
         */
        status: number;
      };
    /** 当前分片信息。 */
    shard: [number, number];
  };
  RESUMED: '';
  C2C_MESSAGE_CREATE: {
    /** 消息 ID，可用于被动回复和撤回。 */
    id: string;
    /** 发送者（user_openid 有值）。 */
    author: C2CUser & Required<Pick<C2CUser, 'username' | 'avatar' | 'bot' | 'union_openid'>>;
    /** 消息文本内容。 */
    content: string;
    /** 消息发送时间，RFC3339 格式。 */
    timestamp: string;
    /** 消息内容类型: 0=普通文本, 3=结构化卡片, 101=并行消息, 102=聊天记录, 103=引用消息。 */
    message_type: number;
    /** 消息场景上下文（含消息索引、鉴权令牌等）。 */
    message_scene: MessageScene;
    /** 消息附件（图片、文件、语音等）。 */
    attachments?: MessageAttachment[];
    /** 结构化卡片消息数据（message_type=3 时有值）。 */
    ark_data?: ARKData;
    /** 消息元素列表（message_type=103 引用消息时包含被引用内容）。 */
    msg_elements?: MsgElement[];
    /**
     * 并行消息数据。
     *
     * @remarks
     * 该字段未被文档收录，Webhook 引用消息实测返回该字段。
     *
     * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/c2c_message_create.html}
     */
    parallel_message?: ParallelMessage;
  };
  GROUP_AT_MESSAGE_CREATE: {
    /** 消息 ID，可用于被动回复和撤回。 */
    id: string;
    /** 发送者（member_openid 有值）。 */
    author: GroupUser &
      Required<
        Pick<
          GroupUser,
          'username' | 'avatar' | 'bot' | 'union_openid' | 'member_openid' | 'member_role' | 'member_nickname'
        >
      >;
    /**
     * 消息文本内容。
     *
     * 群消息（全量模式）中，消息中 @ 某成员时，会替换为 <@ + 该成员的 member_openid + >（如 <@7A3B9C1D5E2F4A6B8C0D1E3F5A7B9C2D>）。
     * 消息中 @全体成员时，会替换为 <@all>。
     * 被 @ 的成员列表见 mentions 字段。
     *
     * @remarks
     * 官方文档说明群 @ 机器人消息已去除 @ 机器人前缀，实测该事件还会去除其他成员的 @ 内容。
     *
     * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_at_message_create.html}
     */
    content: string;
    /** 群 OpenID。 */
    group_openid: string;
    /**
     * 群 ID。
     *
     * @remarks
     * 该字段未被文档收录，群消息事件中实际与 `group_openid` 相同。
     *
     * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_at_message_create.html}
     * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_message_create.html}
     */
    group_id: string;
    /** 消息发送时间，RFC3339 格式。 */
    timestamp: string;
    /** 消息内容类型（同 C2C_MESSAGE_CREATE）。 */
    message_type: number;
    /** 消息场景上下文。 */
    message_scene: MessageScene;
    /** 消息附件。 */
    attachments?: MessageAttachment[];
    /**
     * 消息中@的用户列表。
     *
     * @remarks
     * 官方文档为群 @ 机器人消息定义该字段，实测该事件不返回该字段。群消息（全量模式）会返回该字段。
     *
     * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_at_message_create.html}
     * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_message_create.html}
     */
    mentions?: GroupMentionsUser[];
    /** 结构化卡片消息数据。 */
    ark_data?: ARKData;
    /** 消息元素列表。 */
    msg_elements?: MsgElement[];
    /** 跨应用关联群openid，当绑定了3方应用时有效。 */
    union_group_openid: string;
    /**
     * 并行消息数据。
     *
     * @remarks
     * 该字段未被文档收录，WebSocket 与 Webhook 的引用消息实测均返回该字段。
     *
     * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_message_create.html}
     */
    parallel_message?: ParallelMessage;
  };
  GROUP_MESSAGE_CREATE: DispatchData['GROUP_AT_MESSAGE_CREATE'];
  GROUP_ADD_ROBOT: {
    /** 加入时间戳（Unix 秒）。 */
    timestamp: number;
    /** 群 OpenID。 */
    group_openid: string;
    /** 操作添加机器人进群的群成员 OpenID。 */
    op_member_openid: string;
    /** 跨应用关联群openid，当绑定了3方应用时有效。 */
    union_group_openid: string;
  };
  GROUP_DEL_ROBOT: {
    /** 移除时间戳（Unix 秒）。 */
    timestamp: number;
    /** 群 OpenID。 */
    group_openid: string;
    /** 操作移除机器人退群的群成员 OpenID。 */
    op_member_openid: string;
    /** 跨应用关联群openid，当绑定了3方应用时有效。 */
    union_group_openid: string;
  };
  GROUP_MSG_RECEIVE: {
    /** 操作时间戳（Unix 秒）。 */
    timestamp: number;
    /** 群 OpenID。 */
    group_openid: string;
    /** 操作群成员 OpenID。 */
    op_member_openid: string;
  };
  GROUP_MSG_REJECT: DispatchData['GROUP_MSG_RECEIVE'];
  /** 群成员加入事件。 */
  GROUP_MEMBER_ADD: {
    /** 事件时间戳（Unix 秒）。 */
    timestamp: number;
    /** 群 OpenID。 */
    group_openid: string;
    /** 新加入成员的 OpenID。 */
    member_openid: string;
    /**
     * 跨应用关联用户openid。
     *
     * @remarks
     * 该字段未被文档收录，未绑定 3 方应用时实测返回与 `member_openid` 相同的值。
     *
     * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_member_add.html}
     */
    union_openid: string;
    /** 跨应用关联群openid，当绑定了3方应用时有效。 */
    union_group_openid: string;
  };
  /** 群成员退出事件。 */
  GROUP_MEMBER_REMOVE: {
    /** 事件时间戳（Unix 秒）。 */
    timestamp: number;
    /** 群 OpenID。 */
    group_openid: string;
    /** 退出成员的 OpenID。 */
    member_openid: string;
    /**
     * 退出成员的用户 OpenID（可能为空）。
     *
     * @remarks
     * WebSocket 实测返回 `union_openid`，未返回该字段。
     *
     * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_member_remove.html}
     */
    user_openid?: string;
    /**
     * 跨应用关联用户openid。
     *
     * @remarks
     * 该字段未被文档收录，未绑定 3 方应用时实测返回与 `member_openid` 相同的值。
     *
     * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_member_remove.html}
     */
    union_openid: string;
    /** 跨应用关联群openid，当绑定了3方应用时有效。 */
    union_group_openid: string;
  };
  /**
   * 订阅消息授权状态变更事件。
   *
   * @remarks
   * 当前没有订阅消息模板的授权入口，尚未取得真实 Payload。
   *
   * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/subscribe_message_status.html}
   */
  SUBSCRIBE_MESSAGE_STATUS: {
    /** 群 OpenID（群订阅场景时有值）。 */
    group_openid?: string;
    /** 用户 OpenID（个人订阅场景时有值）。 */
    openid?: string;
    /** 各模板的授权结果列表。 */
    result: SubscribeMsgTemplateResult[];
  };
  /**
   * 用户入群申请事件。
   *
   * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_join_request.html}
   */
  GROUP_JOIN_REQUEST: {
    /** 群OpenID。 */
    group_openid: string;
    /** 申请 ID，需要在申请接口回传。 */
    join_request_id: string;
    /** 安全提示语，可疑消息直接返回 warning_tips，普通消息命中 sec_risk_rules 时返回 top_tips。 */
    risk_tips?: string;
    /** 用户在应用/开放平台下的统一标识（如有）。 */
    union_openid?: string;
    /** 申请人 openid。 */
    member_openid: string;
    /** 申请人昵称。 */
    username: string;
    /** 申请时间戳（RFC3339 格式）。 */
    apply_at: string;
    /** 申请来源：self_apply 主动申请，invited 被邀请。 */
    apply_source: 'self_apply' | 'invited';
    /** 邀请人 openid（apply_source=invited 时有效）。 */
    invited_by?: string;
    /** 是否为机器人账号。 */
    bot?: boolean;
    /** 用户入群验证方式。 */
    verify_info?: VerifyInfo;
    /** 自动审批通过的扩展信息，只有在下行事件中会携带。 */
    auto_approved?: AutoApproved;
  };
  FRIEND_ADD: {
    /** 事件发生时间。 */
    timestamp: number;
    /** 用户 OpenID。 */
    openid: string;
    /** 好友用户信息。 */
    author: FriendAuthor;
    /**
     * 加好友场景值。
     *
     * @remarks
     * 实测重新添加机器人好友时，WebSocket 未返回该字段。
     *
     * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/friend_add.html}
     */
    scene?: number;
    /**
     * 开发者自定义的回调数据（callback_data），用于区分不同来源。
     *
     * @remarks
     * 实测重新添加机器人好友时，WebSocket 未返回该字段。
     *
     * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/friend_add.html}
     */
    scene_param?: string;
    /**
     * 机器人分享链接的短链code。
     *
     * @remarks
     * 实测重新添加机器人好友时，WebSocket 和 Webhook 均未返回该字段。
     *
     * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/friend_add.html}
     */
    short_code?: string;
  };
  FRIEND_DEL: {
    /** 事件发生时间。 */
    timestamp: number;
    /** 用户 OpenID。 */
    openid: string;
    /**
     * 好友用户信息。
     *
     * @remarks
     * 官方文档的字段表包含 `author`，文档同一页面的事件示例却未包含该字段。
     * 实测事件会返回 `author`。
     *
     * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/friend_del.html}
     */
    author: FriendAuthor;
  };
  C2C_MSG_RECEIVE: {
    /** 事件发生时间。 */
    timestamp: number;
    /** 用户 OpenID。 */
    openid: string;
  };
  C2C_MSG_REJECT: DispatchData['C2C_MSG_RECEIVE'];
  INTERACTION_CREATE: {
    /** 互动事件 ID。 */
    id: string;
    /** 官方定义的互动事件类型。 */
    type: InteractionType;
    /** 官方定义的聊天类型。 */
    chat_type?: 1 | 2;
    /** 互动发生时间。 */
    timestamp: string;
    /** 互动携带的数据。 */
    data: InteractionData;
    /** 互动事件版本。 */
    version: number;
    /** 机器人应用 ID。 */
    application_id?: string;
  } & (
    | {
        /** 互动发生在私聊场景。 */
        scene: 'c2c';
        /** 私聊场景的用户 OpenID。 */
        user_openid: string;
        /**
         * 用户跨应用的 UnionOpenID。
         *
         * @remarks
         * 该字段未被文档收录，Webhook 实测返回该字段。
         *
         * @see {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
         */
        union_openid?: string;
      }
    | {
        /** 互动发生在群聊场景。 */
        scene: 'group';
        /** 群聊场景的群 OpenID。 */
        group_openid: string;
        /** 群聊场景的成员 OpenID。 */
        group_member_openid?: string;
      }
  );
};

/** 客户端支持的 Dispatch Payload。 */
export type Dispatch = {
  [Type in keyof DispatchData]: DispatchPayload<Type, DispatchData[Type]>;
}[keyof DispatchData];
