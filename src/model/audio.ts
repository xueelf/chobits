export enum AudioStatus {
  /** 开始播放操作 */
  Start = 0,
  /** 暂停播放操作 */
  Pause = 1,
  /** 继续播放操作 */
  Resume = 2,
  /** 停止播放操作 */
  Stop = 3,
}

export interface AudioControl {
  /** 音频数据的url status为0时传 */
  audio_url: string;
  /** 状态文本（比如：简单爱-周杰伦），可选，status为0时传，其他操作不传 */
  text: string;
  /** 播放状态，参考 STATUS */
  status: AudioStatus;
}
