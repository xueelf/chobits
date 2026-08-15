import { type EmbusInstance } from 'embus';

import bot from '#/api/bot';
import groups from '#/api/groups';
import interactions from '#/api/interactions';
import users from '#/api/users';

export const OPEN_API_ORIGIN = 'https://api.bot.qq.com';

/**
 * Markdown 消息内容。
 *
 * @remarks
 * 消息接口的官方字段表未列出 params，并将 custom_template_id 标记为已废弃，Markdown 文档及实际请求仍使用这两个字段。
 *
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_messages.post.html}
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_messages.post.html}
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/type/markdown.html}
 */
export interface MessageMarkdown {
  /**
   * @deprecated 平台 Markdown 模板 ID。使用模板时填写，非模板不传。
   */
  template_id?: number;
  /** Markdown 内容。支持的格式参考文档：Markdown。 */
  content?: string;
  /**
   * @deprecated 自定义模板 ID，与 template_id 二选一。
   */
  custom_template_id?: string;
  /** 是否校验图片转存结果，当为true时，如果出现图片转存失败，则会返回错误，消息不会发送。默认为false。 */
  force_verify_image_resource?: boolean;
  /** {key: xxx, values: xxx}，模版内变量与填充值的kv映射。 */
  params?: MessageMarkdownParams[];
}

/** 用户入群验证方式。 */
export interface VerifyInfo {
  /** 入群验证方式：verify_message / admin_review_qa。 */
  method: 'verify_message' | 'admin_review_qa';
  /** 验证消息内容，仅 auth_type=verify_message 时可能携带。 */
  verify_message?: string;
  /** 问答列表，仅 auth_type=admin_review_qa 时可能携带。 */
  review_qa_list?: ReviewQA[];
}

/** 入群验证问答。 */
export interface ReviewQA {
  /** 管理员设置的问题。 */
  question: string;
  /** 申请人填写的答案。 */
  answer: string;
}

/** 模板内变量与填充值的 kv 映射。 */
export interface MessageMarkdownParams {
  /** markdown 模版 key。 */
  key?: string;
  /** markdown 模版 key 对应的 values，列表长度大小为 1 代表单 value 值，长度大于 1 则为列表类型的参数 values 传参数。 */
  values?: string[];
}

/** 消息中的内嵌键盘。 */
export interface Keyboard {
  /** 内嵌键盘模板 ID。使用平台预设模板时填写此字段。 */
  id?: string;
  /** 自定义键盘布局。与 id 互斥，用于自定义按钮。 */
  content?: KeyboardContent;
}

/** 内嵌键盘的自定义布局。 */
export interface KeyboardContent {
  /** 按钮行列表。 */
  rows?: Row[];
}

/** 内嵌键盘中的一行按钮。 */
export interface Row {
  /** 行内按钮，从左到右排列。 */
  buttons?: Button[];
}

/** 内嵌键盘中的按钮。 */
export interface Button {
  /** 按钮 ID。同一键盘内唯一。 */
  id?: string;
  /** 按钮渲染。 */
  render_data?: RenderData;
  /** 按钮点击行为。 */
  action?: Action;
}

/** 按钮的文字和样式。 */
export interface RenderData {
  /** 按钮文字，最多 10 字符。 */
  label?: string;
  /** 点击后文字，不传则保持不变。 */
  visited_label?: string;
  /** 0=灰线框, 1=蓝线框, 2=白字, 3=蓝底白字。 */
  style?: 0 | 1 | 2 | 3;
}

/** 按钮被点击时执行的操作。 */
export interface Action {
  /**
   * 0：跳转按钮：http 或 小程序
   *
   * 1：回调按钮：回调后台接口, data 传给后台
   *
   * 2：指令按钮：自动在输入框插入 @bot data
   */
  type?: 0 | 1 | 2;
  /** 操作权限。 */
  permission?: Permission;
  /** 回调数据。type=1/2 时必填。 */
  data?: string;
  /**
   * @deprecated 可点击次数限制。0=无限。
   */
  click_limit?: number;
  /** 版本过低时提示文案。 */
  unsupport_tips?: string;
  /**
   * 指令按钮可用，点击按钮后直接自动发送 data，仅单聊可用，默认 false。
   *
   * 支持版本 8983。
   */
  enter?: boolean;
  /** 指令按钮可用，指令是否带引用回复本消息，默认 false。支持版本 8983。 */
  reply?: boolean;
  /**
   * 本字段仅在指令按钮下有效，设置后会忽略 action.enter 配置。
   *
   * 设置为 1 时，点击按钮自动唤起手Q选图器，其他值暂无效果。
   *
   * 仅支持手机端版本 8983+ 的单聊场景，桌面端不支持。
   */
  anchor?: 1;
}

