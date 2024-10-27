export function createRandom(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 基于当前时间（分 + 秒 + 随机数）生成消息序号
 *
 * @returns {number} 消息序号
 */
export function createSeq(): number {
  const date: Date = new Date();
  const minutes: number = date.getMinutes();
  const seconds: number = date.getSeconds();
  const milliseconds: number = date.getMilliseconds();
  const random: number = createRandom(0, 999);
  const id: string = random.toString().padStart(3, '0');
  const seq: string = '' + minutes + seconds + milliseconds + id;

  return Number(seq);
}

export function isMsgId(id: string): boolean {
  // msg_id 以 '!' 结尾（不排除 tx 会暗改）
  return id.endsWith('!');
}

export function createMsgPayload(id?: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    msg_seq: createSeq(),
  };

  if (id) {
    if (isMsgId(id)) {
      payload.msg_id = id;
    } else {
      payload.event_id = id;
    }
  }
  return payload;
}
