import type { AnyObject } from '@/utils/common';
import type { ReadyData, ResumedData } from '@/client/session';
import type { Guild } from '@/model/guild';
import type { Channel } from '@/model/channel';
import type { AudioAction } from '@/model/audio';
import type { MemberWithGuildID } from '@/model/member';
import type { AuditResult, Post, Reply, Thread } from '@/model/forum';
import type { Message, MessageAudited, MessageReaction } from '@/model/message';
import { Result } from '@/utils/request';
import { SendChannelMessageParams } from '@/api/channels';
import { GroupMessage, SendGroupsMessageParams } from '@/api/groups';
import { UserMessage, SendUserMessageParams } from '@/api/users';

export type SessionReady = ReadyData & { t: 'READY' };
export type SessionResumed = ResumedData & { t: 'RESUMED' };

export type GuildCreate = Guild & {
  t: 'GUILD_CREATE';
  op_user_id: string;
};
export type GuildUpdate = Guild & {
  t: 'GUILD_UPDATE';
  op_user_id: string;
};
export type GuildDelete = Guild & {
  t: 'GUILD_DELETE';
  op_user_id: string;
};
export type ChannelCreate = Channel & {
  t: 'CHANNEL_CREATE';
  op_user_id: string;
};
export type ChannelUpdate = Channel & {
  t: 'CHANNEL_UPDATE';
  op_user_id: string;
};
export type ChannelDelete = Channel & {
  t: 'CHANNEL_DELETE';
  op_user_id: string;
};

export type GuildMemberAdd = MemberWithGuildID & {
  t: 'GUILD_MEMBER_ADD';
  op_user_id: string;
};
export type GuildMemberUpdate = MemberWithGuildID & {
  t: 'GUILD_MEMBER_UPDATE';
  op_user_id: string;
};
export type GuildMemberRemove = MemberWithGuildID & {
  t: 'GUILD_MEMBER_REMOVE';
  op_user_id: string;
};

export type MessageCreate = Message & {
  /** 事件类型 */
  t: 'MESSAGE_CREATE';
  /** 快捷回复 */
  reply: (params: SendChannelMessageParams) => Promise<Result<Message>>;
};
export type MessageDelete = AnyObject & { t: 'MESSAGE_DELETE' };

export type MessageReactionAdd = AnyObject & { t: 'MESSAGE_REACTION_ADD' };
export type MessageReactionRemove = MessageReaction & { t: 'MESSAGE_REACTION_REMOVE' };

export type DirectMessageCreate = Message & {
  /** 事件类型 */
  t: 'DIRECT_MESSAGE_CREATE';
  /** 快捷回复 */
  reply: (params: SendChannelMessageParams) => Promise<Result<Message>>;
};
export type DirectMessageDelete = AnyObject & { t: 'DIRECT_MESSAGE_DELETE' };

export interface InteractionCreate {
  /** 事件类型 */
  t: 'INTERACTION_CREATE';
  /** 平台方事件 ID，可以用于被动消息发送 */
  id: string;
  /** 按钮事件固定是 11 */
  type: 11;
  /** 消息内容 */
  // TODO: ／人◕ ‿‿ ◕人＼ 文档这里写错了，咱也不知道是啥字段
  // 'chat_type': number;
  /** 消息生产时间 */
  timestamp: string;
  /** 频道的 openid */
  guild_id: string;
  /** 文字子频道的 openid */
  channel_id: string;
  /** 群聊的 openid */
  group_open_id: string;
  /** 目前只有群和单聊有该字段，1 群聊，2 单聊，后续加入 3 频道 */
  chat_type: 1 | 2 | 3;
  data: {
    resolved: {
      /** 操作按钮的 data 字段值【在发送按钮时规划】 */
      button_data: string;
      /** 操作按钮的 id 字段值【在发送按钮时规划】 */

      button_id: string;
      /** 操作的用户 openid */
      user_id: string;
      /** 操作的消息 id */

      message_id: string;
    };
  };
  /** 默认 1 */
  version: number;
  /** 机器人的 appid */
  application_id: string;
}

export type MessageAuditPass = MessageAudited & { t: 'MESSAGE_AUDIT_PASS' };
export type MessageAuditReject = MessageAudited & { t: 'MESSAGE_AUDIT_REJECT' };

export type AudioStart = AudioAction & { t: 'AUDIO_START' };
export type AudioFinish = AudioAction & { t: 'AUDIO_FINISH' };
export type AudioOnMic = AudioAction & { t: 'AUDIO_ON_MIC' };
export type AudioOffMic = AudioAction & { t: 'AUDIO_OFF_MIC' };

