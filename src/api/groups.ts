import { type TotteInstance } from 'totte';

import {
  type ArkMessage,
  type MarkdownMessage,
  type MediaMessage,
  type MessageExtInfo,
  type MessageReference,
  type TextMessage,
  type UploadConfig,
  type UploadPart,
  type VerifyInfo,
} from '#/api/index';

/**
 * 卡片消息 (msg_type=8)。
 *
 * @remarks
 * 当前群聊消息文档未收录 card、msg_type 8 和卡片消息示例。
 *
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_messages.post.html}
 */
export interface GroupCardMessage {
  /** 消息类型，8=卡片消息。 */
  msg_type: 8;
  /** 卡片消息。 */
  card: {
    /** 当 type 为 tuwen 时，会发送一个包括标题、描述、图片、跳转链接的消息。 */
    type?: string;
    /** 卡片消息内容。 */
    content?: {
      /** 表示卡片消息的描述。 */
      description?: string;
      /** 表示卡片消息中出现的图片。 */
      pic_url?: string;
      /** 表示卡片消息的标题。 */
      title?: string;
      /** 表示卡片消息中的跳转链接。 */
      url?: string;
    };
  };
  /** 被动回复的消息 ID。从 GROUP_AT_MESSAGE_CREATE 等事件的 d.id 获取，5 分钟内有效。 */
  msg_id?: string;
  /** 被动回复的事件 ID。从事件最外层的id获取。与 msg_id 二选一，支持事件："INTERACTION_CREATE"、"GROUP_ADD_ROBOT"、"GROUP_MSG_RECEIVE"。 */
  event_id?: string;
  /** 回复消息的序号，与 msg_id 联合使用，避免相同消息 id 回复重复发送，不填默认是 1。相同的 msg_id + msg_seq 重复发送会失败。 */
  msg_seq?: number;
  /** 引用回复。填写后以引用形式展示，关联上下文。 */
  message_reference?: MessageReference;
  /** 指明发送消息为互动召回消息，与 msg_id，event_id 互斥使用。 */
  is_wakeup?: boolean;
}

/** 向指定群发送的消息。 */
export type SendGroupMessagePayload = TextMessage | MarkdownMessage | ArkMessage | MediaMessage | GroupCardMessage;

/**
 * 群聊富媒体文件的上传信息。
 *
 * @remarks
 * 富媒体概述中的格式范围比文件限制和群聊上传接口更宽，图片另含 gif/webp/bmp，语音另含 mp3/wav/ogg。
 *
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/rich-media.html}
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_files.post.html}
 */
export interface UploadGroupFilePayload {
  /**
   * 媒体类型。
   *
   * 1=图片, 2=视频, 3=语音, 4=文件
   *
   * 图片支持 png/jpg，视频支持 mp4，语音支持 silk。
   */
  file_type?: 1 | 2 | 3 | 4;
  /**
   * 媒体资源的 URL，需以 http 开头，平台会下载并转存。
   *
   * 分片上传合并时可为空。
   */
  url?: string;
  /**
   * true=直接发送消息并占用主动消息频次，返回中包含消息 ID。
   *
   * false=仅返回 file_info，用于后续发送消息接口的 media 字段。
   */
  srv_send_msg?: boolean;
  /** 文件名（可选）。 */
  file_name?: string;
  /**
   * 分片上传任务 ID。来自 UploadPrepare 响应的 upload_id。
   *
   * 传入后走分片上传合并路径，url 可为空。
   */
  upload_id?: string;
  /**
   * @deprecated 暂未支持。当前文件上传接口已经移除该字段。
   *
   * {@link https://github.com/tencent-connect/bot-docs/blob/e603b92cfc77487e5415e32c6eee6bf88bd05f5c/docs/develop/api-v2/server-inter/message/send-receive/rich-media.md}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_files.post.html}
   */
  file_data?: unknown;
}

/** 群聊富媒体分片上传前的文件信息。 */
export interface PrepareGroupFileUploadPayload {
  /**
   * 业务类型。1=图片, 2=视频, 3=语音, 4=文件
   *
   * 图片软限制 20MB, 视频软限制 30MB, 语音软限制 20MB, 文件软限制 200MB
   *
   * 超过软限制降级为文件类型，超过 200MB 硬限制报错。
   */
  file_type: 1 | 2 | 3 | 4;
  /** 文件大小（字节）。 */
  file_size: string;
  /** 文件名。 */
  file_name: string;
  /** 整个文件的 MD5 校验值。 */
  md5: string;
  /** 整个文件的 SHA1 校验值。 */
  sha1: string;
  /** 文件前 10002432 字节（约 10MB）的 MD5 校验值。 */
  md5_10m: string;
}

