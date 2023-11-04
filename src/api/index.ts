import type { Token } from '@/client/token.js';
import ws from '@/api/ws.js';
import request from '@/utils/request.js';

export async function createApi(token: Token) {
  const instance = request.create({
    appid: token.config.appid,
    baseURL: 'https://api.sgroup.qq.com',
    headers: {
      'Authorization': `QQBot ${token.value}`,
      'X-Union-Appid': token.config.appid,
    },
  });

  return {
    request: instance,
    ...ws(instance),
  };
}
