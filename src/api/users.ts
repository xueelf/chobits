import { type EmbusInstance } from 'embus';

import {
  type ArkMessage,
  type MarkdownMessage,
  type MediaMessage,
  type MessageExtInfo,
  type MessageReference,
  type TextMessage,
  type UploadConfig,
  type UploadPart,
} from '#/api/index';

/** 输入状态通知。 */
export interface InputNotify {
  /** 填1。 */
  input_type?: 1;
  /** 状态持续时间，最长60s。 */
  input_second?: number;
}

/** 输入状态通知 (msg_type=6)。 */
export interface UserInputNotifyMessage {
  /** 消息类型。决定哪个内容字段生效: 0=纯文本(content) 2=Markdown(markdown) 6=输入中状态（input_notify) 7=富媒体(media)。 */
  msg_type: 6;
  /** 输入中状态，msg_type=6时使用。 */
  input_notify: InputNotify;
  /**
   * 被动回复的消息 ID。从 C2C_MESSAGE_CREATE 等事件的 d.id 获取，5 分钟内有效。
   *
   * @remarks
   * 单聊消息的官方接口文档中，msg_id 字段说明标注为 5 分钟，文档同一页面的接口说明和消息收发概述文档标注为 60 分钟。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_messages.post.html}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/overview.html}
   */
  msg_id?: string;
  /** 被动回复的事件 ID。从事件最外层的id获取。与 msg_id 二选一，支持事件："INTERACTION_CREATE"、"C2C_MSG_RECEIVE"、"FRIEND_ADD"。 */
  event_id?: string;
  /** 回复消息的序号，与 msg_id 联合使用，避免相同消息 id 回复重复发送，不填默认是 1。相同的 msg_id + msg_seq 重复发送会失败。 */
  msg_seq?: number;
  /** 引用回复。填写后以引用形式展示，关联上下文。 */
  message_reference?: MessageReference;
  /** 指明发送消息为互动召回消息，与 msg_id，event_id 互斥使用。 */
  is_wakeup?: boolean;
}

/** 向指定用户发送的私聊消息。 */
export type SendUserMessagePayload = TextMessage | MarkdownMessage | ArkMessage | UserInputNotifyMessage | MediaMessage;

/** 流式发送的单聊消息分片。 */
export interface SendUserStreamMessagePayload {
  /**
   * 输入模式。
   *
   * append（默认）：ContentRaw 拼接到 Pending。
   *
   * replace：ContentRaw 为当前全量正文，须以上游已下发前缀 SentContent 开头，合并后 Pending 仅存未下发后缀。
   */
  input_mode?: 'append' | 'replace';
  /** 输入状态。1=生成中，10=生成结束。 */
  input_state?: 1 | 10;
  /** 分片序号，从0递增。 */
  index?: number;
  /** 内容格式类型，text：文本消息，markdown：Markdown消息。 */
  content_type?: 'text' | 'markdown';
  /**
   * Markdown 格式的文本内容。
   *
   * @remarks
   * 官方将 content_type 定义为 text 或 markdown，但 content_raw 仅说明 Markdown，示例也只使用 markdown。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_stream_messages.post.html}
   */
  content_raw?: string;
  /** 被动回复事件 ID，与 msg_id 二选一。 */
  event_id?: string;
  /** 被动回复消息 ID，与 event_id 二选一。 */
  msg_id?: string;
  /** 流式消息 ID。第一条由服务端生成并返回，后续分片需携带上一分片返回的 id。 */
  stream_msg_id?: string;
  /** 消息序号，用于去重。 */
  msg_seq?: number;
  /** 是否为召回消息。true 时不校验 msg_id/event_id 有效期。 */
  is_wakeup?: boolean;
}

/**
 * 单聊富媒体文件的上传信息。
 *
 * @remarks
 * 富媒体概述中的格式范围比文件限制和单聊上传接口更宽，图片另含 gif/webp/bmp，语音另含 mp3/wav/ogg。
 *
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/rich-media.html}
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_files.post.html}
 */
export interface UploadUserFilePayload {
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
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_files.post.html}
   */
  file_data?: unknown;
}

/** 单聊富媒体分片上传前的文件信息。 */
export interface PrepareUserFileUploadPayload {
  /** 业务类型。1=图片, 2=视频, 3=语音, 4=文件。 */
  file_type: 1 | 2 | 3 | 4;
  /** 文件大小（字节）。 */
  file_size: string;
  /** 文件名。 */
  file_name: string;
  /** 整个文件的 MD5。 */
  md5: string;
  /** 整个文件的 SHA1。 */
  sha1: string;
  /** 文件前 10002432 字节（约 10MB）的 MD5 校验值。 */
  md5_10m: string;
}

