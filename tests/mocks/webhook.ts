import {
  type GroupInteractionData,
  type UserInteractionData,
  createGroupEvent,
  createGroupMemberEvent,
  createGroupMessage,
  createUserMessage,
} from './payload';

import { type DispatchData, type DispatchPayload, InteractionType, OpCode } from '#/core/payload';
import { createSigningKey, sign } from '#/utils/signature';

export class MockWebhook {
  public constructor(private readonly secret: string) {}

  public async sendUserMessage(data: Partial<DispatchData['C2C_MESSAGE_CREATE']> = {}): Promise<Request> {
    return await this.createRequest({
      op: OpCode.Dispatch,
      id: 'user-message-event-id',
      t: 'C2C_MESSAGE_CREATE',
      d: createUserMessage(data),
    });
  }

  public async sendGroupMessage(data: Partial<DispatchData['GROUP_MESSAGE_CREATE']> = {}): Promise<Request> {
    return await this.createRequest({
      op: OpCode.Dispatch,
      id: 'group-message-event-id',
      t: 'GROUP_MESSAGE_CREATE',
      d: createGroupMessage(data),
    });
  }

  public async sendGroupAtMessage(data: Partial<DispatchData['GROUP_AT_MESSAGE_CREATE']> = {}): Promise<Request> {
    return await this.createRequest({
      op: OpCode.Dispatch,
      id: 'group-at-message-event-id',
      t: 'GROUP_AT_MESSAGE_CREATE',
      d: createGroupMessage(data),
    });
  }

  public async sendFriendAdd(data: Partial<DispatchData['FRIEND_ADD']> = {}): Promise<Request> {
    return await this.createRequest({
      op: OpCode.Dispatch,
      id: 'friend-add-event-id',
      t: 'FRIEND_ADD',
      d: {
        author: { union_openid: '' },
        openid: 'user-openid',
        scene: 1000,
        scene_param: '',
        timestamp: Math.floor(Date.now() / 1000),
        ...data,
      },
    });
  }

  public async sendFriendDelete(data: Partial<DispatchData['FRIEND_DEL']> = {}): Promise<Request> {
    return await this.createRequest({
      op: OpCode.Dispatch,
      id: 'friend-delete-event-id',
      t: 'FRIEND_DEL',
      d: {
        author: { union_openid: '' },
        openid: 'user-openid',
        timestamp: Math.floor(Date.now() / 1000),
        ...data,
      },
    });
  }

  public async sendGroupAddRobot(data: Partial<DispatchData['GROUP_ADD_ROBOT']> = {}): Promise<Request> {
    return await this.createRequest({
      op: OpCode.Dispatch,
      id: 'group-add-robot-event-id',
      t: 'GROUP_ADD_ROBOT',
      d: createGroupEvent(data),
    });
  }

  public async sendGroupDeleteRobot(data: Partial<DispatchData['GROUP_DEL_ROBOT']> = {}): Promise<Request> {
    return await this.createRequest({
      op: OpCode.Dispatch,
      id: 'group-delete-robot-event-id',
      t: 'GROUP_DEL_ROBOT',
      d: createGroupEvent(data),
    });
  }

  public async sendGroupMemberAdd(data: Partial<DispatchData['GROUP_MEMBER_ADD']> = {}): Promise<Request> {
    return await this.createRequest({
      op: OpCode.Dispatch,
      id: 'group-member-add-event-id',
      t: 'GROUP_MEMBER_ADD',
      d: createGroupMemberEvent(data),
    });
  }

  public async sendGroupMemberRemove(data: Partial<DispatchData['GROUP_MEMBER_REMOVE']> = {}): Promise<Request> {
    return await this.createRequest({
      op: OpCode.Dispatch,
      id: 'group-member-remove-event-id',
      t: 'GROUP_MEMBER_REMOVE',
      d: createGroupMemberEvent(data),
    });
  }

  public async sendUserButtonInteraction(data: UserInteractionData = {}): Promise<Request> {
    return await this.createRequest({
      op: OpCode.Dispatch,
      id: 'user-interaction-event-id',
      t: 'INTERACTION_CREATE',
      d: {
        application_id: 'app-id',
        chat_type: 2,
        data: {
          resolved: {
            button_data: 'interaction:respond-reply',
            button_id: 'interaction-respond-reply',
          },
          type: InteractionType.INLINE_KEYBOARD,
        },
        id: 'user-interaction-id',
        scene: 'c2c',
        timestamp: new Date().toISOString(),
        type: InteractionType.INLINE_KEYBOARD,
        union_openid: 'union-openid',
        user_openid: 'user-openid',
        version: 1,
        ...data,
      },
    });
  }

  public async sendGroupButtonInteraction(data: GroupInteractionData = {}): Promise<Request> {
    return await this.createRequest({
      op: OpCode.Dispatch,
      id: 'group-interaction-event-id',
      t: 'INTERACTION_CREATE',
      d: {
        application_id: 'app-id',
        chat_type: 1,
        data: {
          resolved: {
            button_data: 'interaction:respond-reply',
            button_id: 'interaction-respond-reply',
          },
          type: InteractionType.INLINE_KEYBOARD,
        },
        group_member_openid: 'member-openid',
        group_openid: 'group-openid',
        id: 'group-interaction-id',
        scene: 'group',
        timestamp: new Date().toISOString(),
        type: InteractionType.INLINE_KEYBOARD,
        version: 1,
        ...data,
      },
    });
  }

  public async sendUserAuthorizeInteraction(data: UserInteractionData = {}): Promise<Request> {
    return await this.createRequest({
      op: OpCode.Dispatch,
      id: 'user-authorize-interaction-event-id',
      t: 'INTERACTION_CREATE',
      d: {
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
        scene: 'c2c',
        timestamp: new Date().toISOString(),
        type: InteractionType.USER_AUTHORIZE,
        union_openid: '',
        user_openid: 'user-openid',
        version: 1,
        ...data,
      },
    });
  }

  public async sendGroupAuthorizeStatusInteraction(data: GroupInteractionData = {}): Promise<Request> {
    return await this.createRequest({
      op: OpCode.Dispatch,
      id: 'group-authorize-status-interaction-event-id',
      t: 'INTERACTION_CREATE',
      d: {
        data: { resolved: {}, type: 2001 },
        group_openid: 'group-openid',
        id: 'group-authorize-status-interaction-id',
        scene: 'group',
        timestamp: new Date().toISOString(),
        type: InteractionType.GROUP_AUTHORIZE_STATUS,
        version: 1,
        ...data,
      },
    });
  }

  private async createRequest<Type extends keyof DispatchData>(
    payload: DispatchPayload<Type, DispatchData[Type]>,
  ): Promise<Request> {
    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = await sign(await createSigningKey(this.secret), timestamp + body);

    return new Request('https://example.com/callback', {
      method: 'POST',
      headers: {
        'X-Signature-Ed25519': signature,
        'X-Signature-Timestamp': timestamp,
      },
      body,
    });
  }
}
