export enum Format {
  /** 普通文本 */
  Text = 1,
  /** HTML */
  Html = 2,
  /** Markdown */
  Markdown = 3,
  /** JSON */
  Json = 4,
}

export interface ThreadInfo {
  /** 主帖ID */
  thread_id: string;
  /** 帖子标题 */
  title: string;
  /** 帖子内容 */
  content: string;
  /** 发表时间 */
  date_time: string;
}

export interface Thread {
  /** 频道ID */
  guild_id: string;
  /** 子频道ID */
  channel_id: string;
  /** 作者ID */
  author_id: string;
  /** ThreadInfo 主帖内容 */
  thread_info: ThreadInfo;
}

export interface Post {
  /** 频道ID */
  guild_id: string;
  /** 子频道ID */
  channel_id: string;
  /** 作者ID */
  author_id: string;
  /** 帖子内容 */
  post_info: PostInfo;
}

export interface PostInfo {
  /** 主题ID */
  thread_id: string;
  /** 帖子ID */
  post_id: string;
  /** 帖子内容 */
  content: string;
  /** 评论时间 */
  date_time: string;
}

export interface Reply {
  /** 频道ID */
  guild_id: string;
  /** 子频道ID */
  channel_id: string;
  /** 作者ID */
  author_id: string;
  /** 回复内容 */
  reply_info: ReplyInfo;
}

export interface ReplyInfo {
  /** 主题ID */
  thread_id: string;
  /** 帖子ID */
  post_id: string;
  /** 回复ID */
  reply_id: string;
  /** 回复内容 */
  content: string;
  /** 回复时间 */
  date_time: string;
}

/** 审核的类型 */
export enum AuditType {
  /** 帖子 */
  PUBLISH_THREAD = 1,
  /** 评论 */
  PUBLISH_POST,
  /** 回复 */
  PUBLISH_REPLY,
}

export interface AuditResult {
  /** 频道ID */
  guild_id: string;
  /** 子频道ID */
  channel_id: string;
  /** 作者ID */
  author_id: string;
  /** 主题ID */
  thread_id: string;
  /** 帖子ID */
  post_id: string;
  /** 回复ID */
  reply_id: string;
  /** 审核的类型 */
  type: AuditType;
  /** 审核结果. 0:成功 1:失败 */
  result: 0 | 1;
  /** result不为0时错误信息 */
  err_msg: string;
}