/** 已上传完成的单聊文件分片信息。 */
export interface FinishUserFileUploadPartPayload {
  /** 上传任务 ID。 */
  upload_id?: string;
  /** 分片序号。 */
  part_index?: number;
  /** 分块大小（字节）。 */
  block_size?: string;
  /** 分片 MD5。 */
  md5?: string;
}

/** 已发送的单聊消息信息。 */
export interface UserMessage {
  /** 消息 ID，可用于后续撤回。 */
  id: string;
  /** 发送时间，RFC3339 东八区。 */
  timestamp: string;
  /** 扩展信息。 */
  ext_info?: MessageExtInfo;
}

/** 已发送的流式单聊消息信息。 */
export interface UserStreamMessage {
  /** 消息ID。首条返回 stream_msg_id，用于后续分片。 */
  id: string;
  /** 消息发送时间，RFC3339 格式。 */
  timestamp: string;
  /**
   * 扩展信息。
   *
   * ref_idx: 引用消息索引 扩展信息。
   */
  ext_info?: MessageExtInfo;
  /** 流式消息剩余长度（字符数）。 */
  remain_msg_len?: number;
}

/** 单聊富媒体文件信息。 */
export interface UserFile {
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
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_files.post.html}
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
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_files.post.html}
   */
  raw_url?: string;
}

/** 单聊富媒体分片上传信息。 */
export interface UserFileMultipartUpload {
  /** 上传任务 ID，后续分片上传和完成合并时需携带。 */
  upload_id: string;
  /** 分块大小（字节），默认 5MB。客户端按此大小对文件分片。 */
  block_size: string;
  /** 分片列表，每个分片包含一个预签名上传 URL。 */
  parts: UploadPart[];
  /** 上传配置，由后台下发控制客户端上传行为。 */
  upload_config: UploadConfig;
}

