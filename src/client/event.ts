import { ReadyData, ResumedData } from '@/client/session';
import { Message } from '@/model/message';

export type SessionReadyData = ReadyData;
export type SessionResumedData = ResumedData;

export interface MessageCreateData {
  author: {
    avatar: string;
    bot: boolean;
    id: string;
    username: string;
  };
  channel_id: string;
  content: string;
  guild_id: string;
  id: string;
  member: {
    joined_at: string;
    nick: string;
    roles: string[];
  };
  seq: number;
  seq_in_channel: string;
  timestamp: string;
}

export interface MessageAuditPassData {
  audit_id: string;
  audit_time: string;
  channel_id: string;
  create_time: string;
  guild_id: string;
  message_id: string;
  seq_in_channel: string;
}

export interface BotEvent {
  // GUILDS
  /** 当机器人加入新 guild 时 */
  'guild.create': (data: unknown) => void;
  /** 当 guild 资料发生变更时 */
  'guild.update': (data: unknown) => void;
  /** 当机器人退出 guild 时 */
  'guild.delete': (data: unknown) => void;
  /** 当 channel 被创建时 */
  'channel.create': (data: unknown) => void;
  /** 当 channel 被更新时 */
  'channel.update': (data: unknown) => void;
  /** 当 channel 被删除时 */
  'channel.delete': (data: unknown) => void;

  // GUILD_MEMBERS
  /** 当成员加入时 */
  'guild.member.add': (data: unknown) => void;
  /** 当成员资料变更时 */
  'guild.member.update': (data: unknown) => void;
  /** 当成员被移除时 */
  'guild.member.remove': (data: unknown) => void;

  // GUILD_MESSAGES
  /** **仅私域**，发送消息事件，代表频道内的全部消息，而不只是 at 机器人的消息。内容与 AT_MESSAGE_CREATE 相同 */
  'message.create': (data: Message) => void;
  /** **仅私域**，删除（撤回）消息事件 */
  'message.delete': (data: unknown) => void;

  // GUILD_MESSAGE_REACTIONS
  /** 为消息添加表情表态 */
  'message.reaction.add': (data: unknown) => void;
  /** 为消息删除表情表态 */
  'message.reaction.remove': (data: unknown) => void;

  // DIRECT_MESSAGE
  /** 当收到用户发给机器人的私信消息时 */
  'direct.message.create': (data: Message) => void;
  /** 删除（撤回）消息事件 */
  'direct.message.delete': (data: unknown) => void;

  // INTERACTION
  /** 互动事件创建时 */
  'interaction.create': (data: unknown) => void;

  // MESSAGE_AUDIT
  /** 消息审核通过 */
  'message.audit.pass': (data: unknown) => void;
  /** 消息审核不通过 */
  'message.audit.reject': (data: unknown) => void;

  // FORUMS_EVENT
  /** **仅私域**，当用户创建主题时 */
  'forum.thread.create': (data: unknown) => void;
  /** **仅私域**，当用户更新主题时 */
  'forum.thread.update': (data: unknown) => void;
  /** **仅私域**，当用户删除主题时 */
  'forum.thread.delete': (data: unknown) => void;
  /** **仅私域**，当用户创建帖子时 */
  'forum.post.create': (data: unknown) => void;
  /** **仅私域**，当用户删除帖子时 */
  'forum.post.delete': (data: unknown) => void;
  /** **仅私域**，当用户回复评论时 */
  'forum.reply.create': (data: unknown) => void;
  /** **仅私域**，当用户回复评论时 */
  'forum.reply.delete': (data: unknown) => void;
  /** **仅私域**，当用户发表审核通过时 */
  'forum.publish.audit.result': (data: unknown) => void;

  // AUDIO_ACTION
  /** 音频开始播放时 */
  'audio.start': (data: unknown) => void;
  /** 音频播放结束时 */
  'audio.finish': (data: unknown) => void;
  /** 上麦时 */
  'audio.on.mic': (data: unknown) => void;
  /** 下麦时 */
  'audio.off.mic': (data: unknown) => void;

  // PUBLIC_GUILD_MESSAGES
  /** **仅公域**，当收到 @ 机器人的消息时 */
  'at.message.create': (data: Message) => void;
  /** **仅公域**，当频道的消息被删除时 */
  'public.message.delete': (data: unknown) => void;

  // TODO: ／人◕ ‿‿ ◕人＼ SESSION 文档没提供类型，我暂时只遇到过这俩，待补充
  /** 连接会话通信 */
  'session.ready': (data: SessionReadyData) => void;
  /** 重连会话 */
  'session.resumed': (data: SessionResumedData) => void;
}