/** 已上传完成的群聊文件分片信息。 */
export interface FinishGroupFileUploadPartPayload {
  /** 上传任务 ID，来自预上传响应。 */
  upload_id?: string;
  /** 分片序号，对应 UploadPart.index。 */
  part_index?: number;
  /** 该分块的实际大小（字节）。 */
  block_size?: string;
  /** 该分片的 MD5 校验值。 */
  md5?: string;
}

/** 已发送的群聊消息信息。 */
export interface SendGroupMessage {
  /** 消息 ID，可用于后续撤回。 */
  id: string;
  /** 发送时间，RFC3339 东八区。 */
  timestamp: string;
  /** 扩展信息。 */
  ext_info?: MessageExtInfo;
}

/** 群聊富媒体文件信息。 */
export interface UploadGroupFile {
  /** 文件唯一 ID。 */
  file_uuid: string;
  /**
   * 文件信息，用于发送消息接口的 media.file_info 字段。
   *
   * 内部为序列化的二进制数据，开发者无需解析，直接透传即可。
   */
  file_info: string;
  /** file_info 有效期（秒）。到期后需重新上传。0 表示可长期使用。 */
  ttl: number;
  /**
   * 发送消息的唯一 ID。仅 srv_send_msg=true 时返回。
   *
   * @remarks
   * srv_send_msg=false 时实际返回空字符串。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_files.post.html}
   */
  id?: string;
  /**
   * 文件下载链接（COS 预签名 GET URL），有效期与 ttl 一致。
   *
   * 仅分片上传合并（upload_id 路径）且 file_type 为图片/视频/语音时返回。
   *
   * URL 直传和文件类型(file_type=4)不返回此字段。
   *
   * @remarks
   * URL 直传且 srv_send_msg=false 时实际返回空字符串。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_files.post.html}
   */
  raw_url?: string;
}

/** 群聊富媒体分片上传信息。 */
export interface PrepareGroupFileUpload {
  /** 上传任务 ID，后续分片上传和完成合并时需携带。 */
  upload_id: string;
  /** 分块大小（字节），默认 5MB。客户端按此大小对文件分片。 */
  block_size: string;
  /** 分片列表，每个分片包含一个预签名上传 URL。 */
  parts: UploadPart[];
  /** 上传配置，由后台下发控制客户端上传行为。 */
  upload_config: UploadConfig;
}

/** 指定群的基本信息。 */
export interface GroupInfo {
  /** 群 OpenID。 */
  group_openid: string;
  /** 群名称。 */
  group_name: string;
  /** 群简介。 */
  group_finger_memo: string;
  /** 群分类。 */
  group_class_text: string;
  /** 群标签列表。 */
  group_tags: string[];
  /** 群成员人数。 */
  group_member_num: number;
}

/** 机器人在指定群中的状态信息。 */
export interface GroupBotState {
  /** 机器人的 openid。 */
  member_openid: string;
  /** 入群时间戳（RFC3339格式）。 */
  joined_at: string;
  /** 是否接收主动推送。true: 接受主动推送。 */
  allow_proactive_msg: boolean;
  /** 接受消息的类型：群内接收消息的设置：all、only_mention、mention_and_context。 */
  recv_msg_setting: 'all' | 'only_mention' | 'mention_and_context';
  /** 群成员角色 member-普通成员，owner-群主，admin-管理员。 */
  member_role: 'member' | 'owner' | 'admin';
}

/** 入群申请的审批信息。 */
export interface ReviewGroupJoinRequestPayload {
  /** 审批动作：approve 通过，decline 拒绝。 */
  op: 'approve' | 'decline';
  /** 申请ID。 */
  join_request_id?: string;
  /** 拒绝理由，op=decline 时可填。 */
  reject_reason?: string;
  /** 是否同时加入群黑名单，默认 false, action=decline 时可填。 */
  add_to_member_blacklist?: boolean;
}

/** 拉取入群申请列表时使用的分页信息。 */
export interface GetGroupJoinRequestListPayload {
  /** 分页游标，首次请求可不传或传空串。 */
  cursor?: string;
  /** 单页数量，默认 20，最大 100。 */
  limit?: number;
}

