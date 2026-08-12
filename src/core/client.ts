import { type SendGroupMessagePayload } from '#/api/groups';
import createOperations, { type Operations, type TextMessage } from '#/api/index';
import { type SendUserMessagePayload } from '#/api/users';
import { Auth } from '#/core/auth';
import { type Logger } from '#/core/logger';
import { type Context, type Middleware, compose } from '#/core/middleware';
import { type Dispatch, type DispatchData } from '#/core/payload';
import { Webhook } from '#/core/webhook';
import { WebSocketSession } from '#/core/websocket';
import { EventEmitter } from '#/utils/emitter';
import { createRandom } from '#/utils/number';
import { type ReadonlyDeep, deepFreeze } from '#/utils/object';
import { createRequest } from '#/utils/request';
import { isString } from '#/utils/type';

/**
 * @remarks
 * 官方仅将 `msg_seq` 定义为 integer，实测 `4294967295` 可以正常发送，`4294967296` 返回 `40011000` 请求数据异常。
 *
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_messages.post.html}
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_messages.post.html}
 */
const MAX_MESSAGE_SEQUENCE = 2 ** 32 - 1;

type ReplyMethod = 'sendGroupMessage' | 'sendUserMessage';

type ReplyIdField = 'msg_id' | 'event_id';

type ReplyManagedField = ReplyIdField | 'msg_seq';

type EventReplyMessage<Message> = Message extends unknown ? Omit<Message, ReplyManagedField> : never;

type EventReplyPayload<Message> = Message extends unknown
  ? Omit<Message, ReplyManagedField> & ({ msg_id: string; msg_seq: number } | { event_id: string; msg_seq: number })
  : never;

type ClientOperations = Readonly<Omit<Operations, 'getGateway'>>;

type EventWithReply<Data, Method extends ReplyMethod> = ReadonlyDeep<
  Data & {
    /**
     * 回复当前事件。
     *
     * 字符串会作为文本消息发送。
     * 对象直接使用当前场景的官方消息结构。
     * `msg_id`、`event_id` 和 `msg_seq` 会根据事件自动补充。
     *
     * @param message 回复内容或官方消息结构。
     * @returns 消息发送结果。
     */
    reply(message: string | EventReplyMessage<Parameters<Operations[Method]>[1]>): ReturnType<Operations[Method]>;
  }
>;

type UserInteractionEvent = EventWithReply<
  Extract<DispatchData['INTERACTION_CREATE'], { scene: 'c2c' }>,
  'sendUserMessage'
>;

type GroupInteractionEvent = EventWithReply<
  Extract<DispatchData['INTERACTION_CREATE'], { scene: 'group' }>,
  'sendGroupMessage'
>;

type InteractionEvent = UserInteractionEvent | GroupInteractionEvent;

type ReplyMessage = EventReplyMessage<SendGroupMessagePayload | SendUserMessagePayload>;

const withMessageSequence = <Message extends { msg_seq?: number }>(message: Message): Message & { msg_seq: number } => {
  return { ...message, msg_seq: message.msg_seq ?? createRandom(1, MAX_MESSAGE_SEQUENCE) };
};

const createReplyPayload = <Message extends ReplyMessage>(
  message: string | (Message & Partial<Record<ReplyManagedField, unknown>>),
  idField: ReplyIdField,
  replyId: string | undefined,
): TextMessage | EventReplyPayload<Message> => {
  if (!replyId) {
    throw new Error('The event cannot be replied to without its ID');
  }
  const msgSeq = createRandom(1, MAX_MESSAGE_SEQUENCE);

  if (isString(message)) {
    const payload: TextMessage = { msg_type: 0, content: message };

    return idField === 'msg_id'
      ? { ...payload, msg_id: replyId, msg_seq: msgSeq }
      : { ...payload, event_id: replyId, msg_seq: msgSeq };
  }
  const { msg_id: _msgId, event_id: _eventId, msg_seq: _msgSeq, ...payload } = message;
  const replyPayload =
    idField === 'msg_id'
      ? { ...payload, msg_id: replyId, msg_seq: msgSeq }
      : { ...payload, event_id: replyId, msg_seq: msgSeq };

  return <EventReplyPayload<Message>>replyPayload;
};

