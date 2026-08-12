import { type Logger } from '#/core/logger';
import { type Dispatch, DispatchType, OpCode } from '#/core/payload';
import { isNumber, isString } from '#/utils/type';

/*
 * 下列 QQ 关闭码在官方错误码表中同时标记为不可重试 Resume 和 Identify，连接无法自动恢复。
 * https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/event-emit/websocket.html
 */
const FATAL_CLOSE_CODES = new Set([4001, 4002, 4010, 4011, 4012, 4013, 4014, 4914, 4915]);

/**
 * 可尝试恢复会话的 WebSocket 关闭码。
 *
 * @remarks
 * 官方错误码表允许 4008 和 4009 Resume，文档同一页面的简化说明仅列出 4009，当前按错误码表处理。1006 在会话可恢复时同样 Resume。
 *
 * {@link https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/event-emit/websocket.html}
 * {@link https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4.1}
 */
const RESUMABLE_CLOSE_CODES = new Set([1006, 4008, 4009]);

const MAX_RETRY_DELAY = 30000;

/** QQ Gateway 事件订阅类型。 */
enum Intent {
  /**
   * 群成员变更事件。
   *
   * @remarks
   * 官方 Intents 总表未列出该类型，`GROUP_MEMBER_ADD` 和 `GROUP_MEMBER_REMOVE` 事件属于 `1 << 24`。
   *
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/event-emit/payload.html}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_member_add.html}
   * {@link https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_member_remove.html}
   */
  GROUP_MEMBER = 1 << 24,
  /** 群聊与私聊事件。 */
  GROUP_AND_C2C_EVENT = 1 << 25,
  /** 互动事件。 */
  INTERACTION = 1 << 26,
}

const INTENTS = Object.values(Intent).reduce((intents, intent) => (isNumber(intent) ? intents | intent : intents), 0);

/** 客户端或服务端发送的心跳。 */
interface HeartbeatPayload {
  op: OpCode.Heartbeat;
  d: number | null;
}

/** 客户端发送的鉴权信息。 */
interface IdentifyPayload {
  op: OpCode.Identify;
  d: {
    token: string;
    intents: number;
  };
}

/** 客户端发送的会话恢复信息。 */
interface ResumePayload {
  op: OpCode.Resume;
  d: {
    token: string;
    session_id: string;
    seq: number;
  };
}

/** 服务端发送的重新连接通知。 */
interface ReconnectPayload {
  op: OpCode.Reconnect;
}

/** 服务端发送的无效会话通知。 */
interface InvalidSessionPayload {
  op: OpCode.InvalidSession;
  d?: boolean;
}

/** 服务端建立连接后发送的首条消息。 */
interface HelloPayload {
  op: OpCode.Hello;
  d: {
    heartbeat_interval: number;
  };
}

/** 服务端发送的心跳回包。 */
interface HeartbeatAckPayload {
  op: OpCode.HeartbeatAck;
}

/** QQ Gateway 使用的全部 WebSocket Payload。 */
type Payload =
  | Dispatch
  | HeartbeatPayload
  | IdentifyPayload
  | ResumePayload
  | ReconnectPayload
  | InvalidSessionPayload
  | HelloPayload
  | HeartbeatAckPayload;

/** QQ Gateway 可能推送给客户端的 Payload。 */
type ReceivePayload = Exclude<Payload, IdentifyPayload | ResumePayload>;

/** 客户端可能发送给 QQ Gateway 的 Payload。 */
type SendPayload = HeartbeatPayload | IdentifyPayload | ResumePayload;

class WebSocketConnectionError extends Error {
  /**
   * 初始化 WebSocket 连接错误。
   *
   * @param message 错误信息。
   * @param retryable 是否可以重试连接。
   */
  public constructor(
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
  }
}