/** 入群申请。 */
export interface JoinRequest {
  /** 申请ID,需要在申请接口回传。 */
  join_request_id: string;
  /** 安全提示语，可疑消息直接返回 warning_tips，普通消息命中 sec_risk_rules 时返回 top_tips。 */
  risk_tips: string;
  /** 用户在应用/开放平台下的统一标识（如有）。 */
  union_openid: string;
  /** 申请人 openid。 */
  member_openid: string;
  /** 申请人昵称。 */
  username: string;
  /** 申请时间戳（RFC3339 格式）。 */
  apply_at: string;
  /** 申请来源：self_apply 主动申请，invited 被邀请。 */
  apply_source: 'self_apply' | 'invited';
  /** 邀请人 openid（apply_source=invited 时有效）。 */
  invited_by: string;
  /** 是否为机器人账号。 */
  bot: boolean;
  /** 用户入群验证方式。 */
  verify_info: VerifyInfo;
}

/** 入群申请列表。 */
export interface GroupJoinRequestList {
  /** 入群申请列表。 */
  list: JoinRequest[];
  /** 下一页游标，空串表示已到末页。 */
  next_cursor: string;
}

/** 定时禁言规则。 */
export interface MuteScheduleRule {
  /** 任务ID，用于标记此定时禁言任务。 */
  task_id: string;
  /** 禁言开始时间（RFC3339 格式）。 */
  start_at: string;
  /** 禁言结束时间（RFC3339 格式）。 */
  end_at: string;
  /** 此规则是否启用。 */
  enabled: boolean;
}

/** 周期禁言规则。 */
export interface MuteRecurringRule {
  /** 任务ID，用于标记此周期禁言规则。 */
  task_id: string;
  /** 生效星期几列表，取值 1~7（1=周一，7=周日），可多选。 */
  weekdays: number[];
  /** 时段开始时间，格式 HH:mm（北京时间）。 */
  start_time: string;
  /** 时段结束时间，格式 HH:mm（北京时间），若小于 start_time 表示跨天到次日。 */
  end_time: string;
  /** 此规则是否启用。 */
  enabled: boolean;
}

/** 群级禁言规则。 */
export interface GlobalMuteRule {
  /** 全员禁言模式：none 未开启，always 始终禁言，schedule 定时禁言(定时和周期性)。 */
  mode: 'none' | 'always' | 'schedule';
  /** 定时禁言规则列表（可包含多条）。 */
  schedule_rules: MuteScheduleRule[];
  /** 周期禁言规则列表（可包含多条）。 */
  recurring_rules: MuteRecurringRule[];
}

/** 群成员禁言状态。 */
export interface MemberMuteState {
  /** 被禁言成员的 openid。 */
  member_openid: string;
  /** 禁言到期时间（RFC3339 格式）。 */
  mute_expire_at: string;
  /** 被禁言成员的昵称。 */
  username: string;
  /** 用户在应用/开放平台下的统一标识（如有）。 */
  union_openid: string;
}

/** 群禁言状态。 */
export interface GroupMuteState {
  /** 群级禁言规则（全员禁言配置）。 */
  global_rule: GlobalMuteRule;
  /** 当前处于禁言中的用户列表（不含已过期）。 */
  members: MemberMuteState[];
}

/** 群成员禁言操作。 */
export interface SetMemberMuteState {
  /** 操作类型：add 增加禁言，update 更新禁言到期时间，del 解除禁言。 */
  op: 'add' | 'update' | 'del';
  /** 注意：增加/更新时，只能操作普通成员，不能操作群主，管理员，机器人 被禁言成员的 openid。 */
  member_openid: string;
  /** 禁言到期时间（RFC3339 格式），op=del 时可传空串表示立即解除禁言。 */
  mute_expire_at?: string;
}

/** 群成员禁言列表。 */
export interface SetGroupMemberMutePayload {
  /** 用户禁言列表，每项通过 op 控制增/改/删，单次设置不能超过10个。 */
  members?: SetMemberMuteState[];
}

/** 查询入群自动审批策略列表时使用的分页信息。 */
export interface GetGroupJoinApprovalStrategyListPayload {
  /** 分页游标，首次请求可不传或传空串。 */
  cursor?: string;
  /** 单页数量，默认 20，最大 100。 */
  limit?: number;
}