/** 按钮的操作权限。 */
export interface Permission {
  /** 0=指定用户, 1=管理员, 2=所有人。 */
  type?: 0 | 1 | 2;
  /** 有权限的用户 id 的列表。 */
  specify_user_ids?: string[];
}

/**
 * 富媒体消息使用的文件信息。
 *
 * @remarks
 * 单聊消息接口将 file_info 来源写为群聊上传接口，富媒体文档则说明单聊和群聊上传的文件不能跨场景使用。
 *
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_messages.post.html}
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/rich-media.html}
 */
export interface MediaInfo {
  /** 文件数据。来自文件上传接口返回值。 */
  file_info?: string;
}

/** 引用消息的信息。 */
export interface MessageReference {
  /**
   * 被引用消息 ID，例如REFIDX_xxxxxx
   *
   * - 非机器人发的消息，从消息事件的MessageScene的ext数组，msg_idx字段中获取
   * - 机器人自己发的消息，从发消息请求响应ext_info.ref_idx获取
   */
  message_id?: string;
  /**
   * 是否忽略获取引用消息详情错误，默认否。
   *
   * @deprecated 当前单聊和群聊消息接口已经移除该字段。
   *
   * {@link https://github.com/tencent-connect/bot-docs/blob/a2a8c47dca57df09a258cbe9f87600b0d80945bc/docs/develop/api-v2/server-inter/message/template/model.md}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_messages.post.html}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_messages.post.html}
   */
  ignore_get_message_error?: boolean;
}

/** 消息的扩展信息。 */
export interface MessageExtInfo {
  /** 引用消息索引。对应消息时间ext里的msg_idx与ref_msg_idx。 */
  ref_idx?: string;
}

/** ARK 对象中的键值对。 */
export interface ArkObjKV {
  /** key。 */
  key: string;
  /** value。 */
  value: string;
}

/** ARK 模板中的对象。 */
export interface ArkObj {
  /** ark objkv 列表。 */
  obj_kv: ArkObjKV[];
}

/** ARK 模板中的键值对。 */
export interface ArkKV {
  /** key。 */
  key: string;
  /** value。 */
  value?: string;
  /** ark obj 类型的列表。 */
  obj?: ArkObj[];
}

/**
 * ARK 消息内容。
 *
 * @remarks
 * 消息接口的官方字段表未列出 ark，接口说明、内容互斥提示、错误码及官方文档历史仍包含 ARK。
 *
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_messages.post.html}
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_messages.post.html}
 * {@link https://github.com/tencent-connect/bot-docs/blob/main/docs/develop/api-v2/server-inter/message/type/ark.md}
 * {@link https://github.com/tencent-connect/bot-docs/blob/main/docs/develop/api-v2/server-inter/message/template/model.md}
 */
export interface Ark {
  /** 模版 id，管理端可获得或内邀申请获得。 */
  template_id: number;
  /** {key: xxx, value: xxx}，模版内变量与填充值的 kv 映射。 */
  kv: ArkKV[];
}

interface MessagePayload {
  /**
   * 发送单聊消息：
   *
   * 被动回复的消息 ID。从 C2C_MESSAGE_CREATE 等事件的 d.id 获取，5 分钟内有效。
   * 发送群聊消息：
   *
   * 被动回复的消息 ID。从 GROUP_AT_MESSAGE_CREATE 等事件的 d.id 获取，5 分钟内有效。
   *
   * @remarks
   * 单聊消息的官方接口文档中，msg_id 字段说明标注为 5 分钟，文档同一页面的接口说明和消息收发概述文档标注为 60 分钟。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_messages.post.html}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/overview.html}
   */
  msg_id?: string;
  /**
   * 发送单聊消息：
   *
   * 被动回复的事件 ID。从事件最外层的id获取。与 msg_id 二选一，支持事件："INTERACTION_CREATE"、"C2C_MSG_RECEIVE"、"FRIEND_ADD"。
   *
   * 发送群聊消息：
   *
   * 被动回复的事件 ID。从事件最外层的id获取。与 msg_id 二选一，支持事件："INTERACTION_CREATE"、"GROUP_ADD_ROBOT"、"GROUP_MSG_RECEIVE"。
   */
  event_id?: string;
  /**
   * 回复消息的序号，与 msg_id 联合使用，避免相同消息 id 回复重复发送，不填默认是 1。
   *
   * 相同的 msg_id + msg_seq 重复发送会失败。
   */
  msg_seq?: number;
  /** 引用回复。填写后以引用形式展示，关联上下文。 */
  message_reference?: MessageReference;
  /** 指明发送消息为互动召回消息，与 msg_id，event_id 互斥使用。 */
  is_wakeup?: boolean;
  /**
   * @deprecated 暂不支持。当前单聊和群聊消息接口已经移除该字段。
   *
   * 图片、视频、语音、文件等富媒体需先上传获取 file_info，再通过发消息接口（msg_type=7）携带 media.file_info 发送。
   *
   * {@link https://github.com/tencent-connect/bot-docs/blob/e603b92cfc77487e5415e32c6eee6bf88bd05f5c/docs/develop/api-v2/server-inter/message/send-receive/send.md}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/overview.html}
   */
  image?: string;
}

