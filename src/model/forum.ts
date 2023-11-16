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
