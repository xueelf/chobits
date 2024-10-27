import { EventEmitter } from 'node:events';
import { Logger, type Level } from 'nebia';
import { assignDeep, createInstance, Result, type TotteInstance } from 'totte';
import { ErrorData, useApi } from '@/api';
import { createMsgPayload } from '@/util';
import { Token } from './token';
import { DispatchPayload, Session } from './session';
import { FileType, MessageResponse, MsgType } from '@/types/message';

export type EventInterceptor = (payload: DispatchPayload) => void | Promise<void>;

/** 客户端配置项 */
export interface ClientConfig {
  /** ID */
  appid: string;
  /** 令牌 */
  token: string;
  /** 密钥 */
  secret: string;
  /**
   * 分片，默认 `[0, 1]`
   *
   * @deprecated 据 {@link https://bot.q.qq.com/wiki/develop/api/gateway/shard.html | 官方文档} 描述，分片是根据频道 id 进行哈希的，未证实是否对群聊适用，暂不考虑支持。
   */
  shard?: number[];
  /** 是否开启沙盒，默认 `false` */
  sandbox?: boolean;
  /** 掉线重连数，默认 `3` */
  maxRetry?: number;
  /** 日志等级，默认 `"info"` */
  logLevel?: Level;
}

type ReplyEvent =
  | 'GROUP_ADD_ROBOT'
  | 'GROUP_AT_MESSAGE_CREATE'
  | 'GROUP_MSG_RECEIVE'
  | 'FRIEND_ADD'
  | 'C2C_MSG_RECEIVE'
  | 'C2C_MESSAGE_CREATE';
type ClientEvent<T extends DispatchPayload, U extends DispatchPayload['t']> = T extends {
  t: U;
  d: infer D;
}
  ? T extends { t: ReplyEvent }
    ? D & {
        reply: (content: string) => Promise<{ id: string; timestamp: string }>;
      }
    : D
  : never;
type ClientEventMap<T extends DispatchPayload = DispatchPayload> = {
  [K in T['t']]: [ClientEvent<T, K>];
};

export class Client extends EventEmitter<ClientEventMap> {
  private eventInterceptors: EventInterceptor[];
  public api: ReturnType<typeof useApi>;
  public config: Required<ClientConfig>;
  public logger: Logger;
  public request: TotteInstance;
  public session: Session;
  public token: Token;
  public username?: string;

  constructor(cfg: ClientConfig) {
    super();

    this.eventInterceptors = [];
    this.config = assignDeep(
      {
        sandbox: false,
        maxRetry: 3,
        logLevel: 'info',
      },
      cfg,
    );
    this.logger = new Logger({
      name: this.config.appid,
      level: this.config.logLevel,
    });
    this.request = createInstance();
    this.request.useRequestInterceptor(config => {
      this.logger.debug('HTTP Href: %s', config.href);
      this.logger.trace('HTTP Request: %O', config);

      return config;
    });
    this.request.useResponseInterceptor(response => {
      this.logger.debug('HTTP Status: %s %d', response.config.href, response.status);
      this.logger.trace('HTTP Response: %O', response);
    });
    this.session = new Session(this);
    this.token = new Token(this);

    const apiRequest = this.request.create({
      origin: this.config.sandbox
        ? 'https://sandbox.api.sgroup.qq.com'
        : 'https://api.sgroup.qq.com',
    });
    apiRequest.useRequestInterceptor(async config => {
      await this.token.renew();
      assignDeep(config, {
        headers: {
          Authorization: this.token.authorization,
        },
      });
      this.logger.debug('API URL: %s', config.url);
      this.logger.trace('API Request: %O', config);

      return config;
    });
    apiRequest.useResponseInterceptor<ErrorData>(response => {
      this.logger.debug('API Status: %s %d', response.config.url, response.status);
      this.logger.trace('API Response: %O', response);

      const { data } = response;
      const { err_code, message } = data;

      if (err_code) {
        this.logger.error('API Error: %s', message);
        throw new Error(message);
      }
    });
    this.api = useApi(apiRequest);

    this.logger.debug('Client initialized');
    this.logger.trace('Client Config: %O', this.config);
    this.logger.info('Ciallo～(∠·ω< )⌒★');

    this.useEventInterceptor(async payload => {
      const { t, d } = payload;

      switch (t) {
        case 'C2C_MESSAGE_CREATE':
          this.logger.info('From User: %s', d.content);
          break;
        case 'GROUP_AT_MESSAGE_CREATE':
          this.logger.info('From Group: %s', d.content);
          break;
        case 'GROUP_ADD_ROBOT':
          this.logger.info('已被用户 %s 添加到群聊 %s', d.op_member_openid, d.group_openid);
          break;
        case 'GROUP_DEL_ROBOT':
          this.logger.info('已被用户 %s 移出群聊 %s', d.op_member_openid, d.group_openid);
          break;
        case 'GROUP_MSG_RECEIVE':
          this.logger.info('用户 %s 开启了群聊 %s 的主动消息', d.op_member_openid, d.group_openid);
          break;
        case 'GROUP_MSG_REJECT':
          this.logger.info('用户 %s 关闭了群聊 %s 的主动消息', d.op_member_openid, d.group_openid);
          break;
        case 'FRIEND_ADD':
          this.logger.info('已被用户 %s 添加', d.openid);
          break;
        case 'FRIEND_DEL':
          this.logger.info('已被用户 %s 删除', d.openid);
          break;
        case 'C2C_MSG_RECEIVE':
          this.logger.info('用户 %s 开启了主动消息', d.openid);
          break;
        case 'C2C_MSG_REJECT':
          this.logger.info('用户 %s 关闭了主动消息', d.openid);
          break;
      }
    });
  }