interface KeyboardMessagePayload extends MessagePayload {
  /** 内嵌键盘。短形式只传 id，长形式传 content.rows。 */
  keyboard?: Keyboard;
}

/** 文本消息 (msg_type=0)。 */
export interface TextMessage extends KeyboardMessagePayload {
  /** 消息类型。决定哪个内容字段生效: 0=纯文本(content) 2=Markdown(markdown) 6=输入中状态（input_notify) 7=富媒体(media)。 */
  msg_type?: 0;
  /** 文本内容。msg_type=0 时为全文 注意: 传了 markdown 后此字段必须为空。 */
  content: string;
}

/** Markdown 消息 (msg_type=2)。 */
export interface MarkdownMessage extends KeyboardMessagePayload {
  /** 消息类型。决定哪个内容字段生效: 0=纯文本(content) 2=Markdown(markdown) 6=输入中状态（input_notify) 7=富媒体(media)。 */
  msg_type: 2;
  /** Markdown 消息。msg_type=2 时必填 注意: 填写此字段后 content/ark 必须全为空。 */
  markdown: MessageMarkdown;
}

/** ARK 消息（msg_type=3）。 */
export interface ArkMessage extends KeyboardMessagePayload {
  /** 消息类型，3=ARK 消息。 */
  msg_type: 3;
  /** ARK 消息。 */
  ark: Ark;
}

/** 富媒体消息 (msg_type=7)。 */
export interface MediaMessage extends KeyboardMessagePayload {
  /** 消息类型。决定哪个内容字段生效: 0=纯文本(content) 2=Markdown(markdown) 6=输入中状态（input_notify) 7=富媒体(media)。 */
  msg_type: 7;
  /** 富媒体消息。msg_type=7 时填写。 */
  media: MediaInfo;
  /**
   * @deprecated 当前单聊和群聊的富媒体消息示例不再传入该字段。
   *
   * @remarks
   * 官方文档历史要求 msg_type=7 时填写 content，当前消息接口仅为 msg_type=0 定义该字段，富媒体示例也未传入。
   *
   * {@link https://github.com/tencent-connect/bot-docs/blob/645787a45937e5d9c4f0f61afefdffde0f38696e/docs/develop/api-v2/server-inter/message/send-receive/send.md}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_messages.post.html}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_messages.post.html}
   */
  content?: string;
}

/** 富媒体分片上传的分片信息。 */
export interface UploadPart {
  /**
   * 分片序号，从 0 开始。
   *
   * @remarks
   * 官方文档将首个分片序号定义为 0，当前单聊和群聊预上传接口均使用 1 作为首个分片序号。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_id_upload_prepare.post.html}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_id_upload_prepare.post.html}
   */
  index: number;
  /** 预签名上传 URL，客户端通过 HTTP PUT 将分片数据上传到此 URL。 */
  presigned_url: string;
  /** 该分块的大小（字节）。 */
  block_size: string;
}

/** 富媒体分片上传配置。 */
export interface UploadConfig {
  /** 上传并发数，默认 1。 */
  concurrency: number;
  /** 重试超时时间（秒），默认 300（5分钟）。 */
  retry_timeout: number;
  /** 重试延迟（秒），默认 1。 */
  retry_delay: number;
}

export type Operations = ReturnType<typeof users> &
  ReturnType<typeof groups> &
  ReturnType<typeof bot> &
  ReturnType<typeof interactions>;

export default (request: EmbusInstance) => ({
  ...bot(request),
  ...users(request),
  ...groups(request),
  ...interactions(request),
});
