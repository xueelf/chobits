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
 * @typeParam Type 官方事件名。
 * @typeParam Data 事件数据。
 */
export interface DispatchPayload<Type extends string = string, Data = unknown> {
  /** 事件 ID。 */
  id?: string;
  /** Payload 操作码。 */
  op: OpCode.Dispatch;
  /** 事件序列号。 */
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
export interface AutoAppproved {
  /** 自动审批通过的策略ID。 */
  strategy_id: string;
}

/** 官方定义的互动事件类型。 */
export enum InteractionType {
  /** 消息按钮回调。 */
  INLINE_KEYBOARD = 11,
  /**
   * 私聊快捷菜单回调（CALLBACK_COMMAND）：用户点击私聊场景下的自定义菜单。
   *
   * @remarks
   * 快捷指令和快捷菜单实测均触发 `C2C_MESSAGE_CREATE`，未收到该类型。服务入口依赖小程序，暂未取得真实 Payload。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
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
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
   */
  GROUP_AUTHORIZE = 19,
  /**
   * 群授权状态变更。
   *
   * @remarks
   * WebSocket 与 Webhook 实测进入群设置中的「机器人管理」时触发该类型。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
   */
  GROUP_AUTHORIZE_STATUS = 20,
}

/** 互动事件携带的数据。 */
export interface InteractionData {
  /**
   * 官方定义的互动数据类型。
   *
   * QQ 机器人当前公开的消息按钮和快捷菜单事件分别使用 `11` 和 `12`。
   *
   * @remarks
   * `GROUP_AUTHORIZE_STATUS` 实际返回 `type: 2001`，该取值未被文档收录。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
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
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
   */
  opt_scene: 'dialog' | 'setting' | 'friend_del';
  /** 授权范围。 */
  scope: 'c2c_push' | 'group_push';
  /**
   * 授权开关字段。
   *
   * @remarks
   * 该字段未被文档收录。WebSocket 与 Webhook 实测开启「允许主动发送消息」时返回 `true`，关闭时不返回该字段。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
   */
  switch?: boolean;
}

/** QQ 用户或机器人信息。 */
export interface User {
  /** 用户 ID。 */
  id: string;
  /** 用户名称。 */
  username?: string;
  /**
   * 头像 URL。
   *
   * @deprecated 旧版 `User` 结构包含该字段，当前事件 `User` 结构已经移除，请勿依赖消息事件返回该值。
   */
  avatar?: string;
  /** 是否为机器人。 */
  bot?: boolean;
  /**
   * 用户状态。
   *
   * @remarks
   * 该字段未被文档收录，WebSocket `READY` Payload 实际返回 `1`。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/event-emit/websocket.html}
   */
  status?: number;
  /** 用户跨应用的 UnionOpenID。 */
  union_openid?: string;
  /** 用户跨应用的 UnionUserAccount。 */
  union_user_account?: string;
  /** 私聊场景的用户 OpenID。 */
  user_openid?: string;
  /** 群聊场景的成员 OpenID。 */
  member_openid?: string;
  /** 群成员角色。 */
  member_role?: string;
  /**
   * 是否指向当前机器人。
   *
   * @remarks
   * 该字段未被文档收录，群消息中提及当前机器人时实际返回 `true`。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_at_message_create.html}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_message_create.html}
   */
  is_you?: boolean;
  /**
   * 提及范围。
   *
   * @remarks
   * 该字段未被文档收录，群消息中提及当前机器人时实际返回 `single`。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_at_message_create.html}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_message_create.html}
   */
  scope?: string;
}

/** 消息来源场景。 */
export interface MessageScene {
  /** 消息来源。 */
  source: string;
  /** 场景扩展信息。 */
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
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/c2c_message_create.html}
   */
  content?: string;
  /** 附件 URL。 */
  url?: string;
  /** 附件文件名。 */
  filename?: string;
  /** 图片宽度。 */
  width?: number;
  /** 图片高度。 */
  height?: number;
  /** 附件大小。 */
  size?: number;
  /** 附件内容类型。 */
  content_type?: string;
  /** 语音附件的 WAV URL。 */
  voice_wav_url?: string;
  /** 语音识别参考文本。 */
  asr_refer_text?: string;
}

/** 接收消息中的 ARK 数据。 */
export interface ARKData {
  /** ARK 提示文本。 */
  prompt?: string;
  /** ARK 类型。 */
  ark_type?: string;
  /** ARK 名称。 */
  ark_name?: string;
  /** ARK 字段数据。 */
  fields?: Record<string, unknown>;
}