type Events = {
  /** WebSocket 后台连接无法恢复。 */
  error: [error: Error];
  /** WebSocket 会话就绪。 */
  READY: [event: ReadonlyDeep<DispatchData['READY']>];
  /** WebSocket 会话已经恢复。 */
  RESUMED: [event: ReadonlyDeep<DispatchData['RESUMED']>];
  /** 收到私聊消息。 */
  C2C_MESSAGE_CREATE: [event: EventWithReply<DispatchData['C2C_MESSAGE_CREATE'], 'sendUserMessage'>];
  /** 未开启全量模式时，收到群内 @ 机器人的消息。 */
  GROUP_AT_MESSAGE_CREATE: [event: EventWithReply<DispatchData['GROUP_AT_MESSAGE_CREATE'], 'sendGroupMessage'>];
  /** 开启「接收所有消息」后，收到群内每一条消息，包括 @ 机器人的消息。 */
  GROUP_MESSAGE_CREATE: [event: EventWithReply<DispatchData['GROUP_MESSAGE_CREATE'], 'sendGroupMessage'>];
  /** 机器人被添加到群。 */
  GROUP_ADD_ROBOT: [event: EventWithReply<DispatchData['GROUP_ADD_ROBOT'], 'sendGroupMessage'>];
  /** 机器人被移出群。 */
  GROUP_DEL_ROBOT: [event: ReadonlyDeep<DispatchData['GROUP_DEL_ROBOT']>];
  /** 群消息接收设置被开启。 */
  GROUP_MSG_RECEIVE: [event: EventWithReply<DispatchData['GROUP_MSG_RECEIVE'], 'sendGroupMessage'>];
  /** 群消息接收设置被关闭。 */
  GROUP_MSG_REJECT: [event: ReadonlyDeep<DispatchData['GROUP_MSG_REJECT']>];
  /** 群成员加入群。 */
  GROUP_MEMBER_ADD: [event: ReadonlyDeep<DispatchData['GROUP_MEMBER_ADD']>];
  /** 群成员离开群。 */
  GROUP_MEMBER_REMOVE: [event: ReadonlyDeep<DispatchData['GROUP_MEMBER_REMOVE']>];
  /** 订阅消息授权状态发生变更。 */
  SUBSCRIBE_MESSAGE_STATUS: [event: ReadonlyDeep<DispatchData['SUBSCRIBE_MESSAGE_STATUS']>];
  /** 用户申请加入群。 */
  GROUP_JOIN_REQUEST: [event: ReadonlyDeep<DispatchData['GROUP_JOIN_REQUEST']>];
  /** 用户添加机器人为好友。 */
  FRIEND_ADD: [event: EventWithReply<DispatchData['FRIEND_ADD'], 'sendUserMessage'>];
  /** 用户删除机器人好友。 */
  FRIEND_DEL: [event: ReadonlyDeep<DispatchData['FRIEND_DEL']>];
  /**
   * 用户开启私聊消息接收。
   *
   * @remarks
   * 官方事件文档定义 `C2C_MSG_RECEIVE`。
   * WebSocket 与 Webhook 实测开启「允许主动发送消息」时收到 `INTERACTION_CREATE`，`type: 18`，`authorize_data.switch: true`。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/c2c_msg_receive.html}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
   */
  C2C_MSG_RECEIVE: [event: EventWithReply<DispatchData['C2C_MSG_RECEIVE'], 'sendUserMessage'>];
  /**
   * 用户关闭私聊消息接收。
   *
   * @remarks
   * 官方事件文档定义 `C2C_MSG_REJECT`。
   * WebSocket 与 Webhook 实测关闭「允许主动发送消息」时收到 `INTERACTION_CREATE`，`type: 18`，且不包含 `authorize_data.switch`。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/c2c_msg_reject.html}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
   */
  C2C_MSG_REJECT: [event: ReadonlyDeep<DispatchData['C2C_MSG_REJECT']>];
  /** 用户点击消息按钮、变更授权或进入群机器人管理。 */
  INTERACTION_CREATE: [event: InteractionEvent];
};

type ClientEvents<CustomEvents extends Record<keyof CustomEvents, unknown[]>> = {
  [Event in keyof Events | Exclude<keyof CustomEvents, keyof Events>]: Event extends keyof Events
    ? Events[Event]
    : Event extends keyof CustomEvents
      ? CustomEvents[Event]
      : never;
};

/** 累积中间件 State 类型的客户端。 */
type ClientWithState<CustomEvents extends Record<keyof CustomEvents, unknown[]>, State extends object> = Omit<
  Client<CustomEvents>,
  'use'
> & {
  use<AddedState extends object = Record<never, never>>(
    ...middlewares: Middleware<State & AddedState>[]
  ): ClientWithState<CustomEvents, State & AddedState>;
};

/** QQ 机器人客户端。 */
export interface Client<
  CustomEvents extends Record<keyof CustomEvents, unknown[]> = Record<never, never>,
> extends ClientOperations {}