/** 入群自动审批策略。 */
export interface JoinApprovalStrategy {
  /** 策略 ID。 */
  strategy_id: string;
  /** 关联的群 openid 列表（创建时使用 group_openids 时返回）。 */
  group_openids: string[];
  /**
   * 关联的 QQ 群号列表（创建时使用 group_ids 时返回）。
   *
   * @remarks
   * 官方文档字段表仅将 `group_ids` 定义为 `array`，请求说明称数组元素为 `uint64`，响应示例返回脱敏字符串。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_join_approval_strategy.get.html}
   */
  group_ids: unknown[];
  /** 白名单中的号码数量（估算，可能存在少量误差）。 */
  whitelist_user_count: number;
  /** 策略是否启用，on-启用 off-关闭。 */
  is_enable: 'on' | 'off';
  /** 过期时间（RFC3339 格式）。 */
  expire_at: string;
  /** 创建时间（RFC3339 格式）。 */
  created_at: string;
  /** 最近更新时间（RFC3339 格式）。 */
  updated_at: string;
  /**
   * 策略备注。
   *
   * @remarks
   * 官方文档的响应字段表包含 `remark`，响应示例未返回该字段。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_join_approval_strategy.get.html}
   */
  remark?: string;
}

/** 生效中的入群自动审批策略列表。 */
export interface GroupJoinApprovalStrategyList {
  /** 生效中的策略列表。 */
  strategies: JoinApprovalStrategy[];
  /** 下一页游标，空串表示已到末页。 */
  next_cursor: string;
}

/** 创建入群自动审批策略时使用的信息。 */
export interface CreateGroupJoinApprovalStrategyPayload {
  /** group_openids 与 group_ids 二选一必填，同时传入或均未传入均返回错误 关联的群 openid 列表，最多 100 个，与 group_ids 互斥。 */
  group_openids?: string[];
  /** 关联的 QQ 群号列表（uint64），最多 100 个，与 group_openids 互斥。 */
  group_ids?: unknown[];
  /** 是否启用策略，on-启用 off-关闭，默认 on。 */
  is_enable?: 'on' | 'off';
  /** 过期时间（RFC3339 格式），不传默认一年过期。 */
  expire_at?: string;
  /** 策略备注，最多 255 个汉字，不必填。 */
  remark?: string;
}

/** 创建的入群自动审批策略。 */
export interface CreateGroupJoinApprovalStrategy {
  /** 服务端生成的策略 ID。 */
  strategy_id: string;
  /** 是否启用，on-启用 off-关闭。 */
  is_enable: 'on' | 'off';
  /** 过期时间（RFC3339 格式）。 */
  expire_at: string;
}

/** 入群自动审批策略的关联群增删操作。 */
export interface GroupAction {
  /** 操作类型：add 新增关联群，del 删除关联群。 */
  op: 'add' | 'del';
  /** 待操作的群 openid 列表，与 group_ids 互斥。 */
  group_openids?: string[];
  /** 待操作的 QQ 群号列表（uint64），与 group_openids 互斥。 */
  group_ids?: unknown[];
}

/** 修改入群自动审批策略时使用的信息。 */
export interface UpdateGroupJoinApprovalStrategyPayload {
  /** 是否启用策略，on-启用 off-关闭。 */
  is_enable?: 'on' | 'off';
  /** 过期时间（RFC3339 格式）。 */
  expire_at?: string;
  /** 关联群增删操作，群标识形式须与创建时一致。 */
  group_action?: GroupAction;
  /** 策略备注，最多 255 个汉字，不必填。 */
  remark?: string;
}

/** 修改后的入群自动审批策略。 */
export interface UpdateGroupJoinApprovalStrategy {
  /** 是否启用，on-启用 off-关闭。 */
  is_enable: 'on' | 'off';
  /** 过期时间（RFC3339 格式）。 */
  expire_at: string;
}

/** 入群自动审批策略的白名单号码操作。 */
export interface UpdateGroupJoinApprovalStrategyWhitelistPayload {
  /** 操作类型：add 新增号码，del 删除号码。 */
  op: 'add' | 'del';
  /** QQ 号码列表，单次最多 10000 个，使用字符串类型避免 JS 精度问题。 */
  whitelist_users: string[];
}

/** 修改后的入群自动审批策略白名单信息。 */
export interface UpdateGroupJoinApprovalStrategyWhitelist {
  /** 策略 ID。 */
  strategy_id: string;
  /** 操作后策略当前白名单号码数（估算）。 */
  whitelist_user_count: number;
  /** 策略更新时间（RFC3339 格式）。 */
  updated_at: string;
}