export type ForumThreadCreate = Thread & { t: 'FORUM_THREAD_CREATE' };
export type ForumThreadUpdate = Thread & { t: 'FORUM_THREAD_UPDATE' };
export type ForumThreadDelete = Thread & { t: 'FORUM_THREAD_DELETE' };
export type ForumPostCreate = Post & { t: 'FORUM_POST_CREATE' };
export type ForumPostDelete = Post & { t: 'FORUM_POST_DELETE' };
export type ForumReplyCreate = Reply & { t: 'FORUM_REPLY_CREATE' };
export type ForumReplyDelete = Reply & { t: 'FORUM_REPLY_DELETE' };
export type ForumPublishAuditResult = AuditResult & { t: 'FORUM_PUBLISH_AUDIT_RESULT' };

export type AtMessageCreate = Message & {
  /** 事件类型 */
  t: 'AT_MESSAGE_CREATE';
  /** 快捷回复 */
  reply: (params: SendChannelMessageParams) => Promise<Result<Message>>;
};
export type PublicMessageDelete = AnyObject & { t: 'PUBLIC_MESSAGE_DELETE' };

export interface GroupAddRobot {
  /** 事件类型 */
  t: 'GROUP_ADD_ROBOT';
  /** 加入的时间戳 */
  timestamp: string;
  /** 加入群的群 openid */
  group_openid: string;
  /** 操作添加机器人进群的群成员 openid */
  op_member_openid: string;
}

export interface GroupDelRobot {
  /** 事件类型 */
  t: 'GROUP_DEL_ROBOT';
  /** 移除的时间戳 */
  timestamp: string;
  /** 移除群的群 openid */
  group_openid: string;
  /** 操作移除机器人退群的群成员 openid */
  op_member_openid: string;
}

export interface GroupMessageReject {
  /** 事件类型 */
  t: 'GROUP_MSG_REJECT';
  /** 操作的时间戳 */
  timestamp: string;
  /** 操作群的群 openid */
  group_openid: string;
  /** 操作群成员的 openid */
  op_member_openid: string;
}

export interface GroupMessageReceive {
  /** 事件类型 */
  t: 'GROUP_MSG_RECEIVE';
  /** 操作的时间戳 */
  timestamp: string;
  /** 操作群的群 openid */
  group_openid: string;
  /** 操作群成员的 openid */
  op_member_openid: string;
}

export interface FriendAdd {
  /** 事件类型 */
  t: 'FRIEND_ADD';
  /** 添加时间戳 */
  timestamp: string;
  /** 用户 openid */
  openid: string;
}

export interface FriendDel {
  /** 事件类型 */
  t: 'FRIEND_DEL';
  /** 删除时间戳 */
  timestamp: string;
  /** 用户 openid */
  openid: string;
}

export interface C2cMsgReject {
  /** 事件类型 */
  t: 'C2C_MSG_REJECT';
  /** 操作时间戳 */
  timestamp: string;
  /** 用户 openid */
  openid: string;
}

export interface C2cMsgReceive {
  /** 事件类型 */
  t: 'C2C_MSG_RECEIVE';
  /** 操作时间戳 */
  timestamp: string;
  /** 用户 openid */
  openid: string;
}

export interface C2cMessageCreate {
  /** 事件类型 */
  t: 'C2C_MESSAGE_CREATE';
  /** 平台方消息ID，可以用于被动消息发送 */
  id: string;
  /** 发送者 */
  author: {
    /** 用户 openid */
    user_openid: string;
  };
  /** 文本消息内容 */
  content: string;
  /** 消息生产时间 */
  timestamp: string;
  /** 富媒体文件附件 */
  attachments: object[];
  /** 快捷回复 */
  reply: (params: SendUserMessageParams) => Promise<Result<UserMessage>>;
}

export interface GroupAtMessageCreate {
  /** 事件类型 */
  t: 'GROUP_AT_MESSAGE_CREATE';
  /** 平台方消息ID，可以用于被动消息发送 */
  id: string;
  /** 发送者 */
  author: {
    id: string;
    /** 用户 openid */
    member_openid: string;
  };
  /** 消息内容 */
  content: string;
  /** 消息生产时间 */
  timestamp: string;
  /** 群聊的 openid */
  group_openid: string;
  /** 富媒体文件附件 */
  attachments: object[];
  /** 快捷回复 */
  reply: (params: SendGroupsMessageParams) => Promise<Result<GroupMessage>>;
}

export interface BotEvent {
  //#region GUILDS
  /** 当机器人加入新 guild 时 */
  'guild.create': (event: GuildCreate) => void;
  /** 当 guild 资料发生变更时 */
  'guild.update': (event: GuildUpdate) => void;
  /** 当机器人退出 guild 时 */
  'guild.delete': (event: GuildDelete) => void;
  /** 当 channel 被创建时 */
  'channel.create': (event: ChannelCreate) => void;
  /** 当 channel 被更新时 */
  'channel.update': (event: ChannelUpdate) => void;
  /** 当 channel 被删除时 */
  'channel.delete': (event: ChannelDelete) => void;
  //#endregion

  //#region GUILD_MEMBERS
  /** 当成员加入时 */
  'guild.member.add': (event: GuildMemberAdd) => void;
  /** 当成员资料变更时 */
  'guild.member.update': (event: GuildMemberUpdate) => void;
  /** 当成员被移除时 */
  'guild.member.remove': (event: GuildMemberRemove) => void;
  //#endregion