/** 接收消息中的消息元素。 */
export interface MsgElement {
  /** 消息元素索引。 */
  msg_idx?: string;
  /** 消息元素作者。 */
  author?: User;
  /** 官方定义的入站消息类型。 */
  message_type?: number;
  /** 文本内容。 */
  content?: string;
  /** 附件列表。 */
  attachments?: MessageAttachment[];
  /** ARK 数据。 */
  ark_data?: ARKData;
  /** 嵌套消息元素。 */
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
    user: User & Required<Pick<User, 'username' | 'bot' | 'status'>>;
    /** 当前分片信息。 */
    shard: [number, number];
  };
  RESUMED: '';
  C2C_MESSAGE_CREATE: {
    /** 消息 ID。 */
    id: string;
    /** 消息发送者。 */
    author: User & Required<Pick<User, 'username' | 'bot' | 'union_openid' | 'user_openid'>>;
    /** 消息文本内容。 */
    content: string;
    /** 消息发送时间。 */
    timestamp: string;
    /** 官方定义的入站消息类型。 */
    message_type: number;
    /** 消息来源场景。 */
    message_scene: MessageScene;
    /** 消息附件。 */
    attachments?: MessageAttachment[];
    /** ARK 数据。 */
    ark_data?: ARKData;
    /** 消息元素。 */
    msg_elements?: MsgElement[];
    /**
     * 并行消息数据。
     *
     * @remarks
     * 该字段未被文档收录，Webhook 引用消息实测返回该字段。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/c2c_message_create.html}
     */
    parallel_message?: ParallelMessage;
  };
  GROUP_AT_MESSAGE_CREATE: {
    /** 消息 ID。 */
    id: string;
    /** 消息发送者。 */
    author: User & Required<Pick<User, 'username' | 'bot' | 'union_openid' | 'member_openid' | 'member_role'>>;
    /** 消息文本内容。 */
    content: string;
    /** 群 OpenID。 */
    group_openid: string;
    /**
     * 群 ID。
     *
     * @remarks
     * 该字段未被文档收录，群消息事件中实际与 `group_openid` 相同。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_at_message_create.html}
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_message_create.html}
     */
    group_id: string;
    /** 消息发送时间。 */
    timestamp: string;
    /** 官方定义的入站消息类型。 */
    message_type: number;
    /** 消息来源场景。 */
    message_scene: MessageScene;
    /** 消息附件。 */
    attachments?: MessageAttachment[];
    /** 消息中提及的用户。 */
    mentions?: User[];
    /** ARK 数据。 */
    ark_data?: ARKData;
    /** 消息元素。 */
    msg_elements?: MsgElement[];
    /**
     * 并行消息数据。
     *
     * @remarks
     * 该字段未被文档收录，Webhook 引用消息实测返回该字段。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_message_create.html}
     */
    parallel_message?: ParallelMessage;
  };
  GROUP_MESSAGE_CREATE: DispatchData['GROUP_AT_MESSAGE_CREATE'];
  GROUP_ADD_ROBOT: {
    /** 事件发生时间。 */
    timestamp: number;
    /** 群 OpenID。 */
    group_openid: string;
    /** 执行操作的群成员 OpenID。 */
    op_member_openid: string;
  };
  GROUP_DEL_ROBOT: DispatchData['GROUP_ADD_ROBOT'];
  GROUP_MSG_RECEIVE: DispatchData['GROUP_ADD_ROBOT'];
  GROUP_MSG_REJECT: DispatchData['GROUP_ADD_ROBOT'];
  /** 群成员加入事件。 */
  GROUP_MEMBER_ADD: {
    /** 事件发生时间。 */
    timestamp: number;
    /** 群 OpenID。 */
    group_openid: string;
    /** 群成员 OpenID。 */
    member_openid: string;
    /**
     * 新成员的用户 OpenID（跨应用统一标识，可能为空）。
     *
     * @remarks
     * WebSocket 与 Webhook 实测均未返回该字段。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_member_add.html}
     */
    user_openid?: string;
  };
  /** 群成员退出事件。 */
  GROUP_MEMBER_REMOVE: {
    /** 事件发生时间。 */
    timestamp: number;
    /** 群 OpenID。 */
    group_openid: string;
    /** 退出成员的 OpenID。 */
    member_openid: string;
    /**
     * 退出成员的用户 OpenID（可能为空）。
     *
     * @remarks
     * WebSocket 与 Webhook 实测均未返回该字段。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_member_remove.html}
     */
    user_openid?: string;
  };
  /**
   * 订阅消息授权状态变更事件。
   *
   * @remarks
   * 当前没有订阅消息模板的授权入口，尚未取得真实 Payload。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/subscribe_message_status.html}
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
   * @remarks
   * WebSocket 与 Webhook 实测提交入群申请时均未收到该事件，同意申请后收到 `GROUP_MEMBER_ADD`。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_join_request.html}
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
    auto_approved?: AutoAppproved;
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
     * WebSocket 实测重新添加机器人好友时未返回该字段。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/friend_add.html}
     */
    scene?: number;
    /**
     * 开发者自定义的回调数据（callback_data），用于区分不同来源。
     *
     * @remarks
     * WebSocket 实测重新添加机器人好友时未返回该字段。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/friend_add.html}
     */
    scene_param?: string;
    /**
     * 机器人分享链接的短链code。
     *
     * @remarks
     * WebSocket 与 Webhook 实测重新添加机器人好友时未返回该字段。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/friend_add.html}
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
     * 官方文档字段表定义 `author`，文档同一页面的事件示例未返回该字段，实际事件返回该字段。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/friend_del.html}
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
         * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
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
