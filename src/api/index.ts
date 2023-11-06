import type { Token } from '@/client/token.js';

import { Request } from '@/client/request.js';
import { deepAssign } from '@/utils/common.js';
import channels from '@/api/channels.js';
import dms from '@/api/dms.js';
import gateway from '@/api/gateway.js';
import groups from '@/api/groups.js';
import users from '@/api/users.js';

export function createApi(token: Token) {
  const request = new Request(token.config.appid);

  request.useRequestInterceptor(async config => {
    await token.renew();
    deepAssign(config, {
      baseURL: 'https://api.sgroup.qq.com',
      headers: {
        'Authorization': `QQBot ${token.value}`,
        'X-Union-Appid': token.config.appid,
      },
    });

    return config;
  });

  return {
    ...channels(request),
    ...dms(request),
    ...groups(request),
    ...users(request),
    ...gateway(request),
  };
}