export default (request: TotteInstance) => {
  return {
    /**
     * 发送群聊消息
     *
     * 向指定群发送消息。支持文本/Markdown/富媒体等类型，可附带内嵌键盘。
     *
     * 注意: 群消息不支持流式参数
     *
     * 被动消息有效时间 5 分钟，每个消息最多回复 5 次
     *
     * 主动消息频控规则
     *
     * - Bot 维度（发送方）：企业认证/个人身份证认证 60/qpm，未认证 30/qpm
     *
     * - 单关系维度（接收方）：20/qpm，每个群 1 天最多接收 1000 条
     *
     * 接口频率限制：100 QPS
     *
     * @param group_openid 群 OpenID
     * @returns
     *
     * - id：消息 ID，可用于后续撤回
     * - timestamp：发送时间，RFC3339 东八区
     * - ext_info：扩展信息
     * @throws 22006 消息类型与内容不匹配
     * @throws 304004 无权限使用该ARK模板
     * @throws 304036 无Markdown模板权限
     * @throws 304061 消息内容无效
     * @throws 304064 订阅消息未授权
     * @throws 304080 文件信息无效
     * @throws 304103 消息ID已过期，不能回复
     * @throws 305007 键盘样式参数错误
     * @throws 340069 消息类型无效
     * @throws 40034004 富媒体信息转存失败
     * @throws 40034005 回复消息msg_id已过期
     * @throws 40034006 消息内容违规
     * @throws 40034008 markdown参数有空值
     * @throws 40034009 markdown参数有换行符
     * @throws 40034010 模版参数中不能含有markdown语法
     * @throws 40034011 无效的markdown内容
     * @throws 40034024 请求参数msg_id无效或越权
     * @throws 40034025 请求参数event_id无效
     * @throws 40034026 请求参数event_id已过期
     * @throws 40034027 该事件不支持回复消息
     * @throws 40034029 内联键盘行/列超限
     * @throws 40034100 主动消息发送超过频控限制
     * @throws 40034101 机器人非群成员
     * @throws 40034105 主动消息发送失败，无权限
     * @throws 40034106 消息不支持该指令类型
     * @throws 40034108 指令参数长度超限
     * @throws 40034109 指令参数解析失败
     * @throws 40034124 markdown消息参数错误
     * @throws 40034127 无markdown模板权限
     * @throws 40034128 被动回复时间或次数超限
     * @throws 40054002 机器人被禁言
     * @throws 40054003 机器人不是群成员
     * @throws 40054005 消息被去重
     * @throws 40054007 消息长度超限
     * @throws 40054010 不允许发送URL
     * @throws 40054016 机器人已下线
     * @throws 50055001 消息发送异常，请稍后重试
     * @throws 50055006 ARK消息发送异常，请稍后重试
     */
    sendGroupMessage(group_openid: string, message: SendGroupMessagePayload) {
      return request.post<SendGroupMessage>(`/v2/groups/${group_openid}/messages`, message);
    },

    /**
     * 撤回群聊消息
     *
     * 撤回群消息。发送超过 2 分钟的消息不可撤回。
     *
     * 成功返回 HTTP 200，无响应体。
     *
     * 发送超出 2 分钟的消息不可撤回。
     *
     * 机器人如果是群管理员，可以撤回机器人自己的消息以及普通群成员的消息，群成员的消息ID从群消息事件GROUP_AT_MESSAGE_CREATE或GROUP_MESSAGE_CREATE里，d.id这个字段中获取。
     *
     * 机器人如果是普通成员，只能撤回机器人自己发送的消息，消息ID可以从消息发送接口响应里获取。
     *
     * 接口频率限制：10 QPS
     *
     * @remarks
     * 官方文档说明成功返回 HTTP 200，无响应体，文档同一页面的响应示例为 `{}`。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_messages_message_id.delete.html}
     *
     * @param group_openid 群 OpenID
     * @param message_id 消息 ID
     * @throws 40061001 请求参数无效
     * @throws 40062003 无操作权限
     * @throws 40064004 已超出消息撤回时限
     * @throws 50065001 消息撤回失败，请稍后重试
     */
    recallGroupMessage(group_openid: string, message_id: string) {
      return request.delete(`/v2/groups/${group_openid}/messages/${message_id}`);
    },

    /**
     * 群聊富媒体上传
     *
     * 上传图片/视频/语音到群聊，返回 file_info 用于发送消息接口的 media 字段。
     *
     * srv_send_msg=true 时直接发送消息并占用主动消息频次，false 时仅返回 file_info。
     *
     * 用群接口上传的文件仅能发送到群聊。
     *
     * 文件类型与大小限制:
     *
     * - 1=图片(png/jpg): 软限制 20MB, 硬限制 200MB
     * - 2=视频(mp4): 软限制 30MB, 硬限制 200MB
     * - 3=语音(silk): 软限制 20MB, 硬限制 200MB
     * - 4=文件: 软限制 200MB, 硬限制 200MB
     *
     * 超过软限制会降级为文件类型上传，超过硬限制会报错。
     *
     * 支持两种上传方式：
     *
     * - URL 上传：传入 url，平台下载转存
     * - 分片上传合并：先通过 upload_prepare + upload_part_finish 完成分片上传，再携带 upload_id 调用本接口完成合并
     *
     * 推荐使用分片上传，流程如下：
     *
     * 1. 调用 upload_prepare 获取 upload_id、block_size 和各分片预签名 URL
     * 2. 按 block_size 将文件分片，逐片 HTTP PUT 到对应的预签名 URL
     * 3. 每片 PUT 成功后调用 upload_part_finish 通知服务端该分片完成
     * 4. 全部分片完成后，携带 upload_id 调用本接口完成合并，返回 file_info
     *
     * 接口频率限制：50 QPS
     *
     * @param group_openid 群 OpenID
     * @returns
     *
     * - file_uuid：文件唯一 ID
     * - file_info：文件信息，用于发送消息接口的 media.file_info 字段。内部为序列化的二进制数据，开发者无需解析，直接透传即可
     * - ttl：file_info 有效期（秒）。到期后需重新上传。0 表示可长期使用
     * - id：发送消息的唯一 ID。仅 srv_send_msg=true 时返回
     * - raw_url：文件下载链接（COS 预签名 GET URL），有效期与 ttl 一致。仅分片上传合并（upload_id 路径）且 file_type 为图片/视频/语音时返回，URL 直传和文件类型(file_type=4)不返回此字段
     * @throws 850018 群被禁言或者机器人被禁言
     * @throws 850019 不支持的文件格式
     * @throws 850026 下载原始文件失败
     * @throws 850031 上传文件超过大小限制
     * @throws 850027 发送数据超时
     * @throws 10000 不支持的操作
     * @throws 40093001 文件上传失败，请重试
     * @throws 40093002 超过今天发送文件容量上限
     */
    uploadGroupFile(group_openid: string, file: UploadGroupFilePayload) {
      return request.post<UploadGroupFile>(`/v2/groups/${group_openid}/files`, file);
    },

    /**
     * 群聊富媒体预上传
     *
     * 大文件分片上传前的准备工作。返回 upload_id、分片预签名 URL 和上传配置。
     *
     * 后续将文件按 block_size 分片，逐片 PUT 到预签名 URL，每片完成后调用分片完成接口。
     *
     * 大文件分片上传第一步。
     *
     * 传入文件大小、MD5/SHA1 校验值，服务端返回 upload_id 和各分片预签名 URL。
     *
     * 接口频率限制：10 QPS
     *
     * @param group_id 群 OpenID
     * @returns
     *
     * - upload_id：上传任务 ID，后续分片上传和完成合并时需携带
     * - block_size：分块大小（字节），默认 5MB。客户端按此大小对文件分片
     * - parts：分片列表，每个分片包含一个预签名上传 URL
     * - upload_config：上传配置，由后台下发控制客户端上传行为
     * @throws 850018 群被禁言或者机器人被禁言
     * @throws 850019 不支持的文件格式
     * @throws 850026 下载原始文件失败
     * @throws 850031 上传文件超过大小限制
     * @throws 850027 发送数据超时
     * @throws 10000 不支持的操作
     * @throws 40093001 文件上传失败，请重试
     */
    prepareGroupFileUpload(group_id: string, file: PrepareGroupFileUploadPayload) {
      return request.post<PrepareGroupFileUpload>(`/v2/groups/${group_id}/upload_prepare`, file);
    },

    /**
     * 群聊分片上传完成
     *
     * 通知服务端某个分片已上传完成。
     *
     * 需在每片 PUT 成功后调用。
     *
     * 全部分片完成后，用 upload_id 作为 MediaUpload 的 upload_id 字段调一次上传接口完成合并
     *
     * 分片上传第二步。
     *
     * 每个分片 PUT 到预签名 URL 成功后调用，通知服务端该分片已上传完成。
     *
     * 全部分片完成后，携带 upload_id 调用 /v2/groups/{group_openid}/files 完成合并。
     *
     * 接口频率限制：10 QPS
     *
     * @remarks
     * 官方文档将响应标记为「无」，文档同一页面的响应示例为 `{}`。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_id_upload_part_finish.post.html}
     *
     * @param group_id 群 OpenID
     * @throws 850018 群被禁言或者机器人被禁言
     * @throws 850019 不支持的文件格式
     * @throws 850026 下载原始文件失败
     * @throws 850031 上传文件超过大小限制
     * @throws 850027 发送数据超时
     * @throws 10000 不支持的操作
     * @throws 40093001 文件上传失败，请重试
     * @throws 40093002 超过今天发送文件容量上限
     */
    finishGroupFileUploadPart(group_id: string, part: FinishGroupFileUploadPartPayload) {
      return request.post(`/v2/groups/${group_id}/upload_part_finish`, part);
    },

    /**
     * 获取群基本信息
     *
     * 获取指定群的基本信息。
     *
     * 接口频率限制：30 QPM
     *
     * @param group_openid 群 OpenID
     * @returns
     *
     * - group_openid：群 OpenID
     * - group_name：群名称
     * - group_finger_memo：群简介
     * - group_class_text：群分类
     * - group_tags：群标签列表
     * - group_member_num：群成员人数
     * @throws 11253 应用无接口访问权限
     */
    getGroupInfo(group_openid: string) {
      return request.get<GroupInfo>(`/v2/groups/${group_openid}/info`);
    },

    /**
     * 获取机器人群内状态
     *
     * 获取机器人在指定群中的状态信息。
     *
     * 接口频率限制：30 QPM
     *
     * @param group_openid 群 OpenID
     * @returns
     *
     * - member_openid：机器人的 openid
     * - joined_at：入群时间戳（RFC3339格式）
     * - allow_proactive_msg：是否接收主动推送。true: 接受主动推送
     * - recv_msg_setting：接受消息的类型：群内接收消息的设置：all、only_mention、mention_and_context
     * - member_role：群成员角色 member-普通成员，owner-群主，admin-管理员
     * @throws 11253 应用无接口访问权限
     */
    getGroupBotState(group_openid: string) {
      return request.get<GroupBotState>(`/v2/groups/${group_openid}/bot_state`);
    },

    /**
     * 入群申请审批
     *
     * 审批入群申请：approve 通过，decline 拒绝。
     *
     * 机器人需拥有群管理员身份。
     *
     * 接口频率限制：60 QPM
     *
     * @param group_openid 群OpenID
     * @param member_openid 成员OpenID
     * @remarks
     * QQ 客户端无法将机器人设置为群管理员，实际请求返回 `11703 not group admin`。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_approval_join_request_member_openid.post.html}
     */
    reviewGroupJoinRequest(group_openid: string, member_openid: string, payload: ReviewGroupJoinRequestPayload) {
      return request.post(`/v2/groups/${group_openid}/approval_join_request/${member_openid}`, payload);
    },

    /**
     * 入群申请列表拉取
     *
     * 拉取入群申请列表，支持分页。
     *
     * 机器人需拥有群管理员身份。
     *
     * 接口频率限制：30 QPM
     *
     * @param group_openid 群OpenID
     * @returns
     *
     * - list：入群申请列表
     * - next_cursor：下一页游标，空串表示已到末页
     * @remarks
     * QQ 客户端无法将机器人设置为群管理员，实际请求返回 `11703 not group admin`。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_join_request_list.get.html}
     */
    getGroupJoinRequestList(group_openid: string, payload: GetGroupJoinRequestListPayload = {}) {
      return request.get<GroupJoinRequestList>(`/v2/groups/${group_openid}/join_request_list`, payload);
    },

    /**
     * 查询群禁言状态
     *
     * 查询群禁言状态，包含全员禁言模式与成员级禁言列表。
     *
     * 机器人需拥有群管理员身份。
     *
     * 接口频率限制：30 QPM
     *
     * @param group_openid 群OpenID
     * @returns
     *
     * - global_rule：群级禁言规则（全员禁言配置）
     * - members：当前处于禁言中的用户列表（不含已过期）
     * @remarks
     * QQ 客户端无法将机器人设置为群管理员，实际请求返回 `11703 not group admin`。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_restrict_chat_setting.get.html}
     */
    getGroupMuteState(group_openid: string) {
      return request.get<GroupMuteState>(`/v2/groups/${group_openid}/restrict_chat_setting`);
    },

    /**
     * 设置群成员禁言
     *
     * 设置群成员级禁言。
     *
     * 机器人需拥有群管理员身份，最大禁言时长为 30 天。
     *
     * 接口频率限制：60 QPM
     *
     * @param group_openid 群OpenID
     * @remarks
     * QQ 客户端无法将机器人设置为群管理员，实际请求返回 `11703 not group admin`。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_restrict_chat_setting.post.html}
     */
    setGroupMemberMute(group_openid: string, payload: SetGroupMemberMutePayload) {
      return request.post(`/v2/groups/${group_openid}/restrict_chat_setting`, payload);
    },

    /**
     * 查询入群自动审批策略列表
     *
     * 查询当前生效中的策略列表，按创建时间倒序，支持分页。
     *
     * 接口频率限制：60 QPM
     *
     * @returns
     *
     * - strategies：生效中的策略列表
     * - next_cursor：下一页游标，空串表示已到末页
     */
    getGroupJoinApprovalStrategyList(payload: GetGroupJoinApprovalStrategyListPayload = {}) {
      return request.get<GroupJoinApprovalStrategyList>('/v2/groups/join_approval_strategy', payload);
    },

    /**
     * 创建入群自动审批策略
     *
     * 创建入群自动审批策略，指定关联群号。strategy_id 由服务端生成。一个机器人最多 20 个策略。
     *
     * 设置的规则只有当机器人拥有群管理员身份时才会生效。
     *
     * 接口频率限制：60 QPM
     *
     * @returns
     *
     * - strategy_id：服务端生成的策略 ID
     * - is_enable：是否启用，on-启用 off-关闭
     * - expire_at：过期时间（RFC3339 格式）
     */
    createGroupJoinApprovalStrategy(payload: CreateGroupJoinApprovalStrategyPayload) {
      return request.post<CreateGroupJoinApprovalStrategy>('/v2/groups/join_approval_strategy', payload);
    },

    /**
     * 删除入群自动审批策略
     *
     * 删除指定的入群自动审批策略。
     *
     * 接口频率限制：60 QPM
     *
     * @remarks
     * 官方文档将响应标记为「无」，文档同一页面的响应示例为 `{}`。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_join_approval_strategy_strategy_id.delete.html}
     *
     * @param strategy_id 策略 ID
     */
    deleteGroupJoinApprovalStrategy(strategy_id: string) {
      return request.delete(`/v2/groups/join_approval_strategy/${strategy_id}`);
    },

    /**
     * 修改入群自动审批策略
     *
     * 修改策略的生效状态、失效时间或增删关联群。
     *
     * 接口频率限制：60 QPM
     *
     * @param strategy_id 策略 ID
     * @returns
     *
     * - is_enable：是否启用，on-启用 off-关闭
     * - expire_at：过期时间（RFC3339 格式）
     */
    updateGroupJoinApprovalStrategy(strategy_id: string, payload: UpdateGroupJoinApprovalStrategyPayload) {
      return request.patch<UpdateGroupJoinApprovalStrategy>(
        `/v2/groups/join_approval_strategy/${strategy_id}`,
        payload,
      );
    },

    /**
     * 执行入群自动审批策略
     *
     * 对策略关联的全部群发起全量扫描，命中白名单号码的入群申请自动审批通过。异步执行，约 10 分钟完成。
     *
     * 接口频率限制：60 QPM
     *
     * @remarks
     * 官方文档将响应标记为「无」，文档同一页面的响应示例为 `{}`。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_join_approval_strategy_strategy_id_execute.post.html}
     *
     * @param strategy_id 策略 ID
     */
    executeGroupJoinApprovalStrategy(strategy_id: string) {
      return request.post(`/v2/groups/join_approval_strategy/${strategy_id}/execute`);
    },

    /**
     * 修改入群自动审批策略的白名单号码
     *
     * 对指定策略批量新增或删除白名单 QQ 号码，单次最多 10000 个，号码上限 10W。
     *
     * 接口频率限制：60 QPM
     *
     * @param strategy_id 策略 ID
     * @returns
     *
     * - strategy_id：策略 ID
     * - whitelist_user_count：操作后策略当前白名单号码数（估算）
     * - updated_at：策略更新时间（RFC3339 格式）
     */
    updateGroupJoinApprovalStrategyWhitelist(
      strategy_id: string,
      payload: UpdateGroupJoinApprovalStrategyWhitelistPayload,
    ) {
      return request.post<UpdateGroupJoinApprovalStrategyWhitelist>(
        `/v2/groups/join_approval_strategy/${strategy_id}/whitelist_users`,
        payload,
      );
    },
  };
};
