const textEncoder = new TextEncoder();

/*
 * RFC 8410 第 7 节规定 Ed25519 私钥在 OneAsymmetricKey 中使用双层 OCTET STRING 包装，第 10.3 节给出了对应的 PKCS#8 DER 示例。
 * 下列字节是该结构在 32 字节 CurvePrivateKey 之前的固定前缀。
 * https://www.rfc-editor.org/rfc/rfc8410.html#section-7
 * https://www.rfc-editor.org/rfc/rfc8410.html#section-10.3
 */
const PKCS8_PREFIX = Uint8Array.from([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
]);

function createSeed(secret: string): Uint8Array {
  const secretBytes = textEncoder.encode(secret);
  const seed = new Uint8Array(32);

  for (let index = 0; index < seed.length; index++) {
    seed[index] = secretBytes[index % secretBytes.length] ?? 0;
  }
  return seed;
}

function toHex(value: ArrayBuffer): string {
  return [...new Uint8Array(value)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(value: string): Uint8Array | null {
  if (!/^[\da-f]{128}$/i.test(value)) {
    return null;
  }
  const bytes = value.match(/../g);

  return bytes ? Uint8Array.from(bytes, byte => Number.parseInt(byte, 16)) : null;
}

/**
 * 使用机器人密钥生成 QQ Webhook 签名密钥。
 *
 * @param secret 机器人密钥。
 * @returns 用于生成 Ed25519 签名的私钥。
 */
export async function createSigningKey(secret: string): Promise<CryptoKey> {
  if (!secret) {
    throw new TypeError('clientSecret is required');
  }
  const key = new Uint8Array(PKCS8_PREFIX.length + 32);

  key.set(PKCS8_PREFIX);
  key.set(createSeed(secret), PKCS8_PREFIX.length);

  return crypto.subtle.importKey('pkcs8', key, { name: 'Ed25519' }, false, ['sign']);
}

/**
 * 生成 QQ Webhook 要求的十六进制 Ed25519 签名。
 *
 * @param key Ed25519 私钥。
 * @param value 需要签名的原始内容。
 * @returns 十六进制签名。
 */
export async function sign(key: CryptoKey, value: string): Promise<string> {
  return toHex(await crypto.subtle.sign('Ed25519', key, textEncoder.encode(value)));
}

/**
 * 验证 QQ Webhook 的十六进制 Ed25519 签名。
 *
 * @param key Ed25519 私钥。
 * @param signature 请求携带的十六进制签名。
 * @param value 需要验证的原始内容。
 * @returns 签名有效时返回 `true`。
 */
export async function verify(key: CryptoKey, signature: string, value: string): Promise<boolean> {
  let signatureDifference = 0;
  const actualSignature = fromHex(signature);

  if (!actualSignature) {
    return false;
  }
  /*
   * Ed25519 签名具有确定性，重新生成的预期签名可以直接进行常量时间比较。
   */
  const expectedSignature = fromHex(await sign(key, value));

  if (!expectedSignature) {
    return false;
  }

  for (let index = 0; index < expectedSignature.length; index++) {
    signatureDifference |= (expectedSignature[index] ?? 0) ^ (actualSignature[index] ?? 0);
  }
  return signatureDifference === 0;
}