export default (request: EmbusInstance) => {
  return {
    /**
     * 发送单聊消息
     *
     * 向指定用户发送私聊消息。
     *
     * 被动消息有效时间 60 分钟，每个消息最多回复 4 次
     *
     * 主动消息频控规则:
     *
     * - Bot 维度（发送方）：企业认证/个人身份证认证 10/qps，未认证 5/qps 且 30/qpm
     *
     * - 单关系维度（接收方）：20/qpm，每个好友 1 天最多接收 1000 条
     *
     * 互动召回消息：在用户主动与机器人对话之后，机器人在未来 30 天内可下发互动召回消息给用户（消息类型与当前机器人拥有的消息类型权限一致），每个周期内可下发一条。
     *
     * 分别为：当天、1 - 3 天、3 - 7 天、7 - 30 天，合计：4 个周期。
     *
     * 在发消息接口中使用 is_wakeup 字段声明使用该能力。
     *
     * 接口频率限制：100 QPS，包括主动、被动等所有消息类型
     *
     * @param user_openid 用户 OpenID
     * @returns
     *
     * - id：消息 ID，可用于后续撤回
     * - timestamp：发送时间，RFC3339 东八区
     * - ext_info：扩展信息
     * @throws 22006 消息类型与内容不匹配
     * @throws 50059 输入类型错误
     * @throws 304004 无权限使用该ARK模板
     * @throws 304061 消息内容无效
     * @throws 304062 订阅按钮数量达到上限
     * @throws 304064 订阅消息未授权
     * @throws 304080 文件信息无效
     * @throws 304103 消息ID已过期，不能回复
     * @throws 340067 获取机器人信息失败
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
     * @throws 40034105 主动消息发送失败，无权限
     * @throws 40034106 消息不支持该指令类型
     * @throws 40034108 指令参数长度超限
     * @throws 40034109 指令参数解析失败
     * @throws 40034122 召回消息已达区间上限
     * @throws 40034123 不支持召回消息
     * @throws 40034124 markdown消息参数错误
     * @throws 40034127 无markdown模板权限
     * @throws 40034128 被动回复时间或次数超限
     * @throws 40054004 无好友关系
     * @throws 40054005 消息被去重
     * @throws 40054006 验证好友关系失败
     * @throws 40054007 消息长度超限
     * @throws 40054013 用户拒收消息
     * @throws 40054016 机器人已下线
     * @throws 40054018 消息过长或异常
     * @throws 50055002 消息发送异常，请稍后重试
     */
    sendUserMessage(user_openid: string, payload: SendUserMessagePayload): Promise<UserMessage> {
      return request.post(`/v2/users/${user_openid}/messages`, payload);
    },

    /**
     * 流式发送单聊消息
     *
     * 流式分批发送单聊消息。
     *
     * 每个分片使用相同 stream_msg_id，index 从0递增。
     *
     * 支持 markdown 内容格式。
     *
     * 接口频率限制：50 QPS
     *
     * @param user_openid 用户 OpenID
     * @returns
     *
     * - id：消息ID。首条返回 stream_msg_id，用于后续分片
     * - timestamp：消息发送时间，RFC3339 格式
     * - ext_info：扩展信息。ref_idx: 引用消息索引 扩展信息
     * - remain_msg_len：流式消息剩余长度（字符数）
     * @throws 40007 已下发内容前缀不可修改
     * @throws 50001 服务内部错误
     * @throws 50002 频率限制
     */
    sendUserStreamMessage(user_openid: string, payload: SendUserStreamMessagePayload): Promise<UserStreamMessage> {
      return request.post(`/v2/users/${user_openid}/stream_messages`, payload);
    },

    /**
     * 撤回单聊消息
     *
     * 撤回机器人发送给当前用户的消息。
     *
     * 发送超过 2 分钟的消息不可撤回。
     *
     * 成功返回 HTTP 200，无响应体。
     *
     * 接口频率限制：10 QPS
     *
     * @remarks
     * 官方文档说明成功返回 HTTP 200，无响应体，文档同一页面的响应示例为 `{}`。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_messages_message_id.delete.html}
     *
     * @param user_openid 用户 OpenID
     * @param message_id 消息 ID
     * @throws 306009 用户openid无效
     * @throws 40061001 请求参数无效
     * @throws 40061002 请求参数msgid无效
     * @throws 40064004 已超出消息撤回时限
     */
    recallUserMessage(user_openid: string, message_id: string): Promise<Record<string, never>> {
      return request.delete(`/v2/users/${user_openid}/messages/${message_id}`);
    },

    /**
     * 单聊富媒体上传
     *
     * 上传图片/视频/语音到单聊，返回 file_info 用于发送消息接口的 media 字段。
     *
     * 用单聊接口上传的文件仅能发送到单聊。
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
     * @param user_openid 用户 OpenID
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
    uploadUserFile(user_openid: string, payload: UploadUserFilePayload): Promise<UserFile> {
      return request.post(`/v2/users/${user_openid}/files`, payload);
    },

    /**
     * 单聊富媒体预上传
     *
     * 单聊大文件分片上传前的准备工作。返回 upload_id、分片预签名 URL 和上传配置。
     *
     * 后续将文件按 block_size 分片，逐片 PUT 到预签名 URL，每片完成后调用分片完成接口。
     *
     * 大文件分片上传第一步。
     *
     * 传入文件大小、MD5/SHA1 校验值，服务端返回 upload_id 和各分片预签名 URL。
     *
     * 接口频率限制：10 QPS
     *
     * @param user_id 用户 OpenID
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
    prepareUserFileUpload(user_id: string, payload: PrepareUserFileUploadPayload): Promise<UserFileMultipartUpload> {
      return request.post(`/v2/users/${user_id}/upload_prepare`, payload);
    },

    /**
     * 单聊分片上传完成
     *
     * 通知服务端某个分片已上传完成。
     *
     * 全部分片完成后，用 upload_id 作为 MediaUpload 的 upload_id 字段调一次上传接口完成合并
     *
     * 分片上传第二步。
     *
     * 每个分片 PUT 到预签名 URL 成功后调用，通知服务端该分片已上传完成。
     *
     * 全部分片完成后，携带 upload_id 调用 /v2/users/{user_openid}/files 完成合并。
     *
     * 接口频率限制：10 QPS
     *
     * @remarks
     * 官方文档将响应标记为「无」，文档同一页面的响应示例为 `{}`。
     *
     * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_id_upload_part_finish.post.html}
     *
     * @param user_id 用户 OpenID
     * @throws 850018 群被禁言或者机器人被禁言
     * @throws 850019 不支持的文件格式
     * @throws 850026 下载原始文件失败
     * @throws 850031 上传文件超过大小限制
     * @throws 850027 发送数据超时
     * @throws 10000 不支持的操作
     * @throws 40093001 文件上传失败，请重试
     * @throws 40093002 超过今天发送文件容量上限
     */
    finishUserFileUploadPart(
      user_id: string,
      payload: FinishUserFileUploadPartPayload,
    ): Promise<Record<string, never>> {
      return request.post(`/v2/users/${user_id}/upload_part_finish`, payload);
    },
  };
};
