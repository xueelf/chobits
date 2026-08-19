import { isNumber, isRecord } from '#/utils/type';

function hasMsgSeq(value: unknown): value is Record<string, unknown> & { msg_seq: number } {
  return isRecord(value) && isNumber(value.msg_seq);
}

export function mockFetch(handler: (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>): typeof fetch {
  return Object.assign(handler, {
    preconnect(): void {},
  });
}

export async function readMessageBody(request: Request): Promise<Record<string, unknown> & { msg_seq: number }> {
  const body: unknown = await request.json();

  if (!hasMsgSeq(body)) {
    throw new TypeError('消息请求体缺少有效的 msg_seq');
  }
  return body;
}