export class WebSocketSession {
  /** WebSocket 连接。 */
  private socket: WebSocket | null = null;
  /** Dispatch 处理状态。 */
  private dispatches = new Map<number, boolean>();
  /** 可恢复会话 ID。 */
  private sessionId: string | null = null;
  /** 最新收到的事件序列号。 */
  private receivedSeq: number | null = null;
  /** 已连续处理完成的事件序列号。 */
  private processedSeq: number | null = null;
  /** 心跳间隔，单位为毫秒。 */
  private heartbeatIntervalMs: number | null = null;
  /** 心跳定时器。 */
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  /** 重连等待。 */
  private retryDelay: { resolve: () => void; timer: ReturnType<typeof setTimeout> } | null = null;
  /** 心跳回包状态。 */
  private heartbeatAck = true;
  /** 连接 Promise。 */
  private connectionPromise: Promise<void> | null = null;
  /** 断线重连状态。 */
  private reconnecting = false;
  /** 会话恢复标记。 */
  private resumeRequested = false;
  /** 主动停止标记。 */
  private connectionStopped = true;

  /**
   * 初始化 WebSocket 会话。
   *
   * @param options WebSocket 会话配置。
   */
  public constructor(
    private readonly options: {
      /** 分发 QQ Dispatch 事件。 */
      dispatch(payload: Dispatch): Promise<void>;
      /** 报告 WebSocket 后台连接错误。 */
      error(error: Error): Promise<void>;
      /** 获取 Gateway 鉴权信息。 */
      getAuthorization(): Promise<string>;
      /** 获取 WebSocket 接入地址。 */
      getGateway(): Promise<{ url: string }>;
      /** 建立或恢复连接时允许的最大重试次数。 */
      maxRetry: number;
      /** SDK 日志回调。 */
      logger?: Logger;
    },
  ) {}

  /**
   * 建立 WebSocket 连接，并等待会话准备完成。
   *
   * @throws 建立或恢复连接失败时抛出原错误。
   */
  public async connect(): Promise<void> {
    if (this.connectionPromise) {
      await this.connectionPromise;
      return;
    }

    if (this.socket) {
      return;
    }
    this.connectionStopped = false;
    this.connectionPromise = this.connectWithRetry();

    await this.connectionPromise;
  }

  /** 主动关闭 WebSocket 连接，并等待关闭事件完成。 */
  public async disconnect(): Promise<void> {
    const connectionPromise = this.connectionPromise;
    const retryDelay = this.retryDelay;
    const socket = this.socket;

    this.connectionStopped = true;
    this.resumeRequested = false;
    this.retryDelay = null;

    if (retryDelay) {
      clearTimeout(retryDelay.timer);
      retryDelay.resolve();
    }
    this.clearHeartbeat();
    this.resetSession();

    if (socket) {
      this.options.logger?.('websocket', '主动关闭 WebSocket 连接');
      const closePromise = new Promise<void>(resolve => {
        socket.addEventListener('close', () => resolve(), { once: true });
      });

      socket.close();
      await closePromise;
    }
    if (connectionPromise) {
      await Promise.allSettled([connectionPromise]);
    }
  }

