import { type Logger } from '#/core/logger';
import { type Dispatch, OpCode } from '#/core/payload';
import { createSigningKey, sign, verify } from '#/utils/signature';
import { isNumber, isRecord, isString } from '#/utils/type';

export class Webhook {
  /** Webhook 签名密钥。 */
  private signingKey: Promise<CryptoKey> | null = null;

  /**
   * 初始化 Webhook 回调。
   *
   * @param clientSecret 机器人 AppSecret。
   * @param dispatch 分发已验证事件的函数。
   * @param logger SDK 日志回调。
   */
  public constructor(
    private readonly clientSecret: string,
    private readonly dispatch: (payload: Dispatch) => Promise<void>,
    private readonly logger?: Logger,
  ) {}

  /**
   * 处理 QQ Webhook 回调请求。
   *
   * @param request HTTP Server 或 Serverless 平台提供的标准 Request。
   * @param waitUntil 延长事件处理的生命周期，不阻塞 ACK。
   * @returns 需要返回给 QQ 的标准 Response。
   */
  public async callback(request: Request, waitUntil?: (task: Promise<void>) => void): Promise<Response> {
    this.logger?.('webhook', '收到 Webhook 请求', { method: request.method, url: request.url });

    if (request.method !== 'POST') {
      this.logger?.('webhook', 'Webhook 请求方法不受支持', { method: request.method, status: 405 });

      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'POST' },
      });
    }
    let payload: unknown;
    const body = await request.text();

    try {
      payload = JSON.parse(body);
    } catch {
      this.logger?.('webhook', 'Webhook 请求体不是有效的 JSON', { status: 400 });
      return new Response('Invalid JSON', { status: 400 });
    }

    if (!isRecord(payload)) {
      this.logger?.('webhook', 'Webhook Payload 格式无效', { status: 400 });
      return new Response('Invalid payload', { status: 400 });
    }

    if (payload.op === OpCode.CallbackValidation) {
      const data = payload.d;

      if (!isRecord(data) || !isString(data.plain_token) || !isString(data.event_ts)) {
        this.logger?.('webhook', 'Webhook 回调地址验证数据无效', { status: 400 });

        return new Response('Invalid validation payload', { status: 400 });
      }
      /*
       * Webhook 回调地址验证请求不包含事件签名头，OpCode 13 需要在事件签名校验前处理。
       */
      const response = Response.json({
        plain_token: data.plain_token,
        signature: await sign(await this.getSigningKey(), data.event_ts + data.plain_token),
      });

      this.logger?.('webhook', 'Webhook 回调地址验证完成', { status: response.status });

      return response;
    }

    if (payload.op !== OpCode.Dispatch) {
      this.logger?.('webhook', 'Webhook OpCode 不受支持', { op: payload.op, status: 400 });

      return new Response('Unsupported opcode', { status: 400 });
    }
    const signature = request.headers.get('X-Signature-Ed25519');
    const timestamp = request.headers.get('X-Signature-Timestamp');

    if (!signature || !timestamp || !(await verify(await this.getSigningKey(), signature, timestamp + body))) {
      this.logger?.('webhook', 'Webhook 签名验证失败', { status: 401 });

      return new Response('Invalid signature', { status: 401 });
    }
    const task = (async () => {
      await new Promise<void>(resolve => setTimeout(resolve));

      try {
        await this.dispatch(<Dispatch>(<unknown>payload));
      } catch (error) {
        if (waitUntil) {
          throw error;
        }
      }
    })();

    waitUntil?.(task);
    this.logger?.('webhook', 'Webhook 事件确认完成', {
      status: 200,
      t: payload.t,
      ...(isNumber(payload.s) ? { s: payload.s } : {}),
      ...(isString(payload.id) ? { id: payload.id } : {}),
    });

    return Response.json({ op: OpCode.HttpCallbackAck });
  }

  /** 获取 Webhook 签名密钥。 */
  private getSigningKey(): Promise<CryptoKey> {
    this.signingKey ??= createSigningKey(this.clientSecret);

    return this.signingKey;
  }
}
