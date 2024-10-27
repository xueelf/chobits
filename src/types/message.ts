/** 消息类型 */
export enum MsgType {
  /** 文本 */
  Text = 0,
  /** Markdown */
  Markdown = 2,
  /** Ark */
  Ark = 3,
  /** Embed */
  Embed = 4,
  /** 富媒体 */
  Media = 7,
}

/** 媒体类型 */
export enum FileType {
  /** 图片（png/jpg） */
  Image = 1,
  /** 视频（mp4） */
  Video = 2,
  /** 语音（silk） */
  Audio = 3,
  /** 文件（暂不开放） */
  Document = 4,
}

export interface MessageResponse {
  /** 消息唯一 ID */
  id: string;
  /** 发送时间 */
  timestamp: string;
}