  /**
   * 打开 QQ Gateway 连接并鉴权或恢复会话。
   *
   * @param resumeSession 是否恢复已有会话。
   */
  private async openConnection(resumeSession: boolean): Promise<void> {
    const mode = resumeSession && this.sessionId && this.processedSeq !== null ? 'resume' : 'identify';

    this.options.logger?.('websocket', '开始建立 WebSocket 连接', { mode });
    const authorization = await this.options.getAuthorization();

    if (this.connectionStopped) {
      throw new WebSocketConnectionError('WebSocket connection stopped', false);
    }
    const { url } = await this.options.getGateway();

    if (this.connectionStopped) {
      throw new WebSocketConnectionError('WebSocket connection stopped', false);
    }
    await new Promise<void>((resolve, reject) => {
      let sessionReady = false;
      const socket = new WebSocket(url);
      this.socket = socket;

      socket.addEventListener('message', async event => {
        if (this.socket !== socket || !isString(event.data)) {
          return;
        }
        let payload: ReceivePayload;

        try {
          payload = <ReceivePayload>JSON.parse(event.data);
        } catch {
          return;
        }
        this.options.logger?.('websocket', '收到 Gateway Payload', { payload });

        switch (payload.op) {
          case OpCode.Dispatch: {
            if (payload.t === DispatchType.Ready) {
              this.sessionId = payload.d.session_id;
              sessionReady = true;
              resolve();
            } else if (payload.t === DispatchType.Resumed) {
              sessionReady = true;
              resolve();
            }
            const sessionId = this.sessionId;
            const sequence = payload.s;

            if (isNumber(sequence)) {
              this.receivedSeq = Math.max(this.receivedSeq ?? sequence, sequence);
              if ((this.processedSeq !== null && sequence <= this.processedSeq) || this.dispatches.has(sequence)) {
                this.options.logger?.('websocket', '忽略重复的 Dispatch', {
                  t: payload.t,
                  s: sequence,
                  ...(payload.id === undefined ? {} : { id: payload.id }),
                });

                return;
              }
              this.dispatches.set(sequence, false);
            }

            try {
              await this.options.dispatch(payload);
            } finally {
              if (this.sessionId === sessionId && isNumber(sequence)) {
                this.dispatches.set(sequence, true);

                for (const [nextSequence, completed] of this.dispatches) {
                  if (!completed) {
                    break;
                  }
                  this.processedSeq = nextSequence;
                  this.dispatches.delete(nextSequence);
                }
              }
            }
            break;
          }
          case OpCode.Reconnect:
            this.restartConnection(true);
            break;
          case OpCode.InvalidSession: {
            const resumable = payload.d === true;

            if (!resumable) {
              this.resetSession();
            }
            this.restartConnection(resumable);
            break;
          }
          case OpCode.Hello:
            this.options.logger?.('websocket', 'WebSocket 连接已建立', { mode });
            this.heartbeatIntervalMs = payload.d.heartbeat_interval;
            this.startHeartbeat();

            if (resumeSession && this.sessionId && this.processedSeq !== null) {
              this.sendPayload(socket, {
                op: OpCode.Resume,
                d: {
                  token: authorization,
                  session_id: this.sessionId,
                  seq: this.processedSeq,
                },
              });
            } else {
              this.sendPayload(socket, {
                op: OpCode.Identify,
                d: {
                  token: authorization,
                  intents: INTENTS,
                },
              });
            }
            break;
          case OpCode.HeartbeatAck:
            this.heartbeatAck = true;
            break;
        }
      });

      socket.addEventListener('error', () => {
        if (!sessionReady && this.socket === socket) {
          reject(new WebSocketConnectionError('WebSocket connection failed', true));
          socket.close();
        }
      });

      socket.addEventListener('close', async event => {
        if (this.socket !== socket) {
          return;
        }
        this.socket = null;
        this.clearHeartbeat();

        const resumeRequested = this.resumeRequested;
        const canResume = this.sessionId !== null && this.processedSeq !== null;
        const shouldResume = canResume && (resumeRequested || RESUMABLE_CLOSE_CODES.has(event.code));
        const retryable = !FATAL_CLOSE_CODES.has(event.code);
        const error = new WebSocketConnectionError(`WebSocket closed with code ${event.code}`, retryable);

        this.options.logger?.('websocket', 'WebSocket 连接已关闭', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          retryable,
          resumable: shouldResume,
        });
        this.resumeRequested = false;

        if (!shouldResume) {
          this.resetSession();
        }

        if (!sessionReady) {
          reject(error);
        } else if (!this.connectionStopped && retryable) {
          await this.reconnect(shouldResume);
        } else if (!this.connectionStopped) {
          await this.options.error(error);
        }
      });
    });
  }

  /** 建立连接，失败时重试。 */
  private async connectWithRetry(): Promise<void> {
    try {
      await this.openConnection(false);
    } catch (error) {
      this.options.logger?.('websocket', 'WebSocket 连接失败', { mode: 'identify', error });
      await this.retryConnection(false, error);
    } finally {
      this.connectionPromise = null;
    }
  }

  /**
   * 启动断线重连。
   *
   * @param resumeSession 是否恢复已有会话。
   */
  private async reconnect(resumeSession: boolean): Promise<void> {
    if (this.reconnecting || this.connectionStopped) {
      return;
    }
    this.reconnecting = true;
    this.connectionPromise = this.retryConnection(resumeSession);

    const [result] = await Promise.allSettled([this.connectionPromise]);

    this.connectionPromise = null;
    this.reconnecting = false;

    if (result.status === 'rejected' && !this.connectionStopped) {
      const reconnectError =
        result.reason instanceof Error
          ? result.reason
          : new Error('WebSocket reconnect failed', { cause: result.reason });

      await this.options.error(reconnectError);
    }
  }

  /**
   * 按递增延迟重试建立连接。
   *
   * @param resumeSession 是否恢复已有会话。
   * @param cause 首次连接失败的原因。
   * @throws 遇到不可重试的错误或达到最大重试次数时抛出最后一次错误。
   */
  private async retryConnection(resumeSession: boolean, cause?: unknown): Promise<void> {
    if (cause instanceof WebSocketConnectionError && !cause.retryable) {
      throw cause;
    }
    let error: unknown = cause;

    for (let attempt = 1; attempt <= this.options.maxRetry && !this.connectionStopped; attempt++) {
      const delayMs = Math.min(attempt * 1000, MAX_RETRY_DELAY);
      const mode = resumeSession && this.sessionId !== null && this.processedSeq !== null ? 'resume' : 'identify';

      this.options.logger?.('websocket', '准备重试 WebSocket 连接', {
        mode,
        attempt,
        maxRetry: this.options.maxRetry,
        delayMs,
      });
      const { promise, resolve } = Promise.withResolvers<void>();

      this.retryDelay = { resolve, timer: setTimeout(resolve, delayMs) };
      await promise;
      this.retryDelay = null;

      if (this.connectionStopped) {
        throw new WebSocketConnectionError('WebSocket connection stopped', false);
      }

      try {
        await this.openConnection(mode === 'resume');
        return;
      } catch (nextError) {
        error = nextError;
        this.options.logger?.('websocket', 'WebSocket 连接失败', { mode, error: nextError });

        if (nextError instanceof WebSocketConnectionError && !nextError.retryable) {
          throw nextError;
        }
      }
    }
    const finalError = error ?? new Error('WebSocket reconnect limit reached');
    const mode = resumeSession && this.sessionId !== null && this.processedSeq !== null ? 'resume' : 'identify';

    this.options.logger?.('websocket', 'WebSocket 重试次数已耗尽', {
      mode,
      maxRetry: this.options.maxRetry,
      error: finalError,
    });

    throw finalError;
  }

  /**
   * 关闭连接并设置会话恢复状态。
   *
   * @param resumeSession 是否恢复已有会话。
   */
  private restartConnection(resumeSession: boolean): void {
    this.resumeRequested = resumeSession;
    this.socket?.close();
  }

  /** 启动心跳循环。 */
  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatAck = true;

    this.scheduleHeartbeat();
  }

  /** 安排下一次心跳。 */
  private scheduleHeartbeat(): void {
    if (this.heartbeatIntervalMs === null) {
      return;
    }
    this.heartbeatTimer = setTimeout(() => {
      if (!this.heartbeatAck) {
        this.options.logger?.('websocket', 'WebSocket 心跳响应超时', { seq: this.receivedSeq });
        this.restartConnection(true);
        return;
      }
      this.heartbeatAck = false;
      this.sendPayload(this.socket, { op: OpCode.Heartbeat, d: this.receivedSeq });
      this.scheduleHeartbeat();
    }, this.heartbeatIntervalMs);
  }

  /** 清除心跳定时器。 */
  private clearHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /** 清除会话恢复信息。 */
  private resetSession(): void {
    this.dispatches = new Map();
    this.sessionId = null;
    this.receivedSeq = null;
    this.processedSeq = null;
  }

  /**
   * 发送 Gateway Payload。
   *
   * @param socket WebSocket 连接。
   * @param payload 需要发送的 Gateway Payload。
   */
  private sendPayload(socket: WebSocket | null, payload: SendPayload): void {
    if (socket?.readyState === WebSocket.OPEN) {
      const loggedPayload =
        payload.op === OpCode.Identify
          ? { op: payload.op, d: { intents: payload.d.intents } }
          : payload.op === OpCode.Resume
            ? {
                op: payload.op,
                d: {
                  session_id: payload.d.session_id,
                  seq: payload.d.seq,
                },
              }
            : payload;

      this.options.logger?.('websocket', '发送 Gateway Payload', { payload: loggedPayload });
      socket.send(JSON.stringify(payload));
    }
  }
}
