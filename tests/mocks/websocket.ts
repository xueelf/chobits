import {
  type GroupInteractionData,
  type UserInteractionData,
  createGroupEvent,
  createGroupMemberEvent,
  createGroupMessage,
  createUserMessage,
} from './payload';

import { type DispatchData, type DispatchPayload, InteractionType, OpCode } from '#/core/payload';
import { isNumber, isRecord } from '#/utils/type';

export class MockGateway extends EventTarget {
  public static readonly OPEN = 1;
  public static readonly instances: MockGateway[] = [];

  public readonly sent: string[] = [];
  public readonly url: string;
  public readyState = MockGateway.OPEN;
  private sequence = 0;

  public constructor(url: string | URL) {
    super();
    this.url = String(url);
    MockGateway.instances.push(this);
  }

  public static async waitForConnection(index = 0): Promise<MockGateway> {
    while (!MockGateway.instances[index]) {
      await new Promise(resolve => setTimeout(resolve));
    }
    return MockGateway.instances[index];
  }

  public send(data: string): void {
    this.sent.push(data);
  }

  public close(code = 1000): void {
    this.readyState = 3;
    queueMicrotask(() => this.dispatchEvent(new CloseEvent('close', { code })));
  }

  public sendPayload(payload: unknown): void {
    if (isRecord(payload) && isNumber(payload.s)) {
      this.sequence = payload.s;
    }
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(payload) }));
  }

  public dispatch<Type extends keyof DispatchData>(
    type: Type,
    data: DispatchData[Type],
    options: { id?: string; sequence?: number } = {},
  ): DispatchPayload<Type, DispatchData[Type]> {
    const sequence = options.sequence ?? this.sequence + 1;
    const payload: DispatchPayload<Type, DispatchData[Type]> = options.id
      ? { id: options.id, op: OpCode.Dispatch, s: sequence, t: type, d: data }
      : { op: OpCode.Dispatch, s: sequence, t: type, d: data };

    this.sendPayload(payload);
    return payload;
  }

  public hello(heartbeatInterval = 60000): void {
    this.sendPayload({
      op: OpCode.Hello,
      d: { heartbeat_interval: heartbeatInterval },
    });
  }

  public ready(
    data: Partial<DispatchData['READY']> = {},
    sequence?: number,
  ): DispatchPayload<'READY', DispatchData['READY']> {
    return this.dispatch(
      'READY',
      {
        version: 1,
        session_id: 'session-id',
        user: { id: 'bot-id', username: 'bot', bot: true, status: 1 },
        shard: [0, 0],
        ...data,
      },
      sequence === undefined ? {} : { sequence },
    );
  }

  public resumed(sequence?: number): DispatchPayload<'RESUMED', DispatchData['RESUMED']> {
    return this.dispatch('RESUMED', '', sequence === undefined ? {} : { sequence });
  }

  public sendUserMessage(
    data: Partial<DispatchData['C2C_MESSAGE_CREATE']> = {},
  ): DispatchPayload<'C2C_MESSAGE_CREATE', DispatchData['C2C_MESSAGE_CREATE']> {
    return this.dispatch('C2C_MESSAGE_CREATE', createUserMessage(data), { id: 'user-message-event-id' });
  }

  public sendGroupMessage(
    data: Partial<DispatchData['GROUP_MESSAGE_CREATE']> = {},
  ): DispatchPayload<'GROUP_MESSAGE_CREATE', DispatchData['GROUP_MESSAGE_CREATE']> {
    return this.dispatch('GROUP_MESSAGE_CREATE', createGroupMessage(data), {
      id: 'group-message-event-id',
    });
  }

  public sendGroupAtMessage(
    data: Partial<DispatchData['GROUP_AT_MESSAGE_CREATE']> = {},
  ): DispatchPayload<'GROUP_AT_MESSAGE_CREATE', DispatchData['GROUP_AT_MESSAGE_CREATE']> {
    return this.dispatch('GROUP_AT_MESSAGE_CREATE', createGroupMessage(data), {
      id: 'group-at-message-event-id',
    });
  }

  public sendFriendAdd(
    data: Partial<DispatchData['FRIEND_ADD']> = {},
  ): DispatchPayload<'FRIEND_ADD', DispatchData['FRIEND_ADD']> {
    return this.dispatch(
      'FRIEND_ADD',
      {
        author: { union_openid: '' },
        openid: 'user-openid',
        timestamp: Math.floor(Date.now() / 1000),
        ...data,
      },
      { id: 'friend-add-event-id' },
    );
  }

  public sendFriendDelete(
    data: Partial<DispatchData['FRIEND_DEL']> = {},
  ): DispatchPayload<'FRIEND_DEL', DispatchData['FRIEND_DEL']> {
    return this.dispatch(
      'FRIEND_DEL',
      {
        author: { union_openid: '' },
        openid: 'user-openid',
        timestamp: Math.floor(Date.now() / 1000),
        ...data,
      },
      { id: 'friend-delete-event-id' },
    );
  }

  public sendGroupAddRobot(
    data: Partial<DispatchData['GROUP_ADD_ROBOT']> = {},
  ): DispatchPayload<'GROUP_ADD_ROBOT', DispatchData['GROUP_ADD_ROBOT']> {
    return this.dispatch('GROUP_ADD_ROBOT', createGroupEvent(data), { id: 'group-add-robot-event-id' });
  }

  public sendGroupDeleteRobot(
    data: Partial<DispatchData['GROUP_DEL_ROBOT']> = {},
  ): DispatchPayload<'GROUP_DEL_ROBOT', DispatchData['GROUP_DEL_ROBOT']> {
    return this.dispatch('GROUP_DEL_ROBOT', createGroupEvent(data), { id: 'group-delete-robot-event-id' });
  }

  public sendGroupMessageReceive(
    data: Partial<DispatchData['GROUP_MSG_RECEIVE']> = {},
  ): DispatchPayload<'GROUP_MSG_RECEIVE', DispatchData['GROUP_MSG_RECEIVE']> {
    return this.dispatch('GROUP_MSG_RECEIVE', createGroupEvent(data), { id: 'group-message-receive-event-id' });
  }

  public sendGroupMessageReject(
    data: Partial<DispatchData['GROUP_MSG_REJECT']> = {},
  ): DispatchPayload<'GROUP_MSG_REJECT', DispatchData['GROUP_MSG_REJECT']> {
    return this.dispatch('GROUP_MSG_REJECT', createGroupEvent(data), { id: 'group-message-reject-event-id' });
  }

  public sendGroupMemberAdd(
    data: Partial<DispatchData['GROUP_MEMBER_ADD']> = {},
  ): DispatchPayload<'GROUP_MEMBER_ADD', DispatchData['GROUP_MEMBER_ADD']> {
    return this.dispatch('GROUP_MEMBER_ADD', createGroupMemberEvent(data), { id: 'group-member-add-event-id' });
  }

  public sendGroupMemberRemove(
    data: Partial<DispatchData['GROUP_MEMBER_REMOVE']> = {},
  ): DispatchPayload<'GROUP_MEMBER_REMOVE', DispatchData['GROUP_MEMBER_REMOVE']> {
    return this.dispatch('GROUP_MEMBER_REMOVE', createGroupMemberEvent(data), { id: 'group-member-remove-event-id' });
  }

  public sendUserButtonInteraction(
    data: UserInteractionData = {},
  ): DispatchPayload<'INTERACTION_CREATE', DispatchData['INTERACTION_CREATE']> {
    return this.dispatch(
      'INTERACTION_CREATE',
      {
        application_id: 'app-id',
        chat_type: 2,
        data: {
          resolved: {
            button_data: 'interaction:respond-reply',
            button_id: 'interaction-respond-reply',
          },
          type: InteractionType.INLINE_KEYBOARD,
        },
        id: 'interaction-id',
        type: InteractionType.INLINE_KEYBOARD,
        scene: 'c2c',
        user_openid: 'user-openid',
        timestamp: new Date().toISOString(),
        version: 1,
        ...data,
      },
      { id: 'user-interaction-event-id' },
    );
  }

  public sendGroupButtonInteraction(
    data: GroupInteractionData = {},
  ): DispatchPayload<'INTERACTION_CREATE', DispatchData['INTERACTION_CREATE']> {
    return this.dispatch(
      'INTERACTION_CREATE',
      {
        application_id: 'app-id',
        chat_type: 1,
        data: {
          resolved: {
            button_data: 'interaction:respond-reply',
            button_id: 'interaction-respond-reply',
          },
          type: InteractionType.INLINE_KEYBOARD,
        },
        id: 'group-interaction-id',
        type: InteractionType.INLINE_KEYBOARD,
        group_openid: 'group-openid',
        group_member_openid: 'member-openid',
        scene: 'group',
        timestamp: new Date().toISOString(),
        version: 1,
        ...data,
      },
      { id: 'group-interaction-event-id' },
    );
  }

  public sendUserAuthorizeInteraction(
    data: UserInteractionData = {},
  ): DispatchPayload<'INTERACTION_CREATE', DispatchData['INTERACTION_CREATE']> {
    return this.dispatch(
      'INTERACTION_CREATE',
      {
        application_id: 'app-id',
        data: {
          resolved: {
            authorize_data: {
              opt_scene: 'setting',
              scope: 'c2c_push',
              switch: true,
            },
          },
        },
        id: 'user-authorize-interaction-id',
        type: InteractionType.USER_AUTHORIZE,
        scene: 'c2c',
        user_openid: 'user-openid',
        timestamp: new Date().toISOString(),
        version: 1,
        ...data,
      },
      { id: 'user-authorize-interaction-event-id' },
    );
  }

  public sendGroupAuthorizeStatusInteraction(
    data: GroupInteractionData = {},
  ): DispatchPayload<'INTERACTION_CREATE', DispatchData['INTERACTION_CREATE']> {
    return this.dispatch(
      'INTERACTION_CREATE',
      {
        data: { resolved: {}, type: 2001 },
        id: 'group-authorize-status-interaction-id',
        type: InteractionType.GROUP_AUTHORIZE_STATUS,
        group_openid: 'group-openid',
        scene: 'group',
        timestamp: new Date().toISOString(),
        version: 1,
        ...data,
      },
      { id: 'group-authorize-status-interaction-event-id' },
    );
  }

  public reconnect(): void {
    this.sendPayload({ op: OpCode.Reconnect });
  }

  public invalidateSession(resumable = false): void {
    this.sendPayload({ op: OpCode.InvalidSession, d: resumable });
  }

  public heartbeatAck(): void {
    this.sendPayload({ op: OpCode.HeartbeatAck });
  }
}

export function mockWebSocket(constructor: unknown): typeof WebSocket {
  return <typeof WebSocket>constructor;
}