export class Client<
  CustomEvents extends Record<keyof CustomEvents, unknown[]> = Record<never, never>,
> extends EventEmitter<ClientEvents<CustomEvents>> {
  /** 事件中间件。 */
  private readonly middlewares: Middleware[] = [];
  /** 中间件执行函数。 */
  private readonly composedMiddleware = compose(this.middlewares);
  /** 自定义日志回调。 */
  private readonly logger?: Logger;
  /** Webhook 回调处理器。 */
  private readonly webhook: Webhook;
  /** WebSocket 会话。 */
  private readonly websocket: WebSocketSession;

  /**
   * 创建 QQ 机器人客户端。
   *
   * @param options 客户端配置。
   * @param options.appId 机器人 AppID。
   * @param options.clientSecret 机器人 AppSecret。
   * @param options.maxRetry WebSocket 建立或恢复连接时允许的最大重试次数，默认为 `3`，`Infinity` 表示持续重试。
   * @param options.logger SDK 日志回调。
   * @throws `appId` 或 `clientSecret` 为空，或者 `maxRetry` 不是非负整数或 `Infinity` 时抛出。
   */
  public constructor(options: { appId: string; clientSecret: string; maxRetry?: number; logger?: Logger }) {
    super();
    const { appId, clientSecret, maxRetry = 3, logger } = options;

    if (!appId || !clientSecret) {
      throw new TypeError('appId and clientSecret are required');
    }

    if (maxRetry !== Infinity && (!Number.isInteger(maxRetry) || maxRetry < 0)) {
      throw new TypeError('maxRetry must be a non-negative integer or Infinity');
    }
    const auth = new Auth(appId, clientSecret, logger);
    const request = createRequest(auth, logger);
    const { getGateway, ...operations } = createOperations(request);

    this.logger = logger;
    this.webhook = new Webhook(
      clientSecret,
      async payload => {
        await this.dispatch(payload);
      },
      logger,
    );
    this.websocket = new WebSocketSession({
      dispatch: async payload => {
        await this.dispatch(payload);
      },
      error: async error => {
        await this.emit('error', error);
      },
      getAuthorization: () => auth.getAuthorization(),
      getGateway: async () => {
        const { data } = await getGateway();

        return data;
      },
      maxRetry,
      logger,
    });

    Object.assign(this, operations, {
      sendGroupMessage: (group_openid: string, message: SendGroupMessagePayload) => {
        return operations.sendGroupMessage(group_openid, withMessageSequence(message));
      },
      sendUserMessage: (user_openid: string, message: SendUserMessagePayload) => {
        return operations.sendUserMessage(user_openid, withMessageSequence(message));
      },
    });
  }

  /**
   * 注册事件中间件。
   *
   * 中间件按照注册顺序执行。调用并等待 `next()` 后继续执行后续中间件和监听器，不调用则停止当前事件分发。
   * WebSocket 与 Webhook 共用同一条中间件链。
   *
   * @typeParam AddedState 当前中间件向共享状态增加的数据。
   * @param middlewares 事件中间件。
   * @returns 累积当前 State 后的客户端，便于继续链式调用。
   */
  public use<AddedState extends object = Record<never, never>>(
    ...middlewares: Middleware<AddedState>[]
  ): ClientWithState<CustomEvents, AddedState> {
    this.middlewares.push(...(<Middleware[]>middlewares));

    return <ClientWithState<CustomEvents, AddedState>>this;
  }

  /**
   * 建立 WebSocket 会话并等待 `READY` 或 `RESUMED`。
   *
   * 重复调用时复用正在建立的连接或当前在线会话。
   *
   * @returns WebSocket 会话就绪后完成。
   * @throws 建立或恢复连接失败时抛出原错误。
   */
  public async online(): Promise<void> {
    await this.websocket.connect();
  }

  /**
   * 主动关闭 WebSocket 会话并清理可恢复状态。
   *
   * @returns WebSocket 会话关闭后完成。
   */
  public async offline(): Promise<void> {
    await this.websocket.disconnect();
  }

  /**
   * 处理 QQ Webhook 回调请求。
   *
   * 负责回调地址验证、Ed25519 验签和 HTTP Callback ACK，事件分发在 ACK 返回后开始。
   *
   * @param request HTTP Server 或 Serverless 平台提供的标准 Request。
   * @param waitUntil 延长事件处理的生命周期，不阻塞 ACK。
   * @returns 需要返回给 QQ 的标准 Response。
   */
  public async callback(request: Request, waitUntil?: (task: Promise<void>) => void): Promise<Response> {
    return await this.webhook.callback(request, waitUntil);
  }

  /**
   * 运行中间件并分发事件。
   *
   * @param payload QQ 推送的 Dispatch Payload。
   */
  private async dispatch(payload: Dispatch): Promise<void> {
    const context: Context = {
      payload: deepFreeze(payload),
      state: {},
    };
    const details = {
      t: payload.t,
      ...(payload.s === undefined ? {} : { s: payload.s }),
      ...(payload.id === undefined ? {} : { id: payload.id }),
    };

    this.logger?.('dispatch', '开始处理 Dispatch', { payload: context.payload });

    try {
      await this.composedMiddleware(context, () => this.emitDispatch(payload));
      this.logger?.('dispatch', 'Dispatch 处理完成', details);
    } catch (error) {
      this.logger?.('dispatch', 'Dispatch 处理失败', { ...details, error });
      throw error;
    }
  }

  /**
   * 分发 QQ Dispatch 事件。
   *
   * @remarks
   * 互动事件文档称 d.id 可用于被动回复，消息接口则要求使用 Dispatch 最外层 id。实测被动回复使用 d.id 返回 40034025，仅互动回调可用。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_messages.post.html}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_messages.post.html}
   * @param payload QQ 推送的 Dispatch Payload。
   */
  private async emitDispatch(payload: Dispatch): Promise<void> {
    const dispatchType: string = payload.t;

    switch (payload.t) {
      case 'C2C_MESSAGE_CREATE':
        return await this.emit(
          payload.t,
          deepFreeze({
            ...payload.d,
            reply: async message => {
              return await this.sendUserMessage(
                payload.d.author.user_openid,
                createReplyPayload(message, 'msg_id', payload.d.id),
              );
            },
          }),
        );
      case 'GROUP_AT_MESSAGE_CREATE':
      case 'GROUP_MESSAGE_CREATE':
        return await this.emit(
          payload.t,
          deepFreeze({
            ...payload.d,
            reply: async message => {
              return await this.sendGroupMessage(
                payload.d.group_openid,
                createReplyPayload(message, 'msg_id', payload.d.id),
              );
            },
          }),
        );
      case 'GROUP_ADD_ROBOT':
      case 'GROUP_MSG_RECEIVE':
        return await this.emit(
          payload.t,
          deepFreeze({
            ...payload.d,
            reply: async message => {
              return await this.sendGroupMessage(
                payload.d.group_openid,
                createReplyPayload(message, 'event_id', payload.id),
              );
            },
          }),
        );
      case 'FRIEND_ADD':
        return await this.emit(
          payload.t,
          deepFreeze({
            ...payload.d,
            reply: async message => {
              return await this.sendUserMessage(payload.d.openid, createReplyPayload(message, 'event_id', payload.id));
            },
          }),
        );
      case 'C2C_MSG_RECEIVE':
        return await this.emit(
          payload.t,
          deepFreeze({
            ...payload.d,
            reply: async message => {
              return await this.sendUserMessage(payload.d.openid, createReplyPayload(message, 'event_id', payload.id));
            },
          }),
        );
      case 'INTERACTION_CREATE': {
        if (payload.d.scene === 'group') {
          const { group_openid } = payload.d;
          const event: GroupInteractionEvent = {
            ...payload.d,
            reply: async message => {
              return await this.sendGroupMessage(group_openid, createReplyPayload(message, 'event_id', payload.id));
            },
          };

          return await this.emit(payload.t, deepFreeze(event));
        }
        const { user_openid } = payload.d;
        const event: UserInteractionEvent = {
          ...payload.d,
          reply: async message => {
            return await this.sendUserMessage(user_openid, createReplyPayload(message, 'event_id', payload.id));
          },
        };

        return await this.emit(payload.t, deepFreeze(event));
      }
      case 'READY':
        return await this.emit(payload.t, payload.d);
      case 'RESUMED':
        return await this.emit(payload.t, payload.d);
      case 'GROUP_DEL_ROBOT':
      case 'GROUP_MSG_REJECT':
        return await this.emit(payload.t, payload.d);
      case 'GROUP_MEMBER_ADD':
      case 'GROUP_MEMBER_REMOVE':
        return await this.emit(payload.t, payload.d);
      case 'SUBSCRIBE_MESSAGE_STATUS':
        return await this.emit(payload.t, payload.d);
      case 'GROUP_JOIN_REQUEST':
        return await this.emit(payload.t, payload.d);
      case 'FRIEND_DEL':
        return await this.emit(payload.t, payload.d);
      case 'C2C_MSG_REJECT':
        return await this.emit(payload.t, payload.d);
      default:
        this.logger?.('dispatch', '不受支持的 Dispatch 事件', { t: dispatchType });
    }
  }
}
