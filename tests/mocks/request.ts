import { isNumber, isRecord } from '#/utils/type';

function hasMsgSeq(value: unknown): value is Record<string, unknown> & { msg_seq: number } {
  return isRecord(value) && isNumber(value.msg_seq);
}

export function mockFetch(handler: (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>): typeof fetch {
  return Object.assign(handler, {
    preconnect(): void {},
  });
}

export function toRequest(input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Request {
  return input instanceof Request ? new Request(input, init) : new Request(input.toString(), init);
}

export async function readRequestBody(request?: Request): Promise<unknown> {
  if (!request) {
    throw new TypeError('缺少请求');
  }
  return await request.json();
}

export async function readMessageBody(request: Request): Promise<Record<string, unknown> & { msg_seq: number }> {
  const body = await readRequestBody(request);

  if (!hasMsgSeq(body)) {
    throw new TypeError('消息请求体缺少有效的 msg_seq');
  }
  return body;
}