  //#region GUILD_MESSAGES
  /** **仅私域**，发送消息事件，代表频道内的全部消息，而不只是 at 机器人的消息。内容与 AT_MESSAGE_CREATE 相同 */
  'message.create': (event: MessageCreate) => void;
  /** **仅私域**，删除（撤回）消息事件 */
  'message.delete': (event: MessageDelete) => void;
  //#endregion

  //#region GUILD_MESSAGE_REACTIONS
  /** 为消息添加表情表态 */
  'message.reaction.add': (event: MessageReactionAdd) => void;
  /** 为消息删除表情表态 */
  'message.reaction.remove': (event: MessageReactionRemove) => void;
  //#endregion

  //#region DIRECT_MESSAGE
  /** 当收到用户发给机器人的私信消息时 */
  'direct.message.create': (event: DirectMessageCreate) => void;
  /** 删除（撤回）消息事件 */
  'direct.message.delete': (event: DirectMessageDelete) => void;
  //#endregion

  //#region INTERACTION
  /** 用户点击了消息体的回调按钮 */
  'interaction.create': (event: InteractionCreate) => void;
  //#endregion

  //#region MESSAGE_AUDIT
  /** 消息审核通过 */
  'message.audit.pass': (event: MessageAuditPass) => void;
  /** 消息审核不通过 */
  'message.audit.reject': (event: MessageAuditReject) => void;
  //#endregion

  //#region FORUMS_EVENT
  /** **仅私域**，当用户创建主题时 */
  'forum.thread.create': (event: ForumThreadCreate) => void;
  /** **仅私域**，当用户更新主题时 */
  'forum.thread.update': (event: ForumThreadUpdate) => void;
  /** **仅私域**，当用户删除主题时 */
  'forum.thread.delete': (event: ForumThreadDelete) => void;

  /** **仅私域**，当用户创建帖子时 */
  'forum.post.create': (event: ForumPostCreate) => void;
  /** **仅私域**，当用户删除帖子时 */
  'forum.post.delete': (event: ForumPostDelete) => void;

  /** **仅私域**，当用户回复评论时 */
  'forum.reply.create': (event: ForumReplyCreate) => void;
  /** **仅私域**，当用户回复评论时 */
  'forum.reply.delete': (event: ForumReplyDelete) => void;

  /** **仅私域**，当用户发表审核通过时 */
  'forum.publish.audit.result': (event: ForumPublishAuditResult) => void;
  //#endregion

  //#region AUDIO_ACTION
  /** 音频开始播放时 */
  'audio.start': (event: AudioStart) => void;
  /** 音频播放结束时 */
  'audio.finish': (event: AudioFinish) => void;
  /** 上麦时 */
  'audio.on.mic': (event: AudioOnMic) => void;
  /** 下麦时 */
  'audio.off.mic': (event: AudioOffMic) => void;
  //#endregion

  //#region PUBLIC_GUILD_MESSAGES
  /** **仅公域**，当收到 at 机器人的消息时 */
  'at.message.create': (event: AtMessageCreate) => void;
  /** **仅公域**，当频道的消息被删除时 */
  'public.message.delete': (event: PublicMessageDelete) => void;
  //#endregion

  //#region GROUP_MESSAGES
  /** 机器人被添加到群聊 */
  'group.add.robot': (event: GroupAddRobot) => void;
  /** 机器人被移出群聊 */
  'group.del.robot': (event: GroupDelRobot) => void;

  /** 群管理员主动在机器人资料页操作关闭通知 */
  'group.msg.reject': (event: GroupMessageReject) => void;
  /** 群管理员主动在机器人资料页操作开启通知 */
  'group.msg.receive': (event: GroupMessageReceive) => void;

  /** 用户在群聊 at 机器人发送消息 */
  'group.at.message.create': (event: GroupAtMessageCreate) => void;

  /** 用户添加机器人'好友'到消息列表 */
  'friend.add': (event: FriendAdd) => void;
  /** 用户删除机器人'好友' */
  'friend.del': (event: FriendDel) => void;

  /** 用户在机器人资料卡手动关闭 "主动消息" 推送 */
  'c2c.msg.reject': (event: C2cMsgReject) => void;
  /** 用户在机器人资料卡手动开启 "主动消息" 推送开关 */
  'c2c.msg.receive': (event: C2cMsgReceive) => void;
  /** 用户在单聊发送消息给机器人 */
  'c2c.message.create': (event: C2cMessageCreate) => void;
  //#endregion

  // TODO: ／人◕ ‿‿ ◕人＼ SESSION 文档没提供类型，我暂时只遇到过这俩，待补充
  //#region SESSION
  /** 连接会话通信 */
  'session.ready': (event: SessionReady) => void;
  /** 重连会话 */
  'session.resumed': (event: SessionResumed) => void;
  //#endregion
}
