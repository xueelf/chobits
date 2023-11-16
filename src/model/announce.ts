export interface RecommendChannel {
  /** 子频道 id */
  channel_id: string;
  /** 推荐语 */
  introduce: string;
}

export interface Announce {
  /** 频道 id */
  guild_id: string;
  /** 子频道 id */
  channel_id: string;
  /** 消息 id */
  message_id: string;
  /** 公告类别 0:成员公告 1:欢迎公告，默认成员公告 */
  announces_type: number;
  /** 推荐子频道详情列表 */
  recommend_channels: RecommendChannel[];
}
