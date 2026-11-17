import { type DispatchData } from '#/core/payload';

type UserInteraction = Extract<DispatchData['INTERACTION_CREATE'], { scene: 'c2c' }>;

type GroupInteraction = Extract<DispatchData['INTERACTION_CREATE'], { scene: 'group' }>;

export type UserInteractionData = Partial<Omit<UserInteraction, 'scene' | 'type'>>;

export type GroupInteractionData = Partial<Omit<GroupInteraction, 'scene' | 'type'>>;

export const createUserMessage = (
  data: Partial<DispatchData['C2C_MESSAGE_CREATE']> = {},
): DispatchData['C2C_MESSAGE_CREATE'] => ({
  author: {
    avatar: 'https://example.com/user-avatar.png',
    bot: false,
    id: 'user-openid',
    union_openid: 'user-openid',
    user_openid: 'user-openid',
    username: 'user',
  },
  content: '私聊消息',
  id: 'user-message-id',
  message_scene: {
    ext: ['msg_idx=user-message-index'],
    source: 'default',
  },
  message_type: 0,
  timestamp: new Date().toISOString(),
  ...data,
});

export const createGroupMessage = (
  data: Partial<DispatchData['GROUP_MESSAGE_CREATE']> | Partial<DispatchData['GROUP_AT_MESSAGE_CREATE']> = {},
): DispatchData['GROUP_MESSAGE_CREATE'] => ({
  author: {
    avatar: 'https://example.com/member-avatar.png',
    bot: false,
    id: 'member-openid',
    member_nickname: 'member',
    member_openid: 'member-openid',
    member_role: 'owner',
    union_openid: 'member-openid',
    username: 'member',
  },
  content: '群聊消息',
  group_id: 'group-openid',
  group_openid: 'group-openid',
  id: 'group-message-id',
  message_scene: {
    ext: ['msg_idx=group-message-index', 'auth_token=group-message-token'],
    source: 'default',
  },
  message_type: 0,
  timestamp: new Date().toISOString(),
  union_group_openid: 'group-openid',
  ...data,
});

export const createGroupEvent = (
  data: Partial<DispatchData['GROUP_ADD_ROBOT']> = {},
): DispatchData['GROUP_ADD_ROBOT'] => ({
  group_openid: 'group-openid',
  op_member_openid: 'member-openid',
  timestamp: Math.floor(Date.now() / 1000),
  union_group_openid: 'group-openid',
  ...data,
});

export const createGroupMessageSettingEvent = (
  data: Partial<DispatchData['GROUP_MSG_RECEIVE']> = {},
): DispatchData['GROUP_MSG_RECEIVE'] => ({
  group_openid: 'group-openid',
  op_member_openid: 'member-openid',
  timestamp: Math.floor(Date.now() / 1000),
  ...data,
});

export const createGroupMemberEvent = (
  data: Partial<DispatchData['GROUP_MEMBER_ADD']> = {},
): DispatchData['GROUP_MEMBER_ADD'] => ({
  group_openid: 'group-openid',
  member_openid: 'member-openid',
  timestamp: Math.floor(Date.now() / 1000),
  union_group_openid: 'group-openid',
  union_openid: 'member-openid',
  ...data,
});

export const createGroupJoinRequest = (
  data: Partial<DispatchData['GROUP_JOIN_REQUEST']> = {},
): DispatchData['GROUP_JOIN_REQUEST'] => ({
  apply_at: new Date().toISOString(),
  apply_source: 'self_apply',
  group_openid: 'group-openid',
  join_request_id: 'join-request-id',
  member_openid: 'member-openid',
  username: 'member',
  verify_info: { method: 'verify_message' },
  ...data,
});
