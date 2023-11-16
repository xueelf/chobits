import { Member } from '@/model/member';

export interface Schedule {
  /** 日程 id */
  id: string;
  /** 日程名称 */
  name: string;
  /** 日程描述 */
  description: string;
  /** 日程开始时间戳(ms) */
  start_timestamp: string;
  /** 日程结束时间戳(ms) */
  end_timestamp: string;
  /** 创建者 */
  creator: Member;
  /** 日程开始时跳转到的子频道 id */
  jump_channel_id: string;
  /** 日程提醒类型，取值参考RemindType */
  remind_type: string;
}
