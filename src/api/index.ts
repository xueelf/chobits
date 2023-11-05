import type { Token } from '@/client/token.js';

import channels from '@/api/channels.js';
import dms from '@/api/dms.js';
import groups from '@/api/groups.js';
import users from '@/api/users.js';
import gateway from '@/api/gateway.js';
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
    ...channels(instance),
    ...dms(instance),
    ...groups(instance),
    ...users(instance),
    ...gateway(instance),
  };
}