  private emitEvent(payload: DispatchPayload): void {
    const { t, d } = payload;

    switch (t) {
      case 'GROUP_ADD_ROBOT':
      case 'GROUP_MSG_RECEIVE':
        Reflect.set(d, 'reply', (content: string) => {
          return this.sendGroupMessage(d.group_openid, content, payload.id);
        });
        break;
      case 'FRIEND_ADD':
      case 'C2C_MSG_RECEIVE':
        Reflect.set(d, 'reply', (content: string) => {
          return this.sendUserMessage(d.openid, content, payload.id);
        });
        break;
      case 'C2C_MESSAGE_CREATE':
        Reflect.set(d, 'reply', (content: string) => {
          return this.sendUserMessage(d.author.user_openid, content, d.id);
        });
        break;
      case 'GROUP_AT_MESSAGE_CREATE':
        Reflect.set(d, 'reply', (content: string) => {
          return this.sendGroupMessage(d.group_openid, content, d.id);
        });
        break;
    }
    // @ts-expect-error
    this.emit(t, d);
  }

  private async onDispatch(payload: DispatchPayload): Promise<void> {
    this.emitEvent(payload);

    for (let index = 0; index < this.eventInterceptors.length; index++) {
      const interceptor = this.eventInterceptors[index];
      await interceptor(payload);
    }
  }

  public useEventInterceptor(interceptor: EventInterceptor): void {
    this.eventInterceptors.push(interceptor);
  }

  public async online(): Promise<void> {
    await this.session.connect();
    this.session.on('dispatch', this.onDispatch.bind(this));
  }

  public offline(): void {
    this.session.disconnect();
    this.session.removeAllListeners();
    this.logger.info('Goodbye');
  }

  public async sendMessage(options: {
    type: 'group' | 'user';
    to_id: string;
    from_id?: string;
    content: string;
  }): Promise<Result<MessageResponse>> {
    const { type, to_id, from_id, content } = options;
    const payload: Record<string, unknown> = {
      ...createMsgPayload(from_id),
      msg_type: MsgType.Text,
      content,
    };
    const method = type === 'group' ? this.api.sendGroupMessage : this.api.sendUserMessage;

    // @ts-expect-error
    return method(to_id, payload);
  }

  public sendGroupMessage(
    group_openid: string,
    content: string,
    from_id?: string,
  ): Promise<Result<MessageResponse>> {
    return this.sendMessage({
      type: 'group',
      to_id: group_openid,
      from_id,
      content,
    });
  }

  public sendUserMessage(
    openid: string,
    content: string,
    from_id?: string,
  ): Promise<Result<MessageResponse>> {
    return this.sendMessage({
      type: 'user',
      to_id: openid,
      from_id,
      content,
    });
  }

  public async sendImage(options: {
    type: 'group' | 'user';
    to_id: string;
    from_id?: string;
    url: string;
    content?: string;
    err_msg?: string;
  }): Promise<void> {
    const { type, to_id, from_id, url, content = '', err_msg } = options;

    try {
      const fileMethod = type === 'group' ? this.api.sendGroupFile : this.api.sendUserFile;
      const { data } = await fileMethod(to_id, {
        file_type: FileType.Image,
        url,
        srv_send_msg: !from_id,
      });

      if (!from_id) {
        return;
      }
      const { file_info } = data;
      const msgMethod = type === 'group' ? this.api.sendGroupMessage : this.api.sendUserMessage;

      await msgMethod(to_id, {
        ...createMsgPayload(from_id),
        msg_type: MsgType.Media,
        content,
        media: {
          file_info,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        const method = type === 'group' ? this.sendGroupMessage : this.sendUserMessage;
        const message = err_msg ?? error.message;

        await method.call(this, to_id, message, from_id);
      }
    }
  }

  public sendGroupImage(group_openid: string, url: string, from_id: string): Promise<void> {
    return this.sendImage({
      type: 'group',
      to_id: group_openid,
      from_id,
      url,
    });
  }

  public sendUserImage(openid: string, url: string, from_id: string): Promise<void> {
    return this.sendImage({
      type: 'user',
      to_id: openid,
      from_id,
      url,
    });
  }
}
